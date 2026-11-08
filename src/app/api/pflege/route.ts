export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { rolleAusAnfrage, darfBewohnerVerwalten } from '@/lib/pilotAuth';
import { ladeStammdaten, fahrzeugFehler, fahrzeugAuswahl } from '@/lib/stammdaten-server';
import { sendBuchungEmail } from '@/lib/email';
import { STANDARD_ABHOLORT } from '@/lib/touren';

/**
 * Bereich für die Pflege: Bewohner pflegen, Fahrtwünsche melden, freie Fahrzeiten belegen, absagen.
 * Nur für die Rollen pflege, gfo und admin.
 */

const ZEIT = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;
const TAG = /^\d{4}-\d{2}-\d{2}$/;
const heute = () => new Date().toISOString().slice(0, 10);
const fehler = (text: string, status = 400) => NextResponse.json({ error: text }, { status });
const text = (v: unknown, max: number) => {
  const t = String(v ?? '').trim().slice(0, max);
  return t || null;
};

async function pruefen(req: NextRequest) {
  const { rolle } = await rolleAusAnfrage(req);
  return darfBewohnerVerwalten(rolle);
}

/** Bewohner, freie Fahrzeiten und geplante Bewohnerfahrten der nächsten 12 Wochen */
export async function GET(req: NextRequest) {
  if (!(await pruefen(req))) return fehler('Bitte mit einem Pflege-Zugang anmelden.', 401);
  const sb = createServiceClient();
  const bis = new Date(Date.now() + 84 * 86_400_000).toISOString().slice(0, 10);

  const fahrtenLaden = (filter: string) => sb.from('rikscha_buchungen').select('*').eq('storniert', false)
    .gte('datum', heute()).lte('datum', bis).or(filter).order('datum').order('startzeit');
  const [bw, mitZweitem] = await Promise.all([
    sb.from('rikscha_bewohner').select('*').order('name'),
    fahrtenLaden('angebot.eq.true,bewohner_id.not.is.null,bewohner2_id.not.is.null'),
  ]);
  if (bw.error) return fehler('Die Bewohner-Tabelle fehlt noch. Bitte supabase/bewohner-pflege.sql ausführen.', 503);
  // Spalte bewohner2_id fehlt noch (Migration nicht gelaufen) → ohne sie laden
  const fahrten = mitZweitem.error ? await fahrtenLaden('angebot.eq.true,bewohner_id.not.is.null') : mitZweitem;

  const liste = fahrten.data ?? [];
  return NextResponse.json({
    bewohner: bw.data ?? [],
    angebote: liste.filter((b) => b.angebot && !b.bewohner_id),
    fahrten: liste.filter((b) => b.bewohner_id || b.bewohner2_id),
  });
}

