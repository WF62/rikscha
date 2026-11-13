import type { NextRequest } from 'next/server';
import { anmelden, istToken } from './passwort';
import { zuViele, merke } from './spamschutz';

/** Angemeldeter Zugang mit Kutscher-Rechten für Inhalte (Pflege-Zugänge sind nur für Bewohnerfahrten). */
export async function checkPilot(name: string, password: string): Promise<boolean> {
  const rolle = await getPilotRolle(name, password);
  return !!rolle && rolle !== 'pflege';
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

/** Prüft die mitgesendeten Zugangsdaten: Name, Rolle und Organisation (oder rolle null). Falsche Versuche zählen mit. */
export async function anmeldungAusAnfrage(req: NextRequest): Promise<{ name: string; rolle: string | null; organisationId: string | null }> {
  const { name, password } = zugangAusAnfrage(req);
  if (!name || !password) return { name, rolle: null, organisationId: null };
  // Abgelaufene Tokens zählen nicht als Fehlversuch (sie sind nicht zu erraten)
  const token = istToken(password);
  if (!token && await zuViele(req, 'login-fehler', FEHL_GRENZE)) return { name, rolle: null, organisationId: null };
  const a = await anmelden(name, password);
  if (!a && !token) await merke(req, 'login-fehler');
  return { name, rolle: a?.rolle ?? null, organisationId: a?.organisationId ?? null };
}

export async function rolleAusAnfrage(req: NextRequest): Promise<{ name: string; rolle: string | null }> {
  const { name, rolle } = await anmeldungAusAnfrage(req);
  return { name, rolle };
}

/** Kutscher, GFO und Admin dürfen Fahrten und Sperren verwalten – Gäste, Angehörige und Pflege nicht. */
export function darfFahrtenVerwalten(rolle: string | null) {
  return rolle === 'kutscher' || rolle === 'pilot' || rolle === 'gfo' || rolle === 'admin';
}

/**
 * Vermittlung: Pflege, Quartiersbüro & Co. (Rolle 'pflege'), dazu GFO und Admin.
 * Sie pflegen Fahrgäste ihrer Organisation und buchen Fahrten und Gruppenfahrten für sie.
 */
export function darfBewohnerVerwalten(rolle: string | null) {
  return rolle === 'pflege' || rolle === 'gfo' || rolle === 'admin';
}
