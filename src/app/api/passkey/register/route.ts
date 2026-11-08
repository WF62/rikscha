export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { createServiceClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const { pilot, credential, geraet } = await req.json();
  if (!pilot || !credential) return NextResponse.json({ error: 'Fehlende Felder.' }, { status: 400 });

  const db = createServiceClient();

  // Neueste offene Challenge holen
  const { data: ch } = await db
    .from('rikscha_passkey_challenges')
    .select('id, challenge')
    .eq('pilot_name', pilot)
    .eq('typ', 'registration')
    .gt('expires_at', new Date().toISOString())
    .order('expires_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!ch) return NextResponse.json({ error: 'Keine gültige Challenge.' }, { status: 400 });

  const rpID = process.env.PASSKEY_RP_ID ?? 'localhost';
  const origin = process.env.PASSKEY_ORIGIN ?? `https://${rpID}`;

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge: ch.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }

  if (!verification.verified || !verification.registrationInfo) {
    return NextResponse.json({ error: 'Verifizierung fehlgeschlagen.' }, { status: 400 });
  }

  const info = verification.registrationInfo;

  await db.from('rikscha_passkeys').upsert({
    pilot_name: pilot,
    credential_id: info.credential.id,
    public_key: Buffer.from(info.credential.publicKey).toString('base64'),
    counter: info.credential.counter,
    transports: credential.response?.transports ?? [],
    geraet: geraet ?? null,
  }, { onConflict: 'credential_id' });

  // Challenge löschen
  await db.from('rikscha_passkey_challenges').delete().eq('id', ch.id);

  return NextResponse.json({ ok: true });
}
