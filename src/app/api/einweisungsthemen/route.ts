export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { rolleAusAnfrage, darfWebBearbeiten } from '@/lib/pilotAuth';

const CORS = { 'Access-Control-Allow-Origin': '*' };

export async function GET() {
  const db = createServiceClient();
  const { data, error } = await db
    .from('rikscha_einweisungsthemen')
    .select('id, gruppe, punkte, reihenfolge')
    .order('reihenfolge');
  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: CORS });
  return NextResponse.json(data ?? [], { headers: CORS });
}

export async function PUT(req: NextRequest) {
  const { rolle } = await rolleAusAnfrage(req);
  if (!darfWebBearbeiten(rolle))
    return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 });

  const body = await req.json();
  const { id, gruppe, punkte, reihenfolge } = body;
  if (!id) return NextResponse.json({ error: 'Fehlende ID.' }, { status: 400 });

  const db = createServiceClient();
  const { error } = await db
    .from('rikscha_einweisungsthemen')
    .update({ gruppe, punkte, reihenfolge })
    .eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: CORS });
  return NextResponse.json({ ok: true }, { headers: CORS });
}

export async function POST(req: NextRequest) {
  const { rolle } = await rolleAusAnfrage(req);
  if (!darfWebBearbeiten(rolle))
    return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 });

  const { gruppe, punkte, reihenfolge } = await req.json();
  if (!gruppe) return NextResponse.json({ error: 'Fehlende Gruppe.' }, { status: 400 });

  const db = createServiceClient();
  const { data, error } = await db
    .from('rikscha_einweisungsthemen')
    .insert({ gruppe, punkte: punkte ?? [], reihenfolge: reihenfolge ?? 99 })
    .select('id')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: CORS });
  return NextResponse.json({ ok: true, id: data.id }, { status: 201, headers: CORS });
}

export async function DELETE(req: NextRequest) {
  const { rolle } = await rolleAusAnfrage(req);
  if (!darfWebBearbeiten(rolle))
    return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'Fehlende ID.' }, { status: 400 });

  const db = createServiceClient();
  const { error } = await db.from('rikscha_einweisungsthemen').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: CORS });
  return NextResponse.json({ ok: true }, { headers: CORS });
}
