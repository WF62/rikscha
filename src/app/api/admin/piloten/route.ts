export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { adminCookieGueltig, passwortFelder } from '@/lib/passwort';

function checkAdmin(req: NextRequest) {
  return adminCookieGueltig(req.cookies.get('admin_session')?.value);
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
    .insert({ name, ...(await passwortFelder(String(passwort))), rolle: rolle ?? 'pilot', aktiv: true, muss_pw_aendern: true })
    .select('id, name, rolle, aktiv')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id, name, rolle, aktiv, passwort } = await req.json();
  if (!id) return NextResponse.json({ error: 'ID fehlt.' }, { status: 400 });
  const fields: Record<string, unknown> = {};
  if (name !== undefined) fields.name = name;
  if (rolle !== undefined) fields.rolle = rolle;
  if (aktiv !== undefined) fields.aktiv = aktiv;
  // Neues Passwort vom Admin: gehasht speichern, Person muss es beim nächsten Login ändern
  if (passwort) Object.assign(fields, await passwortFelder(String(passwort)), { muss_pw_aendern: true });
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
