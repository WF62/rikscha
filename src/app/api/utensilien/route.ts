export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { rolleAusAnfrage, darfFahrtenVerwalten } from '@/lib/pilotAuth';

/** GET: Utensilienlisten für die eingewiesenen Fahrzeuge des Kutschers. */
export async function GET(req: NextRequest) {
  const { name, rolle } = await rolleAusAnfrage(req);
  if (!darfFahrtenVerwalten(rolle)) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 });

  const db = createServiceClient();

  let fahrzeugFilter: string[] | null = null;
  if (rolle === 'kutscher' || rolle === 'pilot') {
    const { data: ew } = await db
      .from('rikscha_kutscher_fahrzeuge')
      .select('fahrzeug_id')
      .eq('kutscher_name', name);
    fahrzeugFilter = (ew ?? []).map((r: { fahrzeug_id: string }) => r.fahrzeug_id);
  }

  const { data, error } = await db
    .from('rikscha_checklisten')
    .select('*')
    .eq('typ', 'utensilien')
    .order('titel');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const listen = (data ?? []).filter((l: { fahrzeug_id: string | null }) => {
    if (fahrzeugFilter === null) return true;
    return fahrzeugFilter.includes(l.fahrzeug_id ?? '');
  });

  return NextResponse.json({ listen });
}
