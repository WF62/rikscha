import { createServiceClient } from './supabase';
import { freieAbschnitte, type Abschnitt } from './fenster';

type Fenster = { id: string; startzeit: string; endzeit: string };

/**
 * Hängt an freie Fahrzeiten (Zeitfenster) die noch freien Abschnitte und die Zahl der Buchungen an.
 * Fehlt die Spalte angebot_id noch (SQL nicht ausgeführt), gilt das ganze Fenster als frei.
 */
export async function mitFreienAbschnitten<T extends Fenster>(fenster: T[]): Promise<(T & { frei: Abschnitt[]; gebucht: number })[]> {
  if (!fenster.length) return [];
  const { data, error } = await createServiceClient().from('rikscha_buchungen')
    .select('angebot_id, startzeit, endzeit').in('angebot_id', fenster.map((f) => f.id)).eq('storniert', false);
  const kinder = error ? [] : (data ?? []);
  return fenster.map((f) => {
    const belegt = kinder.filter((k) => k.angebot_id === f.id);
    return { ...f, frei: freieAbschnitte(f, belegt), gebucht: belegt.length };
  });
}
