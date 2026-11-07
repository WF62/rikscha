export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { ladeStammdaten } from '@/lib/stammdaten-server';

/** Öffentlich: aktive Fahrzeuge (auch künftige mit "verfügbar ab") und aktive Kutscher-Namen. */
export async function GET() {
  const d = await ladeStammdaten(false);
  return NextResponse.json({
    quelle: d.quelle,
    fahrzeuge: d.fahrzeuge.map(({ notiz: _n, ...f }) => f),
    kutscher: d.kutscher.map(({ name, reihenfolge, aktiv }) => ({ id: name, name, reihenfolge, aktiv })),
  });
}
