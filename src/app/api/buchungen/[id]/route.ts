export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { rolleAusAnfrage, darfFahrtenVerwalten, istAdmin } from '@/lib/pilotAuth';
import { fahrzeugFehler, fahrzeugAuswahl, rollstuhlNoetig } from '@/lib/stammdaten-server';

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
  // Freie Zeit für das Quartier öffnen/schließen – nur Kutscher
  if (body.oeffentlich !== undefined && darfFahrtenVerwalten(rolle)) update.oeffentlich = !!body.oeffentlich;

  // Fahrzeug prüfen, sobald Kutscher, Gäste, Fahrzeug oder Zeit geändert werden
  const betrifftFahrzeug = ['fahrzeug', 'datum', 'startzeit', 'endzeit', 'gaeste', 'pilot'].some((k) => body[k] !== undefined);
  if (betrifftFahrzeug && !update.storniert) {
    const { data: alt } = await sb.from('rikscha_buchungen').select('*').eq('id', id).maybeSingle();
    if (!alt) return NextResponse.json({ error: 'Diese Fahrt gibt es nicht.' }, { status: 404 });
    const neu = { ...alt, ...update } as Record<string, unknown> & { fahrzeug: string; pilot: string; gaeste: string[]; datum: string; startzeit: string; endzeit: string; storniert: boolean };
    const anzahl = (neu.gaeste ?? []).length;
    if (!neu.storniert && neu.fahrzeug) {
      const fzFehler = await fahrzeugFehler(neu.fahrzeug, neu.datum);
      if (fzFehler) return NextResponse.json({ error: fzFehler }, { status: 409 });
      const rollstuhl = await rollstuhlNoetig([alt.bewohner_id, alt.bewohner2_id]);
      const wahl = (await fahrzeugAuswahl(neu.datum, neu.startzeit, neu.endzeit, { anzahl: Math.max(1, anzahl), rollstuhl, ausserId: id }))
        .find((x) => x.id === neu.fahrzeug);
      if (wahl && !wahl.frei) {
        return NextResponse.json({ error: `${wahl.name} geht hier nicht: ${wahl.grund}.` }, { status: 409 });
      }
    } else if (!neu.storniert && neu.pilot && anzahl > 0) {
      // Kutscher und Gast stehen fest → Fahrzeug muss feststehen, sonst droht Überbuchung
      return NextResponse.json({ error: 'Kutscher und Gast stehen fest – bitte jetzt ein Fahrzeug wählen, damit es nicht doppelt gebucht wird.' }, { status: 409 });
    }
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
