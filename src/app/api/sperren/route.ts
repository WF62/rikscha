import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const von = searchParams.get('von');
  const bis = searchParams.get('bis');
  const fahrzeug = searchParams.get('fahrzeug');

  const sb = createServiceClient();
  let q = sb.from('rikscha_sperren').select('*').order('von_datum');
  if (fahrzeug) q = q.eq('fahrzeug', fahrzeug);
  if (von && bis) q = q.lte('von_datum', bis).gte('bis_datum', von);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { fahrzeug, von_datum, bis_datum, grund } = body;
  if (!fahrzeug || !von_datum || !bis_datum) {
    return NextResponse.json({ error: 'Pflichtfelder fehlen.' }, { status: 400 });
  }
  const sb = createServiceClient();
  const { data, error } = await sb
    .from('rikscha_sperren')
    .insert({ fahrzeug, von_datum, bis_datum, grund: grund || null })
    .select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
