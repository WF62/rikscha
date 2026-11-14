export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { rolleAusAnfrage } from '@/lib/pilotAuth';

/** GET: Anzahl aktiver Vermittlungsstellen ohne Fahrzeugzugang. Nur für Admin/Kutscher-Admin. */
export async function GET(req: NextRequest) {
  const { rolle } = await rolleAusAnfrage(req);
  if (!['admin', 'kutscher-admin', 'gfo'].includes(rolle ?? '')) {
    return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 });
  }

  const db = createServiceClient();

  const [{ data: stellen }, { data: einweisungen }] = await Promise.all([
    db.from('rikscha_kutscher').select('name').eq('aktiv', true).eq('rolle', 'pflege'),
    db.from('rikscha_kutscher_fahrzeuge').select('kutscher_name'),
  ]);

  const mitZugang = new Set((einweisungen ?? []).map((e: { kutscher_name: string }) => e.kutscher_name));
  const anzahl = (stellen ?? []).filter((s: { name: string }) => !mitZugang.has(s.name)).length;

  return NextResponse.json({ anzahl });
}
