import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { pilot, password } = await req.json();

  if (!pilot || !password) {
    return NextResponse.json({ error: 'Fehlende Felder.' }, { status: 400 });
  }

  let passwörter: Record<string, string> = {};
  try {
    passwörter = JSON.parse(process.env.PILOT_PASSWORDS ?? '{}');
  } catch {
    return NextResponse.json({ error: 'Konfigurationsfehler.' }, { status: 500 });
  }

  if (passwörter[pilot] && passwörter[pilot] === password) {
    return NextResponse.json({ ok: true, pilot });
  }

  return NextResponse.json({ error: 'Falscher Name oder Passwort.' }, { status: 401 });
}
