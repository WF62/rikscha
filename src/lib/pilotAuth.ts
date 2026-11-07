import type { NextRequest } from 'next/server';
import { createServiceClient } from './supabase';

export async function checkPilot(name: string, password: string): Promise<boolean> {
  return !!(await getPilotRolle(name, password));
}

export async function getPilotRolle(name: string, password: string): Promise<string | null> {
  if (!name || !password) return null;

  const adminName = process.env.ADMIN_NAME || 'Admin';
  if (name === adminName && password === process.env.ADMIN_PASSWORD) return 'admin';

  const db = createServiceClient();
  const { data } = await db
    .from('piloten_zugang')
    .select('rolle')
    .eq('name', name)
    .eq('passwort', password)
    .eq('aktiv', true)
    .maybeSingle();

  return data?.rolle ?? null;
}

export function istAdmin(rolle: string | null) {
  return rolle === 'admin' || rolle === 'gfo';
}

/** Name und Passwort aus den Headern x-pilot / x-password (URI-kodiert). */
export function zugangAusAnfrage(req: NextRequest): { name: string; password: string } {
  const lies = (v: string | null) => { try { return v ? decodeURIComponent(v) : ''; } catch { return ''; } };
  return { name: lies(req.headers.get('x-pilot')), password: lies(req.headers.get('x-password')) };
}

/** Prüft die mitgesendeten Zugangsdaten und liefert Name und Rolle (oder null). */
export async function rolleAusAnfrage(req: NextRequest): Promise<{ name: string; rolle: string | null }> {
  const { name, password } = zugangAusAnfrage(req);
  return { name, rolle: await getPilotRolle(name, password) };
}

/** Kutscher, GFO und Admin dürfen Fahrten und Sperren verwalten – Gäste und Angehörige nicht. */
export function darfFahrtenVerwalten(rolle: string | null) {
  return !!rolle && rolle !== 'gast' && rolle !== 'angehoeriger';
}
