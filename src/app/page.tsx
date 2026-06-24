'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  addMonths, subMonths, isToday, isSameDay, parseISO,
  startOfWeek, endOfWeek, isSameMonth, getISOWeek, getDay, addDays,
} from 'date-fns';
import { de } from 'date-fns/locale';
import type { Buchung, Sperre } from '@/lib/supabase';
import type { TeamUpEvent } from '@/app/api/teamup/route';
import { FAHRZEUGE, PILOTEN, PILOT_FARBE, GAST_FARBE, fahrzeugById } from '@/lib/constants';

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

function BuchungKarte({ b }: { b: Buchung }) {
  const fz = fahrzeugById(b.fahrzeug);
  const istOffen = !b.pilot || !b.fahrzeug;
  return (
    <div className={`rounded overflow-hidden border-2 shadow mb-0.5 ${
      istOffen ? 'border-orange-400 border-dashed' : 'border-gray-400'
    } ${b.storniert ? 'opacity-50' : ''}`}>
      {b.pilot ? (
        <div style={{ backgroundColor: PILOT_FARBE.bgHex }} className={`flex items-center gap-1 px-1.5 py-1 ${PILOT_FARBE.textClass}`}>
          <span style={{ backgroundColor: PILOT_FARBE.dotHex }} className="flex-shrink-0 w-2 h-2 rounded-full" />
          <span className={`text-[11px] font-bold truncate ${b.storniert ? 'line-through' : ''}`}>
            {b.startzeit.slice(0, 5)} P: {b.pilot}
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-1 px-1.5 py-1 bg-orange-100 text-orange-800">
          <span className="flex-shrink-0 w-2 h-2 rounded-full bg-orange-400" />
          <span className="text-[11px] font-bold">{b.startzeit.slice(0, 5)} Pilot offen</span>
        </div>
      )}
      {b.gaeste.map((g, i) => (
        <div key={i} style={{ backgroundColor: GAST_FARBE.bgHex }} className={`flex items-center gap-1 px-1.5 py-0.5 border-t border-white/60 ${GAST_FARBE.textClass}`}>
          <span style={{ backgroundColor: GAST_FARBE.dotHex }} className="flex-shrink-0 w-2 h-2 rounded-full" />
          <span className="text-[11px] font-semibold truncate">G: {g}</span>
        </div>
      ))}
      {b.fahrzeug ? (
        <div style={{ backgroundColor: fz?.bgHex ?? '#e5e7eb' }} className="flex items-center gap-1 px-1.5 py-1 border-t border-white/60 text-gray-900">
          <span style={{ backgroundColor: fz?.farbeHex ?? '#6b7280' }} className="flex-shrink-0 w-2 h-2 rounded-full" />
          <span className="text-[10px] font-semibold truncate">{fz?.name ?? b.fahrzeug}</span>
        </div>
      ) : (
        <div className="flex items-center gap-1 px-1.5 py-1 border-t border-dashed border-orange-300 bg-orange-50 text-orange-700">
          <span className="flex-shrink-0 w-2 h-2 rounded-full bg-orange-300" />
          <span className="text-[10px] font-semibold">Fahrzeug offen</span>
        </div>
      )}
    </div>
  );
}

