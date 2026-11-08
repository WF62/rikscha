'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Bewohner, Buchung, Organisation } from '@/lib/supabase';
import { authHeaders } from '@/lib/authHeaders';
import { useStammdaten } from '@/lib/useStammdaten';
import { istBuchbarAm } from '@/lib/stammdaten';
import { WUNSCH_TOUREN, ABHOLORTE, NACH_ABSPRACHE, tourMinuten, zeitPlus, zeitWarnung, uhrzeitMinuten, dauerText } from '@/lib/touren';
import AktualisierenKnopf from '../AktualisierenKnopf';
import { baumListe, bereichPfad, mitUnterbereichen, type Bereich } from '@/lib/struktur';
import FahrzeugPicker from '../FahrzeugPicker';
import OffenHinweis from '../../OffenHinweis';
import VerschiebenAnfrage from '../../VerschiebenAnfrage';

type Gruppe = { id: string; titel: string; datum: string; organisator: string | null; organisation_id: string | null; fahrten: Buchung[] };
type Vorlage = {
  id: string; titel: string; datum: string; startzeit: string | null; endzeit: string | null;
  abholort: string | null; wunschfahrt: string | null; personen: number; fahrzeuge: string[];
};
type Daten = {
  bewohner: Bewohner[]; angebote: Buchung[]; fahrten: Buchung[]; gruppen: Gruppe[]; vorlagen: Vorlage[];
  organisationen: Organisation[]; eigeneOrganisation: string | null; alle: boolean; fristMonate: number;
  bereiche: Bereich[]; kreise: { id: string; name: string; organisation_id: string }[];
  mitglieder: { kreis_id: string; bewohner_id: string }[]; strukturFehlt: boolean;
};
const ERLAUBT = ['pflege', 'gfo', 'admin'];
const feld = 'w-full border rounded px-3 py-2 text-base';

function tagText(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
}
const zeit = (b: Buchung) => `${b.startzeit.slice(0, 5)}–${b.endzeit.slice(0, 5)} Uhr`;

async function senden(body: Record<string, unknown>) {
  const r = await fetch('/api/pflege', {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body),
  });
  if (r.ok) return null;
  const j = await r.json().catch(() => ({}));
  return (j.error as string) ?? 'Das hat nicht geklappt.';
}

const BEGLEITUNG = '__begleitung';
type Zweit = { wahl: string; begleitung: string };  // wahl: '' | Bewohner-ID | BEGLEITUNG
const ZWEIT_LEER: Zweit = { wahl: '', begleitung: '' };

/** Daten der zweiten Person für die API */
function zweitDaten(z: Zweit) {
  if (z.wahl === BEGLEITUNG) return z.begleitung.trim() ? { begleitung: z.begleitung.trim() } : {};
  return z.wahl ? { bewohner2_id: z.wahl } : {};
}
const zweitAnzahl = (z: Zweit) => (z.wahl === BEGLEITUNG ? (z.begleitung.trim() ? 1 : 0) : z.wahl ? 1 : 0);

/** Auswahl einer zweiten Person: weiterer Bewohner oder Begleitperson (z. B. Angehörige) */
function ZweitePerson({ bewohner, ersteId, wert, onChange, rollstuhlOk, gesperrt }: {
  bewohner: Bewohner[]; ersteId: string; wert: Zweit; onChange: (z: Zweit) => void; rollstuhlOk: boolean;
  /** Grund, warum (noch) keine zweite Person möglich ist */
  gesperrt?: string;
}) {
  if (gesperrt) {
    return (
      <select aria-label="Zweite Person" disabled className="border rounded px-2 py-2 bg-gray-100 text-gray-500">
        <option>{gesperrt}</option>
      </select>
    );
  }
  return (
    <div className="flex flex-col gap-1">
      <select aria-label="Zweite Person" value={wert.wahl} onChange={(e) => onChange({ ...wert, wahl: e.target.value })} className="border rounded px-2 py-2">
        <option value="">Nur eine Person</option>
        <option value={BEGLEITUNG}>+ Begleitperson (z. B. Angehörige)</option>
        {bewohner.filter((b) => b.id !== ersteId).map((b) => (
          <option key={b.id} value={b.id} disabled={b.rollstuhl && !rollstuhlOk}>
            + {b.name}{b.wohnbereich ? ` (${b.wohnbereich})` : ''}{b.rollstuhl ? ' ♿' : ''}
          </option>
        ))}
      </select>
      {wert.wahl === BEGLEITUNG && (
        <input aria-label="Name der Begleitperson" maxLength={80} value={wert.begleitung} placeholder="Name der Begleitperson"
          onChange={(e) => onChange({ ...wert, begleitung: e.target.value })} className="border rounded px-2 py-2" />
      )}
    </div>
  );
}

const EIGENE = '__eigene';
type Tour = { wahl: string; eigene: string };  // wahl: '' | Tour-ID | EIGENE
const TOUR_LEER: Tour = { wahl: '', eigene: '' };
function tourText(t: Tour) {
  if (t.wahl === EIGENE) return t.eigene.trim();
  return WUNSCH_TOUREN.find((x) => x.id === t.wahl)?.name ?? '';
}

/** Endzeit passend zur Tour: Start + Tourdauer (oder unverändert, wenn keine feste Dauer) */
function endeFuerTour(t: Tour, start: string, ende: string) {
  const min = tourMinuten(t.wahl);
  return (min !== null && start && zeitPlus(start, min)) || ende;
}

/** Hinweis unter der Zeit: zu knapp für die gewählte Tour */
function ZeitWarnung({ tour, start, ende }: { tour: Tour; start: string; ende: string }) {
  const w = zeitWarnung(tourText(tour), start, ende);
  return w ? <p role="alert" className="sm:col-span-2 text-sm text-orange-800 bg-orange-50 border border-orange-200 rounded px-3 py-2">⚠ {w} Bitte die Endzeit anpassen, sonst ist das Fahrzeug zu kurz eingeplant.</p> : null;
}

/** Wunschfahrt: eine der bekannten Touren oder ein eigener Wunsch. verfuegbar = Länge der festen Fahrzeit in Minuten */
function WunschfahrtFeld({ wert, onChange, verfuegbar }: { wert: Tour; onChange: (t: Tour) => void; verfuegbar?: number | null }) {
  const gewaehlt = WUNSCH_TOUREN.find((t) => t.id === wert.wahl);
  return (
    <div className="flex flex-col gap-1">
      <select aria-label="Wunschfahrt" value={wert.wahl} onChange={(e) => onChange({ ...wert, wahl: e.target.value })} className="border rounded px-2 py-2">
        <option value="">Egal – der Kutscher schlägt etwas vor</option>
        {WUNSCH_TOUREN.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.dauer}){verfuegbar != null && t.minuten > verfuegbar ? ' – zu lang für diese Zeit' : ''}</option>)}
        <option value={EIGENE}>Eigener Wunsch …</option>
      </select>
      {wert.wahl === EIGENE && (
        <input aria-label="Eigener Wunsch" maxLength={120} value={wert.eigene} placeholder="z. B. zur Eisdiele, zum alten Wohnhaus"
          onChange={(e) => onChange({ ...wert, eigene: e.target.value })} className="border rounded px-2 py-2" />
      )}
      {gewaehlt && verfuegbar != null && gewaehlt.minuten > verfuegbar && (
        <span role="alert" className="text-xs font-normal text-orange-800">⚠ Die Tour dauert {gewaehlt.dauer}, diese Fahrzeit hat nur {dauerText(verfuegbar)}. Lieber eine kürzere Tour wählen.</span>
      )}
    </div>
  );
}

// wahl: '' (Vorgabe) | 'ort:<fester Ort>' | 'adresse' | 'anders'
type Abholort = { wahl: string; text: string };
const ABHOL_LEER: Abholort = { wahl: '', text: '' };

/** Vorgabe: Standard der Organisation, sonst Wohnadresse, sonst erster fester Ort */
function abholVorgabe(standard: string | null, adresse: string | null | undefined) {
  return standard ? `ort:${standard}` : adresse ? 'adresse' : `ort:${ABHOLORTE[0]}`;
}
/** Text des Abholorts */
function abholText(a: Abholort, standard: string | null, adresse: string | null | undefined): string {
  const wahl = a.wahl || abholVorgabe(standard, adresse);
  if (wahl.startsWith('ort:')) return wahl.slice(4);
  if (wahl === 'adresse') return adresse ?? '';
  return a.text.trim() ? `${NACH_ABSPRACHE}: ${a.text.trim()}` : NACH_ABSPRACHE;
}

