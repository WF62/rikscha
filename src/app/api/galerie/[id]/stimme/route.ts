export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { zuViele, merke } from '@/lib/spamschutz';
import { rolleAusAnfrage, darfFahrtenVerwalten } from '@/lib/pilotAuth';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-pilot, x-password',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  // Pro Gerät: eine Stimme je Foto und Tag, insgesamt höchstens 50 Stimmen am Tag
  const proFoto = `stimme:${params.id}`;
  const { rolle } = await rolleAusAnfrage(req);
  if (darfFahrtenVerwalten(rolle)) {
    // Kutscher tragen Stimmen für Gäste ohne Smartphone ein – nur grob begrenzt
    if (await zuViele(req, 'stimme-kutscher', [{ max: 300, minuten: 1440 }])) {
      return NextResponse.json({ error: 'Heute wurden schon sehr viele Stimmen eingetragen.' }, { status: 429, headers: CORS });
    }
    await merke(req, 'stimme-kutscher');
  } else if (await zuViele(req, proFoto, [{ max: 1, minuten: 1440 }]) || await zuViele(req, 'stimme', [{ max: 50, minuten: 1440 }])) {
    return NextResponse.json({ error: 'Du hast für dieses Foto heute schon abgestimmt.' }, { status: 429, headers: CORS });
  }
  else {
    await merke(req, proFoto);
    await merke(req, 'stimme');
  }
  const db = createServiceClient();
  const { error } = await db.rpc('galerie_stimme', { foto_id: params.id });
  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: CORS });
  return NextResponse.json({ ok: true }, { headers: CORS });
}
