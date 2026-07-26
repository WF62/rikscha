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

export async function POST(req: NextRequest) {
  const db = createServiceClient();
  const form = await req.formData();
  const pilot    = form.get('pilot')    as string;
  const password = form.get('password') as string;
  const schluessel = form.get('schluessel') as string; // z.B. "flyer_foto_lotte"
  const datei    = form.get('datei')    as File | null;

  if (!pilot || !password || !schluessel || !datei) {
    return NextResponse.json({ error: 'Fehlende Felder.' }, { status: 400, headers: CORS });
  }

  if (!await checkPilot(pilot, password)) {
    return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401, headers: CORS });
  }

  const ext = datei.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const filename = `${schluessel}-${Date.now()}.${ext}`;
  const bytes = await datei.arrayBuffer();

  const { error: uploadError } = await db.storage
    .from('galerie-fotos')
    .upload(filename, bytes, { contentType: datei.type, upsert: true });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500, headers: CORS });
  }

  const { data: { publicUrl } } = db.storage.from('galerie-fotos').getPublicUrl(filename);

  const { error } = await db
    .from('inhalte')
    .upsert(
      { schluessel, wert: publicUrl, bezeichnung: schluessel, geaendert_von: pilot, geaendert_am: new Date().toISOString() },
      { onConflict: 'schluessel' }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: CORS });
  return NextResponse.json({ url: publicUrl }, { headers: CORS });
}
