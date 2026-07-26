export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

async function checkPilot(db: ReturnType<typeof createServiceClient>, pilot: string, password: string) {
  const { data } = await db
    .from('piloten_zugang')
    .select('id')
    .eq('name', pilot)
    .eq('passwort', password)
    .eq('aktiv', true)
    .maybeSingle();
  return !!data;
}

export async function GET() {
  const db = createServiceClient();
  const { data, error } = await db
    .from('piloten_dateien')
    .select('id, name, kategorie, url, groesse, typ, hochgeladen_von, erstellt_am')
    .order('erstellt_am', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: CORS });
  return NextResponse.json(data ?? [], { headers: CORS });
}

export async function POST(req: NextRequest) {
  const db = createServiceClient();
  const form = await req.formData();
  const pilot     = form.get('pilot')     as string;
  const password  = form.get('password')  as string;
  const kategorie = form.get('kategorie') as string;
  const datei     = form.get('datei')     as File | null;

  if (!pilot || !password || !datei) {
    return NextResponse.json({ error: 'Fehlende Felder.' }, { status: 400, headers: CORS });
  }

  if (!(await checkPilot(db, pilot, password))) {
    return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401, headers: CORS });
  }

  const ext = datei.name.split('.').pop()?.toLowerCase() ?? 'bin';
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const bytes = await datei.arrayBuffer();

  const { error: uploadError } = await db.storage
    .from('piloten-dateien')
    .upload(filename, bytes, { contentType: datei.type, upsert: false });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500, headers: CORS });
  }

  const { data: { publicUrl } } = db.storage.from('piloten-dateien').getPublicUrl(filename);

  const { data: row, error: dbError } = await db
    .from('piloten_dateien')
    .insert({
      name: datei.name,
      kategorie: kategorie || 'Sonstiges',
      url: publicUrl,
      groesse: datei.size,
      typ: datei.type,
      hochgeladen_von: pilot,
      storage_pfad: filename,
    })
    .select()
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500, headers: CORS });
  return NextResponse.json(row, { headers: CORS });
}

export async function DELETE(req: NextRequest) {
  const { id, pilot, password } = await req.json();
  if (!id || !pilot || !password) {
    return NextResponse.json({ error: 'Fehlende Felder.' }, { status: 400, headers: CORS });
  }

  const db = createServiceClient();
  if (!(await checkPilot(db, pilot, password))) {
    return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401, headers: CORS });
  }

  const { data: datei } = await db
    .from('piloten_dateien')
    .select('storage_pfad')
    .eq('id', id)
    .single();

  if (datei?.storage_pfad) {
    await db.storage.from('piloten-dateien').remove([datei.storage_pfad]);
  }

  const { error } = await db.from('piloten_dateien').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: CORS });
  return NextResponse.json({ ok: true }, { headers: CORS });
}
