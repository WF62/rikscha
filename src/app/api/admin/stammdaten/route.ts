export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { ladeStammdaten } from '@/lib/stammdaten-server';

function checkAdmin(req: NextRequest) {
  const cookie = req.cookies.get('admin_session')?.value;
  const expected = process.env.ADMIN_PASSWORD;
  return !!expected && cookie === expected;
}

const FAHRZEUG_FELDER = ['name', 'typ', 'max_gaeste', 'rollstuhl', 'farbe_hex', 'bg_hex', 'verfuegbar_ab', 'aktiv', 'reihenfolge', 'notiz'] as const;
const KUTSCHER_FELDER = ['name', 'aktiv', 'reihenfolge'] as const;
const HEX = /^#[0-9a-fA-F]{6}$/;

function auswahl(body: Record<string, unknown>, felder: readonly string[]) {
  const out: Record<string, unknown> = {};
  for (const f of felder) if (f in body) out[f] = body[f] === '' && (f === 'verfuegbar_ab' || f === 'notiz') ? null : body[f];
  return out;
}

function pruefeFahrzeug(f: Record<string, unknown>): string | null {
  if ('name' in f && !String(f.name ?? '').trim()) return 'Name fehlt.';
  if ('max_gaeste' in f && !(Number.isInteger(f.max_gaeste) && (f.max_gaeste as number) >= 0 && (f.max_gaeste as number) <= 6)) return 'Gäste: 0 bis 6.';
  for (const k of ['farbe_hex', 'bg_hex']) if (k in f && !HEX.test(String(f[k]))) return 'Farbe bitte als #RRGGBB.';
  if (f.verfuegbar_ab != null && !/^\d{4}-\d{2}-\d{2}$/.test(String(f.verfuegbar_ab))) return 'Datum ungültig.';
  return null;
}

function slug(name: string) {
  return name.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/ß/g, 'ss').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 40) || 'fahrzeug';
}

export async function GET(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json(await ladeStammdaten(true));
}

/** Body: { art: 'fahrzeug' | 'kutscher', ...felder } */
export async function POST(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const db = createServiceClient();
  if (body.art === 'fahrzeug') {
    const f = auswahl(body, FAHRZEUG_FELDER);
    if (!f.name) return NextResponse.json({ error: 'Name fehlt.' }, { status: 400 });
    const fehler = pruefeFahrzeug(f);
    if (fehler) return NextResponse.json({ error: fehler }, { status: 400 });
    const id = slug(String(f.name));
    const { data, error } = await db.from('rikscha_fahrzeuge').insert({ id, ...f }).select().single();
    if (error) return NextResponse.json({ error: error.code === '23505' ? 'Ein Fahrzeug mit diesem Namen gibt es schon.' : error.message }, { status: 400 });
    return NextResponse.json(data, { status: 201 });
  }
  if (body.art === 'kutscher') {
    const k = auswahl(body, KUTSCHER_FELDER);
    if (!String(k.name ?? '').trim()) return NextResponse.json({ error: 'Name fehlt.' }, { status: 400 });
    k.name = String(k.name).trim();
    const { data, error } = await db.from('rikscha_kutscher').insert(k).select().single();
    if (error) return NextResponse.json({ error: error.code === '23505' ? 'Diesen Namen gibt es schon.' : error.message }, { status: 400 });
    return NextResponse.json(data, { status: 201 });
  }
  return NextResponse.json({ error: 'Unbekannte Art.' }, { status: 400 });
}

/** Body: { art, id, ...felder } */
export async function PATCH(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: 'ID fehlt.' }, { status: 400 });
  const db = createServiceClient();
  if (body.art === 'fahrzeug') {
    const f = auswahl(body, FAHRZEUG_FELDER);
    const fehler = pruefeFahrzeug(f);
    if (fehler) return NextResponse.json({ error: fehler }, { status: 400 });
    const { error } = await db.from('rikscha_fahrzeuge').update(f).eq('id', body.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }
  if (body.art === 'kutscher') {
    const k = auswahl(body, KUTSCHER_FELDER);
    const { error } = await db.from('rikscha_kutscher').update(k).eq('id', body.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: 'Unbekannte Art.' }, { status: 400 });
}

/** Löschen nur, wenn keine Fahrten daran hängen – sonst bitte deaktivieren. */
export async function DELETE(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { art, id } = await req.json();
  if (!id) return NextResponse.json({ error: 'ID fehlt.' }, { status: 400 });
  const db = createServiceClient();
  if (art === 'fahrzeug') {
    const { count } = await db.from('rikscha_buchungen').select('id', { count: 'exact', head: true }).eq('fahrzeug', id);
    if (count) return NextResponse.json({ error: `Es gibt ${count} Fahrten mit diesem Fahrzeug. Bitte stattdessen deaktivieren.` }, { status: 409 });
    const { error } = await db.from('rikscha_fahrzeuge').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }
  if (art === 'kutscher') {
    const { data: k } = await db.from('rikscha_kutscher').select('name').eq('id', id).maybeSingle();
    if (k) {
      const { count } = await db.from('rikscha_buchungen').select('id', { count: 'exact', head: true }).eq('pilot', k.name);
      if (count) return NextResponse.json({ error: `${k.name} hat ${count} Fahrten. Bitte stattdessen deaktivieren.` }, { status: 409 });
    }
    const { error } = await db.from('rikscha_kutscher').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: 'Unbekannte Art.' }, { status: 400 });
}
