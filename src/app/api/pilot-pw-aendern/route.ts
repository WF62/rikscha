export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { zeileFuer, passwortFelder, anmelden } from '@/lib/passwort';
import { zuViele, merke } from '@/lib/spamschutz';

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
  if (String(neuesPasswort).length < 6) {
    return NextResponse.json({ error: 'Das neue Passwort muss mindestens 6 Zeichen lang sein.' }, { status: 400, headers: CORS });
  }

  if (await zuViele(req, 'login-fehler', [{ max: 10, minuten: 15 }])) {
    return NextResponse.json({ error: 'Zu viele falsche Versuche. Bitte 15 Minuten warten.' }, { status: 429, headers: CORS });
  }
  const zeile = await zeileFuer(String(pilot), String(altesPasswort));
  if (!zeile) {
    await merke(req, 'login-fehler');
    return NextResponse.json({ error: 'Aktuelles Passwort falsch.' }, { status: 401, headers: CORS });
  }

  const db = createServiceClient();
  const { error: updateError } = await db
    .from('piloten_zugang')
    .update({ ...(await passwortFelder(String(neuesPasswort))), muss_pw_aendern: false })
    .eq('id', zeile.id);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500, headers: CORS });

  // Neuer Token (der alte ist mit dem alten Passwort ungültig geworden)
  const a = await anmelden(String(pilot), String(neuesPasswort));
  return NextResponse.json({ ok: true, token: a?.token ?? null }, { headers: CORS });
}
