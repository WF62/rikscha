export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { rolleAusAnfrage, darfFahrtenVerwalten, darfBewohnerVerwalten } from '@/lib/pilotAuth';
import { fahrzeugAuswahl, rollstuhlNoetig } from '@/lib/stammdaten-server';

/**
 * Welche Fahrzeuge passen zu einer Fahrt und sind zu der Zeit frei?
 * ?buchung=<id>  optional: &personen=<n> &rollstuhl=1 (für die Vorschau bei der Vermittlung)
 * oder ?datum=YYYY-MM-DD&von=HH:MM&bis=HH:MM (ohne bestehende Fahrt, z. B. Gruppenfahrt)
 * &fenster=<id>: Fahrt liegt in diesem Zeitfenster (freie Fahrzeit) – das Fenster blockiert nicht
 */
async function eingewieseneIds(kutscherName: string): Promise<string[] | null> {
  const db = createServiceClient();
  const { data } = await db.from('rikscha_kutscher_fahrzeuge')
    .select('fahrzeug_id').eq('kutscher_name', kutscherName);
  if (!data || data.length === 0) return null; // keine Einschränkung wenn noch nichts eingetragen
  return data.map(r => r.fahrzeug_id);
}

export async function GET(req: NextRequest) {
  const { name, rolle } = await rolleAusAnfrage(req);
  if (!darfFahrtenVerwalten(rolle) && !darfBewohnerVerwalten(rolle)) {
    return NextResponse.json({ error: 'Bitte anmelden.' }, { status: 401 });
  }

  // Kutscher und Pilot: nur eingewiesene Fahrzeuge zeigen
  const nurEingewiesene = (rolle === 'kutscher')
    ? await eingewieseneIds(name) : null;

  const p = new URL(req.url).searchParams;
  // Ohne bestehende Fahrt (z. B. Gruppenfahrt planen): ?datum=…&von=HH:MM&bis=HH:MM
  if (!p.get('buchung')) {
    const datum = p.get('datum') ?? '', von = p.get('von') ?? '', bis = p.get('bis') ?? '';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(datum) || !/^\d{2}:\d{2}/.test(von) || !/^\d{2}:\d{2}/.test(bis) || bis <= von) {
      return NextResponse.json({ error: 'Bitte Tag und Uhrzeit angeben.' }, { status: 400 });
    }
    let auswahl = await fahrzeugAuswahl(datum, von, bis, { anzahl: Number(p.get('personen')) || 1, rollstuhl: p.get('rollstuhl') === '1', fensterId: p.get('fenster') });
    if (nurEingewiesene) auswahl = auswahl.map(f => nurEingewiesene.includes(f.id) ? f : { ...f, frei: false, grund: 'Keine Einweisung' });
    return NextResponse.json(auswahl);
  }
  const { data: b } = await createServiceClient().from('rikscha_buchungen').select('*').eq('id', p.get('buchung') ?? '').maybeSingle();
  if (!b) return NextResponse.json({ error: 'Diese Fahrt gibt es nicht.' }, { status: 404 });
  const personen = Number(p.get('personen')) || Math.max(1, (b.gaeste ?? []).length);
  const rollstuhl = p.get('rollstuhl') === '1' || (await rollstuhlNoetig([b.bewohner_id, b.bewohner2_id]));
  let auswahl = await fahrzeugAuswahl(b.datum, b.startzeit, b.endzeit, { anzahl: personen, rollstuhl, ausserId: b.id, fensterId: b.angebot_id ?? null });
  if (nurEingewiesene) auswahl = auswahl.map(f => nurEingewiesene.includes(f.id) ? f : { ...f, frei: false, grund: 'Keine Einweisung' });
  return NextResponse.json(auswahl);
}
