export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { anmeldungAusAnfrage, darfBewohnerVerwalten } from '@/lib/pilotAuth';
import { ladeStammdaten, fahrzeugFehler, fahrzeugAuswahl } from '@/lib/stammdaten-server';
import { sendBuchungEmail } from '@/lib/email';
import { aufraeumen, kontaktVermerken, DATEN_FRIST_MONATE } from '@/lib/datenschutz-server';

/**
 * Vermittlung von Fahrten durch Organisationen (Seniorenheim, Quartiersbüro, Kirchengemeinde …):
 * Fahrgäste pflegen, Fahrtwünsche melden, freie Fahrzeiten belegen, Gruppenfahrten planen, absagen.
 *
 * - Rolle 'pflege' (= Vermittlung) sieht und bearbeitet nur Fahrgäste und Fahrten der eigenen Organisation.
 * - GFO und Admin sehen alle Organisationen.
 * - Freie Fahrzeiten der Kutscher sehen alle gleich (wer zuerst zuordnet, bekommt sie).
 */

const ZEIT = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;
const TAG = /^\d{4}-\d{2}-\d{2}$/;
const heute = () => new Date().toISOString().slice(0, 10);
const fehler = (text: string, status = 400) => NextResponse.json({ error: text }, { status });
const text = (v: unknown, max: number) => {
  const t = String(v ?? '').trim().slice(0, max);
  return t || null;
};

type Org = { id: string; name: string; art: 'einrichtung' | 'quartier'; standard_abholort: string | null; aktiv: boolean };
type Person = { id: string; name: string; rollstuhl: boolean; organisation_id: string | null; adresse: string | null; aktiv: boolean };
type Kontext = { name: string; rolle: string; orgId: string | null; alle: boolean };

async function kontext(req: NextRequest): Promise<Kontext | null> {
  const a = await anmeldungAusAnfrage(req);
  if (!darfBewohnerVerwalten(a.rolle)) return null;
  return { name: a.name, rolle: a.rolle!, orgId: a.organisationId, alle: a.rolle !== 'pflege' };
}

/** Darf dieser Zugang mit Fahrgästen dieser Organisation arbeiten? */
const zustaendig = (k: Kontext, orgId: string | null | undefined) => k.alle || (!!k.orgId && orgId === k.orgId);

export async function GET(req: NextRequest) {
  const k = await kontext(req);
  if (!k) return fehler('Bitte mit einem Vermittlungs-Zugang anmelden.', 401);
  if (!k.alle && !k.orgId) return fehler('Dein Zugang ist noch keiner Organisation zugeordnet. Bitte beim Admin melden.', 403);
  aufraeumen();
  const sb = createServiceClient();
  const bis = new Date(Date.now() + 84 * 86_400_000).toISOString().slice(0, 10);

  const [orgs, bw, fahrten, gruppen] = await Promise.all([
    sb.from('rikscha_organisationen').select('*').order('name'),
    sb.from('rikscha_bewohner').select('*').order('name'),
    sb.from('rikscha_buchungen').select('*').eq('storniert', false).gte('datum', heute()).lte('datum', bis)
      .or('angebot.eq.true,bewohner_id.not.is.null,bewohner2_id.not.is.null,gruppe_id.not.is.null')
      .order('datum').order('startzeit'),
    sb.from('rikscha_gruppen').select('*').gte('datum', heute()).order('datum'),
  ]);
  if (orgs.error || bw.error || gruppen.error || fahrten.error) {
    return fehler('Die Datenbank ist noch nicht vorbereitet. Bitte supabase/vermittlung-gruppen.sql ausführen.', 503);
  }

  const meineBewohner = (bw.data ?? []).filter((p) => zustaendig(k, p.organisation_id));
  const ids = new Set(meineBewohner.map((p) => p.id));
  const meineGruppen = (gruppen.data ?? []).filter((g) => zustaendig(k, g.organisation_id));
  const liste = fahrten.data ?? [];

  return NextResponse.json({
    organisationen: (orgs.data ?? []).filter((o) => k.alle || o.id === k.orgId),
    eigeneOrganisation: k.orgId,
    alle: k.alle,
    fristMonate: DATEN_FRIST_MONATE,
    bewohner: meineBewohner,
    // Freie Fahrzeiten: für alle Organisationen gleich sichtbar
    angebote: liste.filter((b) => b.angebot && !b.bewohner_id && !b.gruppe_id && (b.gaeste ?? []).length === 0),
    fahrten: liste.filter((b) => !b.gruppe_id && (ids.has(b.bewohner_id) || ids.has(b.bewohner2_id))),
    gruppen: meineGruppen
      .map((g) => ({ ...g, fahrten: liste.filter((b) => b.gruppe_id === g.id) }))
      .filter((g) => g.fahrten.length > 0),
  });
}

