export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { createServiceClient } from '@/lib/supabase';

function getRpId(req: NextRequest) {
  const host = req.headers.get('host') ?? '';
  return host.split(':')[0];
}

export async function POST(req: NextRequest) {
  const { pilot } = await req.json();
  if (!pilot) return NextResponse.json({ error: 'Kein Pilot.' }, { status: 400 });

  const db = createServiceClient();
  const rpID = getRpId(req);

  const { data: credentials } = await db
    .from('rikscha_passkeys')
    .select('credential_id, transports')
    .eq('pilot_name', pilot);

  if (!credentials || credentials.length === 0) {
    return NextResponse.json({ error: 'Kein Fingerabdruck registriert.' }, { status: 404 });
  }

  const options = await generateAuthenticationOptions({
    rpID,
    userVerification: 'preferred',
    allowCredentials: credentials.map(c => ({
      id: c.credential_id,
      transports: c.transports ?? [],
    })),
  });

  await db.from('rikscha_passkey_challenges').insert({
    pilot_name: pilot,
    challenge: options.challenge,
    typ: 'authentication',
  });

  return NextResponse.json(options);
}
