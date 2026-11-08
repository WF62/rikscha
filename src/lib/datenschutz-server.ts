import { createServiceClient } from './supabase';

/** Telefon und Adresse werden so viele Monate nach dem letzten Kontakt gelöscht. */
export const DATEN_FRIST_MONATE = 12;

function stichtag(): string {
  const d = new Date();
  d.setMonth(d.getMonth() - DATEN_FRIST_MONATE);
  return d.toISOString().slice(0, 10);
}

let zuletzt = 0;

/**
 * Löscht abgelaufene Kontaktdaten (Telefon, Adresse) und alte Abholorte vergangener Fahrten.
 * Läuft nebenbei bei normalen Seitenaufrufen, höchstens einmal pro Stunde je Server.
 */
export async function aufraeumen(): Promise<void> {
  if (Date.now() - zuletzt < 3_600_000) return;
  zuletzt = Date.now();
  try {
    const sb = createServiceClient();
    const grenze = stichtag();
    await sb.from('rikscha_bewohner').update({ telefon: null, adresse: null })
      .lt('letzter_kontakt', grenze).or('telefon.not.is.null,adresse.not.is.null');
    await sb.from('rikscha_buchungen').update({ abholort: null })
      .lt('datum', grenze).not('abholort', 'is', null);
  } catch { /* nächstes Mal wieder */ }
}

/**
 * Kontakt vermerken: Die Löschfrist beginnt neu – ab heute bzw. ab dem Fahrttag, falls der später liegt.
 */
export async function kontaktVermerken(ids: (string | null | undefined)[], fahrttag?: string): Promise<void> {
  const liste = ids.filter(Boolean) as string[];
  if (!liste.length) return;
  const heute = new Date().toISOString().slice(0, 10);
  const tag = fahrttag && fahrttag > heute ? fahrttag : heute;
  await createServiceClient().from('rikscha_bewohner').update({ letzter_kontakt: tag }).in('id', liste).lt('letzter_kontakt', tag);
}
