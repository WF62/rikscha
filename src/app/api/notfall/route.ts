export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getPilotRolle, darfFahrtenVerwalten } from '@/lib/pilotAuth';
import { sendNotfallSignal } from '@/lib/email';

export async function POST(req: NextRequest) {
  const { pilot, password, kategorie, beschreibung, fahrzeug, lat, lon } = await req.json();
  if (!pilot || !password) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 });
  const rolle = await getPilotRolle(pilot, password);
  if (!darfFahrtenVerwalten(rolle)) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 });
  if (!kategorie) return NextResponse.json({ error: 'Kategorie fehlt.' }, { status: 400 });

  const mapsUrl = lat && lon ? `https://maps.google.com/?q=${lat},${lon}` : null;

  const db = createServiceClient();
  const { data, error } = await db.from('rikscha_notfaelle').insert({
    kutscher: pilot,
    fahrzeug: fahrzeug || null,
    kategorie,
    beschreibung: beschreibung || null,
    lat: lat || null,
    lon: lon || null,
    maps_url: mapsUrl,
  }).select('id').single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  sendNotfallSignal({ kutscher: pilot, kategorie, beschreibung, mapsUrl: mapsUrl ?? undefined })
    .then(() => db.from('rikscha_notfaelle').update({ signal_gesendet: true }).eq('id', data.id))
    .catch(() => {});

  return NextResponse.json({ ok: true, id: data.id }, { status: 201 });
}
