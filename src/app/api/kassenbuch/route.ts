export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getPilotRolle, darfWebBearbeiten } from '@/lib/pilotAuth';

const CORS = { 'Access-Control-Allow-Origin': '*' };

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const pilot = searchParams.get('pilot') ?? '';
  const password = searchParams.get('password') ?? '';
  if (!pilot || !password) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 });
  const rolle = await getPilotRolle(pilot, password);
  if (!darfWebBearbeiten(rolle)) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 });

  const db = createServiceClient();
  const von = searchParams.get('von');
  const bis = searchParams.get('bis');
  const typ = searchParams.get('typ');

  const kostentraeger = searchParams.get('kostentraeger');

  let q = db.from('rikscha_kassenbuch')
    .select('id, typ, betrag, datum, beschreibung, kategorie, fahrtenbuch_id, eingetragen_von, eingetragen_am, kostentraeger')
    .order('datum', { ascending: false })
    .order('eingetragen_am', { ascending: false });

  if (von) q = q.gte('datum', von);
  if (bis) q = q.lte('datum', bis);
  if (typ) q = q.eq('typ', typ);
  if (kostentraeger) q = q.eq('kostentraeger', kostentraeger);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: CORS });
  return NextResponse.json(data ?? [], { headers: CORS });
}

export async function POST(req: NextRequest) {
  const { pilot, password, typ, betrag, datum, beschreibung, kategorie, kostentraeger } = await req.json();
  if (!pilot || !password) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 });
  const rolle = await getPilotRolle(pilot, password);
  if (!darfWebBearbeiten(rolle)) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 });
  if (!typ || !betrag || !datum || !beschreibung) return NextResponse.json({ error: 'Fehlende Felder.' }, { status: 400 });

  const db = createServiceClient();
  const { data, error } = await db.from('rikscha_kassenbuch').insert({
    typ, betrag: Number(betrag), datum, beschreibung, kategorie: kategorie || null,
    kostentraeger: kostentraeger || 'selbst',
    eingetragen_von: pilot,
  }).select('id').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: CORS });
  return NextResponse.json({ ok: true, id: data.id }, { status: 201, headers: CORS });
}

export async function DELETE(req: NextRequest) {
  const { pilot, password, id } = await req.json();
  if (!pilot || !password || !id) return NextResponse.json({ error: 'Fehlende Felder.' }, { status: 400 });
  const rolle = await getPilotRolle(pilot, password);
  if (!darfWebBearbeiten(rolle)) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 });
  const db = createServiceClient();
  const { error } = await db.from('rikscha_kassenbuch').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: CORS });
  return NextResponse.json({ ok: true }, { headers: CORS });
}