/** Inline-Bearbeiten-Panel */
function BearbeitenPanel({ b, onUpdated, onClose }: { b: Buchung; onUpdated: () => void; onClose: () => void }) {
  const [saving, setSaving] = useState(false);
  const [gaestInput, setGaestInput] = useState('');

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

  const fahrzeugWaehlen = (fzId: string) => {
    const fz = FAHRZEUGE.find((f) => f.id === fzId);
    const maxG = fz?.maxGaeste ?? 2;
    const gaesteBeschr = b.gaeste.slice(0, maxG);
    // patch vehicle + trimmed guests in one call
    patch({ fahrzeug: fzId, gaeste: gaesteBeschr });
  };

  const gastHinzufuegen = () => {
    if (!gaestInput.trim()) return;
    const fz = fahrzeugById(b.fahrzeug);
    const maxG = fz?.maxGaeste ?? 2;
    const neu = [...b.gaeste, gaestInput.trim()].slice(0, maxG);
    patch({ gaeste: neu });
    setGaestInput('');
  };
  const gastEntfernen = (i: number) => {
    const neu = b.gaeste.filter((_, idx) => idx !== i);
    patch({ gaeste: neu });
  };

  const fz = fahrzeugById(b.fahrzeug);
  const maxGaeste = fz?.maxGaeste ?? 2;

  return (
    <div className="bg-indigo-50 border-2 border-indigo-300 rounded-lg p-3 mb-2">
      <div className="flex justify-between items-center mb-2">
        <p className="text-xs font-bold text-indigo-700">✏️ Termin bearbeiten</p>
        <button onClick={onClose} className="text-xs text-gray-500 hover:text-gray-700">✕ Schließen</button>
      </div>

      {/* Pilot ändern */}
      <div className="mb-2">
        <p className="text-xs font-semibold text-gray-600 mb-1">Pilot:</p>
        <div className="flex flex-wrap gap-1">
          {PILOTEN.map((name) => (
            <button key={name} disabled={saving}
              onClick={() => patch({ pilot: name })}
              style={{ backgroundColor: b.pilot === name ? PILOT_FARBE.dotHex : PILOT_FARBE.bgHex,
                       color: b.pilot === name ? '#fff' : '#1e1b4b' }}
              className="text-xs px-2 py-1 rounded font-bold border border-indigo-400 hover:scale-105 transition-transform disabled:opacity-50">
              {name}
            </button>
          ))}
          {b.pilot && (
            <button onClick={() => patch({ pilot: '' })} disabled={saving}
              className="text-xs px-2 py-1 rounded border border-dashed border-orange-400 text-orange-700 bg-orange-50 hover:bg-orange-100 disabled:opacity-50">
              Pilot entfernen
            </button>
          )}
        </div>
      </div>

      {/* Fahrzeug ändern */}
      <div className="mb-2">
        <p className="text-xs font-semibold text-gray-600 mb-1">Fahrzeug:</p>
        <div className="flex flex-wrap gap-1">
          {FAHRZEUGE.map((f) => (
            <button key={f.id} disabled={saving}
              onClick={() => fahrzeugWaehlen(f.id)}
              style={{ backgroundColor: f.bgHex, outline: b.fahrzeug === f.id ? `3px solid ${f.farbeHex}` : 'none' }}
              className="text-xs px-2 py-1 rounded font-bold border border-gray-400 hover:scale-105 transition-transform disabled:opacity-50 text-gray-900">
              {f.name} (max. {f.maxGaeste} Gast{f.maxGaeste > 1 ? 'e' : ''})
            </button>
          ))}
          {b.fahrzeug && (
            <button onClick={() => patch({ fahrzeug: '' })} disabled={saving}
              className="text-xs px-2 py-1 rounded border border-dashed border-orange-400 text-orange-700 bg-orange-50 hover:bg-orange-100 disabled:opacity-50">
              Fahrzeug entfernen
            </button>
          )}
        </div>
      </div>

      {/* Gäste bearbeiten */}
      <div>
        <p className="text-xs font-semibold text-gray-600 mb-1">Gäste (max. {maxGaeste}):</p>
        <div className="flex flex-wrap gap-1 mb-1">
          {b.gaeste.map((g, i) => (
            <span key={i} style={{ backgroundColor: GAST_FARBE.bgHex }}
              className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded ${GAST_FARBE.textClass}`}>
              G: {g}
              <button onClick={() => gastEntfernen(i)} disabled={saving} className="ml-1 hover:text-red-600">✕</button>
            </span>
          ))}
        </div>
        {b.gaeste.length < maxGaeste && (
          <div className="flex gap-1">
            <input type="text" value={gaestInput} onChange={(e) => setGaestInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && gastHinzufuegen()}
              placeholder="Name des Gastes..."
              style={{ backgroundColor: GAST_FARBE.bgHex }}
              className="text-xs px-2 py-1 rounded border border-gray-400 flex-1 min-w-0" />
            <button onClick={gastHinzufuegen} disabled={saving || !gaestInput.trim()}
              style={{ backgroundColor: GAST_FARBE.bgHex }}
              className="text-xs px-2 py-1 rounded font-bold border border-gray-400 disabled:opacity-50">
              + G
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function KalenderSeite() {
  const [monat, setMonat]   = useState(new Date());
  const [buchungen, setBuchungen] = useState<Buchung[]>([]);
  const [sperren, setSperren]     = useState<Sperre[]>([]);
  const [teamup, setTeamup]       = useState<TeamUpEvent[]>([]);
  const [teamupVerfuegbar, setTeamupVerfuegbar] = useState(true);
  const [loading, setLoading]     = useState(true);
  const [ausgewaehlt, setAusgewaehlt]     = useState<Date | null>(null);
  const [filterFahrzeug, setFilterFahrzeug] = useState('');
  const [filterPilot, setFilterPilot]       = useState('');
  const [filterNurMitGaesten, setFilterNurMitGaesten] = useState(false);
  const [zeigTeamUp, setZeigTeamUp] = useState(true);
  const [storniereId, setStorniereId] = useState<string | null>(null);
  const [bearbeitenId, setBearbeitenId] = useState<string | null>(null);

  const gridStart = startOfWeek(startOfMonth(monat), { weekStartsOn: 1 });
  const gridEnd   = endOfWeek(endOfMonth(monat),     { weekStartsOn: 1 });
  const tage      = eachDayOfInterval({ start: gridStart, end: gridEnd });
  const feiertage = feiertageDesJahres(monat.getFullYear());

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
  }, [monat]);

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

  const tagBuchungen = ausgewaehlt ? getBuchungenFuerTag(buchungen, ausgewaehlt).filter(buchungFilter) : [];
  const tagSperren   = ausgewaehlt ? getSperrenFuerTag(sperren, ausgewaehlt) : [];
  const tagTeamUp    = ausgewaehlt && zeigTeamUp ? getTeamUpFuerTag(teamup, ausgewaehlt) : [];

  const schnellBuchen = (opts: { pilot?: string; fahrzeug?: string }) => {
    const datum = ausgewaehlt ? format(ausgewaehlt, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
    const p = new URLSearchParams({ datum });
    if (opts.pilot)    p.set('pilot', opts.pilot);
    if (opts.fahrzeug) p.set('fahrzeug', opts.fahrzeug);
    window.location.href = `/buchen?${p.toString()}`;
  };

  return (
    <div>
      {/* Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <button onClick={() => setMonat(subMonths(monat, 1))} className="p-2 rounded hover:bg-white hover:shadow transition-all">&#9664;</button>
          <h2 className="text-xl font-bold text-rikscha-green min-w-[180px] text-center">{format(monat, 'MMMM yyyy', { locale: de })}</h2>
          <button onClick={() => setMonat(addMonths(monat, 1))} className="p-2 rounded hover:bg-white hover:shadow transition-all">&#9654;</button>
          <button onClick={() => setMonat(new Date())} className="text-xs border border-rikscha-green text-rikscha-green px-2 py-1 rounded hover:bg-rikscha-green hover:text-white transition-colors">Heute</button>
        </div>
        <div className="flex gap-2 flex-wrap">
          {teamupVerfuegbar && (
            <button onClick={() => setZeigTeamUp(!zeigTeamUp)}
              className={`text-xs px-2 py-1 rounded border transition-colors ${
                zeigTeamUp ? 'bg-purple-200 border-purple-600 text-purple-900' : 'border-gray-300 text-gray-500'
              }`}>TeamUp {zeigTeamUp ? 'an' : 'aus'}</button>
          )}
          {(filterFahrzeug || filterPilot || filterNurMitGaesten) && (
            <button onClick={() => { setFilterFahrzeug(''); setFilterPilot(''); setFilterNurMitGaesten(false); }}
              className="text-xs px-2 py-1 rounded border border-gray-400 bg-gray-100 text-gray-700 hover:bg-gray-200">Filter ✕</button>
          )}
        </div>
      </div>

      {/* Legende Fahrzeuge */}
      <div className="flex flex-wrap gap-2 mb-3 text-xs">
        <span className="text-xs font-semibold text-gray-500 self-center mr-1">Fahrzeug:</span>
        {FAHRZEUGE.map((f) => (
          <button key={f.id} onClick={() => setFilterFahrzeug(p => p === f.id ? '' : f.id)}
            onDoubleClick={() => schnellBuchen({ fahrzeug: f.id })}
            title="Klick = Filter | Doppelklick = Termin"
            style={{ backgroundColor: f.bgHex }}
            className={`flex items-center gap-1 px-2 py-1 rounded border-2 transition-all font-semibold text-gray-900 ${
              filterFahrzeug === f.id ? 'scale-105 shadow-md ring-2 ring-offset-1 ring-gray-600 border-gray-700' : 'border-gray-400 opacity-90 hover:opacity-100 hover:scale-105'
            }`}>
            <span style={{ backgroundColor: f.farbeHex }} className="w-2 h-2 rounded-full" />
            {f.name} &middot; {f.typ}
          </button>
        ))}
        <span className="flex items-center gap-1 px-2 py-1 rounded border bg-red-200 border-red-600 text-red-900"><span className="w-2 h-2 rounded-full bg-red-600" />Gesperrt</span>
        {teamupVerfuegbar && <span className="flex items-center gap-1 px-2 py-1 rounded border bg-purple-200 border-purple-600 text-purple-900"><span className="w-2 h-2 rounded-full bg-purple-600" />TeamUp</span>}
        <span className="flex items-center gap-1 px-2 py-1 rounded border bg-amber-200 border-amber-500 text-amber-900"><span className="w-2 h-2 rounded-full bg-amber-500" />Feiertag</span>
        <span className="flex items-center gap-1 px-2 py-1 rounded border bg-blue-200 border-blue-500 text-blue-900"><span className="w-2 h-2 rounded-full bg-blue-500" />Wochenende</span>
        <span className="flex items-center gap-1 px-2 py-1 rounded border border-dashed border-orange-400 bg-orange-50 text-orange-800"><span className="w-2 h-2 rounded-full bg-orange-400" />Offen</span>
      </div>

      {/* Legende Piloten */}
      <div className="flex flex-wrap gap-2 mb-2 text-xs">
        <span className="text-xs font-semibold text-gray-500 self-center mr-1">Pilot:</span>
        {PILOTEN.map((name) => (
          <button key={name}
            onClick={() => setFilterPilot(p => p === name ? '' : name)}
            onDoubleClick={() => schnellBuchen({ pilot: name })}
            title="Klick = Filter | Doppelklick = Termin"
            style={{ backgroundColor: PILOT_FARBE.bgHex }}
            className={`flex items-center gap-1 px-2 py-1 rounded border-2 transition-all font-semibold ${
              filterPilot === name ? 'scale-105 shadow-md ring-2 ring-offset-1 ring-gray-600 border-gray-700' : 'border-gray-400 opacity-90 hover:opacity-100 hover:scale-105'
            } ${PILOT_FARBE.textClass}`}>
            <span style={{ backgroundColor: PILOT_FARBE.dotHex }} className="w-2 h-2 rounded-full" />
            P: {name}
          </button>
        ))}
      </div>

      {/* Legende Gaeste */}
      <div className="flex flex-wrap gap-2 mb-4 text-xs border-t-2 border-dashed border-gray-300 pt-3 mt-1">
        <span className="text-xs font-semibold text-gray-500 self-center mr-1">Gast:</span>
        <button onClick={() => setFilterNurMitGaesten(p => !p)}
          style={{ backgroundColor: GAST_FARBE.bgHex }}
          className={`flex items-center gap-1 px-2 py-1 rounded border-2 transition-all font-semibold ${
            filterNurMitGaesten ? 'scale-105 shadow-md ring-2 ring-offset-1 ring-gray-600 border-gray-700' : 'border-gray-400 opacity-90 hover:opacity-100 hover:scale-105'
          } ${GAST_FARBE.textClass}`}>
          <span style={{ backgroundColor: GAST_FARBE.dotHex }} className="w-2 h-2 rounded-full" />
          G: Gast
        </button>
      </div>

      {/* Kalender */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="grid grid-cols-7 bg-rikscha-green text-white text-xs font-semibold">
          {WOCHENTAGE.map((t) => <div key={t} className="py-2 text-center">{t}</div>)}
        </div>
        <div className="grid grid-cols-7 border-l border-t">
          {tage.map((tag) => {
            const imAktuellenMonat = isSameMonth(tag, monat);
            const wt = getDay(tag), istWE = wt === 0 || wt === 6;
            const ftName = feiertage.get(format(tag, 'yyyy-MM-dd')), istFT = !!ftName;
            const kw = getISOWeek(tag), geradeKW = kw % 2 === 0;
            const tagB = getBuchungenFuerTag(buchungen, tag).filter(buchungFilter);
            const tagS = getSperrenFuerTag(sperren, tag);
            const tagT = zeigTeamUp ? getTeamUpFuerTag(teamup, tag) : [];
            const istHeute = isToday(tag), istAusgew = ausgewaehlt && isSameDay(tag, ausgewaehlt);
            const mehr = Math.max(0, tagB.length - 1) + Math.max(0, tagT.length - 1);
            let bg: string;
            if (!imAktuellenMonat) bg = istWE ? 'bg-blue-100' : geradeKW ? 'bg-gray-100' : 'bg-gray-200';
            else if (istFT)  bg = 'bg-amber-100';
            else if (istWE)  bg = 'bg-blue-100';
            else             bg = geradeKW ? 'bg-white' : 'bg-slate-100';
            if (istHeute) bg = 'bg-green-100';
            return (
              <div key={tag.toISOString()}
                onClick={() => setAusgewaehlt(isSameDay(tag, ausgewaehlt!) ? null : tag)}
                className={['border-r border-b min-h-[110px] p-1 cursor-pointer transition-all', bg,
                  istAusgew ? 'ring-2 ring-inset ring-rikscha-green brightness-95' : 'hover:brightness-95'].join(' ')}>
                <div className="flex items-start justify-between mb-0.5">
                  <div className={['text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full flex-shrink-0',
                    istHeute ? 'bg-rikscha-green text-white' : istFT ? 'bg-amber-400 text-amber-950' :
                    istWE ? 'bg-blue-400 text-white' : imAktuellenMonat ? 'text-gray-800' : 'text-gray-400'].join(' ')}>
                    {format(tag, 'd')}
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    {format(tag, 'd') === '1' && <span className="text-[10px] font-bold text-rikscha-green">{format(tag, 'MMM', { locale: de })}</span>}
                    {istFT && <span className="text-[9px] text-amber-800 font-semibold truncate max-w-[64px] text-right leading-tight">{ftName}</span>}
                  </div>
                </div>
                {tagS.map((s) => <div key={s.id} className="text-[10px] bg-red-200 text-red-900 border border-red-500 rounded px-1 mb-0.5 truncate font-semibold">🔒 {fahrzeugById(s.fahrzeug)?.name ?? s.fahrzeug}</div>)}
                {tagB.slice(0, 1).map((b) => <BuchungKarte key={b.id} b={b} />)}
                {tagT.slice(0, 1).map((e) => <div key={e.uid} className="text-[10px] rounded px-1 mb-0.5 truncate border bg-purple-200 border-purple-600 text-purple-950 font-semibold">{e.allDay ? '●' : e.start.slice(11, 16)} {e.summary}</div>)}
                {mehr > 0 && <div className="text-[10px] text-gray-500 font-semibold pl-1">+{mehr} mehr</div>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail-Panel */}
      {ausgewaehlt && (
        <div className="mt-4 bg-white rounded-xl shadow p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold text-rikscha-green">{format(ausgewaehlt, 'EEEE, d. MMMM yyyy', { locale: de })}</h3>
              {feiertage.get(format(ausgewaehlt, 'yyyy-MM-dd')) && (
                <p className="text-xs text-amber-800 font-semibold mt-0.5">🎉 {feiertage.get(format(ausgewaehlt, 'yyyy-MM-dd'))}</p>
              )}
            </div>
            <a href={`/buchen?datum=${format(ausgewaehlt, 'yyyy-MM-dd')}`}
              className="text-sm bg-rikscha-green text-white px-3 py-1 rounded hover:bg-rikscha-light transition-colors">+ Termin</a>
          </div>

          {tagSperren.map((s) => (
            <div key={s.id} className="text-sm bg-red-100 border border-red-400 rounded p-2 mb-2 flex justify-between">
              <span>🔒 {fahrzeugById(s.fahrzeug)?.name} — {s.grund ?? 'Gesperrt'}</span>
              <span className="text-xs text-gray-500">{s.von_datum} bis {s.bis_datum}</span>
            </div>
          ))}
          {tagTeamUp.map((e) => (
            <div key={e.uid} className="text-sm bg-purple-100 border border-purple-400 rounded p-2 mb-2">
              <p className="font-semibold text-purple-900">{e.allDay ? 'Ganztags' : `${e.start.slice(11,16)}–${e.end.slice(11,16)}`} · {e.summary}</p>
              {e.description && <p className="text-xs text-gray-600 mt-0.5">{e.description}</p>}
            </div>
          ))}
          {tagBuchungen.length === 0 && tagSperren.length === 0 && tagTeamUp.length === 0 && (
            <p className="text-gray-400 text-sm">Keine Buchungen an diesem Tag.</p>
          )}

          {tagBuchungen.map((b) => {
            const fz = fahrzeugById(b.fahrzeug);
            const istOffen = !b.pilot || !b.fahrzeug;
            const bearbeiten = bearbeitenId === b.id;
            return (
              <div key={b.id} className={`border-2 rounded-lg overflow-hidden mb-3 shadow-sm ${
                istOffen ? 'border-orange-400' : 'border-gray-400'
              } ${b.storniert ? 'opacity-60' : ''}`}>
                {/* Uhrzeit-Kopf */}
                <div className={`px-3 py-1.5 border-b-2 flex items-center justify-between ${
                  istOffen ? 'bg-orange-100 border-orange-300' : 'bg-gray-200 border-gray-400'
                }`}>
                  <span className={`font-bold text-sm ${b.storniert ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                    {b.startzeit.slice(0,5)}–{b.endzeit.slice(0,5)} Uhr
                  </span>
                  <div className="flex items-center gap-2">
                    {istOffen && <span className="text-xs font-bold text-orange-700 bg-orange-200 px-1.5 py-0.5 rounded">OFFEN</span>}
                    {b.storniert && <span className="text-xs font-bold text-red-700">STORNIERT</span>}
                    {!b.storniert && (
                      <button onClick={() => setBearbeitenId(bearbeiten ? null : b.id)}
                        className={`text-xs px-2 py-0.5 rounded border font-semibold transition-colors ${
                          bearbeiten ? 'bg-indigo-600 text-white border-indigo-600' : 'border-indigo-400 text-indigo-700 hover:bg-indigo-50'
                        }`}>
                        ✏️ Ändern
                      </button>
                    )}
                  </div>
                </div>

                {/* Bearbeiten-Panel */}
                {bearbeiten && (
                  <div className="px-3 pt-3">
                    <BearbeitenPanel b={b} onUpdated={() => { ladeKalenderDaten(); setBearbeitenId(null); }} onClose={() => setBearbeitenId(null)} />
                  </div>
                )}

                {/* Pilot */}
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
                  <div key={i} style={{ backgroundColor: GAST_FARBE.bgHex }} className={`flex items-center gap-2 px-3 py-2 border-t-2 border-white/60 ${GAST_FARBE.textClass}`}>
                    <span style={{ backgroundColor: GAST_FARBE.dotHex }} className="w-3 h-3 rounded-full flex-shrink-0" />
                    <span className="text-sm font-semibold">G: {g}</span>
                  </div>
                ))}
                {b.fahrzeug ? (
                  <div style={{ backgroundColor: fz?.bgHex ?? '#e5e7eb' }} className="flex items-center gap-2 px-3 py-2 border-t-2 border-white/60 text-gray-900">
                    <span style={{ backgroundColor: fz?.farbeHex ?? '#6b7280' }} className="w-3 h-3 rounded-full flex-shrink-0" />
                    <span className="text-sm font-bold">{fz?.name} · {fz?.typ}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-2 border-t-2 border-dashed border-orange-300 bg-orange-50">
                    <span className="w-3 h-3 rounded-full flex-shrink-0 bg-orange-300" />
                    <span className="text-sm text-orange-600 italic">Fahrzeug noch nicht gewählt</span>
                  </div>
                )}
                {(b.notiz || !b.storniert) && (
                  <div className="px-3 py-2 bg-white border-t border-gray-200 flex items-center justify-between gap-2">
                    {b.notiz ? <p className="text-xs text-gray-600 italic flex-1">{b.notiz}</p> : <span />}
                    {!b.storniert && (
                      <button onClick={() => stornieren(b.id)} disabled={storniereId === b.id}
                        className="text-xs text-red-700 border-2 border-red-400 rounded px-2 py-0.5 hover:bg-red-100 disabled:opacity-50 flex-shrink-0 font-semibold">
                        {storniereId === b.id ? '...' : 'Stornieren'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
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
