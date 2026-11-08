export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { anmeldungAusAnfrage } from '@/lib/pilotAuth';
import { fahrzeugAuswahl, rollstuhlNoetig } from '@/lib/stammdaten-server';
import { verschiebungPruefen, anfrageText } from '@/lib/verschiebung';

/**
 * Verschiebung einer Fahrt anfragen (z. B. wegen Hitze oder Regen).
 * POST   { start, grund }        – Kutscher oder Vermittlung fragt an
 * PATCH  { antwort: 'ja'|'nein' } – die andere Seite bestätigt oder lehnt ab
 * DELETE                          – Anfrage zurückziehen
 * Ohne Kutscher ändert die Vermittlung die Zeit direkt (niemand muss zustimmen).
 */
type Seite = 'kutscher' | 'vermittlung';
const fehler = (text: string, status = 400) => NextResponse.json({ error: text }, { status });
const hhmm = (z: string) => String(z).slice(0, 5);
const LEER = { verschiebung_start: null, verschiebung_ende: null, verschiebung_grund: null, verschiebung_von: null, verschiebung_seite: null, verschiebung_am: null };

function heuteBerlin() {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Berlin' }).format(new Date());
}

async function laden(req: NextRequest, id: string) {
  const { name, rolle, organisationId } = await anmeldungAusAnfrage(req);
  const sb = createServiceClient();
  const { data: b } = await sb.from('rikscha_buchungen').select('*').eq('id', id).maybeSingle();
  const buero = rolle === 'gfo' || rolle === 'admin';
  let eigeneGaeste = false;
  if (b && rolle === 'pflege' && organisationId) {
    const ids = [b.bewohner_id, b.bewohner2_id].filter(Boolean);
    const { data: bw } = ids.length ? await sb.from('rikscha_bewohner').select('organisation_id').in('id', ids) : { data: [] };
    eigeneGaeste = (bw ?? []).some((x) => x.organisation_id === organisationId);
  }
  // Wer darf für welche Seite sprechen?
  const darf: Record<Seite, boolean> = {
    kutscher: !!b && ((rolle === 'pilot' && !!b.pilot && b.pilot === name) || buero),
    vermittlung: eigeneGaeste || buero,
  };
  return { sb, b, name, rolle, buero, darf };
}

