export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { rolleAusAnfrage, darfFahrtenVerwalten, darfBewohnerVerwalten } from '@/lib/pilotAuth';
import { fahrzeugAuswahl, rollstuhlNoetig } from '@/lib/stammdaten-server';

/**
 * Welche Fahrzeuge passen zu einer Fahrt und sind zu der Zeit frei?
 * ?buchung=<id>  optional: &personen=<n> &rollstuhl=1 (für die Vorschau bei der Pflege)
 */
export async function GET(req: NextRequest) {
  const { rolle } = await rolleAusAnfrage(req);
  if (!darfFahrtenVerwalten(rolle) && !darfBewohnerVerwalten(rolle)) {
    return NextResponse.json({ error: 'Bitte anmelden.' }, { status: 401 });
  }
  const p = new URL(req.url).searchParams;
  const { data: b } = await createServiceClient().from('rikscha_buchungen').select('*').eq('id', p.get('buchung') ?? '').maybeSingle();
  if (!b) return NextResponse.json({ error: 'Diese Fahrt gibt es nicht.' }, { status: 404 });
  const personen = Number(p.get('personen')) || Math.max(1, (b.gaeste ?? []).length);
  const rollstuhl = p.get('rollstuhl') === '1' || (await rollstuhlNoetig([b.bewohner_id, b.bewohner2_id]));
  return NextResponse.json(await fahrzeugAuswahl(b.datum, b.startzeit, b.endzeit, { anzahl: personen, rollstuhl, ausserId: b.id }));
}
