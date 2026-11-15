export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

const CORS = { 'Access-Control-Allow-Origin': '*' };

// GET: Kontaktdaten eines Kutschers laden (nach Name)
export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get('kutscher');
  if (!name) return NextResponse.json({ error: 'Name fehlt.' }, { status: 400 });
  const db = createServiceClient();
  const { data, error } = await db
    .from('rikscha_kutscher')
    .select('telefon, email, whatsapp, adresse, kontakt_zustimmung')
    .eq('name', name)
    .single();
  if (error) return NextResponse.json({}, { headers: CORS });
  return NextResponse.json(data ?? {}, { headers: CORS });
}

// POST: PDF-Blob empfangen, in Storage ablegen, URL in DB speichern, Kontaktdaten aktualisieren
export async function POST(req: NextRequest) {
  const form = await req.formData();
  const id = form.get('id') as string;
  const kutscher = form.get('kutscher') as string;
  const file = form.get('file') as File | null;

  if (!id || !kutscher || !file) {
    return NextResponse.json({ error: 'Fehlende Felder.' }, { status: 400 });
  }

  const telefon = (form.get('telefon') as string | null) ?? null;
  const email = (form.get('email') as string | null) ?? null;
  const whatsapp = (form.get('whatsapp') as string | null) ?? null;
  const adresse = (form.get('adresse') as string | null) ?? null;
  const kontakt_zustimmung = form.get('kontakt_zustimmung') === 'true';

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

  // Kontaktdaten in rikscha_kutscher speichern
  const kontaktPatch: Record<string, unknown> = {};
  if (telefon !== null) kontaktPatch.telefon = telefon;
  if (email !== null) kontaktPatch.email = email;
  if (whatsapp !== null) kontaktPatch.whatsapp = whatsapp;
  if (adresse !== null) kontaktPatch.adresse = adresse;
  if (kontakt_zustimmung) {
    kontaktPatch.kontakt_zustimmung = true;
    kontaktPatch.kontakt_zustimmung_am = new Date().toISOString();
  }

  await Promise.all([
    db.from('rikscha_kutscher_fahrzeuge').update({ beleg_url: publicUrl }).eq('id', id),
    Object.keys(kontaktPatch).length > 0
      ? db.from('rikscha_kutscher').update(kontaktPatch).eq('name', kutscher)
      : Promise.resolve(),
  ]);

  return NextResponse.json({ ok: true, url: publicUrl, adminPfad: r2.error ? null : pfadAdmin }, { headers: CORS });
}
