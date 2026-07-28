export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { checkPilot } from '@/lib/pilotAuth';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const db = createServiceClient();
  const { pilot, password, beschreibung, fotograf } = await req.json();

  if (!await checkPilot(pilot, password)) {
    return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401, headers: CORS });
  }

  const felder: Record<string, string> = {};
  if (beschreibung !== undefined) felder.beschreibung = beschreibung;
  if (fotograf      !== undefined) felder.pilot       = fotograf;
  if (Object.keys(felder).length > 0)
    await db.from('galerie').update(felder).eq('id', params.id);
  return NextResponse.json({ ok: true }, { headers: CORS });
}
