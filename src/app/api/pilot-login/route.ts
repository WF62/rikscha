import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const { pilot, password } = await req.json();

  if (!pilot || !password) {
    return NextResponse.json({ error: 'Fehlende Felder.' }, { status: 400 });
  }

  const db = createServiceClient();
  const { data, error } = await db
    .from('piloten_zugang')
    .select('id, name, rolle')
    .eq('name', pilot)
    .eq('passwort', password)
    .eq('aktiv', true)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data)  return NextResponse.json({ error: 'Falscher Name oder Passwort.' }, { status: 401 });

  return NextResponse.json({ ok: true, pilot: data.name, rolle: data.rolle });
}
