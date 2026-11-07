export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { zuViele, merke } from '@/lib/spamschutz';

const LOGIN_GRENZE = [{ max: 10, minuten: 15 }, { max: 30, minuten: 1440 }];
const ZU_VIELE_LOGINS = 'Zu viele falsche Versuche. Bitte warte 15 Minuten und versuche es dann noch einmal.';

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
  if (await zuViele(req, 'login-fehler', LOGIN_GRENZE)) {
    return NextResponse.json({ error: ZU_VIELE_LOGINS }, { status: 429, headers: CORS });
  }

  // Admin-Login via Umgebungsvariable
  const adminName = process.env.ADMIN_NAME || 'Admin';
  if (pilot === adminName && password === process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ ok: true, pilot: adminName, rolle: 'admin', muss_pw_aendern: false }, { headers: CORS });
  }

  const db = createServiceClient();
  const { data, error } = await db
    .from('piloten_zugang')
    .select('id, name, rolle, muss_pw_aendern')
    .eq('name', pilot)
    .eq('passwort', password)
    .eq('aktiv', true)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: CORS });
  if (!data) {
    await merke(req, 'login-fehler');
    return NextResponse.json({ error: 'Falscher Name oder Passwort.' }, { status: 401, headers: CORS });
  }

  return NextResponse.json({ ok: true, pilot: data.name, rolle: data.rolle, muss_pw_aendern: data.muss_pw_aendern ?? false }, { headers: CORS });
}
