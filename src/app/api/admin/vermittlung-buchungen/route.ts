export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { rolleAusAnfrage } from '@/lib/pilotAuth';

/** GET: Buchungsaktivität für eine Vermittlungsstelle (via organisation_id). */
export async function GET(req: NextRequest) {
  const { rolle } = await rolleAusAnfrage(req);
  if (!['admin', 'kutscher-admin', 'gfo'].includes(rolle ?? '')) {
    return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const organisation_id = searchParams.get('organisation_id');
  const seit = searchParams.get('seit');

  if (!organisation_id) return NextResponse.json({ letzteBuchung: null, anzahl: 0 });

  const db = createServiceClient();

  const { data: bewohner } = await db
    .from('rikscha_bewohner')
    .select('id')
    .eq('organisation_id', organisation_id);

  const ids = (bewohner ?? []).map((b: { id: string }) => b.id);
  if (ids.length === 0) return NextResponse.json({ letzteBuchung: null, anzahl: 0 });

  // Letzte Buchung insgesamt (ohne Datumsfilter)
  const { data: letzteData } = await db
    .from('rikscha_buchungen')
    .select('datum')
    .eq('storniert', false)
    .in('bewohner_id', ids)
    .order('datum', { ascending: false })
    .limit(1);

  const letzteBuchung = letzteData?.[0]?.datum ?? null;

  // Anzahl in den letzten 30 Tagen
  let anzahl = 0;
  if (seit) {
    const { count } = await db
      .from('rikscha_buchungen')
      .select('id', { count: 'exact', head: true })
      .eq('storniert', false)
      .gte('datum', seit)
      .in('bewohner_id', ids);
    anzahl = count ?? 0;
  }

  return NextResponse.json({ letzteBuchung, anzahl });
}