export async function POST(req: NextRequest) {
  const k = await kontext(req);
  if (!k) return fehler('Bitte mit einem Vermittlungs-Zugang anmelden.', 401);
  if (!k.alle && !k.orgId) return fehler('Dein Zugang ist noch keiner Organisation zugeordnet. Bitte beim Admin melden.', 403);
  const body = await req.json().catch(() => ({}));
  const sb = createServiceClient();

  const orgLaden = async (id: string | null | undefined): Promise<Org | null> => {
    if (!id) return null;
    const { data } = await sb.from('rikscha_organisationen').select('*').eq('id', id).maybeSingle();
    return data;
  };
  const personLaden = async (id: unknown): Promise<Person | null> => {
    if (!id) return null;
    const { data } = await sb.from('rikscha_bewohner').select('*').eq('id', String(id)).eq('aktiv', true).maybeSingle();
    return data && zustaendig(k, data.organisation_id) ? data : null;
  };

  // ── Fahrgäste ──────────────────────────────────────────────
  if (body.aktion === 'bewohner-neu' || body.aktion === 'bewohner-aendern') {
    const felder: Record<string, unknown> = {};
    if (body.name !== undefined) felder.name = text(body.name, 80);
    if (body.wohnbereich !== undefined) felder.wohnbereich = text(body.wohnbereich, 60);
    if (body.adresse !== undefined) felder.adresse = text(body.adresse, 160);
    if (body.telefon !== undefined) felder.telefon = text(body.telefon, 40);
    if (body.hinweis !== undefined) felder.hinweis = text(body.hinweis, 200);
    if (body.rollstuhl !== undefined) felder.rollstuhl = !!body.rollstuhl;
    if (body.aktiv !== undefined) felder.aktiv = !!body.aktiv;
    if ('name' in felder && !felder.name) return fehler('Bitte einen Namen eintragen.');
    felder.letzter_kontakt = heute();   // Bearbeiten zählt als Kontakt → Löschfrist beginnt neu

    if (body.aktion === 'bewohner-neu') {
      if (!felder.name) return fehler('Bitte einen Namen eintragen.');
      const orgId = k.alle ? text(body.organisation_id, 40) : k.orgId;
      if (!orgId || !(await orgLaden(orgId))) return fehler('Bitte eine Organisation wählen.');
      const { data, error } = await sb.from('rikscha_bewohner').insert({ ...felder, organisation_id: orgId }).select().single();
      return error ? fehler(error.message, 500) : NextResponse.json(data, { status: 201 });
    }
    const { data: alt } = await sb.from('rikscha_bewohner').select('organisation_id').eq('id', String(body.id ?? '')).maybeSingle();
    if (!alt || !zustaendig(k, alt.organisation_id)) return fehler('Diesen Fahrgast gibt es nicht.', 404);
    const { error } = await sb.from('rikscha_bewohner').update(felder).eq('id', body.id);
    return error ? fehler(error.message, 500) : NextResponse.json({ ok: true });
  }

  // Löschen (z. B. nach Umzug): Name aus Fahrten entfernen, künftige Fahrten absagen
  if (body.aktion === 'bewohner-loeschen') {
    const id = String(body.id ?? '');
    const { data: person } = await sb.from('rikscha_bewohner').select('name, organisation_id').eq('id', id).maybeSingle();
    if (!person || !zustaendig(k, person.organisation_id)) return fehler('Diesen Fahrgast gibt es nicht.', 404);
    const name = person.name;
    const { data: betroffen } = await sb.from('rikscha_buchungen').select('*').or(`bewohner_id.eq.${id},bewohner2_id.eq.${id}`);
    for (const b of betroffen ?? []) {
      const gaeste: string[] = b.gaeste ?? [];
      const ohne = gaeste.filter((g, i) => !(g === name && i === gaeste.indexOf(name)));
      let update: Record<string, unknown>;
      if (b.datum < heute()) {
        update = { gaeste: gaeste.map((g) => (g === name ? 'Fahrgast' : g)), abholort: null };  // Vergangenheit: Name und Ort entfernen
      } else if (b.bewohner2_id === id) {
        update = { bewohner2_id: null, gaeste: ohne };                                           // war zweite Person
      } else if (b.bewohner2_id) {
        update = { bewohner_id: b.bewohner2_id, bewohner2_id: null, gaeste: ohne };              // zweite Person fährt allein weiter
      } else if (b.gruppe_id && ohne.length) {
        update = { bewohner_id: null, gaeste: ohne };                                            // Gruppenfahrzeug mit weiteren Personen
      } else if (b.angebot && !b.gruppe_id) {
        update = { bewohner_id: null, gaeste: [], notiz: null, wunschfahrt: null, abholort: null }; // freie Fahrzeit wird wieder frei
      } else {
        update = { storniert: true, storniert_am: new Date().toISOString() };                    // Fahrt absagen
      }
      await sb.from('rikscha_buchungen').update(update).eq('id', b.id);
    }
    const { error } = await sb.from('rikscha_bewohner').delete().eq('id', id);
    return error ? fehler(error.message, 500) : NextResponse.json({ ok: true });
  }

  // ── Gemeinsames für Fahrten ────────────────────────────────
  const wunschfahrt = text(body.wunschfahrt, 120);
  /** Abholort: angegeben > Standard der Organisation > Adresse des Fahrgasts */
  const abholortFuer = async (p: Person) => text(body.abholort, 120) ?? (await orgLaden(p.organisation_id))?.standard_abholort ?? p.adresse ?? null;

  /** Ohne festes Fahrzeug: Gibt es in der Flotte überhaupt ein passendes? */
  const flottePasst = async (personen: Person[], anzahl: number) => {
    const flotte = (await ladeStammdaten(false)).fahrzeuge;
    const rolli = personen.find((p) => p.rollstuhl);
    if (flotte.some((x) => x.maxGaeste >= anzahl && (!rolli || x.rollstuhl))) return null;
    return rolli ? `Kein Fahrzeug ist für Rollstühle eingetragen (${rolli.name}).` : `Kein Fahrzeug hat ${anzahl} Plätze.`;
  };
  /** Zweite Person: weiterer Fahrgast (bewohner2_id) ODER Begleitperson (Freitext) */
  const zweitePerson = async (erste: Person): Promise<{ person?: Person; begleitung?: string; fehler?: string }> => {
    if (body.bewohner2_id) {
      if (String(body.bewohner2_id) === erste.id) return { fehler: 'Bitte zwei verschiedene Personen wählen.' };
      const p = await personLaden(body.bewohner2_id);
      return p ? { person: p } : { fehler: 'Die zweite Person gibt es nicht.' };
    }
    const begleitung = text(body.begleitung, 80);
    return begleitung ? { begleitung } : {};
  };
  const zeitPruefen = (datum: unknown, start: unknown, ende: unknown) => {
    if (!TAG.test(String(datum)) || !ZEIT.test(String(start)) || !ZEIT.test(String(ende))) return 'Datum oder Uhrzeit ist ungültig.';
    if (String(datum) < heute()) return 'Das Datum liegt in der Vergangenheit.';
    if (String(ende) <= String(start)) return 'Das Ende muss nach dem Start liegen.';
    return null;
  };

  // ── Fahrtwunsch ────────────────────────────────────────────
  if (body.aktion === 'wunsch') {
    const p1 = await personLaden(body.bewohner_id);
    if (!p1) return fehler('Bitte einen Fahrgast wählen.');
    const { datum, startzeit, endzeit } = body;
    const zf = zeitPruefen(datum, startzeit, endzeit);
    if (zf) return fehler(zf);
    const zweit = await zweitePerson(p1);
    if (zweit.fehler) return fehler(zweit.fehler);
    const personen = zweit.person ? [p1, zweit.person] : [p1];
    const gaeste = [p1.name, ...(zweit.person ? [zweit.person.name] : zweit.begleitung ? [zweit.begleitung] : [])];
    const fahrzeug = String(body.fahrzeug ?? '');
    if (fahrzeug) {
      const ff = await fahrzeugFehler(fahrzeug, datum);
      if (ff) return fehler(ff, 409);
      const wahl = (await fahrzeugAuswahl(datum, startzeit, endzeit, { anzahl: gaeste.length, rollstuhl: personen.some((x) => x.rollstuhl) }))
        .find((x) => x.id === fahrzeug);
      if (wahl && !wahl.frei) return fehler(`${wahl.name} geht hier nicht: ${wahl.grund}.`, 409);
    } else {
      const fp = await flottePasst(personen, gaeste.length);
      if (fp) return fehler(fp, 409);
    }
    const abholort = await abholortFuer(p1);
    if (!abholort) return fehler('Bitte einen Abholort angeben.');
    const { data, error } = await sb.from('rikscha_buchungen').insert({
      fahrzeug, pilot: '', gaeste, datum, startzeit, endzeit, abholort,
      notiz: text(body.notiz, 500), bewohner_id: p1.id, bewohner2_id: zweit.person?.id ?? null, wunschfahrt,
    }).select().single();
    if (error) return fehler(error.message, 500);
    await kontaktVermerken(personen.map((x) => x.id), datum);
    // Team-Mail ohne Namen und Adressen
    sendBuchungEmail({ fahrzeug, pilot: '', datum, startzeit, endzeit, gaeste: ['Vermittelte Fahrt – Kutscher gesucht'], notiz: wunschfahrt ? `Wunschfahrt: ${wunschfahrt}` : null }).catch(() => {});
    return NextResponse.json(data, { status: 201 });
  }

  // ── Freie Fahrzeit belegen ─────────────────────────────────
  if (body.aktion === 'belegen') {
    const p1 = await personLaden(body.bewohner_id);
    if (!p1) return fehler('Bitte einen Fahrgast wählen.');
    const { data: b } = await sb.from('rikscha_buchungen').select('*').eq('id', String(body.buchung_id ?? '')).maybeSingle();
    if (!b || !b.angebot || b.storniert || b.datum < heute()) return fehler('Diese freie Fahrzeit gibt es nicht mehr.', 409);
    if (b.bewohner_id || (b.gaeste ?? []).length) return fehler('Diese Fahrzeit ist schon vergeben.', 409);
    const zweit = await zweitePerson(p1);
    if (zweit.fehler) return fehler(zweit.fehler);
    const personen = zweit.person ? [p1, zweit.person] : [p1];
    const gaeste = [p1.name, ...(zweit.person ? [zweit.person.name] : zweit.begleitung ? [zweit.begleitung] : [])];
    // Spätestens jetzt (Kutscher + Gast stehen fest) muss das Fahrzeug feststehen
    const fahrzeug = String(b.fahrzeug || body.fahrzeug || '');
    if (!fahrzeug) return fehler('Bitte ein Fahrzeug wählen – Kutscher und Gast stehen jetzt fest.');
    const wahl = (await fahrzeugAuswahl(b.datum, b.startzeit, b.endzeit, {
      anzahl: gaeste.length, rollstuhl: personen.some((x) => x.rollstuhl), ausserId: b.id,
    })).find((x) => x.id === fahrzeug);
    if (!wahl) return fehler('Dieses Fahrzeug gibt es nicht.');
    if (!wahl.frei) return fehler(`${wahl.name} geht hier nicht: ${wahl.grund}.`, 409);
    const abholort = await abholortFuer(p1);
    if (!abholort) return fehler('Bitte einen Abholort angeben.');
    // Nur belegen, wenn noch frei (gleichzeitiges Belegen verhindern)
    const { data: neu, error } = await sb.from('rikscha_buchungen')
      .update({ bewohner_id: p1.id, bewohner2_id: zweit.person?.id ?? null, fahrzeug, gaeste, abholort, wunschfahrt, notiz: text(body.notiz, 500) ?? b.notiz })
      .eq('id', b.id).is('bewohner_id', null).select().maybeSingle();
    if (error) return fehler(error.message, 500);
    if (!neu) return fehler('Diese Fahrzeit wurde gerade vergeben.', 409);
    await kontaktVermerken(personen.map((x) => x.id), b.datum);
    return NextResponse.json(neu);
  }

  // ── Einzelne Fahrt absagen ─────────────────────────────────
  if (body.aktion === 'absagen') {
    const { data: b } = await sb.from('rikscha_buchungen').select('*').eq('id', String(body.buchung_id ?? '')).maybeSingle();
    if (!b || !(b.bewohner_id || b.bewohner2_id)) return fehler('Diese Fahrt gibt es nicht.', 404);
    const { data: leute } = await sb.from('rikscha_bewohner').select('organisation_id').in('id', [b.bewohner_id, b.bewohner2_id].filter(Boolean));
    if (!(leute ?? []).some((x) => zustaendig(k, x.organisation_id))) return fehler('Diese Fahrt gibt es nicht.', 404);
    // Belegte freie Fahrzeit wird wieder frei, sonst wird die Fahrt storniert
    const update = b.angebot && !b.gruppe_id
      ? { bewohner_id: null, bewohner2_id: null, gaeste: [], notiz: null, wunschfahrt: null, abholort: null }
      : { storniert: true, storniert_am: new Date().toISOString() };
    const { error } = await sb.from('rikscha_buchungen').update(update).eq('id', b.id);
    return error ? fehler(error.message, 500) : NextResponse.json({ ok: true });
  }

  // ── Gruppenfahrt planen: mehrere Fahrzeuge, Fahrgäste, Kutscher ──
  if (body.aktion === 'gruppe-neu') {
    const titel = text(body.titel, 80);
    if (!titel) return fehler('Bitte einen Namen für die Gruppenfahrt eintragen.');
    const { datum, startzeit, endzeit } = body;
    const zf = zeitPruefen(datum, startzeit, endzeit);
    if (zf) return fehler(zf);

    // Teilnehmende: Fahrgäste aus der Liste + weitere Personen (nur Name)
    const ids: string[] = Array.isArray(body.teilnehmer) ? body.teilnehmer.map(String) : [];
    const personen: Person[] = [];
    for (const id of Array.from(new Set(ids))) {
      const p = await personLaden(id);
      if (!p) return fehler('Ein gewählter Fahrgast ist nicht verfügbar.');
      personen.push(p);
    }
    const weitere = (Array.isArray(body.weitere) ? body.weitere : []).map((n: unknown) => text(n, 80)).filter(Boolean) as string[];
    const gesamt = personen.length + weitere.length;
    if (!gesamt) return fehler('Bitte Teilnehmende auswählen.');
    if (gesamt > 30) return fehler('Höchstens 30 Personen pro Gruppenfahrt.');

    // Fahrzeuge: müssen zu der Zeit frei sein
    const fzIds = Array.from(new Set((Array.isArray(body.fahrzeuge) ? body.fahrzeuge : []).map(String))) as string[];
    if (!fzIds.length) return fehler('Bitte Fahrzeuge auswählen.');
    const auswahl = await fahrzeugAuswahl(datum, startzeit, endzeit, { anzahl: 1 });
    const autos: { id: string; name: string; maxGaeste: number; rollstuhl: boolean; plaetze: { name: string; id?: string }[] }[] = [];
    for (const id of fzIds) {
      const w = auswahl.find((x) => x.id === id);
      if (!w) return fehler('Ein gewähltes Fahrzeug gibt es nicht.');
      if (!w.frei) return fehler(`${w.name} geht hier nicht: ${w.grund}.`, 409);
      autos.push({ id: w.id, name: w.name, maxGaeste: w.maxGaeste, rollstuhl: w.rollstuhl, plaetze: [] });
    }

    // Verteilen: erst Rollstuhl-Fahrgäste auf geeignete Fahrzeuge, dann alle anderen der Reihe nach
    const frei = (a: typeof autos[number]) => a.maxGaeste - a.plaetze.length;
    for (const p of personen.filter((x) => x.rollstuhl)) {
      const a = autos.find((x) => x.rollstuhl && frei(x) > 0);
      if (!a) return fehler(`Für ${p.name} (Rollstuhl) ist kein geeignetes Fahrzeug dabei.`, 409);
      a.plaetze.push({ name: p.name, id: p.id });
    }
    const rest = [...personen.filter((x) => !x.rollstuhl).map((x) => ({ name: x.name, id: x.id })), ...weitere.map((name) => ({ name }))];
    for (const g of rest) {
      const a = autos.find((x) => frei(x) > 0);
      if (!a) return fehler(`Zu wenig Plätze: ${gesamt} Personen, aber nur ${autos.reduce((s, x) => s + x.maxGaeste, 0)} Plätze.`, 409);
      a.plaetze.push(g);
    }
    const genutzt = autos.filter((a) => a.plaetze.length > 0);

    const orgId = k.alle ? (personen[0]?.organisation_id ?? text(body.organisation_id, 40)) : k.orgId;
    const org = await orgLaden(orgId);
    const abholort = text(body.abholort, 120) ?? org?.standard_abholort ?? null;
    if (!abholort) return fehler('Bitte einen Treffpunkt angeben.');

    const { data: gruppe, error: ge } = await sb.from('rikscha_gruppen')
      .insert({ titel, organisation_id: orgId, organisator: k.name, datum }).select().single();
    if (ge || !gruppe) return fehler(ge?.message ?? 'Die Gruppe konnte nicht angelegt werden.', 500);

    const zeilen = genutzt.map((a) => {
      const mitAngaben = a.plaetze.filter((x) => x.id);
      return {
        fahrzeug: a.id, pilot: '', datum, startzeit, endzeit, gruppe_id: gruppe.id, abholort, wunschfahrt,
        gaeste: a.plaetze.map((x) => x.name), notiz: text(body.notiz, 500),
        // Je Fahrzeug bis zu zwei Fahrgäste mit Angaben (Rollstuhl, Hinweis), weitere nur mit Namen
        bewohner_id: mitAngaben[0]?.id ?? null, bewohner2_id: mitAngaben[1]?.id ?? null,
      };
    });
    const { error } = await sb.from('rikscha_buchungen').insert(zeilen);
    if (error) {
      await sb.from('rikscha_gruppen').delete().eq('id', gruppe.id);
      return fehler(error.message, 500);
    }
    await kontaktVermerken(personen.map((x) => x.id), datum);
    sendBuchungEmail({
      fahrzeug: genutzt.map((a) => a.name).join(', '), pilot: '', datum, startzeit, endzeit,
      gaeste: [`Gruppenfahrt „${titel}“ – ${gesamt} Personen, ${genutzt.length} Kutscher gesucht`],
      notiz: wunschfahrt ? `Wunschfahrt: ${wunschfahrt}` : null,
    }).catch(() => {});
    return NextResponse.json({
      gruppe,
      fahrzeuge: genutzt.map((a) => ({ name: a.name, personen: a.plaetze.map((x) => x.name) })),
      nichtGebraucht: autos.filter((a) => !a.plaetze.length).map((a) => a.name),
    }, { status: 201 });
  }

  if (body.aktion === 'gruppe-absagen') {
    const { data: g } = await sb.from('rikscha_gruppen').select('*').eq('id', String(body.gruppe_id ?? '')).maybeSingle();
    if (!g || !zustaendig(k, g.organisation_id)) return fehler('Diese Gruppenfahrt gibt es nicht.', 404);
    const { error } = await sb.from('rikscha_buchungen').update({ storniert: true, storniert_am: new Date().toISOString() })
      .eq('gruppe_id', g.id).eq('storniert', false);
    return error ? fehler(error.message, 500) : NextResponse.json({ ok: true });
  }

  return fehler('Unbekannte Aktion.');
}
