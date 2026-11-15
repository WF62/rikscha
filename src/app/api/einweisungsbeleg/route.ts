export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

const CORS = { 'Access-Control-Allow-Origin': '*' };

// POST: PDF-Blob empfangen, in Storage ablegen, URL in DB speichern
export async function POST(req: NextRequest) {
  const form = await req.formData();
  const id = form.get('id') as string;
  const kutscher = form.get('kutscher') as string;
  const file = form.get('file') as File | null;

  if (!id || !kutscher || !file) {
    return NextResponse.json({ error: 'Fehlende Felder.' }, { status: 400 });
  }

  const db = createServiceClient();
  const datum = new Date().toISOString().slice(0, 10);
  const dateiname = `${kutscher.replace(/[^a-zA-Z0-9äöüÄÖÜß\- ]/g, '_')}_${datum}.pdf`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const pfadKutscher = `einweisungen/${kutscher}/${dateiname}`;
  const pfadAdmin = `einweisungen/admin/${dateiname}`;

  const [r1, r2] = await Promise.all([
    db.storage.from('piloten-dateien').upload(pfadKutscher, buffer, { contentType: 'application/pdf', upsert: true }),
    db.storage.from('piloten-dateien').upload(pfadAdmin, buffer, { contentType: 'application/pdf', upsert: true }),
  ]);

  if (r1.error) return NextResponse.json({ error: r1.error.message }, { status: 500, headers: CORS });

  const { data: { publicUrl } } = db.storage.from('piloten-dateien').getPublicUrl(pfadKutscher);

  await db.from('rikscha_kutscher_fahrzeuge').update({ beleg_url: publicUrl }).eq('id', id);

  return NextResponse.json({ ok: true, url: publicUrl, adminPfad: r2.error ? null : pfadAdmin }, { headers: CORS });
}
