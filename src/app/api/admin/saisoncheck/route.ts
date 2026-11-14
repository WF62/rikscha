export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { rolleAusAnfrage, istAdmin } from '@/lib/pilotAuth';

export type SaisoncheckEintrag = {
  name: string;
  aktiv: boolean;
  letztefahrt: string | null; // ISO-Datum oder null
  fahrtenLetztesSaison: number;
};

/** GET: Alle aktiven Kutscher mit ihrer letzten Fahrt und Fahrtenanzahl in der letzten Saison.
 *  Eine "Saison" läuft von Ostern eines Jahres bis Ostern des nächsten Jahres.
 *  ?saison=2024 → Saison 2024 (Ostern 2024 bis Ostern 2025) */
export async function GET(req: NextRequest) {
  const { rolle } = await rolleAusAnfrage(req);
  if (!istAdmin(rolle)) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 });

  const db = createServiceClient();
  const url = new URL(req.url);
  const saison = parseInt(url.searchParams.get('saison') ?? '') || new Date().getFullYear() - 1;

  // Ostern-Datum berechnen (Gauss-Algorithmus)
  const ostern = (jahr: number) => {
    const a = jahr % 19, b = Math.floor(jahr / 100), c = jahr % 100;
    const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4), k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const monat = Math.floor((h + l - 7 * m + 114) / 31);
    const tag = ((h + l - 7 * m + 114) % 31) + 1;
    return `${jahr}-${String(monat).padStart(2, '0')}-${String(tag).padStart(2, '0')}`;
  };

  const von = ostern(saison);
  const bis = ostern(saison + 1);

  const [{ data: kutscher }, { data: buchungen }] = await Promise.all([
    db.from('rikscha_kutscher').select('id, name, aktiv').order('reihenfolge').order('name'),
    db.from('rikscha_buchungen')
      .select('pilot, datum')
      .eq('storniert', false)
      .neq('eigenfahrt', true)
      .gte('datum', von)
      .lt('datum', bis),
  ]);

  const fahrtenMap: Record<string, { count: number; letzte: string }> = {};
  for (const b of (buchungen ?? [])) {
    if (!fahrtenMap[b.pilot]) fahrtenMap[b.pilot] = { count: 0, letzte: b.datum };
    fahrtenMap[b.pilot].count++;
    if (b.datum > fahrtenMap[b.pilot].letzte) fahrtenMap[b.pilot].letzte = b.datum;
  }

  const ergebnis: SaisoncheckEintrag[] = (kutscher ?? []).map(k => ({
    name: k.name,
    aktiv: k.aktiv,
    letztefahrt: fahrtenMap[k.name]?.letzte ?? null,
    fahrtenLetztesSaison: fahrtenMap[k.name]?.count ?? 0,
  }));

  return NextResponse.json({ saison, von, bis, kutscher: ergebnis });
}

/** PATCH: Kutscher auf inaktiv setzen (Liste von Namen) */
export async function PATCH(req: NextRequest) {
  const { rolle } = await rolleAusAnfrage(req);
  if (!istAdmin(rolle)) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 });

  const { namen }: { namen: string[] } = await req.json();
  if (!namen?.length) return NextResponse.json({ error: 'Keine Namen angegeben.' }, { status: 400 });

  const { error } = await createServiceClient()
    .from('rikscha_kutscher')
    .update({ aktiv: false })
    .in('name', namen);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, deaktiviert: namen.length });
}
