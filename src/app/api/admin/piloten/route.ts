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
    .select('*')
    .order('name');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  // Keine Passwortfelder an den Browser
  return NextResponse.json((data ?? []).map(({ id, name, rolle, aktiv, created_at, organisation_id }) => ({ id, name, rolle, aktiv, created_at, organisation_id: organisation_id ?? null })));
}

export async function POST(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { name, passwort, rolle, organisation_id } = await req.json();
  if (!name || !passwort) return NextResponse.json({ error: 'Name und Passwort erforderlich.' }, { status: 400 });
  const db = createServiceClient();
  const { data, error } = await db
    .from('piloten_zugang')
    .insert({ name, ...(await passwortFelder(String(passwort))), rolle: rolle ?? 'pilot', aktiv: true, muss_pw_aendern: true, ...(organisation_id ? { organisation_id } : {}) })
    .select('id, name, rolle, aktiv')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id, name, rolle, aktiv, passwort, organisation_id } = await req.json();
  if (!id) return NextResponse.json({ error: 'ID fehlt.' }, { status: 400 });
  const fields: Record<string, unknown> = {};
  if (name !== undefined) fields.name = name;
  if (rolle !== undefined) fields.rolle = rolle;
  if (aktiv !== undefined) fields.aktiv = aktiv;
  if (organisation_id !== undefined) fields.organisation_id = organisation_id || null;
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