/** Abholort: feste Orte (Pfarrzentrum, St. Elisabeth, Paulinenhof), Wohnadresse oder nach Absprache */
function AbholortFeld({ wert, onChange, standard, adresse, label = 'Abholort' }: {
  wert: Abholort; onChange: (a: Abholort) => void; standard: string | null; adresse?: string | null; label?: string;
}) {
  const wahl = wert.wahl || abholVorgabe(standard, adresse);
  const orte = standard && !(ABHOLORTE as readonly string[]).includes(standard) ? [standard, ...ABHOLORTE] : [...ABHOLORTE];
  return (
    <div className="flex flex-col gap-1">
      <select aria-label={label} value={wahl} onChange={(e) => onChange({ ...wert, wahl: e.target.value })}
        className="border rounded px-2 py-2">
        {orte.map((o) => <option key={o} value={`ort:${o}`}>📍 {o}</option>)}
        {adresse && <option value="adresse">🏡 Zuhause: {adresse}</option>}
        <option value="anders">💬 {NACH_ABSPRACHE}</option>
      </select>
      {wahl === 'anders' && (
        <input aria-label={`${label}: Hinweis`} maxLength={80} value={wert.text} placeholder="optional, z. B. Kirchplatz oder Adresse"
          onChange={(e) => onChange({ ...wert, text: e.target.value })} className="border rounded px-2 py-2" />
      )}
    </div>
  );
}

