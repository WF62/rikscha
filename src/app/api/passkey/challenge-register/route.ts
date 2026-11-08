export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import { createServiceClient } from '@/lib/supabase';

function getRpId(req: NextRequest) {
  const host = req.headers.get('host') ?? '';
  return host.split(':')[0]; // Port entfernen
}

export async function POST(req: NextRequest) {
  const { pilot } = await req.json();
  if (!pilot) return NextResponse.json({ error: 'Kein Pilot.' }, { status: 400 });

  const db = createServiceClient();
  const rpID = getRpId(req);

  // Existierende Credentials des Piloten laden (zum Ausschließen bei erneuter Registrierung)
  const { data: existing } = await db
    .from('rikscha_passkeys')
    .select('credential_id, transports')
    .eq('pilot_name', pilot);

  const options = await generateRegistrationOptions({
    rpName: 'Rikscha Merten',
    rpID,
    userID: new TextEncoder().encode(pilot),
    userName: pilot,
    userDisplayName: pilot,
    attestationType: 'none',
    excludeCredentials: (existing ?? []).map(c => ({
      id: c.credential_id,
      transports: c.transports ?? [],
    })),
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred',
    },
  });

  // Challenge speichern (5 min gültig)
  await db.from('rikscha_passkey_challenges').insert({
    pilot_name: pilot,
    challenge: options.challenge,
    typ: 'registration',
  });

  return NextResponse.json(options);
}
