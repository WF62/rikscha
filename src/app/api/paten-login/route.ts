export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { createHash } from 'crypto';

function hash(pw: string) {
  return createHash('sha256').update(pw).digest('hex');
}

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  if (!email || !password) return NextResponse.json({ error: 'Fehlende Felder.' }, { status: 400 });

  const db = createServiceClient();
  const { data } = await db
    .from('rikscha_paten')
    .select('id, name, fahrzeug_id, fahrzeugtyp, pw_hash, aktiv')
    .eq('email', email.toLowerCase().trim())
    .single();

  if (!data || !data.aktiv || data.pw_hash !== hash(password)) {
    return NextResponse.json({ error: 'E-Mail oder Passwort ungültig.' }, { status: 401 });
  }

  return NextResponse.json({
    id: data.id,
    name: data.name,
    fahrzeug_id: data.fahrzeug_id,
    fahrzeugtyp: data.fahrzeugtyp,
  });
}
