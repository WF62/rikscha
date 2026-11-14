export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { sendAusfallKutscherEmail, sendAusfallSignalGruppe } from '@/lib/email';

// GET: Token prüfen und Bestätigungsseite-Daten liefern
export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get('token') ?? '';
  if (!token) return NextResponse.redirect(new URL('/', req.url));

  const db = createServiceClient();
  const { data: ausfall } = await db
    .from('rikscha_fahrzeugausfaelle')
    .select('id, fahrzeug, beschreibung, bestaetigt_am, gesperrt_ab, gesperrt_bis, erstellt_am')
    .eq('token', token)
    .single();

  if (!ausfall) return NextResponse.redirect(new URL('/', req.url));

  // Bereits bestätigt → direkt zur Bestätigungsseite weiterleiten
  const params = new URLSearchParams({ token, fahrzeug: ausfall.fahrzeug, beschreibung: ausfall.beschreibung });
  if (ausfall.bestaetigt_am) params.set('bereits', '1');
  return NextResponse.redirect(new URL(`/fahrzeugausfall/bestaetigen?${params}`, req.url));
}

// POST: Ausfall bestätigen + alle Kutscher benachrichtigen
export async function POST(req: NextRequest) {
  const { token, name, gesperrt_ab, gesperrt_bis } = await req.json();
  if (!token) return NextResponse.json({ error: 'Kein Token.' }, { status: 400 });

  const db = createServiceClient();
  const { data: ausfall } = await db
    .from('rikscha_fahrzeugausfaelle')
    .select('id, fahrzeug, beschreibung, bestaetigt_am')
    .eq('token', token)
    .single();

  if (!ausfall) return NextResponse.json({ error: 'Ungültiger Token.' }, { status: 404 });
  if (ausfall.bestaetigt_am) return NextResponse.json({ ok: true, bereits: true });

  // Als bestätigt markieren
  await db.from('rikscha_fahrzeugausfaelle').update({
    bestaetigt_von: name || 'Rolf',
    bestaetigt_am: new Date().toISOString(),
    gesperrt_ab: gesperrt_ab || null,
    gesperrt_bis: gesperrt_bis || null,
    benachrichtigt_am: new Date().toISOString(),
  }).eq('id', ausfall.id);

  // Alle aktiven Kutscher mit E-Mail laden
  const { data: kutscher } = await db
    .from('rikscha_kutscher')
    .select('name, email, whatsapp')
    .eq('aktiv', true)
    .not('email', 'is', null);

  const kutscherMitEmail = (kutscher ?? []).filter(k => k.email);

  // Betroffene Buchungen ermitteln
  const heute = new Date().toISOString().slice(0, 10);
  const bisQuery = gesperrt_bis || '2099-12-31';
  const { data: betroffeneBuchungen } = await db
    .from('rikscha_buchungen')
    .select('id, datum, startzeit, endzeit, pilot, gaeste')
    .eq('fahrzeug', ausfall.fahrzeug)
    .eq('storniert', false)
    .gte('datum', gesperrt_ab || heute)
    .lte('datum', bisQuery)
    .order('datum');

  // E-Mail an alle Kutscher
  if (kutscherMitEmail.length) {
    await sendAusfallKutscherEmail({
      fahrzeug: ausfall.fahrzeug,
      beschreibung: ausfall.beschreibung,
      gesperrt_ab: gesperrt_ab || undefined,
      gesperrt_bis: gesperrt_bis || undefined,
      kutscher: kutscherMitEmail.map(k => ({ name: k.name, email: k.email! })),
    });
  }

  // Signal-Gruppen-Nachricht an alle Kutscher auf einmal
  await sendAusfallSignalGruppe({
    fahrzeug: ausfall.fahrzeug,
    beschreibung: ausfall.beschreibung,
    gesperrt_ab: gesperrt_ab || undefined,
    gesperrt_bis: gesperrt_bis || undefined,
  });

  return NextResponse.json({
    ok: true,
    benachrichtigt: kutscherMitEmail.length,
    betroffene_buchungen: betroffeneBuchungen?.length ?? 0,
    buchungen: betroffeneBuchungen ?? [],
  });
}
