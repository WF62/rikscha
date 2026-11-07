export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { rolleAusAnfrage, darfFahrtenVerwalten } from '@/lib/pilotAuth';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { rolle } = await rolleAusAnfrage(req);
  if (!darfFahrtenVerwalten(rolle)) return NextResponse.json({ error: 'Bitte als Kutscher anmelden, um Sperren zu löschen.' }, { status: 401 });
  const sb = createServiceClient();
  const { error } = await sb.from('rikscha_sperren').delete().eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
