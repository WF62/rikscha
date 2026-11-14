export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { rolleAusAnfrage } from '@/lib/pilotAuth';

/** GET: Anzahl aktiver Vermittlungsstellen ohne Buchung in den letzten 30 Tagen. */
export async function GET(req: NextRequest) {
  const { rolle } = await rolleAusAnfrage(req);
  if (!['admin', 'kutscher-admin', 'gfo'].includes(rolle ?? '')) {
    return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 });
  }

  const db = createServiceClient();
  const vor30Tagen = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const { data: stellen } = await db
    .from('rikscha_kutscher')
    .select('id, name, organisation_id')
    .eq('aktiv', true)
    .eq('rolle', 'pflege');

  if (!stellen || stellen.length === 0) return NextResponse.json({ anzahl: 0 });

  let anzahl = 0;
  for (const stelle of stellen) {
    if (!stelle.organisation_id) { anzahl++; continue; }

    const { data: bewohner } = await db
      .from('rikscha_bewohner')
      .select('id')
      .eq('organisation_id', stelle.organisation_id);

    const ids = (bewohner ?? []).map((b: { id: string }) => b.id);
    if (ids.length === 0) { anzahl++; continue; }

    const { count } = await db
      .from('rikscha_buchungen')
      .select('id', { count: 'exact', head: true })
      .eq('storniert', false)
      .gte('datum', vor30Tagen)
      .in('bewohner_id', ids);

    if (!count || count === 0) anzahl++;
  }

  return NextResponse.json({ anzahl });
}
