export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

async function sendeBestaetigung(opts: {
  an: string; name: string; fahrzeug: string; belegUrl: string; einweisungstyp: string;
}) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return; // E-Mail-Versand nicht konfiguriert
  const { Resend } = await import('resend');
  const resend = new Resend(key);
  const typ = opts.einweisungstyp === 'folge' ? 'Folgeeinweisung' : 'Volleinweisung';
  await resend.emails.send({
    from: process.env.RESEND_FROM ?? 'Rikscha Merten <no-reply@rikscha-merten.de>',
    to: opts.an,
    subject: `Deine Rikscha-Einweisung: ${opts.fahrzeug}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;">
        <h2 style="color:#2D6B1E;">Einweisung abgeschlossen ✅</h2>
        <p>Hallo ${opts.name},</p>
        <p>deine <strong>${typ}</strong> für das Rikscha-Fahrzeug <strong>${opts.fahrzeug}</strong> wurde erfolgreich abgeschlossen und als PDF gespeichert.</p>
        <p><a href="${opts.belegUrl}" style="background:#2D6B1E;color:#fff;padding:0.6rem 1.4rem;border-radius:6px;text-decoration:none;font-weight:700;">📄 Einweisungsbeleg öffnen</a></p>
        <p style="color:#6B7280;font-size:0.85rem;margin-top:2rem;">Mertener Rikschakutscher · <a href="https://kutscher.vercel.app">kutscher.vercel.app</a></p>
      </div>
    `,
  });
}

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

// POST: Signed Upload URL ausstellen ODER Metadaten nach direktem Upload speichern
export async function POST(req: NextRequest) {
  const body = await req.json();
  const db = createServiceClient();

  // Schritt 1: Signed Upload URL anfordern
  if (body.action === 'getUploadUrl') {
    const { kutscher } = body;
    if (!kutscher) return NextResponse.json({ error: 'Kutscher fehlt.' }, { status: 400 });
    const datum = new Date().toISOString().slice(0, 10);
    const dateiname = `${kutscher.replace(/[^a-zA-Z0-9äöüÄÖÜß\- ]/g, '_')}_${datum}.pdf`;
    const pfadKutscher = `einweisungen/${kutscher}/${dateiname}`;
    const pfadAdmin = `einweisungen/admin/${dateiname}`;
    const [s1, s2] = await Promise.all([
      db.storage.from('piloten-dateien').createSignedUploadUrl(pfadKutscher),
      db.storage.from('piloten-dateien').createSignedUploadUrl(pfadAdmin),
    ]);
    if (s1.error) return NextResponse.json({ error: s1.error.message }, { status: 500, headers: CORS });
    const { data: { publicUrl } } = db.storage.from('piloten-dateien').getPublicUrl(pfadKutscher);
    return NextResponse.json({ signedUrl: s1.data.signedUrl, signedUrlAdmin: s2.data?.signedUrl, publicUrl }, { headers: CORS });
  }

  // Schritt 2: Metadaten speichern nach erfolgtem Upload
  const { id, kutscher, fahrzeug = '', einweisungstyp = 'voll', publicUrl, telefon = null, email = null, whatsapp = null, adresse = null, kontakt_zustimmung = false } = body;

  if (!id || !kutscher || !publicUrl) {
    return NextResponse.json({ error: 'Fehlende Felder.' }, { status: 400 });
  }

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

  // Bestätigungsmail an Kutscher (nur wenn E-Mail vorhanden und Zustimmung gegeben)
  if (email && kontakt_zustimmung) {
    sendeBestaetigung({ an: email, name: kutscher, fahrzeug, belegUrl: publicUrl, einweisungstyp }).catch(() => {});
  }

  return NextResponse.json({ ok: true, url: publicUrl }, { headers: CORS });
}
