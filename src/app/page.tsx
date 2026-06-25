'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  addMonths, subMonths, isToday, isSameDay, parseISO,
  startOfWeek, endOfWeek, isSameMonth, getISOWeek, getDay,
  addDays, addWeeks, subWeeks,
} from 'date-fns';
import { de } from 'date-fns/locale';
import type { Buchung, Sperre } from '@/lib/supabase';
import type { TeamUpEvent } from '@/app/api/teamup/route';
import { FAHRZEUGE, PILOTEN, PILOT_FARBE, GAST_FARBE, fahrzeugById } from '@/lib/constants';

type Ansicht = 'monat' | 'woche' | 'tag';
const WOCHENTAGE = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

function osterSonntag(jahr: number): Date {
  const a = jahr % 19, b = Math.floor(jahr / 100), c = jahr % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  return new Date(jahr, Math.floor((h + l - 7 * m + 114) / 31) - 1, ((h + l - 7 * m + 114) % 31) + 1);
}
function feiertageDesJahres(jahr: number): Map<string, string> {
  const o = osterSonntag(jahr);
  const k = (dt: Date) => format(dt, 'yyyy-MM-dd');
  const ad = (b: Date, n: number) => addDays(b, n);
  const m = new Map<string, string>();
  m.set(`${jahr}-01-01`, 'Neujahr'); m.set(`${jahr}-05-01`, 'Tag der Arbeit');
  m.set(`${jahr}-10-03`, 'Tag der Deutschen Einheit');
  m.set(`${jahr}-12-25`, '1. Weihnachtstag'); m.set(`${jahr}-12-26`, '2. Weihnachtstag');
  m.set(k(ad(o,-2)),'Karfreitag'); m.set(k(ad(o,1)),'Ostermontag');
  m.set(k(ad(o,39)),'Christi Himmelfahrt'); m.set(k(ad(o,50)),'Pfingstmontag');
  m.set(k(ad(o,60)),'Fronleichnam');
  return m;
}

function getBuchungenFuerTag(buchungen: Buchung[], tag: Date) {
  return buchungen.filter((b) => isSameDay(parseISO(b.datum), tag));
}
function getSperrenFuerTag(sperren: Sperre[], tag: Date) {
  return sperren.filter((s) => tag >= parseISO(s.von_datum) && tag <= parseISO(s.bis_datum));
}
function getTeamUpFuerTag(events: TeamUpEvent[], tag: Date) {
  return events.filter((e) => isSameDay(parseISO(e.start.slice(0, 10)), tag));
}
function ueberlappen(a: Buchung, b: Buchung) {
  return a.startzeit < b.endzeit && b.startzeit < a.endzeit;
}
function gruppiereTermine(buchungen: Buchung[]): Buchung[][] {
  const sorted = [...buchungen].sort((a, b) => a.startzeit.localeCompare(b.startzeit));
  const gruppen: Buchung[][] = [];
  for (const b of sorted) {
    const vorhandene = gruppen.find((g) => g.some((x) => ueberlappen(x, b)));
    if (vorhandene) vorhandene.push(b);
    else gruppen.push([b]);
  }
  return gruppen;
}

function tagBg(tag: Date, datum: Date, ansicht: Ansicht, feiertage: Map<string, string>) {
  const wt = getDay(tag), istWE = wt === 0 || wt === 6;
  const istFT = feiertage.has(format(tag, 'yyyy-MM-dd'));
  const kw = getISOWeek(tag), geradeKW = kw % 2 === 0;
  const imMonat = isSameMonth(tag, datum);
  if (isToday(tag)) return 'bg-green-100';
  if (istFT) return 'bg-amber-100';
  if (istWE) return 'bg-blue-100';
  if (ansicht === 'monat' && !imMonat) return geradeKW ? 'bg-gray-100' : 'bg-gray-200';
  return geradeKW ? 'bg-white' : 'bg-slate-100';
}

