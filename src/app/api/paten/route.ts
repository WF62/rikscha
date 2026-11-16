export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { createHash } from 'crypto';

function hash(pw: string) {
  return createHash('sha256').update(pw).digest('hex');
}

function istAdminPasswort(req: NextRequest): boolean {
  const pw = req.headers.get('x-admin-password');
  return !!pw && !!process.env.ADMIN_PASSWORD && pw === process.env.ADMIN_PASSWORD;
}

// GET: alle Paten (Admin) oder eigene Daten (Pate via ?id=)
export async function GET(req: NextRequest) {
  if (!istAdminPasswort(req)) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 });

  const db = createServiceClient();
  const { data, error } = await db
    .from('rikscha_paten')
    .select('id, name, email, fahrzeug_id, fahrzeugtyp, betrag_jahr, modell, aktiv, notizen, erstellt_am')
    .order('erstellt_am', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// POST: neuen Paten anlegen (Admin)
export async function POST(req: NextRequest) {
  if (!istAdminPasswort(req)) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 });

  const { name, email, password, fahrzeug_id, fahrzeugtyp, betrag_jahr, modell, notizen } = await req.json();
  if (!name || !email || !password || !fahrzeug_id) {
    return NextResponse.json({ error: 'Name, E-Mail, Passwort und Fahrzeug sind Pflicht.' }, { status: 400 });
  }

  const db = createServiceClient();
  const { data, error } = await db
    .from('rikscha_paten')
    .insert({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      pw_hash: hash(password),
      fahrzeug_id,
      fahrzeugtyp: fahrzeugtyp ?? 'rikscha',
      betrag_jahr: betrag_jahr ?? null,
      modell: modell ?? null,
      notizen: notizen ?? null,
    })
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, id: data.id }, { status: 201 });
}

// PATCH: Paten-Daten ändern (Admin)
export async function PATCH(req: NextRequest) {
  if (!istAdminPasswort(req)) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 });

  const { id, name, email, password, fahrzeug_id, fahrzeugtyp, betrag_jahr, modell, aktiv, notizen } = await req.json();
  if (!id) return NextResponse.json({ error: 'ID fehlt.' }, { status: 400 });

  const patch: Record<string, unknown> = {};
  if (name !== undefined) patch.name = name.trim();
  if (email !== undefined) patch.email = email.toLowerCase().trim();
  if (password !== undefined) patch.pw_hash = hash(password);
  if (fahrzeug_id !== undefined) patch.fahrzeug_id = fahrzeug_id;
  if (fahrzeugtyp !== undefined) patch.fahrzeugtyp = fahrzeugtyp;
  if (betrag_jahr !== undefined) patch.betrag_jahr = betrag_jahr;
  if (modell !== undefined) patch.modell = modell;
  if (aktiv !== undefined) patch.aktiv = aktiv;
  if (notizen !== undefined) patch.notizen = notizen;

  const db = createServiceClient();
  const { error } = await db.from('rikscha_paten').update(patch).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
