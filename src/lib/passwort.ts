import { createHmac, timingSafeEqual } from 'crypto';
import bcrypt from 'bcryptjs';
import { createServiceClient } from './supabase';

/**
 * Passwörter und Anmelde-Schlüssel (Token).
 *
 * - In der Datenbank steht nur noch ein bcrypt-Hash (Spalte passwort_hash).
 *   Solange die Migration supabase/passwoerter-hashen.sql nicht lief, wird noch der Klartext verglichen.
 * - Nach dem Login bekommt der Browser statt des Passworts einen Token "t1.<ablauf>.<signatur>".
 *   Er gilt 90 Tage und wird ungültig, sobald das Passwort geändert wird.
 */

const TOKEN_TAGE = 90;
const PRAEFIX = 't1.';

type Zeile = { id: string; name: string; rolle: string | null; aktiv: boolean | null; muss_pw_aendern?: boolean | null; passwort?: string | null; passwort_hash?: string | null; organisation_id?: string | null; fahrzeug?: string | null };

export type Anmeldung = { name: string; rolle: string; muss_pw_aendern: boolean; token: string | null;
  /** Organisation eines Vermittlungs-Zugangs (Pflege, Quartiersbüro …) */
  organisationId: string | null;
  /** Fahrzeug eines Angehörigen – fest hinterlegt, wird beim Buchen vorausgewählt */
  fahrzeug: string | null };

function geheimnis() {
  const s = process.env.SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!s) throw new Error('SESSION_SECRET fehlt');
  return s;
}

function signatur(name: string, ablauf: number, geheimTeil: string) {
  return createHmac('sha256', geheimnis()).update(`${name}|${ablauf}|${geheimTeil}`).digest('base64url');
}

function gleich(a: string, b: string) {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function istToken(wert: string) {
  return wert.startsWith(PRAEFIX);
}

export function erstelleToken(name: string, geheimTeil: string): string {
  const ablauf = Math.floor(Date.now() / 1000) + TOKEN_TAGE * 86400;
  return `${PRAEFIX}${ablauf}.${signatur(name, ablauf, geheimTeil)}`;
}

export function pruefeToken(token: string, name: string, geheimTeil: string): boolean {
  if (!istToken(token)) return false;
  const [ablaufText, sig] = token.slice(PRAEFIX.length).split('.');
  const ablauf = Number(ablaufText);
  if (!Number.isFinite(ablauf) || ablauf * 1000 < Date.now() || !sig) return false;
  return gleich(sig, signatur(name, ablauf, geheimTeil));
}

export async function hashPasswort(pw: string) {
  return bcrypt.hash(pw, 10);
}

/** Hat die Tabelle schon die Spalte passwort_hash? (Migration gelaufen) */
export async function hatHashSpalte(): Promise<boolean> {
  const { error } = await createServiceClient().from('piloten_zugang').select('passwort_hash').limit(1);
  return !error;
}

/** Felder zum Speichern eines neuen Passworts – gehasht, sobald die Spalte existiert. */
export async function passwortFelder(pw: string): Promise<Record<string, string | null>> {
  if (await hatHashSpalte()) return { passwort_hash: await hashPasswort(pw), passwort: null };
  return { passwort: pw };
}

/** Prüft Passwort ODER Token für eine Datenbankzeile. */
async function passt(z: Zeile, eingabe: string): Promise<boolean> {
  if (istToken(eingabe)) return !!z.passwort_hash && pruefeToken(eingabe, z.name, z.passwort_hash);
  if (z.passwort_hash) return bcrypt.compare(eingabe, z.passwort_hash);
  return !!z.passwort && gleich(z.passwort, eingabe);
}

/**
 * Prüft Name + Passwort (oder Token). Liefert Rolle und einen frischen Token – oder null.
 * Ein Token wird nur ausgegeben, wenn das Passwort schon gehasht gespeichert ist.
 */
export async function anmelden(name: string, eingabe: string): Promise<Anmeldung | null> {
  if (!name || !eingabe) return null;

  const adminName = process.env.ADMIN_NAME || 'Admin';
  const adminPw = process.env.ADMIN_PASSWORD;
  if (adminPw && name === adminName) {
    const ok = istToken(eingabe) ? pruefeToken(eingabe, adminName, adminPw) : gleich(eingabe, adminPw);
    if (ok) return { name: adminName, rolle: 'admin', muss_pw_aendern: false, token: erstelleToken(adminName, adminPw), organisationId: null, fahrzeug: null };
  }

  const { data } = await createServiceClient()
    .from('piloten_zugang').select('*').eq('name', name).eq('aktiv', true);
  for (const z of (data ?? []) as Zeile[]) {
    if (await passt(z, eingabe)) {
      return {
        name: z.name,
        rolle: z.rolle ?? 'kutscher',
        muss_pw_aendern: !!z.muss_pw_aendern,
        token: z.passwort_hash ? erstelleToken(z.name, z.passwort_hash) : null,
        organisationId: z.organisation_id ?? null,
        fahrzeug: z.fahrzeug ?? null,
      };
    }
  }
  return null;
}

/** Für das Ändern des eigenen Passworts: die passende Zeile (Passwort oder Token geprüft). */
export async function zeileFuer(name: string, eingabe: string): Promise<{ id: string } | null> {
  const { data } = await createServiceClient()
    .from('piloten_zugang').select('*').eq('name', name).eq('aktiv', true);
  for (const z of (data ?? []) as Zeile[]) if (await passt(z, eingabe)) return { id: z.id };
  return null;
}

/** Admin-Cookie: Token für den Admin aus den Umgebungsvariablen. */
export function adminCookieWert(): string | null {
  const adminPw = process.env.ADMIN_PASSWORD;
  return adminPw ? erstelleToken(process.env.ADMIN_NAME || 'Admin', adminPw) : null;
}

export function adminCookieGueltig(wert: string | undefined): boolean {
  const adminPw = process.env.ADMIN_PASSWORD;
  return !!wert && !!adminPw && pruefeToken(wert, process.env.ADMIN_NAME || 'Admin', adminPw);
}
