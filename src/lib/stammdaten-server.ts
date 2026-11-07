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
