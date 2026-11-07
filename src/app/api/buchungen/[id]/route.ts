export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { rolleAusAnfrage, darfFahrtenVerwalten, istAdmin } from '@/lib/pilotAuth';
import { fahrzeugFehler } from '@/lib/stammdaten-server';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { name, rolle } = await rolleAusAnfrage(req);
  const sb = createServiceClient();
  if (!darfFahrtenVerwalten(rolle)) {
    // Angehörige dürfen nur eigene Buchungen ändern
    const { data: alt } = await sb.from('rikscha_buchungen').select('pilot').eq('id', id).maybeSingle();
    if (!(rolle === 'angehoeriger' && alt && alt.pilot === name)) {
      return NextResponse.json({ error: 'Bitte als Kutscher anmelden, um Fahrten zu ändern.' }, { status: 401 });
    }
  }
  const body = await req.json();
  const update: Record<string, unknown> = {};

  if (body.storniert === true) {
    update.storniert    = true;
    update.storniert_am = new Date().toISOString();
  }
  if (body.notiz     !== undefined) update.notiz     = body.notiz;
  if (body.pilot     !== undefined) update.pilot     = body.pilot;
  if (body.fahrzeug  !== undefined) update.fahrzeug  = body.fahrzeug;
  if (body.gaeste    !== undefined) update.gaeste    = body.gaeste;
  if (body.datum     !== undefined) update.datum     = body.datum;
  if (body.startzeit !== undefined) update.startzeit = body.startzeit;
  if (body.endzeit   !== undefined) update.endzeit   = body.endzeit;

  // Neues Fahrzeug oder neues Datum: Fahrzeug muss an dem Tag buchbar sein
  if (body.fahrzeug !== undefined || body.datum !== undefined) {
    const { data: alt } = await sb.from('rikscha_buchungen').select('fahrzeug, datum').eq('id', id).maybeSingle();
    const fz = (body.fahrzeug ?? alt?.fahrzeug ?? '') as string;
    const tag = (body.datum ?? alt?.datum) as string | undefined;
    const fzFehler = await fahrzeugFehler(fz, tag);
    if (fzFehler) return NextResponse.json({ error: fzFehler }, { status: 409 });
  }

  const { data, error } = await sb
    .from('rikscha_buchungen')
    .update(update)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { rolle } = await rolleAusAnfrage(req);
  if (!istAdmin(rolle)) return NextResponse.json({ error: 'Nur Admins dürfen Buchungen endgültig löschen.' }, { status: 403 });
  const sb = createServiceClient();
  const { error } = await sb.from('rikscha_buchungen').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
