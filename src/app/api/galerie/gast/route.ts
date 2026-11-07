export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { formularPruefen, begrenzen, ZU_VIELE, NEU_LADEN } from '@/lib/spamschutz';

const BILDTYPEN: Record<string, string> = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'image/heic': 'heic', 'image/heif': 'heif',
};
const MAX_BYTES = 10 * 1024 * 1024;

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
  const pruefung = formularPruefen({ website: form.get('website'), _t: form.get('_t') });
  if (pruefung === 'bot') return NextResponse.json({ ok: true }, { headers: CORS });
  if (pruefung === 'neu-laden') return NextResponse.json({ error: NEU_LADEN }, { status: 400, headers: CORS });

  const pilot      = String(form.get('pilot') || 'Gast').trim().slice(0, 80) || 'Gast';
  const beschreibung = String(form.get('beschreibung') || '').slice(0, 500);
  const datei      = form.get('datei');

  if (!(datei instanceof File)) {
    return NextResponse.json({ error: 'Keine Datei.' }, { status: 400, headers: CORS });
  }
  const ext = BILDTYPEN[datei.type];
  if (!ext) return NextResponse.json({ error: 'Bitte nur Fotos hochladen (JPG, PNG, WebP, HEIC).' }, { status: 400, headers: CORS });
  if (datei.size > MAX_BYTES) return NextResponse.json({ error: 'Das Foto ist zu groß (max. 10 MB).' }, { status: 400, headers: CORS });

  if (!(await begrenzen(req, 'gast-foto', [{ max: 10, minuten: 60 }, { max: 30, minuten: 1440 }]))) {
    return NextResponse.json({ error: ZU_VIELE }, { status: 429, headers: CORS });
  }

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
