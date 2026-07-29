export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { checkPilot } from '@/lib/pilotAuth';

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

  if (!await checkPilot(pilot, password)) {
    return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401, headers: CORS });
  }

  const db = createServiceClient();
  const ts = new Date().toISOString();

  // Erst updaten; wenn keine Zeile getroffen → neu anlegen
  const { data: updated, error: updateErr } = await db
    .from('inhalte')
    .update({ wert, geaendert_von: pilot, geaendert_am: ts })
    .eq('schluessel', schluessel)
    .select('schluessel');

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500, headers: CORS });

  if (!updated || updated.length === 0) {
    const { error: insertErr } = await db
      .from('inhalte')
      .insert({ schluessel, wert, bezeichnung: schluessel, geaendert_von: pilot, geaendert_am: ts });
    if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500, headers: CORS });
  }

  return NextResponse.json({ ok: true }, { headers: CORS });
}
