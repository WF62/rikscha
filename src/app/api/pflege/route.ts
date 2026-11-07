export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { rolleAusAnfrage, darfBewohnerVerwalten } from '@/lib/pilotAuth';
import { ladeStammdaten, fahrzeugFehler } from '@/lib/stammdaten-server';
import { sendBuchungEmail } from '@/lib/email';

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

  const [bw, fahrten] = await Promise.all([
    sb.from('rikscha_bewohner').select('*').order('name'),
    sb.from('rikscha_buchungen').select('*').eq('storniert', false).gte('datum', heute()).lte('datum', bis)
      .or('angebot.eq.true,bewohner_id.not.is.null').order('datum').order('startzeit'),
  ]);
  if (bw.error) return fehler('Die Bewohner-Tabelle fehlt noch. Bitte supabase/bewohner-pflege.sql ausführen.', 503);

  const liste = fahrten.data ?? [];
  return NextResponse.json({
    bewohner: bw.data ?? [],
    angebote: liste.filter((b) => b.angebot && !b.bewohner_id),
    fahrten: liste.filter((b) => b.bewohner_id),
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
    await sb.from('rikscha_buchungen').update({ storniert: true, storniert_am: new Date().toISOString() })
      .eq('bewohner_id', id).eq('angebot', false).gte('datum', heute());
    await sb.from('rikscha_buchungen').update({ gaeste: [], notiz: null }).eq('bewohner_id', id).eq('angebot', true).gte('datum', heute());
    await sb.from('rikscha_buchungen').update({ gaeste: ['Bewohner'], notiz: null }).eq('bewohner_id', id).lt('datum', heute());
    const { error } = await sb.from('rikscha_bewohner').delete().eq('id', id);  // bewohner_id wird automatisch leer
    return error ? fehler(error.message, 500) : NextResponse.json({ ok: true });
  }

  // Für Fahrten: Bewohner laden
  const bewohnerLaden = async (id: unknown) => {
    if (!id) return null;
    const { data } = await sb.from('rikscha_bewohner').select('*').eq('id', String(id)).eq('aktiv', true).maybeSingle();
    return data;
  };
  const rollstuhlFehler = async (bew: { rollstuhl: boolean }, fahrzeugId: string) => {
    if (!bew.rollstuhl || !fahrzeugId) return null;
    const f = (await ladeStammdaten(true)).fahrzeuge.find((x) => x.id === fahrzeugId);
    return f && !f.rollstuhl ? `${f.name} ist nicht für Rollstühle geeignet.` : null;
  };

  if (body.aktion === 'wunsch') {
    const bew = await bewohnerLaden(body.bewohner_id);
    if (!bew) return fehler('Bitte einen Bewohner wählen.');
    const { datum, startzeit, endzeit } = body;
    const fahrzeug = String(body.fahrzeug ?? '');
    if (!TAG.test(String(datum)) || !ZEIT.test(String(startzeit)) || !ZEIT.test(String(endzeit))) return fehler('Datum oder Uhrzeit ist ungültig.');
    if (datum < heute()) return fehler('Das Datum liegt in der Vergangenheit.');
    if (endzeit <= startzeit) return fehler('Das Ende muss nach dem Start liegen.');
    const rf = await rollstuhlFehler(bew, fahrzeug);
    if (rf) return fehler(rf, 409);
    if (fahrzeug) {
      const ff = await fahrzeugFehler(fahrzeug, datum);
      if (ff) return fehler(ff, 409);
      const { data: belegt } = await sb.from('rikscha_buchungen').select('id').eq('fahrzeug', fahrzeug).eq('datum', datum)
        .eq('storniert', false).lt('startzeit', endzeit).gt('endzeit', startzeit);
      if (belegt?.length) return fehler('Das Fahrzeug ist in diesem Zeitraum schon gebucht.', 409);
    }
    const { data, error } = await sb.from('rikscha_buchungen').insert({
      fahrzeug, pilot: '', gaeste: [bew.name], datum, startzeit, endzeit,
      notiz: text(body.notiz, 500), bewohner_id: bew.id,
    }).select().single();
    if (error) return fehler(error.message, 500);
    // Team-Mail ohne Bewohnernamen
    sendBuchungEmail({ fahrzeug, pilot: '', datum, startzeit, endzeit, gaeste: ['Bewohnerfahrt – Kutscher gesucht'], notiz: null }).catch(() => {});
    return NextResponse.json(data, { status: 201 });
  }

  if (body.aktion === 'belegen') {
    const bew = await bewohnerLaden(body.bewohner_id);
    if (!bew) return fehler('Bitte einen Bewohner wählen.');
    const { data: b } = await sb.from('rikscha_buchungen').select('*').eq('id', String(body.buchung_id ?? '')).maybeSingle();
    if (!b || !b.angebot || b.storniert || b.datum < heute()) return fehler('Diese freie Fahrzeit gibt es nicht mehr.', 409);
    if (b.bewohner_id) return fehler('Diese Fahrzeit ist schon vergeben.', 409);
    const rf = await rollstuhlFehler(bew, b.fahrzeug);
    if (rf) return fehler(rf, 409);
    // Nur belegen, wenn noch frei (gleichzeitiges Belegen verhindern)
    const { data: neu, error } = await sb.from('rikscha_buchungen')
      .update({ bewohner_id: bew.id, gaeste: [bew.name], notiz: text(body.notiz, 500) ?? b.notiz })
      .eq('id', b.id).is('bewohner_id', null).select().maybeSingle();
    if (error) return fehler(error.message, 500);
    if (!neu) return fehler('Diese Fahrzeit wurde gerade vergeben.', 409);
    return NextResponse.json(neu);
  }

  if (body.aktion === 'absagen') {
    const { data: b } = await sb.from('rikscha_buchungen').select('*').eq('id', String(body.buchung_id ?? '')).maybeSingle();
    if (!b || !b.bewohner_id) return fehler('Diese Bewohnerfahrt gibt es nicht.', 404);
    // Belegte freie Fahrzeit wird wieder frei, ein Fahrtwunsch wird storniert
    const update = b.angebot
      ? { bewohner_id: null, gaeste: [], notiz: null }
      : { storniert: true, storniert_am: new Date().toISOString() };
    const { error } = await sb.from('rikscha_buchungen').update(update).eq('id', b.id);
    return error ? fehler(error.message, 500) : NextResponse.json({ ok: true });
  }

  return fehler('Unbekannte Aktion.');
}
