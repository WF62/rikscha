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
  const db = createServiceClient();
  const form = await req.formData();
  const pilot      = (form.get('pilot') as string || 'Gast').trim();
  const beschreibung = form.get('beschreibung') as string || '';
  const datei      = form.get('datei') as File | null;

  if (!datei) {
    return NextResponse.json({ error: 'Keine Datei.' }, { status: 400, headers: CORS });
  }

  const ext      = datei.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const filename = `gaeste/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const bytes    = await datei.arrayBuffer();

  const { error: uploadError } = await db.storage
    .from('piloten-dateien')
    .upload(filename, bytes, { contentType: datei.type, upsert: false });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500, headers: CORS });
  }

  const { data: { publicUrl } } = db.storage.from('piloten-dateien').getPublicUrl(filename);

  const { data: row, error: dbError } = await db
    .from('galerie')
    .insert({ url: publicUrl, beschreibung, pilot, kategorie: 'Gäste-Wettbewerb', sichtbar: false, freigegeben: false })
    .select()
    .single();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500, headers: CORS });
  }

  return NextResponse.json(row, { headers: CORS });
}
