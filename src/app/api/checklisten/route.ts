export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { rolleAusAnfrage, darfFahrtenVerwalten } from '@/lib/pilotAuth';

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

/** GET: Alle Checklisten + ob der aktuelle Kutscher sie für diese Saison bestätigt hat.
 *  Für einen Kutscher: nur die allgemeine + die seiner eingewiesenen Fahrzeuge.
 *  Für Admin: alle. */
export async function GET(req: NextRequest) {
  const { name, rolle } = await rolleAusAnfrage(req);
  if (!darfFahrtenVerwalten(rolle)) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 });

  const db = createServiceClient();
  const saison = aktuellesSaison();

  // Eingewiesene Fahrzeuge des Kutschers
  let fahrzeugFilter: string[] | null = null;
  if (rolle === 'kutscher' || rolle === 'pilot') {
    const { data: ew } = await db
      .from('rikscha_kutscher_fahrzeuge')
      .select('fahrzeug_id')
      .eq('kutscher_name', name);
    fahrzeugFilter = (ew ?? []).map((r: { fahrzeug_id: string }) => r.fahrzeug_id);
  }

  // Alle Checklisten laden
  let q = db.from('rikscha_checklisten').select('*').order('typ').order('titel');
  const { data: listen } = await q;

  // Bestätigungen für diese Saison + diesen Kutscher
  const { data: best } = await db
    .from('rikscha_checklisten_bestaetigung')
    .select('checkliste_id, checkliste_version, bestaetigt_am')
    .eq('kutscher_name', name)
    .eq('saison', saison);

  const bestMap = new Map((best ?? []).map((b: { checkliste_id: string; checkliste_version: number; bestaetigt_am: string }) =>
    [b.checkliste_id, { version: b.checkliste_version, am: b.bestaetigt_am }]
  ));

  const result = (listen ?? [])
    .filter((l: { typ: string; fahrzeug_id: string | null }) => {
      if (l.typ === 'allgemein') return true;
      if (fahrzeugFilter === null) return true; // admin: alle
      return fahrzeugFilter.includes(l.fahrzeug_id ?? '');
    })
    .map((l: { id: string; version: number; [key: string]: unknown }) => {
      const b = bestMap.get(l.id);
      return {
        ...l,
        bestaetigt: !!b,
        bestaetigt_am: b?.am ?? null,
        veraltet: b ? b.version < l.version : false,
      };
    });

  return NextResponse.json({ saison, listen: result });
}

/** POST: Bestätigung für eine Checkliste abgeben. */
export async function POST(req: NextRequest) {
  const { name, rolle } = await rolleAusAnfrage(req);
  if (!darfFahrtenVerwalten(rolle)) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 });

  const { checkliste_id, version } = await req.json();
  if (!checkliste_id || !version) return NextResponse.json({ error: 'Fehlende Daten.' }, { status: 400 });

  const saison = aktuellesSaison();
  const db = createServiceClient();

  const { error } = await db.from('rikscha_checklisten_bestaetigung').upsert({
    kutscher_name: name,
    checkliste_id,
    checkliste_version: version,
    saison,
    bestaetigt_am: new Date().toISOString(),
  }, { onConflict: 'kutscher_name,checkliste_id,saison' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
