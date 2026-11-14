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

  let query = db
    .from('rikscha_buchungen')
    .select('datum', { count: 'exact' })
    .eq('storniert', false)
    .in('bewohner_id', ids)
    .order('datum', { ascending: false })
    .limit(1);

  if (seit) query = query.gte('datum', seit);

  const { data, count } = await query;
  const letzteBuchung = data?.[0]?.datum ?? null;

  // Wenn wir die letzte Buchung insgesamt wollen (nicht nur seit X), nochmal ohne Filter
  if (seit && !letzteBuchung) {
    const { data: alleData } = await db
      .from('rikscha_buchungen')
      .select('datum')
      .eq('storniert', false)
      .in('bewohner_id', ids)
      .order('datum', { ascending: false })
      .limit(1);
    return NextResponse.json({ letzteBuchung: alleData?.[0]?.datum ?? null, anzahl: count ?? 0 });
  }

  return NextResponse.json({ letzteBuchung, anzahl: count ?? 0 });
}
