export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { checkPilot } from '@/lib/pilotAuth';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const db = createServiceClient();
  const { pilot, password } = await req.json();

  if (!await checkPilot(pilot, password)) {
    return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401, headers: CORS });
  }

  // Foto-Eintrag holen (nur eigene oder Admin)
  const { data: foto } = await db
    .from('galerie')
    .select('url, pilot')
    .eq('id', params.id)
    .maybeSingle();

  if (!foto) {
    return NextResponse.json({ error: 'Nicht gefunden.' }, { status: 404, headers: CORS });
  }

  // Datei aus Storage löschen — Pfad nach /piloten-dateien/ extrahieren
  const storageMarker = '/piloten-dateien/';
  const markerIdx = foto.url.indexOf(storageMarker);
  if (markerIdx !== -1) {
    const storagePath = decodeURIComponent(foto.url.slice(markerIdx + storageMarker.length).split('?')[0]);
    await db.storage.from('piloten-dateien').remove([storagePath]);
  }

  await db.from('galerie').delete().eq('id', params.id);

  return NextResponse.json({ ok: true }, { headers: CORS });
}
