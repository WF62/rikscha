export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { sendBuchungEmail } from '@/lib/email';
import { rolleAusAnfrage, darfFahrtenVerwalten, darfBewohnerVerwalten } from '@/lib/pilotAuth';
import { fahrzeugFehler, ladeStammdaten } from '@/lib/stammdaten-server';
import { formularPruefen, begrenzen, ZU_VIELE, NEU_LADEN } from '@/lib/spamschutz';

const ZEIT = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;
const TAG = /^\d{4}-\d{2}-\d{2}$/;
function minuten(z: string) { const [h, m] = z.split(':').map(Number); return h * 60 + m; }
function isoTag(d: Date) { return d.toISOString().slice(0, 10); }

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const von      = searchParams.get('von');
  const bis      = searchParams.get('bis');
  const pilot    = searchParams.get('pilot');
  const fahrzeug = searchParams.get('fahrzeug');

  const sb = createServiceClient();
  let q = sb.from('rikscha_buchungen').select('*').order('datum').order('startzeit');
  if (von)      q = q.gte('datum', von);
  if (bis)      q = q.lte('datum', bis);
  if (pilot)    q = q.eq('pilot', pilot);
  if (fahrzeug) q = q.eq('fahrzeug', fahrzeug);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Gastnamen und Notizen sehen nur angemeldete Kutscher (Angehörige nur bei eigenen Buchungen).
  const { name, rolle } = await rolleAusAnfrage(req);
  const voll = darfFahrtenVerwalten(rolle);
  const pflege = darfBewohnerVerwalten(rolle);

  // Bewohner-Angaben nur für Kutscher und Pflege
  const bewohnerIds = Array.from(new Set((data ?? []).flatMap((b) => [b.bewohner_id, b.bewohner2_id]).filter(Boolean))) as string[];
  const bewohner = new Map<string, unknown>();
  if ((voll || pflege) && bewohnerIds.length) {
    const { data: bw } = await sb.from('rikscha_bewohner').select('id, name, wohnbereich, rollstuhl, hinweis').in('id', bewohnerIds);
    for (const x of bw ?? []) bewohner.set(x.id, { name: x.name, wohnbereich: x.wohnbereich, rollstuhl: x.rollstuhl, hinweis: x.hinweis });
  }

  let gekuerzt = false;
  const liste = (data ?? []).map((b) => {
    if (voll || (pflege && (b.bewohner_id || b.bewohner2_id)) || (rolle === 'angehoeriger' && b.pilot === name)) {
      return {
        ...b,
        bewohner: b.bewohner_id ? bewohner.get(b.bewohner_id) ?? null : null,
        bewohner2: b.bewohner2_id ? bewohner.get(b.bewohner2_id) ?? null : null,
      };
    }
    gekuerzt = true;
    return { ...b, gaeste: (b.gaeste ?? []).map(() => 'Gast'), notiz: null, bewohner_id: null, bewohner2_id: null };
  });
  return NextResponse.json(liste, { headers: gekuerzt ? { 'x-rikscha-anonym': '1' } : {} });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { fahrzeug, pilot, datum, startzeit, endzeit, notiz } = body;
  const { name: angemeldet, rolle } = await rolleAusAnfrage(req);
  const vertraut = darfFahrtenVerwalten(rolle);

  // Spam-Schutz für alle, die nicht als Kutscher angemeldet sind
  if (!vertraut) {
    const pruefung = formularPruefen(body);
    if (pruefung === 'bot') return NextResponse.json({ ok: true }, { status: 201 }); // still verwerfen
    if (pruefung === 'neu-laden') return NextResponse.json({ error: NEU_LADEN }, { status: 400 });
    const erlaubt = await begrenzen(req, 'buchung', [{ max: 5, minuten: 60 }, { max: 15, minuten: 1440 }]);
    if (!erlaubt) return NextResponse.json({ error: ZU_VIELE }, { status: 429 });
  }

  if (!datum || !startzeit || !endzeit) {
    return NextResponse.json({ error: 'Datum und Zeiten sind Pflicht.' }, { status: 400 });
  }
  if (!TAG.test(String(datum)) || !ZEIT.test(String(startzeit)) || !ZEIT.test(String(endzeit))) {
    return NextResponse.json({ error: 'Datum oder Uhrzeit ist ungültig.' }, { status: 400 });
  }
  const heute = new Date();
  if (!vertraut && (datum < isoTag(new Date(heute.getTime() - 86_400_000)) || datum > isoTag(new Date(heute.getTime() + 400 * 86_400_000)))) {
    return NextResponse.json({ error: 'Bitte ein Datum zwischen heute und in einem Jahr wählen.' }, { status: 400 });
  }
  const dauer = minuten(endzeit) - minuten(startzeit);
  if (dauer <= 0) return NextResponse.json({ error: 'Das Ende muss nach dem Start liegen.' }, { status: 400 });
  if (dauer > 10 * 60) return NextResponse.json({ error: 'Eine Fahrt darf höchstens 10 Stunden dauern.' }, { status: 400 });
  if (notiz != null && String(notiz).length > 1000) return NextResponse.json({ error: 'Die Notiz ist zu lang (max. 1000 Zeichen).' }, { status: 400 });

  const stamm = await ladeStammdaten(true);
  const fz = stamm.fahrzeuge.find((f) => f.id === fahrzeug);
  const gaeste: string[] = (Array.isArray(body.gaeste) ? body.gaeste : [])
    .map((g: unknown) => String(g ?? '').trim().slice(0, 80)).filter(Boolean);
  if (gaeste.length > (fz?.maxGaeste ?? 2)) {
    return NextResponse.json({ error: `Für dieses Fahrzeug sind höchstens ${fz?.maxGaeste ?? 2} Gäste möglich.` }, { status: 400 });
  }
  // Eigenfahrt nur für angemeldete Angehörige; Kutscher-Namen nur aus der Liste
  const eigenfahrt = rolle === 'angehoeriger' && !!body.eigenfahrt;
  // Freie Fahrzeit für Bewohner: nur Kutscher, mit Kutscher und Fahrzeug, ohne Gäste
  const angebot = vertraut && !!body.angebot;
  if (angebot && (!pilot || !fahrzeug)) {
    return NextResponse.json({ error: 'Für eine freie Fahrzeit bitte Kutscher und Fahrzeug wählen.' }, { status: 400 });
  }
  if (angebot) gaeste.length = 0;
  if (pilot && !vertraut && !(rolle === 'angehoeriger' && pilot === angemeldet)
      && !stamm.kutscher.some((k) => k.name === pilot)) {
    return NextResponse.json({ error: 'Unbekannter Kutscher.' }, { status: 400 });
  }
  // Mindestens Pilot ODER Fahrzeug muss angegeben sein
  if (!pilot && !fahrzeug) {
    return NextResponse.json({ error: 'Bitte mindestens Kutscher oder Fahrzeug angeben.' }, { status: 400 });
  }

  const sb = createServiceClient();

  // Sperre und Doppelbuchung nur prüfen wenn Fahrzeug gewählt
  if (fahrzeug) {
    const fzFehler = await fahrzeugFehler(fahrzeug, datum);
    if (fzFehler) return NextResponse.json({ error: fzFehler }, { status: 409 });

    const { data: sperren } = await sb
      .from('rikscha_sperren')
      .select('id')
      .eq('fahrzeug', fahrzeug)
      .lte('von_datum', datum)
      .gte('bis_datum', datum);
    if (sperren && sperren.length > 0) {
      return NextResponse.json({ error: 'Fahrzeug ist an diesem Tag gesperrt.' }, { status: 409 });
    }

    // Zeitüberschneidung prüfen (nur nicht-stornierte Buchungen)
    const { data: ueberschneidungen } = await sb
      .from('rikscha_buchungen')
      .select('id')
      .eq('fahrzeug', fahrzeug)
      .eq('datum', datum)
      .eq('storniert', false)
      .lt('startzeit', endzeit)
      .gt('endzeit', startzeit);
    if (ueberschneidungen && ueberschneidungen.length > 0) {
      return NextResponse.json({ error: 'Das Fahrzeug ist in diesem Zeitraum bereits gebucht.' }, { status: 409 });
    }
  }

  const { data, error } = await sb
    .from('rikscha_buchungen')
    .insert({
      fahrzeug: fahrzeug || '',
      pilot:    pilot    || '',
      gaeste,
      datum,
      startzeit,
      endzeit,
      notiz: notiz || null,
      ...(eigenfahrt ? { eigenfahrt: true } : {}),
      ...(angebot ? { angebot: true } : {}),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  sendBuchungEmail({
    fahrzeug: fahrzeug || '',
    pilot: pilot || '',
    datum,
    startzeit,
    endzeit,
    gaeste,
    notiz,
  }).catch(() => {});

  return NextResponse.json(data, { status: 201 });
}
