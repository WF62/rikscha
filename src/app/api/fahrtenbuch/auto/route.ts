export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getPilotRolle, darfFahrtenVerwalten } from '@/lib/pilotAuth';

const CORS = { 'Access-Control-Allow-Origin': '*' };

// Legt automatisch Entwurfs-Einträge für vergangene, nicht-stornierte Fahrten an,
// für die noch kein Fahrtenbuch-Eintrag existiert.
export async function POST(req: NextRequest) {
  const { pilot, password } = await req.json();
  if (!pilot || !password) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 });
  const rolle = await getPilotRolle(pilot, password);
  if (!darfFahrtenVerwalten(rolle)) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 });

  const db = createServiceClient();
  const heute = new Date().toISOString().slice(0, 10);

  // Vergangene, nicht-stornierte Buchungen der letzten 90 Tage
  const neunzigTageVor = new Date();
  neunzigTageVor.setDate(neunzigTageVor.getDate() - 90);
  const von = neunzigTageVor.toISOString().slice(0, 10);

  const { data: buchungen, error: buchFehler } = await db
    .from('rikscha_buchungen')
    .select('id, fahrzeug, datum, startzeit, endzeit, pilot, gaeste')
    .eq('storniert', false)
    .eq('eigenfahrt', false)
    .lt('datum', heute)
    .gte('datum', von)
    .order('datum', { ascending: false });

  if (buchFehler) return NextResponse.json({ error: buchFehler.message }, { status: 500, headers: CORS });
  if (!buchungen?.length) return NextResponse.json({ erstellt: 0 }, { headers: CORS });

  // Bestehende Fahrtenbuch-Einträge für diese Buchungen laden
  const buchungIds = buchungen.map(b => b.id);
  const { data: vorhandene } = await db
    .from('rikscha_fahrtenbuch')
    .select('buchung_id')
    .in('buchung_id', buchungIds);

  const vorhandeneIds = new Set((vorhandene ?? []).map(v => v.buchung_id));

  // Fehlende herausfiltern
  const fehlende = buchungen.filter(b => !vorhandeneIds.has(b.id));
  if (!fehlende.length) return NextResponse.json({ erstellt: 0 }, { headers: CORS });

  // Entwürfe anlegen
  const eintraege = fehlende.map(b => ({
    buchung_id: b.id,
    fahrzeug: b.fahrzeug,
    datum: b.datum,
    startzeit: b.startzeit,
    endzeit: b.endzeit,
    kutscher: b.pilot,
    fahrttyp: 'gast',
    gast_name: b.gaeste?.[0] ?? null,
    anzahl_fahrgaeste: b.gaeste?.length ?? 1,
    spenden: 0,
    status: 'entwurf',
    eingetragen_von: 'system',
  }));

  const { error: insertFehler } = await db.from('rikscha_fahrtenbuch').insert(eintraege);
  if (insertFehler) return NextResponse.json({ error: insertFehler.message }, { status: 500, headers: CORS });

  return NextResponse.json({ erstellt: eintraege.length }, { headers: CORS });
}