const plusMonate = (iso: string | undefined, monate: number) => {
  if (!iso) return '';
  const d = new Date(iso + 'T12:00:00'); d.setMonth(d.getMonth() + monate);
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export default function PflegeSeite() {
  const { fahrzeuge, fahrzeugById } = useStammdaten();
  const [zugang, setZugang] = useState<'pruefen' | 'ok' | 'nein'>('pruefen');
  const [daten, setDaten] = useState<Daten | null>(null);
  const [ladeFehler, setLadeFehler] = useState('');
  const [meldung, setMeldung] = useState<{ text: string; ok: boolean } | null>(null);
  const [auswahl, setAuswahl] = useState<Record<string, string>>({}); // Angebot-ID → Bewohner-ID
  const [auswahl2, setAuswahl2] = useState<Record<string, Zweit>>({}); // Angebot-ID → zweite Person
  const [wunsch, setWunsch] = useState({ bewohner_id: '', datum: '', startzeit: '14:00', endzeit: '15:00', fahrzeug: '', notiz: '' });
  const [wunsch2, setWunsch2] = useState<Zweit>(ZWEIT_LEER);
  const [wunschTour, setWunschTour] = useState<Tour>(TOUR_LEER);
  const [wunschAbhol, setWunschAbhol] = useState<Abholort>(ABHOL_LEER);
  const [angebotAbhol, setAngebotAbhol] = useState<Record<string, Abholort>>({});
  const [angebotTour, setAngebotTour] = useState<Record<string, Tour>>({});
  const [angebotFz, setAngebotFz] = useState<Record<string, string>>({}); // Angebot ohne Fahrzeug → gewähltes Fahrzeug
  const LEER_FG = { name: '', wohnbereich: '', adresse: '', telefon: '', rollstuhl: false, hinweis: '', bereich_id: '', kreise: [] as string[] };
  const [bearbeitenKreise, setBearbeitenKreise] = useState<string[]>([]);
  const [filterBereich, setFilterBereich] = useState('');
  const [filterKreis, setFilterKreis] = useState('');
  const [neuerBereich, setNeuerBereich] = useState<{ eltern: string; name: string } | null>(null);
  const [bereichEdit, setBereichEdit] = useState<{ id: string; name: string; hinweis: string; eltern: string } | null>(null);
  const [neuerKreis, setNeuerKreis] = useState('');
  const [neuerBewohner, setNeuerBewohner] = useState(LEER_FG);
  const [orgWahl, setOrgWahl] = useState('');   // für GFO/Admin: welche Organisation
  const [gruppe, setGruppe] = useState({ titel: '', datum: '', startzeit: '14:00', endzeit: '16:00', notiz: '' });
  const [gruppeTeilnehmer, setGruppeTeilnehmer] = useState<string[]>([]);
  const [gruppeWeitere, setGruppeWeitere] = useState('');
  const [gruppeFz, setGruppeFz] = useState<string[]>([]);
  const [gruppeFzListe, setGruppeFzListe] = useState<{ id: string; name: string; maxGaeste: number; rollstuhl: boolean; frei: boolean; grund?: string }[] | null>(null);
  const [gruppeTour, setGruppeTour] = useState<Tour>(TOUR_LEER);
  const [gruppeAbhol, setGruppeAbhol] = useState<Abholort>(ABHOL_LEER);
  const [wiederholDatum, setWiederholDatum] = useState<Record<string, string>>({});   // Vorlage-ID → neues Datum
  const [wiederholt, setWiederholt] = useState<string | null>(null);
  const [kontakt, setKontakt] = useState<{ ansprechperson: string; telefon: string; email: string } | null>(null);   // in Bearbeitung
  const [bearbeiten, setBearbeiten] = useState<Bewohner | null>(null);

  const laden = useCallback(async () => {
    const r = await fetch('/api/pflege', { headers: authHeaders() });
    if (r.status === 401) { setZugang('nein'); return; }
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { setLadeFehler(j.error ?? 'Laden fehlgeschlagen.'); return; }
    setLadeFehler(''); setDaten(j);
    setOrgWahl((alt) => alt || j.eigeneOrganisation || j.organisationen?.[0]?.id || '');
  }, []);

  // Gruppenfahrt: freie Fahrzeuge zur gewählten Zeit laden
  useEffect(() => {
    if (!gruppe.datum || !gruppe.startzeit || !gruppe.endzeit || gruppe.endzeit <= gruppe.startzeit) { setGruppeFzListe(null); return; }
    let aktiv = true;
    fetch(`/api/fahrzeuge-frei?datum=${gruppe.datum}&von=${gruppe.startzeit}&bis=${gruppe.endzeit}`, { headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : []))
      .then((l) => { if (aktiv) { setGruppeFzListe(l); setGruppeFz((alt) => alt.filter((id) => l.some((x: { id: string; frei: boolean }) => x.id === id && x.frei))); } })
      .catch(() => aktiv && setGruppeFzListe([]));
    return () => { aktiv = false; };
  }, [gruppe.datum, gruppe.startzeit, gruppe.endzeit]);

  useEffect(() => {
    const rolle = localStorage.getItem('pilot_rolle');
    if (!localStorage.getItem('pilot_name') || !ERLAUBT.includes(rolle ?? '')) { setZugang('nein'); return; }
    setZugang('ok'); laden();
  }, [laden]);
  // Nach Antworten im Hinweis-Kasten neu laden
  useEffect(() => {
    const neu = () => { laden(); };
    window.addEventListener('rikscha-neu-laden', neu);
    return () => window.removeEventListener('rikscha-neu-laden', neu);
  }, [laden]);

  // Erfolg verschwindet nach 5 s, Fehler bleiben stehen, bis man sie wegtippt
  const zeige = (text: string, ok = true) => { setMeldung({ text, ok }); if (ok) setTimeout(() => setMeldung((m) => (m?.text === text ? null : m)), 5000); };
  const ausfuehren = async (body: Record<string, unknown>, ok: string) => {
    const f = await senden(body);
    if (f) { zeige(f, false); return false; }
    zeige(ok); await laden(); return true;
  };

  if (zugang === 'pruefen') return null;
  if (zugang === 'nein') {
    return (
      <div className="max-w-md mx-auto mt-16 bg-white rounded-xl shadow p-6 text-center space-y-3">
        <h2 className="text-xl font-bold text-rikscha-green">Fahrten vermitteln</h2>
        <p className="text-gray-600">Bitte melde dich auf der Startseite mit deinem Vermittlungs-Zugang an (Menü „Kutscher-Bereich“).</p>
        <a href="/" className="inline-block bg-rikscha-green text-white rounded px-4 py-2 font-semibold">Zur Startseite</a>
      </div>
    );
  }

  const org = daten?.organisationen.find((o) => o.id === orgWahl) ?? null;
  const quartier = org?.art === 'quartier';
  const standardOrt = org?.standard_abholort ?? null;
  // GFO/Admin sehen alle Organisationen, arbeiten aber jeweils in der gewählten
  const bewohner = (daten?.bewohner ?? []).filter((b) => !daten?.alle || !orgWahl || b.organisation_id === orgWahl);
  const aktive = bewohner.filter((b) => b.aktiv);
  const bereiche = (daten?.bereiche ?? []).filter((x) => !orgWahl || x.organisation_id === orgWahl);
  const baum = baumListe(bereiche, orgWahl || undefined);
  const kreise = (daten?.kreise ?? []).filter((x) => !orgWahl || x.organisation_id === orgWahl);
  const kreiseVon = (id: string) => (daten?.mitglieder ?? []).filter((m) => m.bewohner_id === id).map((m) => m.kreis_id);
  const ort = (b?: Bewohner) => (b ? (bereichPfad(bereiche, b.bereich_id) || b.wohnbereich || b.adresse || '') : '');
  /** Fahrgäste eines Bereichs (mit Unterbereichen) oder einer Gruppe */
  const ausBereich = (id: string) => { const ids = mitUnterbereichen(bereiche, id); return aktive.filter((b) => b.bereich_id && ids.has(b.bereich_id)); };
  const ausKreis = (id: string) => aktive.filter((b) => kreiseVon(b.id).includes(id));
  const sichtbar = bewohner.filter((b) => (!filterBereich || (b.bereich_id && mitUnterbereichen(bereiche, filterBereich).has(b.bereich_id)))
    && (!filterKreis || kreiseVon(b.id).includes(filterKreis)));
  const bereichAuswahl = (wert: string, onChange: (v: string) => void, label = 'Bereich') => (
    <select aria-label={label} value={wert} onChange={(e) => onChange(e.target.value)} className={feld}>
      <option value="">– kein Bereich –</option>
      {baum.map(({ bereich: x, tiefe }) => <option key={x.id} value={x.id}>{'\u00a0\u00a0'.repeat(tiefe)}{tiefe ? '└ ' : ''}{x.name}</option>)}
    </select>
  );
  const kreisHaken = (gewaehlt: string[], onChange: (v: string[]) => void) => kreise.length > 0 && (
    <div className="flex flex-wrap gap-2 text-sm">
      {kreise.map((x) => (
        <label key={x.id} className={`flex items-center gap-1 border rounded-full px-2 py-0.5 cursor-pointer ${gewaehlt.includes(x.id) ? 'bg-violet-50 border-violet-400' : ''}`}>
          <input type="checkbox" checked={gewaehlt.includes(x.id)} onChange={(e) => onChange(e.target.checked ? [...gewaehlt, x.id] : gewaehlt.filter((y) => y !== x.id))} />
          {x.name}
        </label>
      ))}
    </div>
  );
  const bewohnerById = (id?: string | null) => bewohner.find((b) => b.id === id);
  const wunschFz = wunsch.fahrzeug ? fahrzeugById(wunsch.fahrzeug) : undefined;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-2xl font-bold text-rikscha-green">🚲 Fahrten vermitteln</h2>
          {daten && (daten.alle && daten.organisationen.length > 1 ? (
            <select aria-label="Organisation" value={orgWahl} onChange={(e) => setOrgWahl(e.target.value)} className="mt-1 border rounded px-2 py-1 text-sm">
              {daten.organisationen.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          ) : org && <div className="text-sm text-gray-600">{org.name}</div>)}
        </div>
        <span className="flex items-center gap-3 flex-wrap">
          <AktualisierenKnopf />
          <a href="/kalender" className="text-sm text-rikscha-green underline">Zum Kalender</a>
        </span>
      </div>
      <OffenHinweis />
      <a href="/pflege/schnell" className="flex items-center justify-between gap-3 bg-rikscha-green text-white rounded-xl shadow px-5 py-4 hover:opacity-90">
        <span><span className="block text-lg font-bold">🚲 Rikscha schnell anmelden</span><span className="text-sm opacity-90">Wer? Wann? Wohin? – fertig in drei Schritten</span></span>
        <span className="text-2xl" aria-hidden>→</span>
      </a>

      {org && (
        <div className="bg-white rounded-xl shadow px-5 py-3 text-sm">
          {kontakt ? (
            <form className="flex flex-wrap gap-2 items-end" onSubmit={async (e) => {
              e.preventDefault();
              if (await ausfuehren({ aktion: 'organisation-kontakt', organisation_id: org.id, ...kontakt }, 'Kontaktdaten gespeichert.')) setKontakt(null);
            }}>
              <label className="font-semibold">Ansprechperson
                <input maxLength={80} value={kontakt.ansprechperson} onChange={(e) => setKontakt({ ...kontakt, ansprechperson: e.target.value })} className="block border rounded px-2 py-1.5" />
              </label>
              <label className="font-semibold">Telefon
                <input maxLength={40} type="tel" value={kontakt.telefon} onChange={(e) => setKontakt({ ...kontakt, telefon: e.target.value })} className="block border rounded px-2 py-1.5" />
              </label>
              <label className="font-semibold">E-Mail
                <input maxLength={120} type="text" inputMode="email" autoComplete="off" value={kontakt.email} onChange={(e) => setKontakt({ ...kontakt, email: e.target.value })} className="block border rounded px-2 py-1.5" />
              </label>
              <button type="submit" className="bg-rikscha-green text-white rounded px-3 py-1.5 font-semibold">Speichern</button>
              <button type="button" onClick={() => setKontakt(null)} className="text-gray-500 px-2 py-1.5">Abbrechen</button>
            </form>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-gray-600">Kontakt für die Kutscher:</span>
              {org.ansprechperson || org.telefon || org.email
                ? <span className="font-medium">{[org.ansprechperson, org.telefon, org.email].filter(Boolean).join(' · ')}</span>
                : <span className="text-amber-700">noch nicht eingetragen – bitte ergänzen, damit Kutscher bei Rückfragen anrufen können</span>}
              <button onClick={() => setKontakt({ ansprechperson: org.ansprechperson ?? '', telefon: org.telefon ?? '', email: org.email ?? '' })}
                className="text-blue-600 underline ml-auto">Bearbeiten</button>
            </div>
          )}
        </div>
      )}

      {meldung && (
        <div role={meldung.ok ? 'status' : 'alert'}
          className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[min(92vw,640px)] rounded-xl px-4 py-3 text-base shadow-lg border-2 flex items-start gap-3 ${meldung.ok ? 'bg-green-50 border-green-500 text-green-900' : 'bg-red-50 border-red-500 text-red-900'}`}>
          <span className="flex-1">{meldung.ok ? '✓ ' : '⚠ '}{meldung.text}</span>
          <button onClick={() => setMeldung(null)} aria-label="Meldung schließen" className="font-bold px-1">✕</button>
        </div>
      )}
      {ladeFehler && <div className="rounded-lg px-4 py-3 text-sm bg-amber-50 border border-amber-300 text-amber-900">{ladeFehler}</div>}
      {!daten && !ladeFehler && <p className="text-gray-400">Wird geladen…</p>}

      {daten && (
        <>
          {/* 1. Freie Fahrzeiten der Kutscher */}
          <section className="bg-white rounded-xl shadow p-5">
            <h3 className="font-bold text-lg text-gray-800 mb-1">Freie Fahrzeiten der Kutscher</h3>
            <p className="text-sm text-gray-500 mb-3">Kutscher bieten diese Zeiten für alle an. Wer zuerst zuordnet, bekommt die Zeit. Wähle einen Fahrgast und tippe auf „Zuordnen“.</p>
            {daten.angebote.length === 0 && <p className="text-sm text-gray-400">Im Moment sind keine freien Zeiten eingetragen.</p>}
            <div className="space-y-3">
              {daten.angebote.map((a) => {
                const fz = fahrzeugById(a.fahrzeug);
                // Ohne Fahrzeug ("egal"): was die Flotte hergibt
                const plaetze = a.fahrzeug ? fz?.maxGaeste ?? 1 : Math.max(1, ...fahrzeuge.map((x) => x.maxGaeste));
                const rolliOk = a.fahrzeug ? !!fz?.rollstuhl : fahrzeuge.some((x) => x.rollstuhl);
                return (
                  <div key={a.id} className="border rounded-lg p-3 flex flex-wrap items-center gap-3">
                    <div className="flex-1 min-w-[200px]">
                      <div className="font-semibold">{tagText(a.datum)}, {zeit(a)}{a.oeffentlich && <span className="ml-2 text-xs font-normal bg-emerald-100 text-emerald-800 rounded-full px-2 py-0.5">🌿 auch öffentlich buchbar</span>}</div>
                      <div className="text-sm text-gray-600">
                        Kutscher: {a.pilot} · {a.fahrzeug
                          ? <>{fz?.name ?? a.fahrzeug} (max. {plaetze} {plaetze > 1 ? 'Gäste' : 'Gast'}){rolliOk ? ' · ♿ Rollstuhl möglich' : ''}</>
                          : <>Fahrzeug egal – wird passend zu den Gästen gewählt</>}
                      </div>
                    </div>
                    <select aria-label="Fahrgast wählen" value={auswahl[a.id] ?? ''} onChange={(e) => setAuswahl({ ...auswahl, [a.id]: e.target.value })}
                      className="border rounded px-2 py-2">
                      <option value="">Fahrgast wählen…</option>
                      {aktive.map((b) => (
                        <option key={b.id} value={b.id} disabled={b.rollstuhl && !rolliOk}>
                          {b.name}{ort(b) ? ` (${ort(b)})` : ''}{b.rollstuhl ? ' ♿' : ''}{b.rollstuhl && !rolliOk ? ' – Fahrzeug passt nicht' : ''}
                        </option>
                      ))}
                    </select>
                    {plaetze >= 2 && (
                      <ZweitePerson bewohner={aktive} ersteId={auswahl[a.id] ?? ''} rollstuhlOk={rolliOk}
                        gesperrt={auswahl[a.id] ? undefined : 'Zweite Person: erst Fahrgast wählen'}
                        wert={auswahl2[a.id] ?? ZWEIT_LEER} onChange={(z) => setAuswahl2({ ...auswahl2, [a.id]: z })} />
                    )}
                    <WunschfahrtFeld wert={angebotTour[a.id] ?? TOUR_LEER} onChange={(t) => setAngebotTour({ ...angebotTour, [a.id]: t })}
                      verfuegbar={(uhrzeitMinuten(a.endzeit) ?? 0) - (uhrzeitMinuten(a.startzeit) ?? 0)} />
                    <AbholortFeld wert={angebotAbhol[a.id] ?? ABHOL_LEER} onChange={(v) => setAngebotAbhol({ ...angebotAbhol, [a.id]: v })}
                      standard={standardOrt} adresse={bewohnerById(auswahl[a.id])?.adresse} />
                    {!a.fahrzeug && auswahl[a.id] && (() => {
                      // Kutscher + Gast stehen fest → jetzt Fahrzeug festlegen
                      const z = auswahl2[a.id] ?? ZWEIT_LEER;
                      const zweiterBw = z.wahl && z.wahl !== BEGLEITUNG ? bewohnerById(z.wahl) : undefined;
                      return (
                        <FahrzeugPicker buchungId={a.id} personen={1 + zweitAnzahl(z)}
                          rollstuhl={!!bewohnerById(auswahl[a.id])?.rollstuhl || !!zweiterBw?.rollstuhl}
                          wert={angebotFz[a.id] ?? ''} onChange={(id) => setAngebotFz((v) => ({ ...v, [a.id]: id }))} />
                      );
                    })()}
                    <button disabled={!auswahl[a.id] || (!a.fahrzeug && !angebotFz[a.id])} className="bg-rikscha-green text-white rounded px-4 py-2 font-semibold disabled:opacity-40"
                      onClick={async () => {
                        const zweit = plaetze >= 2 ? zweitDaten(auswahl2[a.id] ?? ZWEIT_LEER) : {};
                        const wunschfahrt = tourText(angebotTour[a.id] ?? TOUR_LEER);
                        const fzWahl = !a.fahrzeug ? { fahrzeug: angebotFz[a.id] } : {};
                        const abholort = abholText(angebotAbhol[a.id] ?? ABHOL_LEER, standardOrt, bewohnerById(auswahl[a.id])?.adresse);
                        if (!abholort) { zeige('Bitte einen Abholort eintragen.', false); return; }
                        if (await ausfuehren({ aktion: 'belegen', buchung_id: a.id, bewohner_id: auswahl[a.id], ...zweit, ...fzWahl, abholort, ...(wunschfahrt ? { wunschfahrt } : {}) }, 'Zugeordnet. Der Kutscher sieht die Fahrt im Kalender.')) {
                          setAuswahl({ ...auswahl, [a.id]: '' }); setAuswahl2({ ...auswahl2, [a.id]: ZWEIT_LEER }); setAngebotTour({ ...angebotTour, [a.id]: TOUR_LEER }); setAngebotAbhol({ ...angebotAbhol, [a.id]: ABHOL_LEER });
                        }
                      }}>
                      Zuordnen
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 2. Fahrtwunsch melden */}
          <section className="bg-white rounded-xl shadow p-5">
            <h3 className="font-bold text-lg text-gray-800 mb-1">Fahrtwunsch melden</h3>
            <p className="text-sm text-gray-500 mb-3">Kein passender Termin dabei? Trage einen Wunsch ein. Ein Kutscher übernimmt ihn im Kalender.</p>
            <form className="grid grid-cols-1 sm:grid-cols-2 gap-3" onSubmit={async (e) => {
              e.preventDefault();
              const zweitOk = !wunschFz || wunschFz.maxGaeste >= 2;
              const wunschfahrt = tourText(wunschTour);
              const abholort = abholText(wunschAbhol, standardOrt, bewohnerById(wunsch.bewohner_id)?.adresse);
              if (!abholort) { zeige('Bitte einen Abholort eintragen.', false); return; }
              if (await ausfuehren({ aktion: 'wunsch', ...wunsch, abholort, ...(zweitOk ? zweitDaten(wunsch2) : {}), ...(wunschfahrt ? { wunschfahrt } : {}) }, 'Fahrtwunsch gemeldet. Das Rikscha-Team wird benachrichtigt.')) {
                setWunsch({ ...wunsch, bewohner_id: '', notiz: '' }); setWunsch2(ZWEIT_LEER); setWunschTour(TOUR_LEER); setWunschAbhol(ABHOL_LEER);
              }
            }}>
              <label className="sm:col-span-2 text-sm font-semibold">Fahrgast
                <select required value={wunsch.bewohner_id} onChange={(e) => setWunsch({ ...wunsch, bewohner_id: e.target.value })} className={feld}>
                  <option value="">Bitte wählen…</option>
                  {aktive.map((b) => <option key={b.id} value={b.id}>{b.name}{ort(b) ? ` (${ort(b)})` : ''}{b.rollstuhl ? ' ♿' : ''}</option>)}
                </select>
              </label>
              <label className="sm:col-span-2 text-sm font-semibold">Zweite Person (optional)
                <ZweitePerson bewohner={aktive} ersteId={wunsch.bewohner_id} rollstuhlOk={wunschFz ? wunschFz.rollstuhl : fahrzeuge.some((x) => x.rollstuhl)}
                  gesperrt={!wunsch.bewohner_id ? 'Erst oben einen Fahrgast wählen'
                    : wunschFz && wunschFz.maxGaeste < 2 ? `${wunschFz.name} hat nur 1 Platz – für zwei Personen z. B. die Rikscha wählen` : undefined}
                  wert={wunsch2} onChange={setWunsch2} />
                {!wunschFz && zweitAnzahl(wunsch2) > 0 && <span className="block text-xs font-normal text-gray-500 mt-1">Für zwei Personen braucht der Kutscher ein Fahrzeug mit 2 Plätzen (z. B. Rikscha).</span>}
              </label>
              <label className="text-sm font-semibold">Tag
                <input required type="date" value={wunsch.datum} onChange={(e) => setWunsch({ ...wunsch, datum: e.target.value })} className={feld} />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="text-sm font-semibold">Von
                  <input required type="time" value={wunsch.startzeit} onChange={(e) => setWunsch({ ...wunsch, startzeit: e.target.value, endzeit: endeFuerTour(wunschTour, e.target.value, wunsch.endzeit) })} className={feld} />
                </label>
                <label className="text-sm font-semibold">Bis
                  <input required type="time" value={wunsch.endzeit} onChange={(e) => setWunsch({ ...wunsch, endzeit: e.target.value })} className={feld} />
                </label>
              </div>
              <ZeitWarnung tour={wunschTour} start={wunsch.startzeit} ende={wunsch.endzeit} />
              <label className="text-sm font-semibold">Fahrzeug (optional)
                <select value={wunsch.fahrzeug} onChange={(e) => setWunsch({ ...wunsch, fahrzeug: e.target.value })} className={feld}>
                  <option value="">Egal – sucht der Kutscher aus</option>
                  {fahrzeuge.map((f) => {
                    const zweiterBw = wunsch2.wahl && wunsch2.wahl !== BEGLEITUNG ? bewohnerById(wunsch2.wahl) : undefined;
                    const passtNicht = (!!bewohnerById(wunsch.bewohner_id)?.rollstuhl || !!zweiterBw?.rollstuhl) && !f.rollstuhl;
                    const zuKlein = 1 + zweitAnzahl(wunsch2) > f.maxGaeste;
                    return <option key={f.id} value={f.id} disabled={passtNicht || zuKlein || !istBuchbarAm(f, wunsch.datum)}>
                      {f.name} ({f.maxGaeste} {f.maxGaeste > 1 ? 'Plätze' : 'Platz'}){f.rollstuhl ? ' ♿' : ''}{passtNicht ? ' – nicht für Rollstuhl' : zuKlein ? ' – zu wenig Plätze' : ''}
                    </option>;
                  })}
                </select>
              </label>
              <label className="text-sm font-semibold">Wunschfahrt (optional)
                <WunschfahrtFeld wert={wunschTour} onChange={(t) => { setWunschTour(t); setWunsch((w) => ({ ...w, endzeit: endeFuerTour(t, w.startzeit, w.endzeit) })); }} />
                {tourMinuten(wunschTour.wahl) !== null && <span className="block text-xs font-normal text-gray-500 mt-1">Die Endzeit wird passend zur Tour gesetzt.</span>}
              </label>
              <label className="text-sm font-semibold">Abholort
                <AbholortFeld wert={wunschAbhol} onChange={setWunschAbhol} standard={standardOrt} adresse={bewohnerById(wunsch.bewohner_id)?.adresse} />
              </label>
              <label className="text-sm font-semibold">Hinweis für den Kutscher (optional)
                <input value={wunsch.notiz} maxLength={500} onChange={(e) => setWunsch({ ...wunsch, notiz: e.target.value })} className={feld} placeholder="z. B. bitte klingeln, 2. Stock" />
              </label>
              <div className="sm:col-span-2">
                <button type="submit" className="bg-rikscha-green text-white rounded px-5 py-2 font-semibold">Wunsch melden</button>
              </div>
            </form>
          </section>

          {/* 3. Geplante Bewohnerfahrten */}
          <section className="bg-white rounded-xl shadow p-5">
            <h3 className="font-bold text-lg text-gray-800 mb-3">Geplante Fahrten ({daten.fahrten.length})</h3>
            {daten.fahrten.length === 0 && <p className="text-sm text-gray-400">Noch keine Fahrten geplant.</p>}
            <div className="space-y-2">
              {daten.fahrten.map((f) => {
                const bw = bewohnerById(f.bewohner_id) ?? bewohnerById(f.bewohner2_id);
                return (
                  <div key={f.id} className="border rounded-lg p-3 flex flex-wrap items-center gap-3">
                    <div className="flex-1 min-w-[200px]">
                      <div className="font-semibold">
                        {(f.gaeste?.length ? f.gaeste : [bw?.name ?? 'Fahrgast']).map((g) => {
                          const p = bewohner.find((x) => x.name === g && (x.id === f.bewohner_id || x.id === f.bewohner2_id));
                          return p ? `${g}${p.rollstuhl ? ' ♿' : ''}` : `${g} (Begleitung)`;
                        }).join(' + ')}
                      </div>
                      <div className="text-sm text-gray-600">{tagText(f.datum)}, {zeit(f)}{f.fahrzeug ? ` · ${fahrzeugById(f.fahrzeug)?.name ?? f.fahrzeug}` : ''}</div>
                      {f.abholort && <div className="text-sm text-sky-800">📍 {f.abholort}</div>}
                      {f.wunschfahrt && <div className="text-sm text-emerald-800">🗺️ {f.wunschfahrt}</div>}
                      {zeitWarnung(f.wunschfahrt, f.startzeit, f.endzeit) && <div className="text-sm text-orange-800">⚠ {zeitWarnung(f.wunschfahrt, f.startzeit, f.endzeit)}</div>}
                      <div className="mt-1"><VerschiebenAnfrage b={f} onDone={laden} meldung={zeige} /></div>
                    </div>
                    {f.pilot
                      ? <span className="text-sm bg-green-100 text-green-800 rounded-full px-3 py-1">✓ Kutscher: {f.pilot}</span>
                      : <span className="text-sm bg-orange-100 text-orange-800 rounded-full px-3 py-1">Kutscher gesucht</span>}
                    <button className="text-sm text-red-600 underline"
                      onClick={async () => { if (confirm(`Fahrt für ${(f.gaeste ?? []).join(' und ') || bw?.name || 'den Fahrgast'} absagen?`)) await ausfuehren({ aktion: 'absagen', buchung_id: f.id }, 'Die Fahrt wurde abgesagt.'); }}>
                      Absagen
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 4. Gruppenfahrten */}
          <section className="bg-white rounded-xl shadow p-5">
            {(daten.vorlagen ?? []).length > 0 && (
              <div className="mb-6">
                <h3 className="font-bold text-lg text-gray-800 mb-1">🔁 Regelmäßige Gruppenfahrten</h3>
                <p className="text-sm text-gray-500 mb-3">Schon einmal gefahren? Neues Datum eintragen und „Wiederholen“ tippen. Teilnehmende, Fahrzeuge, Uhrzeit und Treffpunkt werden übernommen. Ist ein Fahrzeug an dem Tag belegt, nimmt die App ein anderes freies.</p>
                <div className="space-y-2">
                  {daten.vorlagen.map((v) => (
                    <div key={v.id} className="border rounded-lg p-3 flex flex-wrap items-center gap-3">
                      <div className="flex-1 min-w-[200px]">
                        <div className="font-semibold">👥 {v.titel}</div>
                        <div className="text-sm text-gray-600">
                          zuletzt {tagText(v.datum)}{v.startzeit && v.endzeit ? `, ${v.startzeit.slice(0, 5)}–${v.endzeit.slice(0, 5)} Uhr` : ''}
                          {' · '}{v.personen} Personen · {v.fahrzeuge.map((id) => fahrzeugById(id)?.name ?? id).join(', ')}
                        </div>
                        {(v.abholort || v.wunschfahrt) && <div className="text-sm text-gray-500">{v.abholort ? `📍 ${v.abholort}` : ''}{v.abholort && v.wunschfahrt ? ' · ' : ''}{v.wunschfahrt ? `🗺️ ${v.wunschfahrt}` : ''}</div>}
                      </div>
                      <label className="text-sm font-semibold">Neues Datum
                        <input type="date" aria-label={`Neues Datum für ${v.titel}`} value={wiederholDatum[v.id] ?? ''}
                          onChange={(e) => setWiederholDatum({ ...wiederholDatum, [v.id]: e.target.value })} className="block border rounded px-2 py-2" />
                      </label>
                      <button disabled={!wiederholDatum[v.id] || wiederholt === v.id}
                        className="bg-rikscha-green text-white rounded px-4 py-2 font-semibold disabled:opacity-40 self-end"
                        onClick={async () => {
                          setWiederholt(v.id);
                          const r = await fetch('/api/pflege', {
                            method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() },
                            body: JSON.stringify({ aktion: 'gruppe-wiederholen', gruppe_id: v.id, datum: wiederholDatum[v.id] }),
                          });
                          const j = await r.json().catch(() => ({}));
                          setWiederholt(null);
                          if (!r.ok) { zeige(j.error ?? 'Das hat nicht geklappt.', false); return; }
                          const verteilung = (j.fahrzeuge ?? []).map((f: { name: string; personen: string[] }) => `${f.name}: ${f.personen.join(', ')}`).join(' · ');
                          zeige(`„${v.titel}“ am ${tagText(wiederholDatum[v.id])} angelegt. ${verteilung}${j.ersetzt?.length ? ` (statt ${j.ersetzt.join(', ')}, da belegt)` : ''}`);
                          setWiederholDatum({ ...wiederholDatum, [v.id]: '' });
                          await laden();
                        }}>
                        {wiederholt === v.id ? '…' : '🔁 Wiederholen'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <h3 className="font-bold text-lg text-gray-800 mb-1">👥 Neue Gruppenfahrt planen</h3>
            <p className="text-sm text-gray-500 mb-3">Mehrere Fahrgäste, mehrere Fahrzeuge: Die App verteilt alle auf die gewählten Fahrzeuge. Für jedes Fahrzeug sucht sich ein Kutscher die Fahrt im Kalender aus.</p>
            <form className="grid grid-cols-1 sm:grid-cols-2 gap-3" onSubmit={async (e) => {
              e.preventDefault();
              const weitere = gruppeWeitere.split('\n').map((x) => x.trim()).filter(Boolean);
              const abholort = abholText(gruppeAbhol, standardOrt, null);
              
              const wunschfahrt = tourText(gruppeTour);
              const r = await fetch('/api/pflege', {
                method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() },
                body: JSON.stringify({ aktion: 'gruppe-neu', ...gruppe, teilnehmer: gruppeTeilnehmer, weitere, fahrzeuge: gruppeFz, abholort, organisation_id: orgWahl, ...(wunschfahrt ? { wunschfahrt } : {}) }),
              });
              const j = await r.json().catch(() => ({}));
              if (!r.ok) { zeige(j.error ?? 'Das hat nicht geklappt.', false); return; }
              const verteilung = (j.fahrzeuge ?? []).map((f: { name: string; personen: string[] }) => `${f.name}: ${f.personen.join(', ')}`).join(' · ');
              zeige(`Gruppenfahrt angelegt. ${verteilung}${j.nichtGebraucht?.length ? ` (nicht gebraucht: ${j.nichtGebraucht.join(', ')})` : ''}`);
              setGruppe({ ...gruppe, titel: '', notiz: '' }); setGruppeTeilnehmer([]); setGruppeWeitere(''); setGruppeFz([]); setGruppeTour(TOUR_LEER); setGruppeAbhol(ABHOL_LEER);
              await laden();
            }}>
              <label className="sm:col-span-2 text-sm font-semibold">Name der Fahrt
                <input required maxLength={80} value={gruppe.titel} onChange={(e) => setGruppe({ ...gruppe, titel: e.target.value })} className={feld} placeholder="z. B. Ausflug zum Rhein" />
              </label>
              <label className="text-sm font-semibold">Tag
                <input required type="date" value={gruppe.datum} onChange={(e) => setGruppe({ ...gruppe, datum: e.target.value })} className={feld} />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="text-sm font-semibold">Von
                  <input required type="time" value={gruppe.startzeit} onChange={(e) => setGruppe({ ...gruppe, startzeit: e.target.value, endzeit: endeFuerTour(gruppeTour, e.target.value, gruppe.endzeit) })} className={feld} />
                </label>
                <label className="text-sm font-semibold">Bis
                  <input required type="time" value={gruppe.endzeit} onChange={(e) => setGruppe({ ...gruppe, endzeit: e.target.value })} className={feld} />
                </label>
              </div>
              <ZeitWarnung tour={gruppeTour} start={gruppe.startzeit} ende={gruppe.endzeit} />
              <fieldset className="sm:col-span-2 text-sm">
                <legend className="font-semibold mb-1">Fahrgäste ({gruppeTeilnehmer.length} gewählt)</legend>
                {(baum.length > 0 || kreise.length > 0) && (
                  <select aria-label="Alle hinzufügen aus" value="" className="mb-2 border rounded px-2 py-1"
                    onChange={(e) => {
                      const [art, id] = e.target.value.split(':');
                      const neu = (art === 'b' ? ausBereich(id) : ausKreis(id)).map((x) => x.id);
                      setGruppeTeilnehmer(Array.from(new Set([...gruppeTeilnehmer, ...neu])));
                    }}>
                    <option value="">+ Alle hinzufügen aus …</option>
                    {baum.map(({ bereich: x, tiefe }) => <option key={x.id} value={`b:${x.id}`}>{'\u00a0\u00a0'.repeat(tiefe)}🏢 {x.name} ({ausBereich(x.id).length})</option>)}
                    {kreise.map((x) => <option key={x.id} value={`k:${x.id}`}>👥 Gruppe {x.name} ({ausKreis(x.id).length})</option>)}
                  </select>
                )}
                <div className="flex flex-wrap gap-2">
                  {aktive.map((b) => (
                    <label key={b.id} className={`flex items-center gap-1 border rounded-full px-3 py-1 cursor-pointer ${gruppeTeilnehmer.includes(b.id) ? 'bg-green-50 border-green-500' : ''}`}>
                      <input type="checkbox" checked={gruppeTeilnehmer.includes(b.id)}
                        onChange={(e) => setGruppeTeilnehmer(e.target.checked ? [...gruppeTeilnehmer, b.id] : gruppeTeilnehmer.filter((x) => x !== b.id))} />
                      {b.name}{b.rollstuhl ? ' ♿' : ''}
                    </label>
                  ))}
                  {aktive.length === 0 && <span className="text-gray-400">Noch keine Fahrgäste eingetragen (unten).</span>}
                </div>
              </fieldset>
              <label className="sm:col-span-2 text-sm font-semibold">Weitere Personen (optional, eine pro Zeile)
                <textarea rows={2} value={gruppeWeitere} onChange={(e) => setGruppeWeitere(e.target.value)} className={feld} placeholder={'z. B. Begleitperson\nAngehörige'} />
              </label>
              <fieldset className="sm:col-span-2 text-sm">
                {(() => {
                  const personen = gruppeTeilnehmer.length + gruppeWeitere.split('\n').filter((x) => x.trim()).length;
                  const plaetze = (gruppeFzListe ?? []).filter((f) => gruppeFz.includes(f.id)).reduce((s, f) => s + f.maxGaeste, 0);
                  return <legend className="font-semibold mb-1">Fahrzeuge – Plätze: <span className={plaetze >= personen && personen > 0 ? 'text-green-700' : 'text-orange-700'}>{plaetze} von {personen} nötig</span></legend>;
                })()}
                {!gruppeFzListe && <span className="text-gray-400">Erst Tag und Uhrzeit wählen – dann siehst du die freien Fahrzeuge.</span>}
                <div className="flex flex-wrap gap-2">
                  {(gruppeFzListe ?? []).map((f) => (
                    <label key={f.id} className={`flex items-center gap-1 border rounded-full px-3 py-1 ${f.frei ? 'cursor-pointer' : 'opacity-50'} ${gruppeFz.includes(f.id) ? 'bg-green-50 border-green-500' : ''}`}>
                      <input type="checkbox" disabled={!f.frei} checked={gruppeFz.includes(f.id)}
                        onChange={(e) => setGruppeFz(e.target.checked ? [...gruppeFz, f.id] : gruppeFz.filter((x) => x !== f.id))} />
                      🚲 {f.name} ({f.maxGaeste}){f.rollstuhl ? ' ♿' : ''}{f.grund ? ` – ${f.grund}` : ''}
                    </label>
                  ))}
                </div>
              </fieldset>
              <label className="text-sm font-semibold">Treffpunkt
                <AbholortFeld wert={gruppeAbhol} onChange={setGruppeAbhol} standard={standardOrt} label="Treffpunkt" />
              </label>
              <label className="text-sm font-semibold">Wunschfahrt (optional)
                <WunschfahrtFeld wert={gruppeTour} onChange={(t) => { setGruppeTour(t); setGruppe((g) => ({ ...g, endzeit: endeFuerTour(t, g.startzeit, g.endzeit) })); }} />
                {tourMinuten(gruppeTour.wahl) !== null && <span className="block text-xs font-normal text-gray-500 mt-1">Die Endzeit wird passend zur Tour gesetzt.</span>}
              </label>
              <label className="sm:col-span-2 text-sm font-semibold">Hinweis für die Kutscher (optional)
                <input value={gruppe.notiz} maxLength={500} onChange={(e) => setGruppe({ ...gruppe, notiz: e.target.value })} className={feld} />
              </label>
              <div className="sm:col-span-2">
                <button type="submit" disabled={!gruppeFz.length} className="bg-rikscha-green text-white rounded px-5 py-2 font-semibold disabled:opacity-40">Gruppenfahrt anlegen</button>
              </div>
            </form>

            {daten.gruppen.length > 0 && (
              <div className="mt-5 space-y-3">
                <h4 className="font-semibold text-gray-700">Geplante Gruppenfahrten</h4>
                {daten.gruppen.map((g) => {
                  const erste = g.fahrten[0];
                  const besetzt = g.fahrten.filter((f) => f.pilot).length;
                  return (
                    <div key={g.id} className="border-2 border-violet-200 rounded-lg p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold">👥 {g.titel}</span>
                        <span className="text-sm text-gray-600">{erste ? `${tagText(erste.datum)}, ${zeit(erste)}` : tagText(g.datum)}</span>
                        <span className={`text-xs rounded-full px-2 py-0.5 ${besetzt === g.fahrten.length ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                          {besetzt} von {g.fahrten.length} Kutschern gefunden
                        </span>
                        <button className="ml-auto text-sm text-red-600 underline"
                          onClick={async () => { if (confirm(`Gruppenfahrt „${g.titel}“ ganz absagen?`)) await ausfuehren({ aktion: 'gruppe-absagen', gruppe_id: g.id }, 'Die Gruppenfahrt wurde abgesagt.'); }}>
                          Ganze Gruppe absagen
                        </button>
                      </div>
                      {erste?.abholort && <div className="text-sm text-sky-800 mt-1">📍 {erste.abholort}{erste.wunschfahrt ? ` · 🗺️ ${erste.wunschfahrt}` : ''}</div>}
                      <ul className="mt-2 text-sm space-y-1">
                        {g.fahrten.map((f) => (
                          <li key={f.id} className="flex flex-wrap gap-2">
                            <span className="font-medium">🚲 {fahrzeugById(f.fahrzeug)?.name ?? f.fahrzeug}:</span>
                            <span>{(f.gaeste ?? []).join(', ')}</span>
                            <span className={f.pilot ? 'text-green-700' : 'text-orange-700'}>{f.pilot ? `✓ ${f.pilot}` : 'Kutscher gesucht'}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* 5. Fahrgäste */}
          <section className="bg-white rounded-xl shadow p-5">
            <h3 className="font-bold text-lg text-gray-800 mb-1">Fahrgäste ({aktive.length})</h3>
            <p className="text-sm text-gray-500 mb-3">
              Nur das Nötigste eintragen: keine Diagnosen, kein Geburtsdatum.
              {quartier && <> Telefon und Adresse sieht nur der Kutscher, der die Fahrt übernimmt. Sie werden <strong>{daten.fristMonate} Monate nach dem letzten Kontakt automatisch gelöscht</strong> – jede neue Fahrt oder Änderung startet die Frist neu.</>}
            </p>
            <form className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-4 items-end" onSubmit={async (e) => {
              e.preventDefault();
              if (await ausfuehren({ aktion: 'bewohner-neu', ...neuerBewohner, organisation_id: orgWahl }, `${neuerBewohner.name} wurde angelegt.`)) setNeuerBewohner(LEER_FG);
            }}>
              <label className="text-sm font-semibold">Name
                <input required maxLength={80} value={neuerBewohner.name} onChange={(e) => setNeuerBewohner({ ...neuerBewohner, name: e.target.value })} className={feld} />
              </label>
              {baum.length > 0 ? (
                <label className="text-sm font-semibold">Bereich
                  {bereichAuswahl(neuerBewohner.bereich_id, (v) => setNeuerBewohner({ ...neuerBewohner, bereich_id: v }))}
                </label>
              ) : !quartier && (
                <label className="text-sm font-semibold">Wohnbereich
                  <input maxLength={60} value={neuerBewohner.wohnbereich} onChange={(e) => setNeuerBewohner({ ...neuerBewohner, wohnbereich: e.target.value })} className={feld} />
                </label>
              )}
              {quartier && (
                <>
                  <label className="text-sm font-semibold">Adresse (optional)
                    <input maxLength={160} value={neuerBewohner.adresse} onChange={(e) => setNeuerBewohner({ ...neuerBewohner, adresse: e.target.value })} className={feld} placeholder="Straße Nr., Ort" />
                  </label>
                  <label className="text-sm font-semibold">Telefon (optional)
                    <input maxLength={40} type="tel" value={neuerBewohner.telefon} onChange={(e) => setNeuerBewohner({ ...neuerBewohner, telefon: e.target.value })} className={feld} />
                  </label>
                </>
              )}
              <label className="text-sm font-semibold sm:col-span-2">Hinweis (optional)
                <input maxLength={200} value={neuerBewohner.hinweis} onChange={(e) => setNeuerBewohner({ ...neuerBewohner, hinweis: e.target.value })} className={feld} placeholder="z. B. braucht eine Decke" />
              </label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={neuerBewohner.rollstuhl} onChange={(e) => setNeuerBewohner({ ...neuerBewohner, rollstuhl: e.target.checked })} /> ♿ Rollstuhl</label>
              <button type="submit" className="bg-rikscha-green text-white rounded px-4 py-2 font-semibold">+ Anlegen</button>
              {kreise.length > 0 && <div className="sm:col-span-4">{kreisHaken(neuerBewohner.kreise, (v) => setNeuerBewohner({ ...neuerBewohner, kreise: v }))}</div>}
            </form>

            {(baum.length > 0 || kreise.length > 0) && (
              <div className="flex flex-wrap gap-2 mb-2 text-sm items-center">
                <span className="text-gray-500">Anzeigen:</span>
                {baum.length > 0 && (
                  <select aria-label="Nach Bereich filtern" value={filterBereich} onChange={(e) => setFilterBereich(e.target.value)} className="border rounded px-2 py-1">
                    <option value="">alle Bereiche</option>
                    {baum.map(({ bereich: x, tiefe }) => <option key={x.id} value={x.id}>{'  '.repeat(tiefe)}{x.name}</option>)}
                  </select>
                )}
                {kreise.length > 0 && (
                  <select aria-label="Nach Gruppe filtern" value={filterKreis} onChange={(e) => setFilterKreis(e.target.value)} className="border rounded px-2 py-1">
                    <option value="">alle Gruppen</option>
                    {kreise.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                  </select>
                )}
                {(filterBereich || filterKreis) && <span className="text-gray-500">{sichtbar.length} von {bewohner.length}</span>}
              </div>
            )}

            <div className="divide-y">
              {sichtbar.map((b) => bearbeiten?.id === b.id ? (
                <form key={b.id} className="py-2 grid grid-cols-1 sm:grid-cols-4 gap-2 items-end" onSubmit={async (e) => {
                  e.preventDefault();
                  const { id, name, wohnbereich, adresse, telefon, hinweis, rollstuhl, bereich_id } = bearbeiten;
                  if (await ausfuehren({ aktion: 'bewohner-aendern', id, name, wohnbereich, adresse, telefon, hinweis, rollstuhl, bereich_id: bereich_id ?? '', kreise: bearbeitenKreise }, 'Gespeichert.')) setBearbeiten(null);
                }}>
                  <input required maxLength={80} aria-label="Name" value={bearbeiten.name} onChange={(e) => setBearbeiten({ ...bearbeiten, name: e.target.value })} className={feld} />
                  {baum.length > 0
                    ? bereichAuswahl(bearbeiten.bereich_id ?? '', (v) => setBearbeiten({ ...bearbeiten, bereich_id: v || null }))
                    : !quartier && <input maxLength={60} aria-label="Wohnbereich" value={bearbeiten.wohnbereich ?? ''} onChange={(e) => setBearbeiten({ ...bearbeiten, wohnbereich: e.target.value })} className={feld} />}
                  {quartier && (
                    <>
                      <input maxLength={160} aria-label="Adresse" placeholder="Adresse" value={bearbeiten.adresse ?? ''} onChange={(e) => setBearbeiten({ ...bearbeiten, adresse: e.target.value })} className={feld} />
                      <input maxLength={40} aria-label="Telefon" placeholder="Telefon" value={bearbeiten.telefon ?? ''} onChange={(e) => setBearbeiten({ ...bearbeiten, telefon: e.target.value })} className={feld} />
                    </>
                  )}
                  <input maxLength={200} aria-label="Hinweis" placeholder="Hinweis" value={bearbeiten.hinweis ?? ''} onChange={(e) => setBearbeiten({ ...bearbeiten, hinweis: e.target.value })} className={`${feld} sm:col-span-2`} />
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={bearbeiten.rollstuhl} onChange={(e) => setBearbeiten({ ...bearbeiten, rollstuhl: e.target.checked })} /> ♿ Rollstuhl</label>
                  <div className="flex gap-2">
                    <button type="submit" className="bg-rikscha-green text-white rounded px-3 py-1.5 font-semibold">Speichern</button>
                    <button type="button" onClick={() => setBearbeiten(null)} className="text-gray-500 px-2">Abbrechen</button>
                  </div>
                  {kreise.length > 0 && <div className="sm:col-span-4">{kreisHaken(bearbeitenKreise, setBearbeitenKreise)}</div>}
                </form>
              ) : (
                <div key={b.id} className={`py-2 flex flex-wrap items-center gap-2 ${b.aktiv ? '' : 'opacity-50'}`}>
                  <span className="font-medium">{b.name}</span>
                  {ort(b) && !b.adresse && <span className="text-sm text-gray-500">🏢 {ort(b)}</span>}
                  {b.adresse && <span className="text-sm text-gray-500">🏡 {b.adresse}</span>}
                  {b.telefon && <span className="text-sm text-gray-500">📞 {b.telefon}</span>}
                  {b.rollstuhl && <span title="Rollstuhl">♿</span>}
                  {kreiseVon(b.id).map((kid) => <span key={kid} className="text-xs bg-violet-100 text-violet-800 rounded-full px-2">{kreise.find((x) => x.id === kid)?.name}</span>)}
                  {b.hinweis && <span className="text-sm text-gray-500 italic">„{b.hinweis}“</span>}
                  {(b.adresse || b.telefon) && <span className="text-xs text-gray-400">Kontaktdaten bis {plusMonate(b.letzter_kontakt, daten.fristMonate)}</span>}
                  {!b.aktiv && <span className="text-xs bg-gray-100 rounded-full px-2">ausgeblendet</span>}
                  <span className="ml-auto flex gap-3 text-sm">
                    <a href={`/pflege/wochenplan?fahrgast=${b.id}`} target="_blank" className="text-emerald-700 underline">🗓️ Wochenplan</a>
                    <button onClick={() => { setBearbeiten(b); setBearbeitenKreise(kreiseVon(b.id)); }} className="text-blue-600 underline">Bearbeiten</button>
                    <button onClick={() => ausfuehren({ aktion: 'bewohner-aendern', id: b.id, aktiv: !b.aktiv }, b.aktiv ? `${b.name} ist ausgeblendet.` : `${b.name} ist wieder sichtbar.`)}
                      className="text-orange-600 underline">{b.aktiv ? 'Ausblenden' : 'Wieder anzeigen'}</button>
                    <button onClick={async () => { if (confirm(`${b.name} endgültig löschen? Künftige Fahrten werden abgesagt, in alten Fahrten wird der Name entfernt.`)) await ausfuehren({ aktion: 'bewohner-loeschen', id: b.id }, `${b.name} wurde gelöscht.`); }}
                      className="text-red-600 underline">Löschen</button>
                  </span>
                </div>
              ))}
              {bewohner.length === 0 && <p className="text-sm text-gray-400 py-2">Noch keine Fahrgäste eingetragen.</p>}
            </div>
          </section>

          {/* 6. Aufbau der Einrichtung und Gruppen – frei aufbaubar */}
          <section className="bg-white rounded-xl shadow p-5">
            <h3 className="font-bold text-lg text-gray-800 mb-1">🏢 Aufbau & Gruppen</h3>
            <p className="text-sm text-gray-500 mb-3">
              Bildet euer Haus so ab, wie es ist – nach und nach, beliebig tief (z. B. Haus › Etage › Wohnbereich).
              Jeder Bereich hat einen eigenen <strong>Kalender-Link</strong> für Outlook/Dienstplan und einen <strong>Wochenplan zum Ausdrucken</strong>.
              Der <strong>Hinweis für Mitarbeitende</strong> erscheint in jedem Termin des Bereichs und seiner Unterbereiche.
            </p>
            {daten.strukturFehlt && <p className="text-sm bg-amber-50 border border-amber-300 text-amber-900 rounded px-3 py-2 mb-3">Noch nicht eingerichtet: Bitte einmal supabase/struktur-bereiche-gruppen.sql ausführen.</p>}

            <div className="space-y-1">
              {baum.map(({ bereich: x, tiefe }) => bereichEdit?.id === x.id ? (
                <form key={x.id} style={{ marginLeft: tiefe * 20 }} className="border rounded-lg p-2 bg-gray-50 grid grid-cols-1 sm:grid-cols-3 gap-2" onSubmit={async (e) => {
                  e.preventDefault();
                  if (await ausfuehren({ aktion: 'bereich-aendern', id: x.id, name: bereichEdit.name, hinweis: bereichEdit.hinweis, eltern_id: bereichEdit.eltern }, 'Gespeichert.')) setBereichEdit(null);
                }}>
                  <label className="text-sm font-semibold">Name
                    <input required maxLength={60} value={bereichEdit.name} onChange={(e) => setBereichEdit({ ...bereichEdit, name: e.target.value })} className={feld} />
                  </label>
                  <label className="text-sm font-semibold">Liegt unter
                    <select value={bereichEdit.eltern} onChange={(e) => setBereichEdit({ ...bereichEdit, eltern: e.target.value })} className={feld}>
                      <option value="">– oberste Ebene –</option>
                      {baum.filter(({ bereich: y }) => !mitUnterbereichen(bereiche, x.id).has(y.id)).map(({ bereich: y, tiefe: t }) => (
                        <option key={y.id} value={y.id}>{'  '.repeat(t)}{y.name}</option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm font-semibold">Hinweis für Mitarbeitende
                    <input maxLength={300} value={bereichEdit.hinweis} onChange={(e) => setBereichEdit({ ...bereichEdit, hinweis: e.target.value })} className={feld} placeholder="z. B. 10 Min. vorher im Foyer bereitstellen" />
                  </label>
                  <div className="sm:col-span-3 flex flex-wrap gap-3 items-center">
                    <button type="submit" className="bg-rikscha-green text-white rounded px-3 py-1.5 font-semibold">Speichern</button>
                    <button type="button" onClick={() => setBereichEdit(null)} className="text-gray-500">Abbrechen</button>
                    <button type="button" className="ml-auto text-sm text-gray-600 underline"
                      onClick={async () => { if (confirm('Neuen Kalender-Link erzeugen? Der alte Link funktioniert danach nicht mehr.')) { await ausfuehren({ aktion: 'bereich-aendern', id: x.id, neuer_link: true }, 'Neuer Kalender-Link erzeugt – bitte neu einbinden.'); setBereichEdit(null); } }}>
                      Neuen Kalender-Link erzeugen
                    </button>
                  </div>
                </form>
              ) : (
                <div key={x.id} style={{ marginLeft: tiefe * 20 }} className="flex flex-wrap items-center gap-2 border-l-2 border-gray-200 pl-2 py-1">
                  <span className="font-medium">{tiefe ? '└ ' : ''}{x.name}</span>
                  <span className="text-xs text-gray-400">{ausBereich(x.id).length} Fahrgäste</span>
                  {x.hinweis && <span className="text-xs text-gray-500 italic">„{x.hinweis}“</span>}
                  <span className="ml-auto flex flex-wrap gap-3 text-sm">
                    <button className="text-emerald-700 underline" onClick={() => setNeuerBereich({ eltern: x.id, name: '' })}>+ Unterbereich</button>
                    <a href={`/pflege/wochenplan?bereich=${x.id}`} target="_blank" className="text-emerald-700 underline">🗓️ Wochenplan</a>
                    <button className="text-emerald-700 underline" onClick={async () => {
                      const url = `${location.origin}/pflege/schnell?bereich=${x.id}`;
                      try { await navigator.clipboard.writeText(url); zeige(`Anmelde-Link für „${x.name}“ kopiert. Als Lesezeichen, im Intranet oder im Dienstplan ablegen – damit melden Pflegekräfte eine Fahrt in drei Schritten an.`); }
                      catch { prompt('Anmelde-Link:', url); }
                    }}>🚲 Anmelde-Link</button>
                    {x.kalender_token && (
                      <button className="text-emerald-700 underline" onClick={async () => {
                        const url = `${location.origin}/api/ical/bereich/${x.kalender_token}.ics`;
                        try { await navigator.clipboard.writeText(url); zeige(`Kalender-Link für „${x.name}“ kopiert. In Outlook: Kalender hinzufügen → Aus dem Internet → Link einfügen. Link nur intern weitergeben – er enthält Namen.`); }
                        catch { prompt('Kalender-Link (nur intern weitergeben):', url); }
                      }}>📅 Kalender-Link</button>
                    )}
                    <button className="text-blue-600 underline" onClick={() => setBereichEdit({ id: x.id, name: x.name, hinweis: x.hinweis ?? '', eltern: x.eltern_id ?? '' })}>Bearbeiten</button>
                    <button className="text-red-600 underline" onClick={async () => {
                      const kinder = bereiche.filter((y) => y.eltern_id === x.id).length;
                      const direkt = bewohner.filter((y) => y.bereich_id === x.id).length;
                      const oben = bereiche.find((y) => y.id === x.eltern_id)?.name;
                      const folgen = [
                        kinder ? `${kinder} Unterbereich(e) rücken ${oben ? `zu „${oben}“` : 'auf die oberste Ebene'}.` : '',
                        direkt ? `${direkt} Fahrgast/Fahrgäste ${oben ? `kommen zu „${oben}“` : 'sind danach ohne Bereich'}.` : '',
                      ].filter(Boolean).join('\n');
                      if (confirm(`Bereich „${x.name}“ löschen?${folgen ? `\n\n${folgen}` : ''}`)) await ausfuehren({ aktion: 'bereich-loeschen', id: x.id }, `„${x.name}“ wurde gelöscht.`);
                    }}>Löschen</button>
                  </span>
                </div>
              ))}
              {baum.length === 0 && !daten.strukturFehlt && <p className="text-sm text-gray-400">Noch kein Bereich angelegt.</p>}
            </div>

            {neuerBereich ? (
              <form className="mt-3 flex flex-wrap gap-2 items-end" onSubmit={async (e) => {
                e.preventDefault();
                if (await ausfuehren({ aktion: 'bereich-neu', name: neuerBereich.name, eltern_id: neuerBereich.eltern || undefined, organisation_id: orgWahl }, `„${neuerBereich.name}“ wurde angelegt.`)) setNeuerBereich(null);
              }}>
                <label className="text-sm font-semibold flex-1 min-w-[200px]">
                  {neuerBereich.eltern ? `Neuer Unterbereich in „${bereiche.find((x) => x.id === neuerBereich.eltern)?.name}“` : 'Neuer Bereich (oberste Ebene)'}
                  <input required autoFocus maxLength={60} value={neuerBereich.name} onChange={(e) => setNeuerBereich({ ...neuerBereich, name: e.target.value })} className={feld} placeholder="z. B. 1. Etage oder Wohnbereich Lindenhof" />
                </label>
                <button type="submit" className="bg-rikscha-green text-white rounded px-4 py-2 font-semibold">Anlegen</button>
                <button type="button" onClick={() => setNeuerBereich(null)} className="text-gray-500 px-2 py-2">Abbrechen</button>
              </form>
            ) : !daten.strukturFehlt && (
              <button className="mt-3 text-sm bg-gray-100 border rounded px-3 py-1.5 font-semibold" onClick={() => setNeuerBereich({ eltern: '', name: '' })}>+ Bereich auf oberster Ebene</button>
            )}

            <h4 className="font-semibold text-gray-700 mt-6 mb-1">👥 Gruppen</h4>
            <p className="text-sm text-gray-500 mb-2">Quer zu den Bereichen, z. B. „Sitztanz“ oder „Erzählcafé“. Bitte nach Aktivitäten benennen, nicht nach Krankheiten.</p>
            <div className="flex flex-wrap gap-2 mb-2">
              {kreise.map((x) => (
                <span key={x.id} className="flex items-center gap-2 text-sm bg-violet-50 border border-violet-200 rounded-full px-3 py-1">
                  {x.name} <span className="text-xs text-gray-500">({ausKreis(x.id).length})</span>
                  <button title="Umbenennen" className="text-blue-600" onClick={async () => { const n = prompt('Neuer Name der Gruppe:', x.name); if (n && n.trim() && n !== x.name) await ausfuehren({ aktion: 'kreis-aendern', id: x.id, name: n }, 'Umbenannt.'); }}>✎</button>
                  <button title="Löschen" className="text-red-600" onClick={async () => { if (confirm(`Gruppe „${x.name}“ löschen? Die Fahrgäste bleiben erhalten.`)) await ausfuehren({ aktion: 'kreis-loeschen', id: x.id }, 'Gruppe gelöscht.'); }}>✕</button>
                </span>
              ))}
              {kreise.length === 0 && <span className="text-sm text-gray-400">Noch keine Gruppe.</span>}
            </div>
            {!daten.strukturFehlt && (
              <form className="flex gap-2" onSubmit={async (e) => {
                e.preventDefault();
                if (neuerKreis.trim() && await ausfuehren({ aktion: 'kreis-neu', name: neuerKreis, organisation_id: orgWahl }, `Gruppe „${neuerKreis}“ angelegt.`)) setNeuerKreis('');
              }}>
                <input maxLength={60} value={neuerKreis} onChange={(e) => setNeuerKreis(e.target.value)} placeholder="Neue Gruppe" className="border rounded px-3 py-1.5 text-sm flex-1" />
                <button type="submit" className="bg-rikscha-green text-white rounded px-3 py-1.5 text-sm font-semibold">+ Gruppe</button>
              </form>
            )}
          </section>
        </>
      )}
    </div>
  );
}
