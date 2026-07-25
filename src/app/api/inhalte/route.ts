import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET() {
  const db = createServiceClient();
  const { data, error } = await db
    .from('inhalte')
    .select('schluessel, wert, bezeichnung, geaendert_am, geaendert_von')
    .order('schluessel');

  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: CORS });
  return NextResponse.json(data ?? [], { headers: CORS });
}

export async function POST(req: NextRequest) {
  const { pilot, password, schluessel, wert } = await req.json();

  if (!pilot || !password || !schluessel || wert === undefined) {
    return NextResponse.json({ error: 'Fehlende Felder.' }, { status: 400, headers: CORS });
  }

  const db = createServiceClient();

  const { data: pilotData } = await db
    .from('piloten_zugang')
    .select('id')
    .eq('name', pilot)
    .eq('passwort', password)
    .eq('aktiv', true)
    .maybeSingle();

  if (!pilotData) {
    return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401, headers: CORS });
  }

  const { error } = await db
    .from('inhalte')
    .update({ wert, geaendert_von: pilot, geaendert_am: new Date().toISOString() })
    .eq('schluessel', schluessel);

  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: CORS });
  return NextResponse.json({ ok: true }, { headers: CORS });
}
