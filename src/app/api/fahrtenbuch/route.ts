export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getPilotRolle, darfFahrtenVerwalten, darfWebBearbeiten } from '@/lib/pilotAuth';
import { sendSchadenEmail, sendSchadenSignal } from '@/lib/email';

const CORS = { 'Access-Control-Allow-Origin': '*' };

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const pilot = searchParams.get('pilot') ?? '';
  const password = searchParams.get('password') ?? '';
  if (!pilot || !password) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 });
  const rolle = await getPilotRolle(pilot, password);
  if (!darfFahrtenVerwalten(rolle)) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 });

  const db = createServiceClient();
  const fahrzeug = searchParams.get('fahrzeug');
  const von = searchParams.get('von');
  const bis = searchParams.get('bis');
  const nurEigen = searchParams.get('eigen') === '1';

  let q = db.from('rikscha_fahrtenbuch')
    .select('id, buchung_id, fahrzeug, datum, startzeit, endzeit, kutscher, fahrttyp, gast_name, anzahl_fahrgaeste, km_start, km_ende, spenden, ausgaben, ausgaben_beschreibung, wetter, schaden, schaden_beschreibung, bemerkungen, eingetragen_von, eingetragen_am')
    .order('datum', { ascending: false })
    .order('startzeit', { ascending: false });

  if (fahrzeug) q = q.eq('fahrzeug', fahrzeug);
  if (von) q = q.gte('datum', von);
  if (bis) q = q.lte('datum', bis);
  if (nurEigen) q = q.eq('kutscher', pilot);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: CORS });
  return NextResponse.json(data ?? [], { headers: CORS });
}

async function kassenbuchEintragAnlegen(
  db: ReturnType<typeof createServiceClient>,
  fahrtenbuchId: string,
  felder: Record<string, unknown>,
  pilot: string
) {
  const datum = felder.datum as string;
  const fahrzeug = felder.fahrzeug as string;
  const promises: Promise<unknown>[] = [];

  if (felder.spenden && Number(felder.spenden) > 0) {
    promises.push(Promise.resolve(db.from('rikscha_kassenbuch').insert({
      typ: 'einnahme',
      betrag: Number(felder.spenden),
      datum,
      beschreibung: `Spende – ${fahrzeug}${felder.gast_name ? ` (${felder.gast_name})` : ''}`,
      kategorie: 'Spende',
      fahrtenbuch_id: fahrtenbuchId,
      eingetragen_von: pilot,
    })));
  }
  if (felder.ausgaben && Number(felder.ausgaben) > 0) {
    promises.push(Promise.resolve(db.from('rikscha_kassenbuch').insert({
      typ: 'ausgabe',
      betrag: Number(felder.ausgaben),
      datum,
      beschreibung: (felder.ausgaben_beschreibung as string) || `Ausgabe – ${fahrzeug}`,
      kategorie: 'Fahrtkosten',
      fahrtenbuch_id: fahrtenbuchId,
      eingetragen_von: pilot,
    })));
  }
  await Promise.all(promises);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { pilot, password, ...felder } = body;
  if (!pilot || !password) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 });
  const rolle = await getPilotRolle(pilot, password);
  if (!darfFahrtenVerwalten(rolle)) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 });

  const db = createServiceClient();

  if (felder.buchung_id) {
    const { data: existing } = await db.from('rikscha_fahrtenbuch').select('id').eq('buchung_id', felder.buchung_id).single();
    if (existing) return NextResponse.json({ error: 'Für diese Fahrt existiert bereits ein Eintrag.', existing_id: existing.id }, { status: 409, headers: CORS });
  }

  const { data, error } = await db.from('rikscha_fahrtenbuch').insert({
    ...felder,
    eingetragen_von: pilot,
  }).select('id').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: CORS });

  // Kassenbuch-Einträge automatisch anlegen
  await kassenbuchEintragAnlegen(db, data.id, felder, pilot);

  // Schaden-Benachrichtigung an Rolf (E-Mail + WhatsApp) + Ausfall-Eintrag anlegen
  if (felder.schaden && felder.schaden_beschreibung) {
    const fahrzeug = felder.fahrzeug as string;
    const beschreibung = felder.schaden_beschreibung as string;

    // Ausfall-Eintrag mit Token anlegen (für Bestätigungs-Link)
    let ausfallToken: string | undefined;
    const { data: ausfall } = await db.from('rikscha_fahrzeugausfaelle').insert({
      fahrzeug,
      schaden_fahrtenbuch_id: data.id,
      beschreibung,
    }).select('token').single();
    if (ausfall?.token) ausfallToken = ausfall.token;

    const schadenDaten = {
      kutscher: pilot,
      fahrzeug,
      datum: felder.datum as string,
      beschreibung,
      bemerkungen: felder.bemerkungen as string | undefined,
      ausfallToken,
    };
    sendSchadenEmail(schadenDaten).catch(() => {});
    sendSchadenSignal(schadenDaten).catch(() => {});
  }

  return NextResponse.json({ ok: true, id: data.id }, { status: 201, headers: CORS });
}

export async function PUT(req: NextRequest) {
  const { pilot, password, id, ...felder } = await req.json();
  if (!pilot || !password || !id) return NextResponse.json({ error: 'Fehlende Felder.' }, { status: 400 });
  const rolle = await getPilotRolle(pilot, password);
  if (!darfFahrtenVerwalten(rolle)) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 });

  const db = createServiceClient();

  if (!darfWebBearbeiten(rolle)) {
    const { data: eintrag } = await db.from('rikscha_fahrtenbuch').select('kutscher').eq('id', id).single();
    if (!eintrag || eintrag.kutscher !== pilot) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 403 });
  }

  const { error } = await db.from('rikscha_fahrtenbuch').update({ ...felder, geaendert_am: new Date().toISOString() }).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: CORS });
  return NextResponse.json({ ok: true }, { headers: CORS });
}
