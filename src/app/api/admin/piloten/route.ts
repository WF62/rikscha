export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

function checkAdmin(req: NextRequest) {
  const cookie = req.cookies.get('admin_session')?.value;
  const expected = process.env.ADMIN_PASSWORD;
  return expected && cookie === expected;
}

export async function GET(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const db = createServiceClient();
  const { data, error } = await db
    .from('piloten_zugang')
    .select('id, name, rolle, aktiv, created_at')
    .order('name');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { name, passwort, rolle } = await req.json();
  if (!name || !passwort) return NextResponse.json({ error: 'Name und Passwort erforderlich.' }, { status: 400 });
  const db = createServiceClient();
  const { data, error } = await db
    .from('piloten_zugang')
    .insert({ name, passwort, rolle: rolle ?? 'pilot', aktiv: true, muss_pw_aendern: true })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id, ...fields } = await req.json();
  if (!id) return NextResponse.json({ error: 'ID fehlt.' }, { status: 400 });
  const db = createServiceClient();
  const { error } = await db.from('piloten_zugang').update(fields).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'ID fehlt.' }, { status: 400 });
  const db = createServiceClient();
  const { error } = await db.from('piloten_zugang').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
