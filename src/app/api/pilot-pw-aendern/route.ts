export const dynamic = 'force-dynamic';
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
  const { pilot, altesPasswort, neuesPasswort } = await req.json();

  if (!pilot || !altesPasswort || !neuesPasswort) {
    return NextResponse.json({ error: 'Fehlende Felder.' }, { status: 400, headers: CORS });
  }
  if (neuesPasswort.length < 6) {
    return NextResponse.json({ error: 'Das neue Passwort muss mindestens 6 Zeichen lang sein.' }, { status: 400, headers: CORS });
  }

  const db = createServiceClient();
  const { data, error } = await db
    .from('piloten_zugang')
    .select('id')
    .eq('name', pilot)
    .eq('passwort', altesPasswort)
    .eq('aktiv', true)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: CORS });
  if (!data) return NextResponse.json({ error: 'Aktuelles Passwort falsch.' }, { status: 401, headers: CORS });

  const { error: updateError } = await db
    .from('piloten_zugang')
    .update({ passwort: neuesPasswort, muss_pw_aendern: false })
    .eq('id', data.id);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500, headers: CORS });

  return NextResponse.json({ ok: true }, { headers: CORS });
}
