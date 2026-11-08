export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { rolleAusAnfrage, darfFahrtenVerwalten } from '@/lib/pilotAuth';
import { bereichPfad, type Bereich } from '@/lib/struktur';

/**
 * Namensliste der aktiven Fahrgäste für Kutscher (Fahrt direkt eintragen).
 * Bewusst sparsam: nur Name, Einrichtung, Bereich und Rollstuhl –
 * keine Telefonnummer, Adresse oder Hinweise.
 */
export async function GET(req: NextRequest) {
  const { rolle } = await rolleAusAnfrage(req);
  if (!darfFahrtenVerwalten(rolle)) return NextResponse.json({ error: 'Bitte als Kutscher anmelden.' }, { status: 401 });
  const sb = createServiceClient();
  const [{ data: leute, error }, { data: orgs }, { data: bereiche }] = await Promise.all([
    sb.from('rikscha_bewohner').select('id, name, organisation_id, bereich_id, rollstuhl').eq('aktiv', true),
    sb.from('rikscha_organisationen').select('id, name'),
    sb.from('rikscha_bereiche').select('*'),
  ]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const orgName = (id: string | null) => (orgs ?? []).find((o) => o.id === id)?.name ?? '';
  const liste = (leute ?? []).map((p) => ({
    id: p.id, name: p.name, rollstuhl: !!p.rollstuhl,
    einrichtung: orgName(p.organisation_id),
    bereich: bereichPfad((bereiche ?? []) as Bereich[], p.bereich_id),
  })).sort((a, b) => a.einrichtung.localeCompare(b.einrichtung, 'de') || a.name.localeCompare(b.name, 'de'));
  return NextResponse.json(liste);
}
