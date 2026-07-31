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
