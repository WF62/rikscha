import type { NextRequest } from 'next/server';
import { anmelden, istToken } from './passwort';
import { zuViele, merke } from './spamschutz';

export async function checkPilot(name: string, password: string): Promise<boolean> {
  return !!(await getPilotRolle(name, password));
}

/** Rolle zu Name + Passwort oder Anmelde-Token, sonst null. */
export async function getPilotRolle(name: string, password: string): Promise<string | null> {
  return (await anmelden(name, password))?.rolle ?? null;
}

export function istAdmin(rolle: string | null) {
  return rolle === 'admin' || rolle === 'gfo';
}

/** Name und Passwort aus den Headern x-pilot / x-password (URI-kodiert). */
export function zugangAusAnfrage(req: NextRequest): { name: string; password: string } {
  const lies = (v: string | null) => { try { return v ? decodeURIComponent(v) : ''; } catch { return ''; } };
  return { name: lies(req.headers.get('x-pilot')), password: lies(req.headers.get('x-password')) };
}

const FEHL_GRENZE = [{ max: 10, minuten: 15 }, { max: 30, minuten: 1440 }];

/** Prüft die mitgesendeten Zugangsdaten und liefert Name und Rolle (oder null). Falsche Versuche zählen mit. */
export async function rolleAusAnfrage(req: NextRequest): Promise<{ name: string; rolle: string | null }> {
  const { name, password } = zugangAusAnfrage(req);
  if (!name || !password) return { name, rolle: null };
  // Abgelaufene Tokens zählen nicht als Fehlversuch (sie sind nicht zu erraten)
  const token = istToken(password);
  if (!token && await zuViele(req, 'login-fehler', FEHL_GRENZE)) return { name, rolle: null };
  const rolle = await getPilotRolle(name, password);
  if (!rolle && !token) await merke(req, 'login-fehler');
  return { name, rolle };
}

/** Kutscher, GFO und Admin dürfen Fahrten und Sperren verwalten – Gäste und Angehörige nicht. */
export function darfFahrtenVerwalten(rolle: string | null) {
  return !!rolle && rolle !== 'gast' && rolle !== 'angehoeriger';
}