/** Body: { aktion: 'bewohner-neu' | 'bewohner-aendern' | 'wunsch' | 'belegen' | 'absagen', ... } */
export async function POST(req: NextRequest) {
  if (!(await pruefen(req))) return fehler('Bitte mit einem Pflege-Zugang anmelden.', 401);
  const body = await req.json().catch(() => ({}));
  const sb = createServiceClient();

  if (body.aktion === 'bewohner-neu' || body.aktion === 'bewohner-aendern') {
    const felder: Record<string, unknown> = {};
    if (body.name !== undefined) felder.name = text(body.name, 80);
    if (body.wohnbereich !== undefined) felder.wohnbereich = text(body.wohnbereich, 60);
    if (body.hinweis !== undefined) felder.hinweis = text(body.hinweis, 200);
    if (body.rollstuhl !== undefined) felder.rollstuhl = !!body.rollstuhl;
    if (body.aktiv !== undefined) felder.aktiv = !!body.aktiv;
    if ('name' in felder && !felder.name) return fehler('Bitte einen Namen eintragen.');
    if (body.aktion === 'bewohner-neu') {
      if (!felder.name) return fehler('Bitte einen Namen eintragen.');
      const { data, error } = await sb.from('rikscha_bewohner').insert(felder).select().single();
      return error ? fehler(error.message, 500) : NextResponse.json(data, { status: 201 });
    }
    if (!body.id) return fehler('ID fehlt.');
    const { error } = await sb.from('rikscha_bewohner').update(felder).eq('id', body.id);
    return error ? fehler(error.message, 500) : NextResponse.json({ ok: true });
  }

  // Löschen (z. B. nach Auszug): Name auch aus allen Fahrten entfernen, künftige Fahrten absagen
  if (body.aktion === 'bewohner-loeschen') {
    if (!body.id) return fehler('ID fehlt.');
    const id = String(body.id);
    const { data: person } = await sb.from('rikscha_bewohner').select('name').eq('id', id).maybeSingle();
    const name = person?.name ?? '';
    let { data: betroffen, error: e1 } = await sb.from('rikscha_buchungen').select('*').or(`bewohner_id.eq.${id},bewohner2_id.eq.${id}`);
    if (e1) ({ data: betroffen } = await sb.from('rikscha_buchungen').select('*').eq('bewohner_id', id));
    for (const b of betroffen ?? []) {
      const gaeste: string[] = b.gaeste ?? [];
      const ohne = gaeste.filter((g, i) => !(g === name && i === gaeste.indexOf(name)));
      let update: Record<string, unknown>;
      if (b.datum < heute()) {
        update = { gaeste: gaeste.map((g) => (g === name ? 'Bewohner' : g)) };          // Vergangenheit: nur Name entfernen
      } else if (b.bewohner2_id === id) {
        update = { bewohner2_id: null, gaeste: ohne };                                   // war zweite Person
      } else if (b.bewohner2_id) {
        update = { bewohner_id: b.bewohner2_id, bewohner2_id: null, gaeste: ohne };      // zweite Person fährt allein weiter
      } else if (b.angebot) {
        update = { bewohner_id: null, gaeste: [], notiz: null, ...('wunschfahrt' in b ? { wunschfahrt: null } : {}), ...('abholort' in b ? { abholort: null } : {}) }; // freie Fahrzeit wird wieder frei
      } else {
        update = { storniert: true, storniert_am: new Date().toISOString() };            // Fahrtwunsch absagen
      }
      await sb.from('rikscha_buchungen').update(update).eq('id', b.id);
    }
    const { error } = await sb.from('rikscha_bewohner').delete().eq('id', id);
    return error ? fehler(error.message, 500) : NextResponse.json({ ok: true });
  }

  // Für Fahrten: Bewohner laden
  const bewohnerLaden = async (id: unknown) => {
    if (!id) return null;
    const { data } = await sb.from('rikscha_bewohner').select('*').eq('id', String(id)).eq('aktiv', true).maybeSingle();
    return data;
  };
  const wunschfahrt = text(body.wunschfahrt, 120);
  const abholort = text(body.abholort, 120) ?? STANDARD_ABHOLORT;
  type Person = { id: string; name: string; rollstuhl: boolean };
  /** Fahrgäste prüfen: Rollstuhl und Anzahl der Plätze im Fahrzeug */
  const fahrgastFehler = async (personen: Person[], anzahl: number, fahrzeugId: string) => {
    const flotte = (await ladeStammdaten(false)).fahrzeuge;
    if (!fahrzeugId) {
      // Fahrzeug noch offen: Gibt es überhaupt ein passendes?
      const rolli = personen.find((p) => p.rollstuhl);
      const passend = flotte.filter((x) => x.maxGaeste >= anzahl && (!rolli || x.rollstuhl));
      if (passend.length) return null;
      return rolli ? `Kein Fahrzeug ist für Rollstühle eingetragen (${rolli.name}).` : `Kein Fahrzeug hat ${anzahl} Plätze.`;
    }
    const f = flotte.find((x) => x.id === fahrzeugId) ?? (await ladeStammdaten(true)).fahrzeuge.find((x) => x.id === fahrzeugId);
    if (!f) return null;
    if (anzahl > f.maxGaeste) return `${f.name} hat nur ${f.maxGaeste} Platz${f.maxGaeste === 1 ? '' : 'e'}.`;
    const rolli = personen.find((p) => p.rollstuhl);
    return rolli && !f.rollstuhl ? `${f.name} ist nicht für Rollstühle geeignet (${rolli.name}).` : null;
  };
  /** Zweite Person: weiterer Bewohner (bewohner2_id) ODER Begleitperson (Freitext) */
  const zweitePerson = async (erste: Person): Promise<{ person?: Person; begleitung?: string; fehler?: string }> => {
    if (body.bewohner2_id) {
      if (String(body.bewohner2_id) === erste.id) return { fehler: 'Bitte zwei verschiedene Bewohner wählen.' };
      const p = await bewohnerLaden(body.bewohner2_id);
      return p ? { person: p } : { fehler: 'Den zweiten Bewohner gibt es nicht.' };
    }
    const begleitung = text(body.begleitung, 80);
    return begleitung ? { begleitung } : {};
  };

  if (body.aktion === 'wunsch') {
    const bew = await bewohnerLaden(body.bewohner_id);
    if (!bew) return fehler('Bitte einen Bewohner wählen.');
    const { datum, startzeit, endzeit } = body;
    const fahrzeug = String(body.fahrzeug ?? '');
    if (!TAG.test(String(datum)) || !ZEIT.test(String(startzeit)) || !ZEIT.test(String(endzeit))) return fehler('Datum oder Uhrzeit ist ungültig.');
    if (datum < heute()) return fehler('Das Datum liegt in der Vergangenheit.');
    if (endzeit <= startzeit) return fehler('Das Ende muss nach dem Start liegen.');
    const zweit = await zweitePerson(bew);
    if (zweit.fehler) return fehler(zweit.fehler);
    const personen = zweit.person ? [bew, zweit.person] : [bew];
    const gaeste = [bew.name, ...(zweit.person ? [zweit.person.name] : zweit.begleitung ? [zweit.begleitung] : [])];
    const rf = await fahrgastFehler(personen, gaeste.length, fahrzeug);
    if (rf) return fehler(rf, 409);
    if (fahrzeug) {
      const ff = await fahrzeugFehler(fahrzeug, datum);
      if (ff) return fehler(ff, 409);
      const { data: belegt } = await sb.from('rikscha_buchungen').select('id').eq('fahrzeug', fahrzeug).eq('datum', datum)
        .eq('storniert', false).lt('startzeit', endzeit).gt('endzeit', startzeit);
      if (belegt?.length) return fehler('Das Fahrzeug ist in diesem Zeitraum schon gebucht.', 409);
    }
    const zeile = {
      fahrzeug, pilot: '', gaeste, datum, startzeit, endzeit,
      notiz: text(body.notiz, 500), bewohner_id: bew.id,
      ...(zweit.person ? { bewohner2_id: zweit.person.id } : {}),
      ...(wunschfahrt ? { wunschfahrt } : {}),
    };
    let { data, error } = await sb.from('rikscha_buchungen').insert({ ...zeile, abholort }).select().single();
    if (error && /abholort/.test(error.message)) {
      // Spalte abholort fehlt noch (SQL nicht gelaufen) → Abholort in die Notiz
      ({ data, error } = await sb.from('rikscha_buchungen').insert({ ...zeile, notiz: [`Abholort: ${abholort}`, zeile.notiz].filter(Boolean).join(' · ') }).select().single());
    }
    if (error) return fehler(error.message, 500);
    // Team-Mail ohne Bewohnernamen
    sendBuchungEmail({ fahrzeug, pilot: '', datum, startzeit, endzeit, gaeste: ['Bewohnerfahrt – Kutscher gesucht'], notiz: wunschfahrt ? `Wunschfahrt: ${wunschfahrt}` : null }).catch(() => {});
    return NextResponse.json(data, { status: 201 });
  }

  if (body.aktion === 'belegen') {
    const bew = await bewohnerLaden(body.bewohner_id);
    if (!bew) return fehler('Bitte einen Bewohner wählen.');
    const { data: b } = await sb.from('rikscha_buchungen').select('*').eq('id', String(body.buchung_id ?? '')).maybeSingle();
    if (!b || !b.angebot || b.storniert || b.datum < heute()) return fehler('Diese freie Fahrzeit gibt es nicht mehr.', 409);
    if (b.bewohner_id) return fehler('Diese Fahrzeit ist schon vergeben.', 409);
    const zweit = await zweitePerson(bew);
    if (zweit.fehler) return fehler(zweit.fehler);
    const personen = zweit.person ? [bew, zweit.person] : [bew];
    const gaeste = [bew.name, ...(zweit.person ? [zweit.person.name] : zweit.begleitung ? [zweit.begleitung] : [])];
    // Spätestens jetzt (Kutscher + Gast stehen fest) muss das Fahrzeug feststehen
    const fahrzeug = String(b.fahrzeug || body.fahrzeug || '');
    if (!fahrzeug) return fehler('Bitte ein Fahrzeug wählen – Kutscher und Gast stehen jetzt fest.');
    const wahl = (await fahrzeugAuswahl(b.datum, b.startzeit, b.endzeit, {
      anzahl: gaeste.length, rollstuhl: personen.some((x) => x.rollstuhl), ausserId: b.id,
    })).find((x) => x.id === fahrzeug);
    if (!wahl) return fehler('Dieses Fahrzeug gibt es nicht.');
    if (!wahl.frei) return fehler(`${wahl.name} geht hier nicht: ${wahl.grund}.`, 409);
    // Nur belegen, wenn noch frei (gleichzeitiges Belegen verhindern)
    const felder = { bewohner_id: bew.id, fahrzeug, gaeste, notiz: text(body.notiz, 500) ?? b.notiz, ...(zweit.person ? { bewohner2_id: zweit.person.id } : {}), ...(wunschfahrt ? { wunschfahrt } : {}) };
    const belegen = (f: Record<string, unknown>) => sb.from('rikscha_buchungen').update(f).eq('id', b.id).is('bewohner_id', null).select().maybeSingle();
    let { data: neu, error } = 'abholort' in b ? await belegen({ ...felder, abholort })
      : await belegen({ ...felder, notiz: [`Abholort: ${abholort}`, felder.notiz].filter(Boolean).join(' · ') });
    if (error) return fehler(error.message, 500);
    if (!neu) return fehler('Diese Fahrzeit wurde gerade vergeben.', 409);
    return NextResponse.json(neu);
  }

  if (body.aktion === 'absagen') {
    const { data: b } = await sb.from('rikscha_buchungen').select('*').eq('id', String(body.buchung_id ?? '')).maybeSingle();
    if (!b || !(b.bewohner_id || b.bewohner2_id)) return fehler('Diese Bewohnerfahrt gibt es nicht.', 404);
    // Belegte freie Fahrzeit wird wieder frei, ein Fahrtwunsch wird storniert
    const update = b.angebot
      ? { bewohner_id: null, gaeste: [], notiz: null, ...('bewohner2_id' in b ? { bewohner2_id: null } : {}), ...('wunschfahrt' in b ? { wunschfahrt: null } : {}), ...('abholort' in b ? { abholort: null } : {}) }
      : { storniert: true, storniert_am: new Date().toISOString() };
    const { error } = await sb.from('rikscha_buchungen').update(update).eq('id', b.id);
    return error ? fehler(error.message, 500) : NextResponse.json({ ok: true });
  }

  return fehler('Unbekannte Aktion.');
}
