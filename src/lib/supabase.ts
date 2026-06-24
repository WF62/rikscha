import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function createServiceClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
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
};

export type Sperre = {
  id: string;
  fahrzeug: string;
  von_datum: string;
  bis_datum: string;
  grund?: string;
  erstellt_am: string;
};
