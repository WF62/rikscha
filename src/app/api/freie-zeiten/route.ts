export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { ladeStammdaten, fahrzeugAuswahl } from '@/lib/stammdaten-server';
import { formularPruefen, begrenzen, ZU_VIELE, NEU_LADEN } from '@/lib/spamschutz';
import { sendBuchungEmail } from '@/lib/email';
import { ABHOLORTE, NACH_ABSPRACHE } from '@/lib/touren';

/**
 * Öffentlich freigegebene freie Fahrzeiten der Kutscher – für Interessierte aus dem Quartier.
 * GET: Liste der freien Zeiten (ohne persönliche Daten).
 * POST: eine Zeit belegen (Name, ggf. Begleitung, Telefon, Abholort aus der festen Liste).
 */

const heute = () => new Date().toISOString().slice(0, 10);
const text = (v: unknown, max: number) => { const t = String(v ?? '').trim().slice(0, max); return t || null; };

export async function GET() {
  const bis = new Date(Date.now() + 84 * 86_400_000).toISOString().slice(0, 10);
  const sb = createServiceClient();
  const { data, error } = await sb.from('rikscha_buchungen').select('id, datum, startzeit, endzeit, pilot, fahrzeug, gaeste, bewohner_id, gruppe_id')
    .eq('angebot', true).eq('oeffentlich', true).eq('storniert', false).gte('datum', heute()).lte('datum', bis)
    .order('datum').order('startzeit');
  if (error) return NextResponse.json([]);   // Spalte fehlt noch → keine freien Zeiten anzeigen
  const { fahrzeuge } = await ladeStammdaten(false);
  const maxPlaetze = Math.max(1, ...fahrzeuge.map((f) => f.maxGaeste));
  return NextResponse.json((data ?? [])
    .filter((b) => !b.bewohner_id && !b.gruppe_id && (b.gaeste ?? []).length === 0)
    .map((b) => {
      const f = fahrzeuge.find((x) => x.id === b.fahrzeug);
      return { id: b.id, datum: b.datum, startzeit: b.startzeit, endzeit: b.endzeit, kutscher: b.pilot, fahrzeug: f?.name ?? null, plaetze: f ? f.maxGaeste : maxPlaetze };
    }));
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const pruefung = formularPruefen(body);
  if (pruefung === 'bot') return NextResponse.json({ ok: true });   // still verwerfen
  if (pruefung === 'neu-laden') return NextResponse.json({ error: NEU_LADEN }, { status: 400 });

  const name = text(body.name, 80);
  const begleitung = text(body.begleitung, 80);
  const telefon = text(body.telefon, 40);
  if (!name) return NextResponse.json({ error: 'Bitte deinen Namen eintragen.' }, { status: 400 });
  if (!telefon || !/^[+\d][\d\s/()-]{4,}$/.test(telefon)) {
    return NextResponse.json({ error: 'Bitte eine Telefonnummer angeben – der Kutscher meldet sich, falls sich etwas ändert.' }, { status: 400 });
  }
  const abholort = [...ABHOLORTE, NACH_ABSPRACHE].includes(String(body.abholort)) ? String(body.abholort) : NACH_ABSPRACHE;
  if (!(await begrenzen(req, 'freie-zeit', [{ max: 3, minuten: 60 }, { max: 6, minuten: 1440 }]))) {
    return NextResponse.json({ error: ZU_VIELE }, { status: 429 });
  }

  const sb = createServiceClient();
  const { data: b } = await sb.from('rikscha_buchungen').select('*').eq('id', String(body.buchung_id ?? '')).maybeSingle();
  if (!b || !b.angebot || !b.oeffentlich || b.storniert || b.datum < heute() || b.bewohner_id || b.gruppe_id || (b.gaeste ?? []).length) {
    return NextResponse.json({ error: 'Diese Zeit ist leider schon vergeben. Bitte wähle eine andere.' }, { status: 409 });
  }
  const gaeste = begleitung ? [name, begleitung] : [name];

  // Kutscher und Gast stehen fest → Fahrzeug festlegen (vorhandenes prüfen oder passendes freies wählen)
  const auswahl = await fahrzeugAuswahl(b.datum, b.startzeit, b.endzeit, { anzahl: gaeste.length, ausserId: b.id });
  const fahrzeug = b.fahrzeug ? auswahl.find((x) => x.id === b.fahrzeug && x.frei)?.id : auswahl.find((x) => x.frei)?.id;
  if (!fahrzeug) {
    return NextResponse.json({ error: gaeste.length > 1 ? 'Für zwei Personen ist zu dieser Zeit kein Platz frei. Allein mitfahren geht vielleicht.' : 'Zu dieser Zeit ist leider kein Fahrzeug frei.' }, { status: 409 });
  }

  // Nur belegen, wenn noch frei (gleichzeitiges Buchen verhindern)
  const { data: neu, error } = await sb.from('rikscha_buchungen')
    .update({ gaeste, fahrzeug, abholort, kontakt_telefon: telefon, notiz: text(body.notiz, 300) ?? b.notiz })
    .eq('id', b.id).eq('gaeste', '{}').is('bewohner_id', null).select('id, datum, startzeit, endzeit, pilot').maybeSingle();
  if (error) return NextResponse.json({ error: 'Das hat leider nicht geklappt. Bitte versuche es noch einmal.' }, { status: 500 });
  if (!neu) return NextResponse.json({ error: 'Diese Zeit wurde gerade vergeben. Bitte wähle eine andere.' }, { status: 409 });

  sendBuchungEmail({ fahrzeug, pilot: b.pilot, datum: b.datum, startzeit: b.startzeit, endzeit: b.endzeit, gaeste: ['Freie Zeit aus dem Quartier gebucht'], notiz: null }).catch(() => {});
  const fz = (await ladeStammdaten(true)).fahrzeuge.find((x) => x.id === fahrzeug);
  return NextResponse.json({ ok: true, datum: neu.datum, startzeit: neu.startzeit, endzeit: neu.endzeit, kutscher: neu.pilot, fahrzeug: fz?.name ?? fahrzeug, abholort });
}
