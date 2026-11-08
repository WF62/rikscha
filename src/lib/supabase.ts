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
  /** Freie Fahrzeit, die ein Kutscher für Bewohner anbietet */
  angebot?: boolean;
  /** Angaben zum Bewohner – nur für Kutscher und Pflege mitgeliefert */
  bewohner?: { name: string; wohnbereich: string | null; rollstuhl: boolean; hinweis: string | null } | null;
  /** Zweiter Bewohner in derselben Fahrt (z. B. Rikscha mit 2 Plätzen) */
  bewohner2_id?: string | null;
  /** Gewünschte Tour, z. B. "Fahrt zum Rhein" */
  wunschfahrt?: string | null;
  bewohner2?: { name: string; wohnbereich: string | null; rollstuhl: boolean; hinweis: string | null } | null;
};

export type Bewohner = {
  id: string;
  name: string;
  wohnbereich: string | null;
  rollstuhl: boolean;
  hinweis: string | null;
  aktiv: boolean;
};

export type Sperre = {
  id: string;
  fahrzeug: string;
  von_datum: string;
  bis_datum: string;
  grund?: string;
  erstellt_am: string;
};
