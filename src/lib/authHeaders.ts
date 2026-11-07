'use client';

/**
 * Zugangsdaten des angemeldeten Kutschers für geschützte API-Aufrufe.
 * Werden als Header gesendet (nicht in der Adresszeile), damit sie nicht in
 * Browser-Verlauf oder Server-Logs landen.
 */
export function authHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const name = localStorage.getItem('pilot_name');
  const pw = localStorage.getItem('pilot_pw');
  if (!name || !pw) return {};
  return { 'x-pilot': encodeURIComponent(name), 'x-password': encodeURIComponent(pw) };
}
