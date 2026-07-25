import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function POST(req: NextRequest) {
  const { pilot, password } = await req.json();

  if (!pilot || !password) {
    return NextResponse.json({ error: 'Fehlende Felder.' }, { status: 400, headers: CORS });
  }

  const db = createServiceClient();
  const { data, error } = await db
    .from('piloten_zugang')
    .select('id, name, rolle')
    .eq('name', pilot)
    .eq('passwort', password)
    .eq('aktiv', true)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: CORS });
  if (!data)  return NextResponse.json({ error: 'Falscher Name oder Passwort.' }, { status: 401, headers: CORS });

  return NextResponse.json({ ok: true, pilot: data.name, rolle: data.rolle }, { headers: CORS });
}