async function fahrzeugFrei(b: Record<string, unknown> & { id: string; fahrzeug: string; datum: string; gaeste: string[]; bewohner_id: string | null; bewohner2_id: string | null }, start: string, ende: string) {
  if (!b.fahrzeug) return null;
  const rollstuhl = await rollstuhlNoetig([b.bewohner_id, b.bewohner2_id]);
  const wahl = (await fahrzeugAuswahl(b.datum, start, ende, { anzahl: Math.max(1, (b.gaeste ?? []).length), rollstuhl, ausserId: b.id }))
    .find((x) => x.id === b.fahrzeug);
  return wahl && !wahl.frei ? `${wahl.name} ist zu der Zeit nicht frei (${wahl.grund}).` : null;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { sb, b, name, darf } = await laden(req, id);
  if (!b) return fehler('Diese Fahrt gibt es nicht.', 404);
  if (!darf.kutscher && !darf.vermittlung) return fehler('Nur der Kutscher dieser Fahrt oder die Vermittlung des Gasts kann eine Verschiebung anfragen.', 403);
  if (b.storniert) return fehler('Diese Fahrt ist abgesagt.');
  if (b.datum < heuteBerlin()) return fehler('Diese Fahrt liegt in der Vergangenheit.');
  const hatGast = !!b.bewohner_id || (b.gaeste ?? []).length > 0;
  if (!hatGast) return fehler('Ohne Gast kann der Kutscher die Zeit direkt im Kalender ändern.');

  const body = await req.json().catch(() => ({}));
  const start = hhmm(String(body.start ?? ''));
  const ende = verschiebungPruefen(b.startzeit, b.endzeit, start);
  if (!ende) return fehler('Bitte eine neue Zeit bis 3 Stunden früher oder später wählen.');
  const grund = String(body.grund ?? '').trim().slice(0, 120) || null;
  const belegt = await fahrzeugFrei(b, start, ende);
  if (belegt) return fehler(belegt, 409);

  // Noch kein Kutscher: Vermittlung ändert direkt
  if (!b.pilot) {
    if (!darf.vermittlung) return fehler('Nur die Vermittlung kann diese Fahrt ändern.', 403);
    const { data, error } = await sb.from('rikscha_buchungen').update({
      startzeit: start, endzeit: ende, ...LEER,
      verschiebung_ergebnis: `Verschoben von ${hhmm(b.startzeit)} auf ${start} Uhr${grund ? ` (${grund})` : ''}`,
    }).eq('id', id).select().single();
    if (error) return fehler(error.message, 500);
    return NextResponse.json({ direkt: true, buchung: data });
  }

  // Seite bestimmen: GFO/Admin, die selbst fahren, fragen als Kutscher
  const seite: Seite = darf.kutscher && (!darf.vermittlung || b.pilot === name) ? 'kutscher' : 'vermittlung';
  const { data, error } = await sb.from('rikscha_buchungen').update({
    verschiebung_start: start, verschiebung_ende: ende, verschiebung_grund: grund,
    verschiebung_von: name, verschiebung_seite: seite, verschiebung_am: new Date().toISOString(), verschiebung_ergebnis: null,
  }).eq('id', id).select().single();
  if (error) return fehler(error.message.includes('verschiebung') ? 'Datenbank noch nicht vorbereitet: bitte supabase/verschiebung-anfrage.sql ausführen.' : error.message, 500);
  return NextResponse.json({ direkt: false, buchung: data });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { sb, b, name, buero, darf } = await laden(req, id);
  if (!b) return fehler('Diese Fahrt gibt es nicht.', 404);
  if (!b.verschiebung_start || !b.verschiebung_seite) return fehler('Es gibt keine offene Anfrage (mehr).', 409);
  const andere: Seite = b.verschiebung_seite === 'kutscher' ? 'vermittlung' : 'kutscher';
  if (!darf[andere]) return fehler(andere === 'kutscher' ? 'Nur der Kutscher dieser Fahrt kann antworten.' : 'Nur die Vermittlung des Gasts kann antworten.', 403);
  if (!buero && b.verschiebung_von === name) return fehler('Die eigene Anfrage kann man nicht selbst bestätigen.', 403);
  const body = await req.json().catch(() => ({}));
  const was = anfrageText(b);

  if (body.antwort === 'ja') {
    const belegt = await fahrzeugFrei(b, b.verschiebung_start, b.verschiebung_ende);
    if (belegt) return fehler(`${belegt} Bitte ablehnen oder eine andere Zeit anfragen.`, 409);
    const { data, error } = await sb.from('rikscha_buchungen').update({
      startzeit: b.verschiebung_start, endzeit: b.verschiebung_ende, ...LEER,
      verschiebung_ergebnis: `Verschoben von ${hhmm(b.startzeit)} ${was} – bestätigt von ${name}`,
    }).eq('id', id).select().single();
    if (error) return fehler(error.message, 500);
    return NextResponse.json(data);
  }
  if (body.antwort === 'nein') {
    const notiz = String(body.notiz ?? '').trim().slice(0, 200);
    const { data, error } = await sb.from('rikscha_buchungen').update({
      ...LEER, verschiebung_ergebnis: `Verschiebung ${was} abgelehnt von ${name}${notiz ? `: ${notiz}` : ''} – es bleibt bei ${hhmm(b.startzeit)}–${hhmm(b.endzeit)} Uhr`,
    }).eq('id', id).select().single();
    if (error) return fehler(error.message, 500);
    return NextResponse.json(data);
  }
  return fehler('Bitte mit ja oder nein antworten.');
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { sb, b, name, buero } = await laden(req, id);
  if (!b) return fehler('Diese Fahrt gibt es nicht.', 404);
  if (!b.verschiebung_start) return NextResponse.json(b);
  if (!buero && b.verschiebung_von !== name) return fehler('Nur wer angefragt hat, kann die Anfrage zurückziehen.', 403);
  const { data, error } = await sb.from('rikscha_buchungen').update({ ...LEER, verschiebung_ergebnis: null }).eq('id', id).select().single();
  if (error) return fehler(error.message, 500);
  return NextResponse.json(data);
}
