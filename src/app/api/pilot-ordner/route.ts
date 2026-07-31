export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getPilotRolle, istAdmin } from '@/lib/pilotAuth';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

// GET /api/pilot-ordner?pilot=X&password=Y&besitzer=Z
// Admins können besitzer weglassen → alle; Piloten sehen nur sich selbst
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const pilot    = searchParams.get('pilot')    ?? '';
  const password = searchParams.get('password') ?? '';
  const besitzer = searchParams.get('besitzer') ?? pilot;

  const rolle = await getPilotRolle(pilot, password);
  if (!rolle) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401, headers: CORS });

  const db = createServiceClient();
  let query = db.from('pilot_ordner').select('id, besitzer, kategorie, name, url, groesse, typ, hochgeladen_von, erstellt_am').order('erstellt_am', { ascending: false });

  if (!istAdmin(rolle)) {
    query = query.eq('besitzer', pilot);
  } else if (besitzer) {
    query = query.eq('besitzer', besitzer);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: CORS });
  return NextResponse.json(data ?? [], { headers: CORS });
}

// POST: Upload einer Datei in den Ordner eines Piloten
export async function POST(req: NextRequest) {
  const form     = await req.formData();
  const pilot    = form.get('pilot')    as string;
  const password = form.get('password') as string;
  const besitzer = (form.get('besitzer') as string) || pilot;
  const kategorie = form.get('kategorie') as string;
  const datei    = form.get('datei')    as File | null;

  if (!pilot || !password || !datei) {
    return NextResponse.json({ error: 'Fehlende Felder.' }, { status: 400, headers: CORS });
  }

  const rolle = await getPilotRolle(pilot, password);
  if (!rolle) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401, headers: CORS });

  // Nur Admins dürfen für andere Piloten hochladen
  if (besitzer !== pilot && !istAdmin(rolle)) {
    return NextResponse.json({ error: 'Keine Berechtigung.' }, { status: 403, headers: CORS });
  }

  const db = createServiceClient();
  const ext = datei.name.split('.').pop()?.toLowerCase() ?? 'bin';
  const filename = `ordner/${besitzer}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const bytes = await datei.arrayBuffer();

  const { error: uploadError } = await db.storage
    .from('piloten-dateien')
    .upload(filename, bytes, { contentType: datei.type, upsert: false });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500, headers: CORS });

  const { data: { publicUrl } } = db.storage.from('piloten-dateien').getPublicUrl(filename);

  const { data: row, error: dbError } = await db
    .from('pilot_ordner')
    .insert({
      besitzer,
      kategorie: kategorie || 'Sonstiges',
      name: datei.name,
      url: publicUrl,
      storage_pfad: filename,
      groesse: datei.size,
      typ: datei.type,
      hochgeladen_von: pilot,
    })
    .select()
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500, headers: CORS });
  return NextResponse.json(row, { headers: CORS });
}

// DELETE: Datei löschen (Pilot nur eigene, Admin alle)
export async function DELETE(req: NextRequest) {
  const { id, pilot, password } = await req.json();
  if (!id || !pilot || !password) {
    return NextResponse.json({ error: 'Fehlende Felder.' }, { status: 400, headers: CORS });
  }

  const rolle = await getPilotRolle(pilot, password);
  if (!rolle) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401, headers: CORS });

  const db = createServiceClient();
  const { data: eintrag } = await db.from('pilot_ordner').select('storage_pfad, besitzer').eq('id', id).single();

  if (!eintrag) return NextResponse.json({ error: 'Nicht gefunden.' }, { status: 404, headers: CORS });
  if (eintrag.besitzer !== pilot && !istAdmin(rolle)) {
    return NextResponse.json({ error: 'Keine Berechtigung.' }, { status: 403, headers: CORS });
  }

  if (eintrag.storage_pfad) {
    await db.storage.from('piloten-dateien').remove([eintrag.storage_pfad]);
  }

  const { error } = await db.from('pilot_ordner').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: CORS });
  return NextResponse.json({ ok: true }, { headers: CORS });
}
