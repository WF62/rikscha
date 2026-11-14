export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { rolleAusAnfrage, darfWebBearbeiten } from '@/lib/pilotAuth';

// GET: Alle Kutscher (auch inaktive)
export async function GET(req: NextRequest) {
  const { rolle } = await rolleAusAnfrage(req);
  if (!darfWebBearbeiten(rolle)) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 });
  const { data, error } = await createServiceClient()
    .from('rikscha_kutscher')
    .select('id, name, aktiv, reihenfolge')
    .order('reihenfolge').order('name');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// POST: Neuen Kutscher anlegen
export async function POST(req: NextRequest) {
  const { rolle } = await rolleAusAnfrage(req);
  if (!darfWebBearbeiten(rolle)) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 });
  const { name, reihenfolge } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: 'Name fehlt.' }, { status: 400 });
  const db = createServiceClient();
  // Nächste Reihenfolge ermitteln wenn nicht angegeben
  let r = reihenfolge;
  if (!r) {
    const { data } = await db.from('rikscha_kutscher').select('reihenfolge').order('reihenfolge', { ascending: false }).limit(1);
    r = ((data?.[0]?.reihenfolge ?? 0) + 10);
  }
  const { data, error } = await db.from('rikscha_kutscher').insert({ name: name.trim(), aktiv: true, reihenfolge: r }).select('id, name, aktiv, reihenfolge').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

// PATCH: Name, aktiv oder reihenfolge ändern
export async function PATCH(req: NextRequest) {
  const { rolle } = await rolleAusAnfrage(req);
  if (!darfWebBearbeiten(rolle)) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 });
  const { id, name, aktiv, reihenfolge } = await req.json();
  if (!id) return NextResponse.json({ error: 'ID fehlt.' }, { status: 400 });
  const patch: Record<string, unknown> = {};
  if (name !== undefined) patch.name = name.trim();
  if (aktiv !== undefined) patch.aktiv = aktiv;
  if (reihenfolge !== undefined) patch.reihenfolge = reihenfolge;
  if (!Object.keys(patch).length) return NextResponse.json({ error: 'Nichts zu ändern.' }, { status: 400 });
  const { error } = await createServiceClient().from('rikscha_kutscher').update(patch).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
