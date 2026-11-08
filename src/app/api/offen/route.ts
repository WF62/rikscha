export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { anmeldungAusAnfrage, darfFahrtenVerwalten, darfBewohnerVerwalten } from '@/lib/pilotAuth';

/** Wie viele Tage im Voraus gewarnt wird (heute + 2 Tage) */
const VORLAUF_TAGE = 2;

function berlinJetzt() {
  const teile = Object.fromEntries(new Intl.DateTimeFormat('de-DE', {
    timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date()).map((p) => [p.type, p.value]));
  return { tag: `${teile.year}-${teile.month}-${teile.day}`, zeit: `${teile.hour}:${teile.minute}` };
}
function plusTage(iso: string, n: number) {
  const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/**
 * Bald und noch offen (heute bis übermorgen):
 * - freieZeiten: Kutscher bietet Zeit an, aber noch kein Gast (für Vermittlung, GFO, Admin)
 * - ohneKutscher: Gast steht fest, aber noch kein Kutscher (Vermittlung: nur eigene Gäste;
 *   Kutscher: ohne Namen; GFO/Admin: alle)
 */
export async function GET(req: NextRequest) {
  const { name, rolle, organisationId } = await anmeldungAusAnfrage(req);
  const vermittlung = darfBewohnerVerwalten(rolle);
  const kutscher = darfFahrtenVerwalten(rolle);
  if (!vermittlung && !kutscher) return NextResponse.json({ error: 'Bitte anmelden.' }, { status: 401 });
  const alle = rolle === 'gfo' || rolle === 'admin';

  const { tag, zeit } = berlinJetzt();
  const sb = createServiceClient();
  const { data, error } = await sb.from('rikscha_buchungen').select('*')
    .gte('datum', tag).lte('datum', plusTage(tag, VORLAUF_TAGE)).eq('storniert', false)
    .order('datum').order('startzeit');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const kommend = (data ?? []).filter((b) => b.datum > tag || String(b.startzeit).slice(0, 5) >= zeit);

  const freieZeiten = vermittlung
    ? kommend.filter((b) => b.angebot && !b.bewohner_id && !b.gruppe_id && !(b.gaeste ?? []).length)
      .map((b) => ({ id: b.id, datum: b.datum, startzeit: b.startzeit, endzeit: b.endzeit, pilot: b.pilot, fahrzeug: b.fahrzeug }))
    : [];

  let ohne = kommend.filter((b) => !b.pilot && (b.bewohner_id || (b.gaeste ?? []).length));
  // Vermittlung sieht nur Fahrten der eigenen Gäste
  let orgVon: Record<string, string | null> = {};
  if (vermittlung && !alle) {
    const ids = ohne.map((b) => b.bewohner_id).filter(Boolean);
    const { data: bw } = ids.length ? await sb.from('rikscha_bewohner').select('id, organisation_id').in('id', ids) : { data: [] };
    orgVon = Object.fromEntries((bw ?? []).map((x) => [x.id, x.organisation_id]));
    ohne = ohne.filter((b) => b.bewohner_id && orgVon[b.bewohner_id] === organisationId);
  }
  const mitNamen = vermittlung; // Kutscher sehen hier keine Namen
  const ohneKutscher = ohne.map((b) => ({
    id: b.id, datum: b.datum, startzeit: b.startzeit, endzeit: b.endzeit, fahrzeug: b.fahrzeug, wunschfahrt: b.wunschfahrt ?? null,
    gaeste: mitNamen ? (b.gaeste ?? []) : [], personen: (b.gaeste ?? []).length,
  }));

  // Verschiebungs-Anfragen (alle künftigen Fahrten): offene zum Beantworten und Ergebnisse
  const { data: vs, error: vsFehler } = await sb.from('rikscha_buchungen').select('*')
    .gte('datum', tag).eq('storniert', false)
    .or('verschiebung_start.not.is.null,verschiebung_ergebnis.not.is.null')
    .order('datum').order('startzeit');
  let anfragen: Record<string, unknown>[] = [];
  let ergebnisse: { id: string; datum: string; text: string }[] = [];
  if (!vsFehler && vs?.length) {
    const ids = Array.from(new Set(vs.flatMap((b) => [b.bewohner_id, b.bewohner2_id]).filter(Boolean)));
    const { data: bw } = ids.length ? await sb.from('rikscha_bewohner').select('id, organisation_id').in('id', ids) : { data: [] };
    const org = Object.fromEntries((bw ?? []).map((x) => [x.id, x.organisation_id]));
    const eigeneGaeste = (b: { bewohner_id: string | null; bewohner2_id: string | null }) =>
      [b.bewohner_id, b.bewohner2_id].some((id) => id && org[id] === organisationId);
    const meins = (b: { pilot: string; bewohner_id: string | null; bewohner2_id: string | null }) =>
      alle || (rolle === 'pilot' && b.pilot === name) || (rolle === 'pflege' && eigeneGaeste(b));
    anfragen = vs.filter((b) => b.verschiebung_start && meins(b) && b.verschiebung_von !== name
      && (alle || (rolle === 'pilot' ? b.verschiebung_seite === 'vermittlung' : b.verschiebung_seite === 'kutscher')))
      .map((b) => ({
        id: b.id, datum: b.datum, startzeit: b.startzeit, endzeit: b.endzeit, pilot: b.pilot, fahrzeug: b.fahrzeug,
        gaeste: b.gaeste, bewohner_id: b.bewohner_id, bewohner2_id: b.bewohner2_id, storniert: false,
        verschiebung_start: b.verschiebung_start, verschiebung_ende: b.verschiebung_ende, verschiebung_grund: b.verschiebung_grund,
        verschiebung_von: b.verschiebung_von, verschiebung_seite: b.verschiebung_seite,
      }));
    ergebnisse = vs.filter((b) => !b.verschiebung_start && b.verschiebung_ergebnis && meins(b))
      .map((b) => ({ id: b.id, datum: b.datum, text: b.verschiebung_ergebnis }));
  }

  return NextResponse.json({ heute: tag, vorlaufTage: VORLAUF_TAGE, freieZeiten, ohneKutscher, anfragen, ergebnisse, rolle });
}
