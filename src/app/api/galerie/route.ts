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

export async function GET(req: NextRequest) {
  const db = createServiceClient();
  const { searchParams } = new URL(req.url);
  const pilot       = searchParams.get('pilot');
  const kategorie   = searchParams.get('kategorie');
  const nurSichtbare = searchParams.get('nurSichtbare') === '1';

  let query = db
    .from('galerie')
    .select('id, url, beschreibung, pilot, kategorie, created_at, sichtbar')
    .order('created_at', { ascending: false });

  if (pilot)       query = query.eq('pilot', pilot);
  if (kategorie)   query = query.eq('kategorie', kategorie);
  if (nurSichtbare) query = query.eq('sichtbar', true);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: CORS });
  return NextResponse.json(data ?? [], { headers: CORS });
}

export async function POST(req: NextRequest) {
  const db = createServiceClient();

  const form = await req.formData();
  const pilot       = form.get('pilot') as string;
  const password    = form.get('password') as string;
  const beschreibung = form.get('beschreibung') as string;
  const kategorie   = (form.get('kategorie') as string || 'Sonstiges').trim();
  const sichtbar    = form.get('sichtbar') !== '0';
  const datei       = form.get('datei') as File | null;

  if (!pilot || !password || !datei) {
    return NextResponse.json({ error: 'Fehlende Felder.' }, { status: 400, headers: CORS });
  }

  if (!await checkPilot(pilot, password)) {
    return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401, headers: CORS });
  }

  const pilotOrdner = pilot.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  const katOrdner   = kategorie.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_äöüß]/g, '');
  const ext         = datei.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const filename    = `${pilotOrdner}/${katOrdner}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const bytes       = await datei.arrayBuffer();

  const { error: uploadError } = await db.storage
    .from('piloten-dateien')
    .upload(filename, bytes, { contentType: datei.type, upsert: false });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500, headers: CORS });
  }

  const { data: { publicUrl } } = db.storage
    .from('piloten-dateien')
    .getPublicUrl(filename);

  const { data: row, error: dbError } = await db
    .from('galerie')
    .insert({ url: publicUrl, beschreibung, pilot, kategorie, sichtbar })
    .select()
    .single();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500, headers: CORS });
  }

  return NextResponse.json(row, { headers: CORS });
}
