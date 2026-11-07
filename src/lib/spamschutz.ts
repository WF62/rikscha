import { createHash } from 'crypto';
import type { NextRequest } from 'next/server';
import { createServiceClient } from './supabase';

/**
 * Spam-Schutz für öffentliche Formulare – ohne fremden Dienst:
 * 1. Lockfeld "website": unsichtbar für Menschen, Bots füllen es aus.
 * 2. Mindest-Ausfüllzeit: Formular-Startzeit "_t" muss mind. 3 Sekunden alt sein.
 * 3. Begrenzung pro Gerät und Zeitraum (Tabelle rikscha_anfragen_log).
 *    Gespeichert wird nur ein gekürzter Hash aus IP + Geheimwert, keine IP-Adresse.
 */

const MINDEST_MS = 3000;

/** Anonymer Schlüssel für das anfragende Gerät. */
export function geraeteSchluessel(req: NextRequest): string {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip') || 'unbekannt';
  const salz = process.env.SPAM_SALT || process.env.SUPABASE_SERVICE_ROLE_KEY || 'rikscha';
  return createHash('sha256').update(`${salz}|${ip}`).digest('hex').slice(0, 32);
}

/**
 * Prüft Lockfeld und Ausfüllzeit. Liefert 'bot' (still verwerfen), 'neu-laden'
 * (Startzeit fehlt/kaputt – z. B. alte Seite im Browser) oder null (in Ordnung).
 */
export function formularPruefen(werte: { website?: unknown; _t?: unknown }): 'bot' | 'neu-laden' | null {
  if (typeof werte.website === 'string' && werte.website.trim() !== '') return 'bot';
  const t = Number(werte._t);
  if (!Number.isFinite(t) || t <= 0) return 'neu-laden';
  const alter = Date.now() - t;
  if (alter < MINDEST_MS) return 'bot';
  return null;
}

type Grenze = { max: number; minuten: number };

/** Wie oft wurde die Aktion von diesem Gerät im Zeitraum schon ausgeführt? (null = Tabelle fehlt) */
async function zaehle(aktion: string, schluessel: string, minuten: number): Promise<number | null> {
  try {
    const seit = new Date(Date.now() - minuten * 60_000).toISOString();
    const { count, error } = await createServiceClient()
      .from('rikscha_anfragen_log')
      .select('id', { count: 'exact', head: true })
      .eq('aktion', aktion).eq('schluessel', schluessel).gte('erstellt_am', seit);
    return error ? null : count ?? 0;
  } catch { return null; }
}

/** Ist eine der Grenzen schon erreicht? Fehlt die Tabelle, wird nicht begrenzt. */
export async function zuViele(req: NextRequest, aktion: string, grenzen: Grenze[]): Promise<boolean> {
  const s = geraeteSchluessel(req);
  for (const g of grenzen) {
    const n = await zaehle(aktion, s, g.minuten);
    if (n !== null && n >= g.max) return true;
  }
  return false;
}

/** Merkt sich eine Ausführung. Räumt dabei gelegentlich alte Einträge (> 2 Tage) auf. */
export async function merke(req: NextRequest, aktion: string): Promise<void> {
  try {
    const db = createServiceClient();
    await db.from('rikscha_anfragen_log').insert({ aktion, schluessel: geraeteSchluessel(req) });
    if (Math.random() < 0.05) {
      await db.from('rikscha_anfragen_log').delete().lt('erstellt_am', new Date(Date.now() - 2 * 86_400_000).toISOString());
    }
  } catch { /* Tabelle fehlt – dann ohne Zähler */ }
}

/** zuViele + merke in einem Schritt. Liefert true, wenn die Anfrage erlaubt ist. */
export async function begrenzen(req: NextRequest, aktion: string, grenzen: Grenze[]): Promise<boolean> {
  if (await zuViele(req, aktion, grenzen)) return false;
  await merke(req, aktion);
  return true;
}

export const ZU_VIELE = 'Zu viele Anfragen von diesem Gerät. Bitte versuche es später noch einmal.';
export const NEU_LADEN = 'Bitte lade die Seite neu und versuche es noch einmal.';
