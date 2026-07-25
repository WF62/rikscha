export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const sb = createServiceClient();
  const update: Record<string, unknown> = {};

  if (body.storniert === true) {
    update.storniert    = true;
    update.storniert_am = new Date().toISOString();
  }
  if (body.notiz     !== undefined) update.notiz     = body.notiz;
  if (body.pilot     !== undefined) update.pilot     = body.pilot;
  if (body.fahrzeug  !== undefined) update.fahrzeug  = body.fahrzeug;
  if (body.gaeste    !== undefined) update.gaeste    = body.gaeste;
  if (body.datum     !== undefined) update.datum     = body.datum;
  if (body.startzeit !== undefined) update.startzeit = body.startzeit;
  if (body.endzeit   !== undefined) update.endzeit   = body.endzeit;

  const { data, error } = await sb
    .from('rikscha_buchungen')
    .update(update)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = createServiceClient();
  const { error } = await sb.from('rikscha_buchungen').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
