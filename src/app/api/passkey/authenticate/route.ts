export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { createServiceClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const { pilot, credential } = await req.json();
  if (!pilot || !credential) return NextResponse.json({ error: 'Fehlende Felder.' }, { status: 400 });

  const db = createServiceClient();

  const { data: ch } = await db
    .from('rikscha_passkey_challenges')
    .select('id, challenge')
    .eq('pilot_name', pilot)
    .eq('typ', 'authentication')
    .gt('expires_at', new Date().toISOString())
    .order('expires_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!ch) return NextResponse.json({ error: 'Keine gültige Challenge.' }, { status: 400 });

  const { data: saved } = await db
    .from('rikscha_passkeys')
    .select('id, public_key, counter, transports')
    .eq('pilot_name', pilot)
    .eq('credential_id', credential.id)
    .maybeSingle();

  if (!saved) return NextResponse.json({ error: 'Unbekanntes Gerät.' }, { status: 401 });

  const rpID = process.env.PASSKEY_RP_ID ?? 'localhost';
  const origin = process.env.PASSKEY_ORIGIN ?? `https://${rpID}`;

  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response: credential,
      expectedChallenge: ch.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: credential.id,
        publicKey: Buffer.from(saved.public_key, 'base64'),
        counter: saved.counter,
        transports: saved.transports ?? [],
      },
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }

  if (!verification.verified) {
    return NextResponse.json({ error: 'Fingerabdruck nicht erkannt.' }, { status: 401 });
  }

  // Counter aktualisieren
  await db.from('rikscha_passkeys').update({
    counter: verification.authenticationInfo.newCounter,
    last_used_at: new Date().toISOString(),
  }).eq('id', saved.id);

  await db.from('rikscha_passkey_challenges').delete().eq('id', ch.id);

  // Pilot-Daten zurückgeben (wie pilot-login)
  const { data: pilotData } = await db
    .from('piloten_zugang')
    .select('name, rolle, muss_pw_aendern')
    .eq('name', pilot)
    .eq('aktiv', true)
    .maybeSingle();

  if (!pilotData) return NextResponse.json({ error: 'Pilot nicht aktiv.' }, { status: 403 });

  return NextResponse.json({ ok: true, pilot: pilotData.name, rolle: pilotData.rolle, muss_pw_aendern: pilotData.muss_pw_aendern ?? false });
}