function BuchungKarte({ b, schmal }: { b: Buchung; schmal?: boolean }) {
  const fz = fahrzeugById(b.fahrzeug);
  const istOffen = !b.pilot || !b.fahrzeug;
  return (
    <div className={`rounded overflow-hidden border-2 shadow mb-0.5 ${
      istOffen ? 'border-orange-400 border-dashed' : 'border-gray-400'
    } ${b.storniert ? 'opacity-50' : ''} ${schmal ? 'min-w-0 flex-1' : ''}`}>
      {b.pilot ? (
        <div style={{ backgroundColor: PILOT_FARBE.bgHex }} className={`flex items-center gap-1 px-1 py-0.5 ${PILOT_FARBE.textClass}`}>
          <span style={{ backgroundColor: PILOT_FARBE.dotHex }} className="flex-shrink-0 w-1.5 h-1.5 rounded-full" />
          <span className={`${schmal ? 'text-[9px]' : 'text-[11px]'} font-bold truncate ${b.storniert ? 'line-through' : ''}`}>
            {b.startzeit.slice(0,5)} {schmal ? '' : 'P: '}{b.pilot}
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-1 px-1 py-0.5 bg-orange-100 text-orange-800">
          <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-orange-400" />
          <span className={`${schmal ? 'text-[9px]' : 'text-[11px]'} font-bold truncate`}>{b.startzeit.slice(0,5)} offen</span>
        </div>
      )}
      {!schmal && b.gaeste.map((g, i) => (
        <div key={i} style={{ backgroundColor: GAST_FARBE.bgHex }} className={`flex items-center gap-1 px-1.5 py-0.5 border-t border-white/60 ${GAST_FARBE.textClass}`}>
          <span style={{ backgroundColor: GAST_FARBE.dotHex }} className="flex-shrink-0 w-2 h-2 rounded-full" />
          <span className="text-[11px] font-semibold truncate">G: {g}</span>
        </div>
      ))}
      {schmal && b.gaeste.length > 0 && (
        <div style={{ backgroundColor: GAST_FARBE.bgHex }} className={`flex items-center gap-1 px-1 py-0.5 border-t border-white/60 ${GAST_FARBE.textClass}`}>
          <span style={{ backgroundColor: GAST_FARBE.dotHex }} className="flex-shrink-0 w-1.5 h-1.5 rounded-full" />
          <span className="text-[9px] font-semibold">{b.gaeste.length}G</span>
        </div>
      )}
      {b.fahrzeug ? (
        <div style={{ backgroundColor: fz?.bgHex ?? '#e5e7eb' }} className="flex items-center gap-1 px-1 py-0.5 border-t border-white/60 text-gray-900">
          <span style={{ backgroundColor: fz?.farbeHex ?? '#6b7280' }} className="flex-shrink-0 w-1.5 h-1.5 rounded-full" />
          <span className={`${schmal ? 'text-[9px]' : 'text-[10px]'} font-semibold truncate`}>{fz?.name ?? b.fahrzeug}</span>
        </div>
      ) : (
        <div className="flex items-center gap-1 px-1 py-0.5 border-t border-dashed border-orange-300 bg-orange-50 text-orange-700">
          <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-orange-300" />
          <span className={`${schmal ? 'text-[9px]' : 'text-[10px]'} font-semibold`}>Fzg offen</span>
        </div>
      )}
    </div>
  );
}

