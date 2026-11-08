export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { adminCookieGueltig } from '@/lib/passwort';

/** Organisationen, die Fahrten vermitteln (Seniorenheim, Quartiersbüro …). Nur Admin. */
const checkAdmin = (req: NextRequest) => adminCookieGueltig(req.cookies.get('admin_session')?.value);
const text = (v: unknown, max: number) => { const t = String(v ?? '').trim().slice(0, max); return t || null; };
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Kontaktdaten der Stelle – nur Felder, die mitgeschickt wurden */
function kontakt(b: Record<string, unknown>) {
  const k: Record<string, unknown> = {};
  if (b.ansprechperson !== undefined) k.ansprechperson = text(b.ansprechperson, 80);
  if (b.telefon !== undefined) k.telefon = text(b.telefon, 40);
  if (b.email !== undefined) k.email = text(b.email, 120);
  return k;
}

export async function GET(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data, error } = await createServiceClient().from('rikscha_organisationen').select('*').order('name');
  if (error) return NextResponse.json({ error: 'Bitte zuerst supabase/vermittlung-gruppen.sql ausführen.' }, { status: 503 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const name = text(b.name, 80);
  if (!name) return NextResponse.json({ error: 'Bitte einen Namen eintragen.' }, { status: 400 });
  const { data, error } = await createServiceClient().from('rikscha_organisationen').insert({
    name, art: b.art === 'quartier' ? 'quartier' : 'einrichtung', standard_abholort: text(b.standard_abholort, 120),
    ...kontakt(b),
  }).select().single();
  if (error) return NextResponse.json({ error: error.code === '23505' ? 'Diesen Namen gibt es schon.' : error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  if (!b.id) return NextResponse.json({ error: 'ID fehlt.' }, { status: 400 });
  const felder: Record<string, unknown> = {};
  if (b.name !== undefined) felder.name = text(b.name, 80);
  if (b.art !== undefined) felder.art = b.art === 'quartier' ? 'quartier' : 'einrichtung';
  if (b.standard_abholort !== undefined) felder.standard_abholort = text(b.standard_abholort, 120);
  if (b.aktiv !== undefined) felder.aktiv = !!b.aktiv;
  Object.assign(felder, kontakt(b));
  if (felder.email && !EMAIL.test(String(felder.email))) return NextResponse.json({ error: 'Bitte eine gültige E-Mail-Adresse eintragen.' }, { status: 400 });
  if ('name' in felder && !felder.name) return NextResponse.json({ error: 'Bitte einen Namen eintragen.' }, { status: 400 });
  const { error } = await createServiceClient().from('rikscha_organisationen').update(felder).eq('id', b.id);
  return error ? NextResponse.json({ error: error.message }, { status: 400 }) : NextResponse.json({ ok: true });
}
