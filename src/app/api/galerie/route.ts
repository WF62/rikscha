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
    .from('galerie')
    .select('id, url, beschreibung, pilot, created_at')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: CORS });
  return NextResponse.json(data ?? [], { headers: CORS });
}

export async function POST(req: NextRequest) {
  const db = createServiceClient();

  const form = await req.formData();
  const pilot = form.get('pilot') as string;
  const password = form.get('password') as string;
  const beschreibung = form.get('beschreibung') as string;
  const datei = form.get('datei') as File | null;

  if (!pilot || !password || !datei) {
    return NextResponse.json({ error: 'Fehlende Felder.' }, { status: 400, headers: CORS });
  }

  if (!await checkPilot(pilot, password)) {
    return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401, headers: CORS });
  }

  // Datei hochladen
  const ext = datei.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const bytes = await datei.arrayBuffer();

  const { error: uploadError } = await db.storage
    .from('galerie-fotos')
    .upload(filename, bytes, { contentType: datei.type, upsert: false });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500, headers: CORS });
  }

  const { data: { publicUrl } } = db.storage
    .from('galerie-fotos')
    .getPublicUrl(filename);

  // Metadaten speichern
  const { data: row, error: dbError } = await db
    .from('galerie')
    .insert({ url: publicUrl, beschreibung, pilot })
    .select()
    .single();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500, headers: CORS });
  }

  return NextResponse.json(row, { headers: CORS });
}
