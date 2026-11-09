export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { anmelden } from '@/lib/passwort';
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

  const a = await anmelden(String(pilot), String(password));
  if (!a) {
    await merke(req, 'login-fehler');
    return NextResponse.json({ error: 'Falscher Name oder Passwort.' }, { status: 401, headers: CORS });
  }
  // token: wird im Browser statt des Passworts gespeichert (fehlt nur vor der Passwort-Migration)
  return NextResponse.json({ ok: true, pilot: a.name, rolle: a.rolle, muss_pw_aendern: a.muss_pw_aendern, token: a.token, fahrzeug: a.fahrzeug }, { headers: CORS });
}
