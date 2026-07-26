export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { checkPilot } from '@/lib/pilotAuth';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const BEZEICHNUNGEN: Record<string, string> = {
  flyer_foto_lotte:   'Flyer – Flotte Lotte',
  flyer_foto_piter:   'Flyer – Jruuse Piter',
  flyer_foto_flitzer: 'Flyer – Flinker Flitzer',
  flyer_foto_fahrt1:  'Flyer – Fahrtfoto 1',
  flyer_foto_fahrt2:  'Flyer – Fahrtfoto 2',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function POST(req: NextRequest) {
  const db = createServiceClient();
  const form = await req.formData();
  const pilot      = form.get('pilot')      as string;
  const password   = form.get('password')   as string;
  const schluessel = form.get('schluessel') as string;
  const datei      = form.get('datei')      as File | null;

  if (!pilot || !password || !schluessel || !datei) {
    return NextResponse.json({ error: 'Fehlende Felder.' }, { status: 400, headers: CORS });
  }

  if (!await checkPilot(pilot, password)) {
    return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401, headers: CORS });
  }

  const ext = datei.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const filename = `${schluessel}-${Date.now()}.${ext}`;
  const bytes = await datei.arrayBuffer();

  // In piloten-dateien Bucket hochladen (erscheint in der Ablage)
  const { error: uploadError } = await db.storage
    .from('piloten-dateien')
    .upload(filename, bytes, { contentType: datei.type, upsert: true });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500, headers: CORS });
  }

  const { data: { publicUrl } } = db.storage.from('piloten-dateien').getPublicUrl(filename);

  // In inhalte speichern (verknüpft mit dem Flyer)
  const { error: inhalteError } = await db
    .from('inhalte')
    .upsert(
      { schluessel, wert: publicUrl, bezeichnung: BEZEICHNUNGEN[schluessel] ?? schluessel, geaendert_von: pilot, geaendert_am: new Date().toISOString() },
      { onConflict: 'schluessel' }
    );

  if (inhalteError) return NextResponse.json({ error: inhalteError.message }, { status: 500, headers: CORS });

  // Zusätzlich in piloten_dateien Tabelle eintragen (erscheint in der Ablage)
  await db.from('piloten_dateien').insert({
    name: BEZEICHNUNGEN[schluessel] ?? datei.name,
    kategorie: 'Flyer',
    url: publicUrl,
    groesse: datei.size,
    typ: datei.type,
    hochgeladen_von: pilot,
    storage_pfad: filename,
  });

  return NextResponse.json({ url: publicUrl }, { headers: CORS });
}
