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

/** POST: Nachbestell-Markierung für einen Punkt setzen oder aufheben.
 *  Body: { id: string; punkt_id: string; markieren: boolean } */
export async function POST(req: NextRequest) {
  const { rolle } = await rolleAusAnfrage(req);
  if (!darfFahrtenVerwalten(rolle)) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 });

  const { id, punkt_id, markieren }: { id: string; punkt_id: string; markieren: boolean } = await req.json();
  if (!id || !punkt_id) return NextResponse.json({ error: 'Fehlende Daten.' }, { status: 400 });

  const db = createServiceClient();
  const { data: current } = await db
    .from('rikscha_checklisten')
    .select('nachbestellen')
    .eq('id', id)
    .single();

  const aktuell: string[] = current?.nachbestellen ?? [];
  const neu = markieren
    ? [...new Set([...aktuell, punkt_id])]
    : aktuell.filter((p: string) => p !== punkt_id);

  const { error } = await db
    .from('rikscha_checklisten')
    .update({ nachbestellen: neu })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, nachbestellen: neu });
}
