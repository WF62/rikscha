import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null as never;

export function createServiceClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  if (!supabaseUrl || !serviceKey) throw new Error('Supabase env vars missing');
  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
    // Next.js 14 legt fetch-Antworten sonst im Data Cache ab – auch über Deployments hinweg.
    // Dann zeigt die App veraltete Daten (z. B. neu angelegte Fahrzeuge fehlen). Daher immer frisch laden.
    global: { fetch: (url, init) => fetch(url, { ...init, cache: 'no-store' }) },
  });
}

export type Buchung = {
  id: string;
  fahrzeug: string;
  pilot: string;
  gaeste: string[];
  datum: string;
  startzeit: string;
  endzeit: string;
  notiz?: string;
  storniert: boolean;
  storniert_am?: string;
  erstellt_am: string;
  eigenfahrt?: boolean;
  /** Fahrt für einen Bewohner (nur für Kutscher und Pflege sichtbar) */
  bewohner_id?: string | null;
  /** Freie Fahrzeit, die ein Kutscher anbietet (für Vermittlungsstellen) */
  angebot?: boolean;
  /** Freie Fahrzeit auch für Interessierte aus dem Quartier direkt buchbar */
  oeffentlich?: boolean;
  /** Telefon des Gasts bei öffentlich gebuchter Zeit – nur für den Kutscher der Fahrt */
  kontakt_telefon?: string | null;
  /** Angaben zum Bewohner – nur für Kutscher und Pflege mitgeliefert */
  bewohner?: Fahrgast | null;
  /** Zweiter Bewohner in derselben Fahrt (z. B. Rikscha mit 2 Plätzen) */
  bewohner2_id?: string | null;
  /** Gewünschte Tour, z. B. "Fahrt zum Rhein" */
  wunschfahrt?: string | null;
  /** Wo der Gast abgeholt wird (z. B. Pfarrzentrum Merten, Seniorenheim St. Elisabeth – Eingang Elisabeth) */
  abholort?: string | null;
  bewohner2?: Fahrgast | null;
  /** Gehört zu einer Gruppenfahrt (mehrere Fahrzeuge) */
  gruppe_id?: string | null;
  gruppe?: { titel: string } | null;
  /** Vermittelnde Stelle mit Kontakt – nur für angemeldete Kutscher und Vermittlung */
  vermittlung?: { name: string; ansprechperson: string | null; telefon: string | null; email: string | null } | null;
};

/** Angaben zu einem Fahrgast, wie Kutscher und Vermittlung sie in einer Fahrt sehen */
export type Fahrgast = {
  name: string; wohnbereich: string | null; rollstuhl: boolean; hinweis: string | null;
  /** Bereich als Pfad, z. B. „St. Elisabeth › 1. Etage › Lindenhof“ */
  bereich?: string | null;
  /** Nur für den zuständigen Kutscher, Admin und die eigene Organisation */
  telefon?: string | null; adresse?: string | null;
};

export type Organisation = {
  id: string; name: string; art: 'einrichtung' | 'quartier'; standard_abholort: string | null; aktiv: boolean;
  /** Kontakt für Rückfragen der Kutscher */
  ansprechperson?: string | null; telefon?: string | null; email?: string | null;
};

export type Bewohner = {
  id: string;
  name: string;
  wohnbereich: string | null;
  rollstuhl: boolean;
  hinweis: string | null;
  aktiv: boolean;
  organisation_id?: string | null;
  telefon?: string | null;
  adresse?: string | null;
  /** Ab diesem Tag läuft die Löschfrist für Telefon und Adresse */
  letzter_kontakt?: string;
  /** Bereich im frei aufgebauten Haus (z. B. 1. Etage › Lindenhof) */
  bereich_id?: string | null;
};

export type Sperre = {
  id: string;
  fahrzeug: string;
  von_datum: string;
  bis_datum: string;
  grund?: string;
  erstellt_am: string;
};
