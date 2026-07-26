import { createServiceClient } from './supabase';

export async function checkPilot(name: string, password: string): Promise<boolean> {
  if (!name || !password) return false;

  // Admin via Umgebungsvariable
  const adminName = process.env.ADMIN_NAME || 'Admin';
  if (name === adminName && password === process.env.ADMIN_PASSWORD) return true;

  // Pilot via Datenbank
  const db = createServiceClient();
  const { data } = await db
    .from('piloten_zugang')
    .select('id')
    .eq('name', name)
    .eq('passwort', password)
    .eq('aktiv', true)
    .maybeSingle();

  return !!data;
}
