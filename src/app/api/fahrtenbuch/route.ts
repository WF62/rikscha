export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getPilotRolle, darfFahrtenVerwalten, darfWebBearbeiten } from '@/lib/pilotAuth';

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
    .select('id, buchung_id, fahrzeug, datum, startzeit, endzeit, kutscher, fahrttyp, gast_name, anzahl_fahrgaeste, km_start, km_ende, spenden, wetter, schaden, schaden_beschreibung, bemerkungen, eingetragen_von, eingetragen_am')
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

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { pilot, password, ...felder } = body;
  if (!pilot || !password) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 });
  const rolle = await getPilotRolle(pilot, password);
  if (!darfFahrtenVerwalten(rolle)) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 });

  const db = createServiceClient();

  // Doppeleintrag verhindern: gleiche buchung_id darf nur einmal vorkommen
  if (felder.buchung_id) {
    const { data: existing } = await db.from('rikscha_fahrtenbuch').select('id').eq('buchung_id', felder.buchung_id).single();
    if (existing) return NextResponse.json({ error: 'Für diese Fahrt existiert bereits ein Eintrag.', existing_id: existing.id }, { status: 409, headers: CORS });
  }

  const { data, error } = await db.from('rikscha_fahrtenbuch').insert({
    ...felder,
    eingetragen_von: pilot,
  }).select('id').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: CORS });
  return NextResponse.json({ ok: true, id: data.id }, { status: 201, headers: CORS });
}

export async function PUT(req: NextRequest) {
  const { pilot, password, id, ...felder } = await req.json();
  if (!pilot || !password || !id) return NextResponse.json({ error: 'Fehlende Felder.' }, { status: 400 });
  const rolle = await getPilotRolle(pilot, password);
  if (!darfFahrtenVerwalten(rolle)) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 });

  const db = createServiceClient();

  // Kutscher darf nur eigene Einträge bearbeiten, kutscher-admin/admin alle
  if (!darfWebBearbeiten(rolle)) {
    const { data: eintrag } = await db.from('rikscha_fahrtenbuch').select('kutscher').eq('id', id).single();
    if (!eintrag || eintrag.kutscher !== pilot) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 403 });
  }

  const { error } = await db.from('rikscha_fahrtenbuch').update({ ...felder, geaendert_am: new Date().toISOString() }).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: CORS });
  return NextResponse.json({ ok: true }, { headers: CORS });
}