function BearbeitenPanel({ b, onUpdated, onClose }: { b: Buchung; onUpdated: () => void; onClose: () => void }) {
  const [saving, setSaving] = useState(false);
  const [gaestInput, setGaestInput] = useState('');
  const [notiz, setNotiz] = useState(b.notiz ?? '');
  const [notizGeaendert, setNotizGeaendert] = useState(false);

  const patch = async (data: Record<string, unknown>) => {
    setSaving(true);
    await fetch(`/api/buchungen/${b.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    setSaving(false);
    onUpdated();
  };

  const fahrzeugWaehlen = (fzId: string) => patch({ fahrzeug: fzId });
  const gastHinzufuegen = () => {
    if (!gaestInput.trim()) return;
    const fz = fahrzeugById(b.fahrzeug);
    if (b.gaeste.length >= (fz?.maxGaeste ?? 2)) return;
    patch({ gaeste: [...b.gaeste, gaestInput.trim()] });
    setGaestInput('');
  };
  const gastEntfernen = (i: number) => patch({ gaeste: b.gaeste.filter((_, idx) => idx !== i) });
  const notizSpeichern = () => { patch({ notiz: notiz.trim() }); setNotizGeaendert(false); };

  const fz = fahrzeugById(b.fahrzeug);
  const maxGaeste = fz?.maxGaeste ?? 2;

  return (
    <div className="bg-indigo-50 border-2 border-indigo-300 rounded-lg p-3 mb-3">
      <div className="flex justify-between items-center mb-3">
        <p className="text-sm font-bold text-indigo-700">✏️ Termin bearbeiten</p>
        <button onClick={onClose} className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-200">✕ Schließen</button>
      </div>
      <div className="mb-3">
        <p className="text-xs font-semibold text-gray-600 mb-1.5">Pilot:</p>
        <div className="flex flex-wrap gap-1.5">
          {PILOTEN.map((name) => (
            <button key={name} disabled={saving} onClick={() => patch({ pilot: name })}
              style={{ backgroundColor: b.pilot === name ? PILOT_FARBE.dotHex : PILOT_FARBE.bgHex, color: b.pilot === name ? '#fff' : '#1e1b4b', outline: b.pilot === name ? `3px solid ${PILOT_FARBE.dotHex}` : 'none' }}
              className="text-sm px-3 py-1.5 rounded font-bold border border-indigo-400 hover:scale-105 transition-transform disabled:opacity-50">{name}</button>
          ))}
          {b.pilot && <button onClick={() => patch({ pilot: '' })} disabled={saving} className="text-sm px-3 py-1.5 rounded border border-dashed border-orange-400 text-orange-700 bg-orange-50 hover:bg-orange-100 disabled:opacity-50">Kein Pilot</button>}
        </div>
      </div>
      <div className="mb-3">
        <p className="text-xs font-semibold text-gray-600 mb-1.5">Fahrzeug:</p>
        <div className="flex flex-wrap gap-1.5">
          {FAHRZEUGE.map((f) => (
            <button key={f.id} disabled={saving} onClick={() => fahrzeugWaehlen(f.id)}
              style={{ backgroundColor: f.bgHex, outline: b.fahrzeug === f.id ? `3px solid ${f.farbeHex}` : 'none' }}
              className="text-sm px-3 py-1.5 rounded font-bold border border-gray-400 hover:scale-105 transition-transform disabled:opacity-50 text-gray-900">
              {f.name} <span className="font-normal text-xs opacity-70">(max. {f.maxGaeste}G)</span>
            </button>
          ))}
          {b.fahrzeug && <button onClick={() => patch({ fahrzeug: '' })} disabled={saving} className="text-sm px-3 py-1.5 rounded border border-dashed border-orange-400 text-orange-700 bg-orange-50 hover:bg-orange-100 disabled:opacity-50">Kein Fahrzeug</button>}
        </div>
      </div>
      <div className="mb-3">
        <p className="text-xs font-semibold text-gray-600 mb-1.5">Gäste (max. {maxGaeste}):</p>
        <div className="flex flex-wrap gap-1 mb-1.5">
          {b.gaeste.map((g, i) => (
            <span key={i} style={{ backgroundColor: GAST_FARBE.bgHex }} className={`flex items-center gap-1 text-sm px-2 py-1 rounded ${GAST_FARBE.textClass}`}>
              G: {g}<button onClick={() => gastEntfernen(i)} disabled={saving} className="ml-1 hover:text-red-600 font-bold">✕</button>
            </span>
          ))}
        </div>
        {b.gaeste.length < maxGaeste ? (
          <div className="flex gap-1.5">
            <input type="text" value={gaestInput} onChange={(e) => setGaestInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && gastHinzufuegen()} placeholder="Name des Gastes..."
              style={{ backgroundColor: GAST_FARBE.bgHex }} className="text-sm px-2 py-1.5 rounded border border-gray-400 flex-1 min-w-0" />
            <button onClick={gastHinzufuegen} disabled={saving || !gaestInput.trim()} style={{ backgroundColor: GAST_FARBE.bgHex }} className="text-sm px-3 py-1.5 rounded font-bold border border-gray-400 disabled:opacity-50">+ Gast</button>
          </div>
        ) : <p className="text-xs text-orange-600 italic">Maximum für dieses Fahrzeug erreicht.</p>}
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-600 mb-1.5">Notiz:</p>
        <textarea value={notiz} onChange={(e) => { setNotiz(e.target.value); setNotizGeaendert(true); }}
          placeholder="Notiz hinzufügen..." rows={2} className="w-full text-sm px-2 py-1.5 rounded border border-gray-400 bg-white resize-none" />
        {notizGeaendert && (
          <button onClick={notizSpeichern} disabled={saving} className="mt-1 text-sm px-3 py-1 rounded bg-indigo-600 text-white font-bold hover:bg-indigo-700 disabled:opacity-50">Notiz speichern</button>
        )}
      </div>
    </div>
  );
}

/** Detailkarte einer einzelnen Buchung (im Detail-Panel und Tagesansicht) */
function BuchungDetailKarte({ b, storniereId, bearbeitenId, onStornieren, onBearbeiten, onUpdated, ladeKalenderDaten }: {
  b: Buchung;
  storniereId: string | null;
  bearbeitenId: string | null;
  onStornieren: (id: string) => void;
  onBearbeiten: (id: string | null) => void;
  onUpdated: () => void;
  ladeKalenderDaten: () => void;
}) {
  const fz = fahrzeugById(b.fahrzeug);
  const istOffen = !b.pilot || !b.fahrzeug;
  const bearbeiten = bearbeitenId === b.id;
  return (
    <div className={`border-2 rounded-lg overflow-hidden mb-4 shadow-sm ${
      istOffen ? 'border-orange-400' : 'border-gray-300'
    } ${b.storniert ? 'opacity-60' : ''}`}>
      <div className={`px-3 py-2 flex items-center gap-2 ${
        istOffen ? 'bg-orange-100 border-b-2 border-orange-300' : 'bg-gray-100 border-b border-gray-300'
      }`}>
        <span className={`font-bold text-sm ${b.storniert ? 'line-through text-gray-400' : 'text-gray-800'}`}>
          {b.startzeit.slice(0,5)}–{b.endzeit.slice(0,5)} Uhr
        </span>
        {istOffen && <span className="text-xs font-bold text-orange-700 bg-orange-200 px-1.5 py-0.5 rounded">OFFEN</span>}
        {b.storniert && <span className="text-xs font-bold text-red-700 bg-red-100 px-1.5 py-0.5 rounded">STORNIERT</span>}
      </div>
      {b.pilot ? (
        <div style={{ backgroundColor: PILOT_FARBE.bgHex }} className={`flex items-center gap-2 px-3 py-2 ${PILOT_FARBE.textClass}`}>
          <span style={{ backgroundColor: PILOT_FARBE.dotHex }} className="w-3 h-3 rounded-full flex-shrink-0" />
          <span className="text-sm font-bold">P: {b.pilot}</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 px-3 py-2 bg-orange-50">
          <span className="w-3 h-3 rounded-full flex-shrink-0 bg-orange-300" />
          <span className="text-sm text-orange-600 italic">Pilot noch nicht zugewiesen</span>
        </div>
      )}
      {b.gaeste.map((g, i) => (
        <div key={i} style={{ backgroundColor: GAST_FARBE.bgHex }} className={`flex items-center gap-2 px-3 py-2 border-t border-white/60 ${GAST_FARBE.textClass}`}>
          <span style={{ backgroundColor: GAST_FARBE.dotHex }} className="w-3 h-3 rounded-full flex-shrink-0" />
          <span className="text-sm font-semibold">G: {g}</span>
        </div>
      ))}
      {b.fahrzeug ? (
        <div style={{ backgroundColor: fz?.bgHex ?? '#e5e7eb' }} className="flex items-center gap-2 px-3 py-2 border-t border-white/60 text-gray-900">
          <span style={{ backgroundColor: fz?.farbeHex ?? '#6b7280' }} className="w-3 h-3 rounded-full flex-shrink-0" />
          <span className="text-sm font-bold">{fz?.name} · {fz?.typ}</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 px-3 py-2 border-t border-dashed border-orange-300 bg-orange-50">
          <span className="w-3 h-3 rounded-full flex-shrink-0 bg-orange-300" />
          <span className="text-sm text-orange-600 italic">Fahrzeug noch nicht gewählt</span>
        </div>
      )}
      <div className="px-3 py-2 bg-yellow-50 border-t border-yellow-200 flex items-start gap-2">
        <span className="text-yellow-600 text-sm mt-0.5">📝</span>
        {b.notiz
          ? <p className="text-sm text-gray-700">{b.notiz}</p>
          : <p className="text-sm text-gray-400 italic">Keine Notiz</p>}
      </div>
      {!b.storniert && (
        <div className="flex gap-2 px-3 py-2 bg-gray-50 border-t border-gray-200">
          <button onClick={() => onBearbeiten(bearbeiten ? null : b.id)}
            className={`flex-1 text-sm font-bold py-2 rounded border-2 transition-colors ${
              bearbeiten ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-indigo-100 text-indigo-700 border-indigo-400 hover:bg-indigo-200'
            }`}>✏️ Ändern</button>
          <button onClick={() => onStornieren(b.id)} disabled={storniereId === b.id}
            className="flex-1 text-sm font-bold py-2 rounded border-2 bg-red-50 text-red-700 border-red-400 hover:bg-red-100 disabled:opacity-50">
            {storniereId === b.id ? '...' : '🗑️ Stornieren'}
          </button>
        </div>
      )}
      {bearbeiten && (
        <div className="px-3 pb-3 bg-gray-50 border-t border-indigo-200">
          <BearbeitenPanel b={b} onUpdated={() => { ladeKalenderDaten(); onBearbeiten(null); }} onClose={() => onBearbeiten(null)} />
        </div>
      )}
    </div>
  );
}

export default function KalenderSeite() {
  const [datum, setDatum]   = useState(new Date());
  const [ansicht, setAnsicht] = useState<Ansicht>('monat');
  const [buchungen, setBuchungen] = useState<Buchung[]>([]);
  const [sperren, setSperren]     = useState<Sperre[]>([]);
  const [teamup, setTeamup]       = useState<TeamUpEvent[]>([]);
  const [teamupVerfuegbar, setTeamupVerfuegbar] = useState(true);
  const [loading, setLoading]     = useState(true);
  const [ausgewaehlt, setAusgewaehlt] = useState<Date | null>(null);
  const [filterFahrzeug, setFilterFahrzeug] = useState('');
  const [filterPilot, setFilterPilot]       = useState('');
  const [filterNurMitGaesten, setFilterNurMitGaesten] = useState(false);
  const [zeigTeamUp, setZeigTeamUp] = useState(true);
  const [storniereId, setStorniereId] = useState<string | null>(null);
  const [bearbeitenId, setBearbeitenId] = useState<string | null>(null);

  const feiertage = feiertageDesJahres(datum.getFullYear());

  // Datumsbereich je nach Ansicht
  const gridStart = ansicht === 'monat'
    ? startOfWeek(startOfMonth(datum), { weekStartsOn: 1 })
    : ansicht === 'woche'
    ? startOfWeek(datum, { weekStartsOn: 1 })
    : datum;
  const gridEnd = ansicht === 'monat'
    ? endOfWeek(endOfMonth(datum), { weekStartsOn: 1 })
    : ansicht === 'woche'
    ? endOfWeek(datum, { weekStartsOn: 1 })
    : datum;
  const tage = ansicht === 'tag' ? [datum] : eachDayOfInterval({ start: gridStart, end: gridEnd });

  const ladeKalenderDaten = useCallback(async () => {
    setLoading(true);
    const von = format(gridStart, 'yyyy-MM-dd');
    const bis = format(gridEnd,   'yyyy-MM-dd');
    const [bRes, sRes, tRes] = await Promise.all([
      fetch(`/api/buchungen?von=${von}&bis=${bis}`),
      fetch(`/api/sperren?von=${von}&bis=${bis}`),
      fetch(`/api/teamup?von=${von}&bis=${bis}`),
    ]);
    const [b, s] = await Promise.all([bRes.json(), sRes.json()]);
    setBuchungen(b); setSperren(s);
    if (tRes.ok) { const t = await tRes.json(); if (Array.isArray(t)) { setTeamup(t); setTeamupVerfuegbar(true); } else setTeamupVerfuegbar(false); }
    else setTeamupVerfuegbar(false);
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datum, ansicht]);

  useEffect(() => { ladeKalenderDaten(); }, [ladeKalenderDaten]);

  const stornieren = async (id: string) => {
    setStorniereId(id);
    await fetch(`/api/buchungen/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ storniert: true }) });
    setStorniereId(null);
    ladeKalenderDaten();
  };

  const buchungFilter = (b: Buchung) =>
    (!filterFahrzeug || b.fahrzeug === filterFahrzeug) &&
    (!filterPilot    || b.pilot    === filterPilot) &&
    (!filterNurMitGaesten || b.gaeste.length > 0);

  const navVor  = () => ansicht === 'monat' ? setDatum(addMonths(datum, 1))  : ansicht === 'woche' ? setDatum(addWeeks(datum, 1))  : setDatum(addDays(datum, 1));
  const navZurueck = () => ansicht === 'monat' ? setDatum(subMonths(datum, 1)) : ansicht === 'woche' ? setDatum(subWeeks(datum, 1)) : setDatum(addDays(datum, -1));

  const navLabel = ansicht === 'monat'
    ? format(datum, 'MMMM yyyy', { locale: de })
    : ansicht === 'woche'
    ? `KW ${getISOWeek(startOfWeek(datum,{weekStartsOn:1}))} · ${format(startOfWeek(datum,{weekStartsOn:1}),'d.')} – ${format(endOfWeek(datum,{weekStartsOn:1}),'d. MMM yyyy',{locale:de})}`
    : format(datum, 'EEEE, d. MMMM yyyy', { locale: de });

  const schnellBuchen = (opts: { pilot?: string; fahrzeug?: string }) => {
    const d = ausgewaehlt ?? datum;
    const p = new URLSearchParams({ datum: format(d, 'yyyy-MM-dd') });
    if (opts.pilot)    p.set('pilot', opts.pilot);
    if (opts.fahrzeug) p.set('fahrzeug', opts.fahrzeug);
    window.location.href = `/buchen?${p.toString()}`;
  };

  const tagAusgewaehlt = ansicht === 'tag' ? datum : ausgewaehlt;
  const tagBuchungen = tagAusgewaehlt ? getBuchungenFuerTag(buchungen, tagAusgewaehlt).filter(buchungFilter) : [];
  const tagSperren   = tagAusgewaehlt ? getSperrenFuerTag(sperren, tagAusgewaehlt) : [];
  const tagTeamUp    = tagAusgewaehlt && zeigTeamUp ? getTeamUpFuerTag(teamup, tagAusgewaehlt) : [];

  return (
    <div>
      {/* Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={navZurueck} className="p-2 rounded hover:bg-white hover:shadow transition-all">&#9664;</button>
          <h2 className="text-lg font-bold text-rikscha-green min-w-[160px] text-center">{navLabel}</h2>
          <button onClick={navVor}     className="p-2 rounded hover:bg-white hover:shadow transition-all">&#9654;</button>
          <button onClick={() => setDatum(new Date())} className="text-xs border border-rikscha-green text-rikscha-green px-2 py-1 rounded hover:bg-rikscha-green hover:text-white transition-colors">Heute</button>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          {/* Ansicht-Umschalter */}
          <div className="flex rounded border border-gray-300 overflow-hidden text-xs font-semibold">
            {(['monat','woche','tag'] as Ansicht[]).map((a) => (
              <button key={a} onClick={() => { setAnsicht(a); setAusgewaehlt(null); }}
                className={`px-3 py-1 transition-colors ${
                  ansicht === a ? 'bg-rikscha-green text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}>
                {a === 'monat' ? 'Monat' : a === 'woche' ? 'Woche' : 'Tag'}
              </button>
            ))}
          </div>
          {teamupVerfuegbar && (
            <button onClick={() => setZeigTeamUp(!zeigTeamUp)}
              className={`text-xs px-2 py-1 rounded border transition-colors ${
                zeigTeamUp ? 'bg-purple-200 border-purple-600 text-purple-900' : 'border-gray-300 text-gray-500'
              }`}>TeamUp</button>
          )}
          {(filterFahrzeug || filterPilot || filterNurMitGaesten) && (
            <button onClick={() => { setFilterFahrzeug(''); setFilterPilot(''); setFilterNurMitGaesten(false); }}
              className="text-xs px-2 py-1 rounded border border-gray-400 bg-gray-100 text-gray-700">Filter ✕</button>
          )}
        </div>
      </div>

      {/* Legende */}
      <div className="flex flex-wrap gap-2 mb-3 text-xs">
        <span className="text-xs font-semibold text-gray-500 self-center">Fahrzeug:</span>
        {FAHRZEUGE.map((f) => (
          <button key={f.id} onClick={() => setFilterFahrzeug(p => p === f.id ? '' : f.id)}
            onDoubleClick={() => schnellBuchen({ fahrzeug: f.id })} title="Klick=Filter | Doppelklick=Termin"
            style={{ backgroundColor: f.bgHex }}
            className={`flex items-center gap-1 px-2 py-1 rounded border-2 font-semibold text-gray-900 ${
              filterFahrzeug === f.id ? 'scale-105 shadow ring-2 ring-gray-600 border-gray-700' : 'border-gray-400 opacity-90 hover:opacity-100'
            }`}>
            <span style={{ backgroundColor: f.farbeHex }} className="w-2 h-2 rounded-full" />{f.name}
          </button>
        ))}
        <span className="flex items-center gap-1 px-2 py-1 rounded border bg-amber-200 border-amber-500 text-amber-900"><span className="w-2 h-2 rounded-full bg-amber-500" />Feiertag</span>
        <span className="flex items-center gap-1 px-2 py-1 rounded border bg-blue-200 border-blue-500 text-blue-900"><span className="w-2 h-2 rounded-full bg-blue-500" />WE</span>
        <span className="flex items-center gap-1 px-2 py-1 rounded border border-dashed border-orange-400 bg-orange-50 text-orange-800"><span className="w-2 h-2 rounded-full bg-orange-400" />Offen</span>
      </div>
      <div className="flex flex-wrap gap-2 mb-2 text-xs">
        <span className="text-xs font-semibold text-gray-500 self-center">Pilot:</span>
        {PILOTEN.map((name) => (
          <button key={name} onClick={() => setFilterPilot(p => p === name ? '' : name)}
            onDoubleClick={() => schnellBuchen({ pilot: name })} title="Klick=Filter | Doppelklick=Termin"
            style={{ backgroundColor: PILOT_FARBE.bgHex }}
            className={`flex items-center gap-1 px-2 py-1 rounded border-2 font-semibold ${
              filterPilot === name ? 'scale-105 shadow ring-2 ring-gray-600 border-gray-700' : 'border-gray-400 opacity-90 hover:opacity-100'
            } ${PILOT_FARBE.textClass}`}>
            <span style={{ backgroundColor: PILOT_FARBE.dotHex }} className="w-2 h-2 rounded-full" />P: {name}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 mb-4 text-xs border-t-2 border-dashed border-gray-300 pt-2 mt-1">
        <span className="text-xs font-semibold text-gray-500 self-center">Gast:</span>
        <button onClick={() => setFilterNurMitGaesten(p => !p)} style={{ backgroundColor: GAST_FARBE.bgHex }}
          className={`flex items-center gap-1 px-2 py-1 rounded border-2 font-semibold ${
            filterNurMitGaesten ? 'scale-105 shadow ring-2 ring-gray-600 border-gray-700' : 'border-gray-400 opacity-90'
          } ${GAST_FARBE.textClass}`}>
          <span style={{ backgroundColor: GAST_FARBE.dotHex }} className="w-2 h-2 rounded-full" />G: Gast
        </button>
      </div>

      {/* ===== MONATSANSICHT ===== */}
      {ansicht === 'monat' && (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="grid grid-cols-7 bg-rikscha-green text-white text-xs font-semibold">
            {WOCHENTAGE.map((t) => <div key={t} className="py-2 text-center">{t}</div>)}
          </div>
          <div className="grid grid-cols-7 border-l border-t">
            {tage.map((tag) => {
              const tagB = getBuchungenFuerTag(buchungen, tag).filter(buchungFilter);
              const tagS = getSperrenFuerTag(sperren, tag);
              const tagT = zeigTeamUp ? getTeamUpFuerTag(teamup, tag) : [];
              const istAusgew = ausgewaehlt && isSameDay(tag, ausgewaehlt);
              const gruppen = gruppiereTermine(tagB);
              const anzeigeGruppen = tagB.length <= 2 ? gruppen : gruppen.slice(0, 1);
              const mehrTermine = tagB.length > 2 ? tagB.length - anzeigeGruppen.reduce((s, g) => s + g.length, 0) : 0;
              const bg = tagBg(tag, datum, 'monat', feiertage);
              const zellH = tagB.length >= 2 && gruppen.length >= 2 ? 'min-h-[180px]' : 'min-h-[110px]';
              const ftName = feiertage.get(format(tag, 'yyyy-MM-dd'));
              const imMonat = isSameMonth(tag, datum);
              const wt = getDay(tag); const istWE = wt === 0 || wt === 6;
              return (
                <div key={tag.toISOString()}
                  onClick={() => setAusgewaehlt(isSameDay(tag, ausgewaehlt!) ? null : tag)}
                  className={['border-r border-b p-1 cursor-pointer transition-all', zellH, bg,
                    istAusgew ? 'ring-2 ring-inset ring-rikscha-green brightness-95' : 'hover:brightness-95'].join(' ')}>
                  <div className="flex items-start justify-between mb-0.5">
                    <div className={['text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full flex-shrink-0',
                      isToday(tag) ? 'bg-rikscha-green text-white' : ftName ? 'bg-amber-400 text-amber-950' :
                      istWE ? 'bg-blue-400 text-white' : imMonat ? 'text-gray-800' : 'text-gray-400'].join(' ')}>
                      {format(tag,'d')}
                    </div>
                    <div className="flex flex-col items-end gap-0.5">
                      {format(tag,'d')==='1' && <span className="text-[10px] font-bold text-rikscha-green">{format(tag,'MMM',{locale:de})}</span>}
                      {ftName && <span className="text-[9px] text-amber-800 font-semibold truncate max-w-[64px] text-right leading-tight">{ftName}</span>}
                    </div>
                  </div>
                  {tagS.map((s) => <div key={s.id} className="text-[10px] bg-red-200 text-red-900 border border-red-500 rounded px-1 mb-0.5 truncate font-semibold">🔒 {fahrzeugById(s.fahrzeug)?.name ?? s.fahrzeug}</div>)}
                  {anzeigeGruppen.map((gruppe, gi) => (
                    gruppe.length > 1
                      ? <div key={gi} className="flex gap-0.5 mb-0.5">{gruppe.map((b) => <BuchungKarte key={b.id} b={b} schmal />)}</div>
                      : <BuchungKarte key={gruppe[0].id} b={gruppe[0]} />
                  ))}
                  {tagT.slice(0,1).map((e) => <div key={e.uid} className="text-[10px] rounded px-1 mb-0.5 truncate border bg-purple-200 border-purple-600 text-purple-950 font-semibold">{e.allDay ? '●' : e.start.slice(11,16)} {e.summary}</div>)}
                  {(mehrTermine > 0 || (tagT.length > 1)) && <div className="text-[10px] text-gray-500 font-semibold pl-1">+{mehrTermine + Math.max(0,tagT.length-1)} mehr</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===== WOCHENANSICHT ===== */}
      {ansicht === 'woche' && (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="grid grid-cols-7 bg-rikscha-green text-white text-xs font-semibold">
            {tage.map((tag) => (
              <div key={tag.toISOString()} className="py-2 text-center">
                <div>{WOCHENTAGE[getDay(tag) === 0 ? 6 : getDay(tag)-1]}</div>
                <div className={`text-sm font-bold mx-auto w-7 h-7 flex items-center justify-center rounded-full mt-0.5 ${
                  isToday(tag) ? 'bg-white text-rikscha-green' : ''
                }`}>{format(tag,'d')}</div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 border-l border-t">
            {tage.map((tag) => {
              const tagB = getBuchungenFuerTag(buchungen, tag).filter(buchungFilter);
              const tagS = getSperrenFuerTag(sperren, tag);
              const tagT = zeigTeamUp ? getTeamUpFuerTag(teamup, tag) : [];
              const istAusgew = ausgewaehlt && isSameDay(tag, ausgewaehlt);
              const bg = tagBg(tag, datum, 'woche', feiertage);
              const ftName = feiertage.get(format(tag,'yyyy-MM-dd'));
              const gruppen = gruppiereTermine(tagB);
              return (
                <div key={tag.toISOString()}
                  onClick={() => setAusgewaehlt(isSameDay(tag, ausgewaehlt!) ? null : tag)}
                  className={['border-r border-b min-h-[200px] p-1 cursor-pointer transition-all', bg,
                    istAusgew ? 'ring-2 ring-inset ring-rikscha-green brightness-95' : 'hover:brightness-95'].join(' ')}>
                  {ftName && <div className="text-[9px] text-amber-700 font-semibold mb-0.5 truncate">🎉 {ftName}</div>}
                  {tagS.map((s) => <div key={s.id} className="text-[10px] bg-red-200 text-red-900 border border-red-500 rounded px-1 mb-0.5 truncate font-semibold">🔒 {fahrzeugById(s.fahrzeug)?.name ?? s.fahrzeug}</div>)}
                  {gruppen.map((gruppe, gi) => (
                    gruppe.length > 1
                      ? <div key={gi} className="flex gap-0.5 mb-0.5">{gruppe.map((b) => <BuchungKarte key={b.id} b={b} schmal />)}</div>
                      : <BuchungKarte key={gruppe[0].id} b={gruppe[0]} />
                  ))}
                  {tagT.map((e) => <div key={e.uid} className="text-[10px] rounded px-1 mb-0.5 truncate border bg-purple-200 border-purple-600 text-purple-950 font-semibold">{e.allDay?'●':e.start.slice(11,16)} {e.summary}</div>)}
                  {tagB.length === 0 && tagS.length === 0 && tagT.length === 0 && (
                    <a href={`/buchen?datum=${format(tag,'yyyy-MM-dd')}`}
                      onClick={(e)=>e.stopPropagation()}
                      className="text-[10px] text-gray-400 hover:text-rikscha-green block text-center mt-2">+ Termin</a>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===== TAGESANSICHT ===== */}
      {ansicht === 'tag' && (
        <div className="bg-white rounded-xl shadow p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              {feiertage.get(format(datum,'yyyy-MM-dd')) && (
                <p className="text-xs text-amber-800 font-semibold">🎉 {feiertage.get(format(datum,'yyyy-MM-dd'))}</p>
              )}
            </div>
            <a href={`/buchen?datum=${format(datum,'yyyy-MM-dd')}`} className="text-sm bg-rikscha-green text-white px-3 py-1 rounded hover:bg-rikscha-light transition-colors">+ Termin</a>
          </div>
          {getSperrenFuerTag(sperren, datum).map((s) => (
            <div key={s.id} className="text-sm bg-red-100 border border-red-400 rounded p-2 mb-2">
              🔒 {fahrzeugById(s.fahrzeug)?.name} — {s.grund ?? 'Gesperrt'}
            </div>
          ))}
          {zeigTeamUp && getTeamUpFuerTag(teamup, datum).map((e) => (
            <div key={e.uid} className="text-sm bg-purple-100 border border-purple-400 rounded p-2 mb-2">
              <p className="font-semibold text-purple-900">{e.allDay?'Ganztags':`${e.start.slice(11,16)}–${e.end.slice(11,16)}`} · {e.summary}</p>
            </div>
          ))}
          {getBuchungenFuerTag(buchungen, datum).filter(buchungFilter).length === 0 && (
            <p className="text-gray-400 text-sm">Keine Buchungen an diesem Tag.</p>
          )}
          {getBuchungenFuerTag(buchungen, datum).filter(buchungFilter).map((b) => (
            <BuchungDetailKarte key={b.id} b={b} storniereId={storniereId} bearbeitenId={bearbeitenId}
              onStornieren={stornieren} onBearbeiten={setBearbeitenId}
              onUpdated={ladeKalenderDaten} ladeKalenderDaten={ladeKalenderDaten} />
          ))}
        </div>
      )}

      {/* Detail-Panel (Monat/Woche) */}
      {ansicht !== 'tag' && ausgewaehlt && (
        <div className="mt-4 bg-white rounded-xl shadow p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold text-rikscha-green">{format(ausgewaehlt,'EEEE, d. MMMM yyyy',{locale:de})}</h3>
              {feiertage.get(format(ausgewaehlt,'yyyy-MM-dd')) && (
                <p className="text-xs text-amber-800 font-semibold mt-0.5">🎉 {feiertage.get(format(ausgewaehlt,'yyyy-MM-dd'))}</p>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setDatum(ausgewaehlt); setAnsicht('tag'); setAusgewaehlt(null); }}
                className="text-xs border border-rikscha-green text-rikscha-green px-2 py-1 rounded hover:bg-rikscha-green hover:text-white transition-colors">Tagesansicht</button>
              <a href={`/buchen?datum=${format(ausgewaehlt,'yyyy-MM-dd')}`} className="text-sm bg-rikscha-green text-white px-3 py-1 rounded hover:bg-rikscha-light transition-colors">+ Termin</a>
            </div>
          </div>
          {tagSperren.map((s) => (
            <div key={s.id} className="text-sm bg-red-100 border border-red-400 rounded p-2 mb-2 flex justify-between">
              <span>🔒 {fahrzeugById(s.fahrzeug)?.name} — {s.grund ?? 'Gesperrt'}</span>
            </div>
          ))}
          {tagTeamUp.map((e) => (
            <div key={e.uid} className="text-sm bg-purple-100 border border-purple-400 rounded p-2 mb-2">
              <p className="font-semibold text-purple-900">{e.allDay?'Ganztags':`${e.start.slice(11,16)}–${e.end.slice(11,16)}`} · {e.summary}</p>
            </div>
          ))}
          {tagBuchungen.length === 0 && tagSperren.length === 0 && tagTeamUp.length === 0 && (
            <p className="text-gray-400 text-sm">Keine Buchungen an diesem Tag.</p>
          )}
          {tagBuchungen.map((b) => (
            <BuchungDetailKarte key={b.id} b={b} storniereId={storniereId} bearbeitenId={bearbeitenId}
              onStornieren={stornieren} onBearbeiten={setBearbeitenId}
              onUpdated={ladeKalenderDaten} ladeKalenderDaten={ladeKalenderDaten} />
          ))}
        </div>
      )}

      <div className="mt-6 p-4 bg-white rounded-xl shadow">
        <h3 className="font-semibold text-rikscha-green mb-2">📅 Kalender abonnieren (iCal)</h3>
        <div className="flex flex-wrap gap-2 text-xs">
          <a href="/api/ical" className="underline text-rikscha-green">Alle Fahrten</a>
          {FAHRZEUGE.map((f) => <a key={f.id} href={`/api/ical?fahrzeug=${f.id}`} className="underline text-rikscha-green">{f.name}</a>)}
        </div>
      </div>

      {loading && (
        <div className="fixed inset-0 bg-black/10 flex items-center justify-center pointer-events-none">
          <div className="bg-white rounded-xl shadow p-6 text-rikscha-green font-semibold">Lade...</div>
        </div>
      )}
    </div>
  );
}
