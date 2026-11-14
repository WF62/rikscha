export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { rolleAusAnfrage } from '@/lib/pilotAuth';

function osterDatum(jahr: number): string {
  const a = jahr % 19, b = Math.floor(jahr / 100), c = jahr % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const monat = Math.floor((h + l - 7 * m + 114) / 31);
  const tag = ((h + l - 7 * m + 114) % 31) + 1;
  return `${jahr}-${String(monat).padStart(2, '0')}-${String(tag).padStart(2, '0')}`;
}

function aktuellesSaison(): number {
  const heute = new Date().toISOString().slice(0, 10);
  const jahr = new Date().getFullYear();
  return heute >= osterDatum(jahr) ? jahr : jahr - 1;
}

/** GET: Anzahl der aktiven Kutscher, die diese Saison noch nicht alle Checklisten bestätigt haben.
 *  Nur für Admin und Kutscher-Admin. */
export async function GET(req: NextRequest) {
  const { rolle } = await rolleAusAnfrage(req);
  if (!['admin', 'kutscher-admin', 'gfo'].includes(rolle ?? '')) {
    return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 });
  }

  const db = createServiceClient();
  const saison = aktuellesSaison();

  // Alle Checklisten für Saisoneinweisung (allgemein + fahrzeug)
  const { data: listen } = await db
    .from('rikscha_checklisten')
    .select('id, typ, fahrzeug_id, version')
    .in('typ', ['allgemein', 'fahrzeug']);

  const alleListen = listen ?? [];
  const allgemeinIds = alleListen.filter((l: { typ: string }) => l.typ === 'allgemein').map((l: { id: string }) => l.id);

  // Alle aktiven Kutscher (nur Fahrende, keine pflege/gfo/admin)
  const { data: kutscher } = await db
    .from('rikscha_kutscher')
    .select('name')
    .eq('aktiv', true)
    .in('rolle', ['kutscher', 'kutscher-admin']);

  if (!kutscher?.length) return NextResponse.json({ anzahl: 0, saison });

  // Eingewiesene Fahrzeuge pro Kutscher
  const { data: einweisungen } = await db
    .from('rikscha_kutscher_fahrzeuge')
    .select('kutscher_name, fahrzeug_id')
    .in('kutscher_name', kutscher.map((k: { name: string }) => k.name));

  const ewMap: Record<string, string[]> = {};
  for (const ew of einweisungen ?? []) {
    (ewMap[ew.kutscher_name] ??= []).push(ew.fahrzeug_id);
  }

  // Bestätigungen dieser Saison
  const { data: bestaetigungen } = await db
    .from('rikscha_checklisten_bestaetigung')
    .select('kutscher_name, checkliste_id, checkliste_version')
    .eq('saison', saison)
    .in('kutscher_name', kutscher.map((k: { name: string }) => k.name));

  // Bestätigungen als Map: kutscher_name -> Set<checkliste_id> (nur aktuelle Version)
  const bestMap: Record<string, Set<string>> = {};
  for (const b of bestaetigungen ?? []) {
    const liste = alleListen.find((l: { id: string }) => l.id === b.checkliste_id);
    if (!liste) continue;
    if (b.checkliste_version < liste.version) continue; // veraltet
    (bestMap[b.kutscher_name] ??= new Set()).add(b.checkliste_id);
  }

  // Prüfe für jeden Kutscher, ob alle relevanten Checklisten bestätigt sind
  let anzahl = 0;
  for (const k of kutscher) {
    const bestaetigt = bestMap[k.name] ?? new Set();
    const fahrzeugIds = ewMap[k.name] ?? [];
    const relevanteIds = [
      ...allgemeinIds,
      ...alleListen
        .filter((l: { typ: string; fahrzeug_id: string | null }) => l.typ === 'fahrzeug' && fahrzeugIds.includes(l.fahrzeug_id ?? ''))
        .map((l: { id: string }) => l.id),
    ];
    if (relevanteIds.some(id => !bestaetigt.has(id))) anzahl++;
  }

  return NextResponse.json({ anzahl, saison });
}
