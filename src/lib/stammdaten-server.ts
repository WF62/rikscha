import { createServiceClient } from './supabase';
import { STANDARD_STAMMDATEN, fahrzeugAusZeile, datumDeutsch, type Stammdaten } from './stammdaten';

/**
 * Lädt Fahrzeuge und Kutscher aus der Datenbank.
 * Fehlen die Tabellen noch (Migration nicht ausgeführt), gelten die festen Werte aus dem Code.
 */
export async function ladeStammdaten(alle = false): Promise<Stammdaten> {
  try {
    const sb = createServiceClient();
    let fq = sb.from('rikscha_fahrzeuge').select('*').order('reihenfolge').order('name');
    let kq = sb.from('rikscha_kutscher').select('id, name, aktiv, reihenfolge').order('reihenfolge').order('name');
    if (!alle) { fq = fq.eq('aktiv', true); kq = kq.eq('aktiv', true); }
    const [f, k] = await Promise.all([fq, kq]);
    if (f.error || k.error) return STANDARD_STAMMDATEN;
    return {
      quelle: 'datenbank',
      fahrzeuge: (f.data ?? []).map(fahrzeugAusZeile),
      kutscher: (k.data ?? []).map((r) => ({ id: r.id, name: r.name, aktiv: r.aktiv, reihenfolge: r.reihenfolge })),
    };
  } catch {
    return STANDARD_STAMMDATEN;
  }
}

/** Fehlertext, wenn das Fahrzeug an diesem Tag nicht gebucht werden kann – sonst null. */
export async function fahrzeugFehler(fahrzeugId: string, datum?: string): Promise<string | null> {
  if (!fahrzeugId) return null;
  const { fahrzeuge } = await ladeStammdaten(true);
  const f = fahrzeuge.find((x) => x.id === fahrzeugId);
  if (!f) return 'Dieses Fahrzeug gibt es nicht.';
  if (!f.aktiv) return `${f.name} ist zurzeit nicht im Einsatz.`;
  if (datum && f.verfuegbarAb && datum < f.verfuegbarAb) {
    return `${f.name} ist erst ab ${datumDeutsch(f.verfuegbarAb)} buchbar.`;
  }
  return null;
}

export type FahrzeugWahl = {
  id: string; name: string; maxGaeste: number; rollstuhl: boolean;
  /** true = zu dieser Zeit frei und passend */
  frei: boolean;
  /** Grund, warum es nicht geht */
  grund?: string;
};

/**
 * Welche Fahrzeuge kommen für diese Zeit in Frage? Prüft Lieferdatum, Plätze, Rollstuhl,
 * Sperren und andere Fahrten zur selben Zeit (die Fahrt "ausserId" selbst zählt nicht mit).
 */
export async function fahrzeugAuswahl(
  datum: string, start: string, ende: string,
  opt: { anzahl?: number; rollstuhl?: boolean; ausserId?: string } = {},
): Promise<FahrzeugWahl[]> {
  const sb = createServiceClient();
  const { fahrzeuge } = await ladeStammdaten(false);
  let q = sb.from('rikscha_buchungen').select('id, fahrzeug').eq('datum', datum).eq('storniert', false)
    .neq('fahrzeug', '').lt('startzeit', ende).gt('endzeit', start);
  if (opt.ausserId) q = q.neq('id', opt.ausserId);
  const [{ data: belegt }, { data: sperren }] = await Promise.all([
    q,
    sb.from('rikscha_sperren').select('fahrzeug').lte('von_datum', datum).gte('bis_datum', datum),
  ]);
  const besetzt = new Set((belegt ?? []).map((b) => b.fahrzeug));
  const gesperrt = new Set((sperren ?? []).map((s) => s.fahrzeug));
  const anzahl = opt.anzahl ?? 1;
  return fahrzeuge.map((f) => {
    const grund = f.verfuegbarAb && datum < f.verfuegbarAb ? `erst ab ${datumDeutsch(f.verfuegbarAb)}`
      : anzahl > f.maxGaeste ? `nur ${f.maxGaeste} Platz${f.maxGaeste === 1 ? '' : 'e'}`
      : opt.rollstuhl && !f.rollstuhl ? 'nicht für Rollstuhl'
      : gesperrt.has(f.id) ? 'gesperrt'
      : besetzt.has(f.id) ? 'schon gebucht'
      : undefined;
    return { id: f.id, name: f.name, maxGaeste: f.maxGaeste, rollstuhl: f.rollstuhl, frei: !grund, grund };
  });
}

/** Sitzt einer der Bewohner im Rollstuhl? */
export async function rollstuhlNoetig(ids: (string | null | undefined)[]): Promise<boolean> {
  const liste = ids.filter(Boolean) as string[];
  if (!liste.length) return false;
  const { data } = await createServiceClient().from('rikscha_bewohner').select('id').in('id', liste).eq('rollstuhl', true);
  return !!data?.length;
}
