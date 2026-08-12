export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { checkPilot } from '@/lib/pilotAuth';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET() {
  const db = createServiceClient();
  const { data } = await db
    .from('aktuelles')
    .select('id, datum, titel, text, aktiv, erstellt_von, erstellt_am')
    .order('datum', { ascending: false })
    .limit(10);
  return NextResponse.json(data ?? [], { headers: CORS });
}

export async function POST(req: NextRequest) {
  const db = createServiceClient();
  const { pilot, password, datum, titel, text } = await req.json();
  if (!await checkPilot(pilot, password))
    return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401, headers: CORS });
  const { data, error } = await db
    .from('aktuelles')
    .insert({ datum, titel, text, erstellt_von: pilot })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: CORS });
  return NextResponse.json(data, { headers: CORS });
}

export async function PATCH(req: NextRequest) {
  const db = createServiceClient();
  const { pilot, password, id, ...felder } = await req.json();
  if (!await checkPilot(pilot, password))
    return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401, headers: CORS });
  const { error } = await db.from('aktuelles').update(felder).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: CORS });
  return NextResponse.json({ ok: true }, { headers: CORS });
}

export async function DELETE(req: NextRequest) {
  const db = createServiceClient();
  const { pilot, password, id } = await req.json();
  if (!await checkPilot(pilot, password))
    return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401, headers: CORS });
  const { error } = await db.from('aktuelles').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: CORS });
  return NextResponse.json({ ok: true }, { headers: CORS });
}
