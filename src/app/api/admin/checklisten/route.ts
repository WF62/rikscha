export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { rolleAusAnfrage, darfWebBearbeiten } from '@/lib/pilotAuth';

type Punkt = { id: string; text: string };

/** GET: Alle Checklisten für Admin-Verwaltung. */
export async function GET(req: NextRequest) {
  const { rolle } = await rolleAusAnfrage(req);
  if (!darfWebBearbeiten(rolle)) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 });

  const db = createServiceClient();
  const { data, error } = await db
    .from('rikscha_checklisten')
    .select('*')
    .order('typ')
    .order('fahrzeug_id', { nullsFirst: true })
    .order('titel');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

/** PATCH: Punkte einer Checkliste ersetzen. Version wird inkrementiert. */
export async function PATCH(req: NextRequest) {
  const { rolle } = await rolleAusAnfrage(req);
  if (!darfWebBearbeiten(rolle)) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 });

  const { id, punkte, titel } = await req.json() as { id: string; punkte?: Punkt[]; titel?: string };
  if (!id) return NextResponse.json({ error: 'ID fehlt.' }, { status: 400 });

  const db = createServiceClient();
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (punkte !== undefined) updates.punkte = punkte;
  if (titel !== undefined) updates.titel = titel;

  // Wenn Punkte geändert werden: Version hochzählen
  if (punkte !== undefined) {
    const { data: current } = await db
      .from('rikscha_checklisten')
      .select('version')
      .eq('id', id)
      .single();
    updates.version = (current?.version ?? 1) + 1;
  }

  const { data, error } = await db
    .from('rikscha_checklisten')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
