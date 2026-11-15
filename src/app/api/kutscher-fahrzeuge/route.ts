export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { rolleAusAnfrage, darfWebBearbeiten } from '@/lib/pilotAuth';

const CORS = { 'Access-Control-Allow-Origin': '*' };

// GET: Alle Einweisungen oder gefiltert nach kutscher_name oder id
export async function GET(req: NextRequest) {
  const { rolle } = await rolleAusAnfrage(req);
  if (!['kutscher', 'kutscher-admin', 'gfo', 'admin', 'pflege'].includes(rolle ?? ''))
    return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 });

  const db = createServiceClient();
  const url = new URL(req.url);
  const kutscher = url.searchParams.get('kutscher');
  const id = url.searchParams.get('id');

  if (id) {
    const { data, error } = await db.from('rikscha_kutscher_fahrzeuge')
      .select('id, kutscher_name, fahrzeug_id, eingewiesen_von, eingewiesen_am, beleg_url, einweisungstyp')
      .eq('id', id).single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: CORS });
    return NextResponse.json(data, { headers: CORS });
  }

  let q = db.from('rikscha_kutscher_fahrzeuge')
    .select('id, kutscher_name, fahrzeug_id, eingewiesen_von, eingewiesen_am, beleg_url, einweisungstyp')
    .order('kutscher_name').order('fahrzeug_id');
  if (kutscher) q = q.eq('kutscher_name', kutscher);
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: CORS });
  return NextResponse.json(data ?? [], { headers: CORS });
}

// POST: Einweisung hinzufügen
export async function POST(req: NextRequest) {
  const { rolle, name: adminName } = await rolleAusAnfrage(req);
  if (!darfWebBearbeiten(rolle)) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 });

  const { kutscher_name, fahrzeug_id, eingewiesen_am, einweisungstyp } = await req.json();
  if (!kutscher_name || !fahrzeug_id) return NextResponse.json({ error: 'Fehlende Felder.' }, { status: 400 });

  const db = createServiceClient();
  const { error } = await db.from('rikscha_kutscher_fahrzeuge').insert({
    kutscher_name, fahrzeug_id,
    eingewiesen_von: adminName,
    eingewiesen_am: eingewiesen_am || new Date().toISOString().slice(0, 10),
    einweisungstyp: einweisungstyp === 'folge' ? 'folge' : 'voll',
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: CORS });
  return NextResponse.json({ ok: true }, { status: 201, headers: CORS });
}

// DELETE: Einweisung entfernen
export async function DELETE(req: NextRequest) {
  const { rolle } = await rolleAusAnfrage(req);
  if (!darfWebBearbeiten(rolle)) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'Fehlende ID.' }, { status: 400 });

  const db = createServiceClient();
  const { error } = await db.from('rikscha_kutscher_fahrzeuge').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: CORS });
  return NextResponse.json({ ok: true }, { headers: CORS });
}
