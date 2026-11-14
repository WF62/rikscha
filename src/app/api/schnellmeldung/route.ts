export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getPilotRolle, darfFahrtenVerwalten } from '@/lib/pilotAuth';
import { sendVerspaetungSignal, sendAbsageSignal } from '@/lib/email';

export async function POST(req: NextRequest) {
  const { pilot, password, typ, minuten, notiz, grund } = await req.json();
  if (!pilot || !password) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 });
  const rolle = await getPilotRolle(pilot, password);
  if (!darfFahrtenVerwalten(rolle)) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 });
  if (typ !== 'verspaetung' && typ !== 'absage') return NextResponse.json({ error: 'Unbekannter Typ.' }, { status: 400 });

  const db = createServiceClient();

  if (rolle === 'kutscher' || rolle === 'kutscher-admin' || rolle === 'pilot') {
    const { data: k } = await db.from('rikscha_kutscher').select('aktiv').eq('name', pilot).single();
    if (k && k.aktiv === false) {
      return NextResponse.json({ error: 'Dein Zugang ist nicht mehr aktiv.' }, { status: 403 });
    }
  }

  if (typ === 'verspaetung') {
    if (!minuten || minuten <= 0) return NextResponse.json({ error: 'Dauer fehlt.' }, { status: 400 });
    sendVerspaetungSignal({ kutscher: pilot, minuten, notiz: notiz || undefined }).catch(() => {});
  } else {
    sendAbsageSignal({ kutscher: pilot, grund: grund || undefined }).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
