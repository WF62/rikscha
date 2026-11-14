export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getPilotRolle, darfFahrtenVerwalten } from '@/lib/pilotAuth';

export async function GET() {
  const db = createServiceClient();
  const { data, error } = await db
    .from('rikscha_touren')
    .select('id, name, kurzname, beschreibung, farbe, laenge, dauer, waypoints, waypoints_mit_zeit, gpx_original, erstellt_von, erstellt_am')
    .eq('aktiv', true)
    .order('erstellt_am', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const { pilot, password, name, kurzname, beschreibung, farbe, laenge, dauer, waypoints, waypoints_mit_zeit, gpx_original } = await req.json();
  if (!pilot || !password) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 });
  const rolle = await getPilotRolle(pilot, password);
  if (!darfFahrtenVerwalten(rolle)) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 });
  if (!name || !waypoints?.length) return NextResponse.json({ error: 'Name und Wegpunkte sind erforderlich.' }, { status: 400 });

  const db = createServiceClient();
  const { data, error } = await db.from('rikscha_touren').insert({
    name, kurzname: kurzname || name, beschreibung, farbe: farbe || '#2D6B1E',
    laenge, dauer, waypoints, waypoints_mit_zeit: waypoints_mit_zeit || null, gpx_original: gpx_original || null, erstellt_von: pilot,
  }).select('id').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, id: data.id }, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const { pilot, password, id, name, kurzname, beschreibung, farbe, laenge, dauer, waypoints, waypoints_mit_zeit, gpx_original } = await req.json();
  if (!pilot || !password || !id) return NextResponse.json({ error: 'Fehlende Felder.' }, { status: 400 });
  const rolle = await getPilotRolle(pilot, password);
  if (!darfFahrtenVerwalten(rolle)) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 });
  const db = createServiceClient();
  const updates: Record<string, unknown> = {};
  if (name) updates.name = name;
  if (kurzname !== undefined) updates.kurzname = kurzname;
  if (beschreibung !== undefined) updates.beschreibung = beschreibung;
  if (farbe) updates.farbe = farbe;
  if (laenge !== undefined) updates.laenge = laenge;
  if (dauer !== undefined) updates.dauer = dauer;
  if (waypoints) updates.waypoints = waypoints;
  if (waypoints_mit_zeit) updates.waypoints_mit_zeit = waypoints_mit_zeit;
  if (gpx_original) updates.gpx_original = gpx_original;
  const { error } = await db.from('rikscha_touren').update(updates).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { pilot, password, id } = await req.json();
  if (!pilot || !password || !id) return NextResponse.json({ error: 'Fehlende Felder.' }, { status: 400 });
  const rolle = await getPilotRolle(pilot, password);
  if (!darfFahrtenVerwalten(rolle)) return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 });
  const db = createServiceClient();
  const { error } = await db.from('rikscha_touren').update({ aktiv: false }).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
