export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getPilotRolle, darfFahrtenVerwalten } from '@/lib/pilotAuth';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tourId = searchParams.get('tour_id');
  if (!tourId) return NextResponse.json({ error: 'tour_id fehlt.' }, { status: 400 });
  const db = createServiceClient();
  const { data, error } = await db
    .from('rikscha_touren_fotos')
    .select('id, foto_pfad, lat, lon, aufgenommen_am, beschreibung, hochgeladen_von, hochgeladen_am')
    .eq('tour_id', tourId)
    .order('aufgenommen_am', { ascending: true, nullsFirst: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const pilot = formData.get('pilot') as string;
  const password = formData.get('password') as string;
  const tourId = formData.get('tour_id') as string;
  const file = formData.get('foto') as File | null;
  const lat = formData.get('lat') ? parseFloat(formData.get('lat') as string) : null;
  const lon = formData.get('lon') ? parseFloat(formData.get('lon') as string) : null;
  const aufgenommenAm = formData.get('aufgenommen_am') as string | null;
  const beschreibung = formData.get('beschreibung') as string | null;

  if (!pilot || !password || !tourId || !file) {
    return NextResponse.json({ error: 'Fehlende Felder.' }, { status: 400 });
  }
  const rolle = await getPilotRolle(pilot, password);
  if (!darfFahrtenVerwalten(rolle)) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 });

  const db = createServiceClient();
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const pfad = `${tourId}/${Date.now()}.${ext}`;
  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadErr } = await db.storage.from('touren-fotos').upload(pfad, arrayBuffer, {
    contentType: file.type || 'image/jpeg',
    upsert: false,
  });
  if (uploadErr) return NextResponse.json({ error: uploadErr.message }, { status: 500 });

  const { data, error: dbErr } = await db.from('rikscha_touren_fotos').insert({
    tour_id: tourId,
    foto_pfad: pfad,
    lat: lat || null,
    lon: lon || null,
    aufgenommen_am: aufgenommenAm || null,
    beschreibung: beschreibung || null,
    hochgeladen_von: pilot,
  }).select('id, foto_pfad').single();
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });
  return NextResponse.json({ ok: true, id: data.id, pfad: data.foto_pfad }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const { pilot, password, id } = await req.json();
  if (!pilot || !password || !id) return NextResponse.json({ error: 'Fehlende Felder.' }, { status: 400 });
  const rolle = await getPilotRolle(pilot, password);
  if (!darfFahrtenVerwalten(rolle)) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 });
  const db = createServiceClient();
  const { data: foto } = await db.from('rikscha_touren_fotos').select('foto_pfad').eq('id', id).single();
  if (foto?.foto_pfad) await db.storage.from('touren-fotos').remove([foto.foto_pfad]);
  const { error } = await db.from('rikscha_touren_fotos').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
