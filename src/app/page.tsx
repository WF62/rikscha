'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, addMonths, subMonths, isSameMonth, isToday,
  isSameDay, parseISO,
} from 'date-fns';
import { de } from 'date-fns/locale';
import type { Buchung, Sperre } from '@/lib/supabase';
import type { TeamUpEvent } from '@/app/api/teamup/route';
import { FAHRZEUGE, PILOTEN_FARBEN, GAST_FARBE, fahrzeugById, pilotFarbe } from '@/lib/constants';

const WOCHENTAGE = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

function getBuchungenFuerTag(buchungen: Buchung[], tag: Date) {
  return buchungen.filter((b) => isSameDay(parseISO(b.datum), tag));
}
function getSperrenFuerTag(sperren: Sperre[], tag: Date) {
  return sperren.filter((s) => tag >= parseISO(s.von_datum) && tag <= parseISO(s.bis_datum));
}
function getTeamUpFuerTag(events: TeamUpEvent[], tag: Date) {
  return events.filter((e) => isSameDay(parseISO(e.start.slice(0, 10)), tag));
}

/** Mini-Karte im Kalendertag: Pilot → Gäste → Fahrzeug */
function BuchungKarte({ b }: { b: Buchung }) {
  const fz = fahrzeugById(b.fahrzeug);
  const pf = pilotFarbe(b.pilot);
  return (
    <div className={`rounded overflow-hidden border mb-0.5 border-gray-300 ${b.storniert ? 'opacity-50' : ''}`}>
      {/* Zeile 1: Uhrzeit + Pilot */}
      <div className={`flex items-center gap-0.5 px-1 py-0.5 ${pf.bg} ${pf.text}`}>
        <span className={`flex-shrink-0 w-1.5 h-1.5 rounded-full ${pf.dot}`} />
        <span className={`text-[11px] font-semibold truncate ${b.storniert ? 'line-through' : ''}`}>
          {b.startzeit.slice(0, 5)} P: {b.pilot}
        </span>
      </div>
      {/* Zeile 2+: Gäste */}
      {b.gaeste.map((g, i) => (
        <div key={i} className={`flex items-center gap-0.5 px-1 py-0.5 ${GAST_FARBE.bg} ${GAST_FARBE.text}`}>
          <span className={`flex-shrink-0 w-1.5 h-1.5 rounded-full ${GAST_FARBE.dot}`} />
          <span className="text-[11px] truncate">G: {g}</span>
        </div>
      ))}
      {/* Letzte Zeile: Fahrzeug */}
      <div className={`flex items-center gap-0.5 px-1 py-0.5 ${fz?.farbe ?? 'bg-gray-100 text-gray-700'}`}>
        <span className={`flex-shrink-0 w-1.5 h-1.5 rounded-full ${fz?.farbeDot ?? 'bg-gray-400'}`} />
        <span className="text-[10px] truncate">{fz?.name ?? b.fahrzeug}</span>
      </div>
    </div>
  );
}

export default function KalenderSeite() {
  const [monat, setMonat] = useState(new Date());
  const [buchungen, setBuchungen] = useState<Buchung[]>([]);
  const [sperren, setSperren] = useState<Sperre[]>([]);
  const [teamup, setTeamup] = useState<TeamUpEvent[]>([]);
  const [teamupVerfuegbar, setTeamupVerfuegbar] = useState(true);
  const [loading, setLoading] = useState(true);
  const [ausgewaehlt, setAusgewaehlt] = useState<Date | null>(null);
  const [filterFahrzeug, setFilterFahrzeug] = useState('');
  const [filterPilot, setFilterPilot] = useState('');
  const [zeigTeamUp, setZeigTeamUp] = useState(true);
  const [storniereId, setStorniereId] = useState<string | null>(null);

  const ladeKalenderDaten = useCallback(async () => {
    setLoading(true);
    const von = format(startOfMonth(monat), 'yyyy-MM-dd');
    const bis = format(endOfMonth(monat), 'yyyy-MM-dd');
    const [bRes, sRes, tRes] = await Promise.all([
      fetch(`/api/buchungen?von=${von}&bis=${bis}`),
      fetch(`/api/sperren?von=${von}&bis=${bis}`),
      fetch(`/api/teamup?von=${von}&bis=${bis}`),
    ]);
    const [b, s] = await Promise.all([bRes.json(), sRes.json()]);
    setBuchungen(b);
    setSperren(s);
    if (tRes.ok) {
      const t = await tRes.json();
      if (Array.isArray(t)) { setTeamup(t); setTeamupVerfuegbar(true); }
      else setTeamupVerfuegbar(false);
    } else setTeamupVerfuegbar(false);
    setLoading(false);
  }, [monat]);

  useEffect(() => { ladeKalenderDaten(); }, [ladeKalenderDaten]);

  const tage = eachDayOfInterval({ start: startOfMonth(monat), end: endOfMonth(monat) });
  const erstWochentag = (getDay(tage[0]) + 6) % 7;

  const stornieren = async (id: string) => {
    setStorniereId(id);
    await fetch(`/api/buchungen/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storniert: true }),
    });
    setStorniereId(null);
    ladeKalenderDaten();
  };

  const tagBuchungen = ausgewaehlt
    ? getBuchungenFuerTag(buchungen, ausgewaehlt).filter(
        (b) => (!filterFahrzeug || b.fahrzeug === filterFahrzeug) &&
               (!filterPilot || b.pilot === filterPilot)
      )
    : [];
  const tagSperren = ausgewaehlt ? getSperrenFuerTag(sperren, ausgewaehlt) : [];
  const tagTeamUp = ausgewaehlt && zeigTeamUp ? getTeamUpFuerTag(teamup, ausgewaehlt) : [];

  const piloten = Array.from(new Set(buchungen.map((b) => b.pilot))).sort();

  return (
    <div>
      {/* Navigation & Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <button onClick={() => setMonat(subMonths(monat, 1))} className="p-2 rounded hover:bg-white hover:shadow transition-all">&#9664;</button>
          <h2 className="text-xl font-bold text-rikscha-green min-w-[180px] text-center">
            {format(monat, 'MMMM yyyy', { locale: de })}
          </h2>
          <button onClick={() => setMonat(addMonths(monat, 1))} className="p-2 rounded hover:bg-white hover:shadow transition-all">&#9654;</button>
          <button onClick={() => setMonat(new Date())} className="text-xs border border-rikscha-green text-rikscha-green px-2 py-1 rounded hover:bg-rikscha-green hover:text-white transition-colors">Heute</button>
        </div>
        <div className="flex gap-2 flex-wrap">
          <select value={filterFahrzeug} onChange={(e) => setFilterFahrzeug(e.target.value)} className="text-sm border rounded px-2 py-1">
            <option value="">Alle Fahrzeuge</option>
            {FAHRZEUGE.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
          <select value={filterPilot} onChange={(e) => setFilterPilot(e.target.value)} className="text-sm border rounded px-2 py-1">
            <option value="">Alle Piloten</option>
            {piloten.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          {teamupVerfuegbar && (
            <button
              onClick={() => setZeigTeamUp(!zeigTeamUp)}
              className={`text-xs px-2 py-1 rounded border transition-colors ${
                zeigTeamUp ? 'bg-purple-100 border-purple-400 text-purple-800' : 'border-gray-300 text-gray-500'
              }`}
            >
              TeamUp {zeigTeamUp ? 'an' : 'aus'}
            </button>
          )}
        </div>
      </div>

      {/* Legende Fahrzeuge */}
      <div className="flex flex-wrap gap-2 mb-3 text-xs">
        {FAHRZEUGE.map((f) => (
          <span key={f.id} className={`flex items-center gap-1 px-2 py-1 rounded border ${f.farbe}`}>
            <span className={`w-2 h-2 rounded-full ${f.farbeDot}`}></span>
            {f.name} &middot; {f.typ}
          </span>
        ))}
        <span className="flex items-center gap-1 px-2 py-1 rounded border bg-red-100 border-red-400 text-red-800">
          <span className="w-2 h-2 rounded-full bg-red-500"></span>Gesperrt
        </span>
        {teamupVerfuegbar && (
          <span className="flex items-center gap-1 px-2 py-1 rounded border bg-purple-100 border-purple-400 text-purple-800">
            <span className="w-2 h-2 rounded-full bg-purple-500"></span>TeamUp
          </span>
        )}
      </div>

      {/* Legende Piloten */}
      <div className="flex flex-wrap gap-2 mb-4 text-xs">
        {Object.entries(PILOTEN_FARBEN).map(([name, f]) => (
          <span key={name} className={`flex items-center gap-1 px-2 py-1 rounded border ${f.bg} border-current ${f.text}`}>
            <span className={`w-2 h-2 rounded-full ${f.dot}`}></span>
            P: {name}
          </span>
        ))}
        <span className={`flex items-center gap-1 px-2 py-1 rounded border ${GAST_FARBE.bg} border-current ${GAST_FARBE.text}`}>
          <span className={`w-2 h-2 rounded-full ${GAST_FARBE.dot}`}></span>
          G: Gast
        </span>
      </div>

      {/* Kalender */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="grid grid-cols-7 bg-rikscha-green text-white text-xs font-semibold">
          {WOCHENTAGE.map((t) => <div key={t} className="py-2 text-center">{t}</div>)}
        </div>
        <div className="grid grid-cols-7 border-l border-t">
          {Array.from({ length: erstWochentag }).map((_, i) => (
            <div key={`leer-${i}`} className="border-r border-b bg-gray-50 min-h-[100px]" />
          ))}
          {tage.map((tag) => {
            const tagB = getBuchungenFuerTag(buchungen, tag).filter(
              (b) => (!filterFahrzeug || b.fahrzeug === filterFahrzeug) &&
                     (!filterPilot || b.pilot === filterPilot)
            );
            const tagS = getSperrenFuerTag(sperren, tag);
            const tagT = zeigTeamUp ? getTeamUpFuerTag(teamup, tag) : [];
            const istHeute = isToday(tag);
            const istAusgewaehlt = ausgewaehlt && isSameDay(tag, ausgewaehlt);
            const mehr = Math.max(0, tagB.length - 1) + Math.max(0, tagT.length - 1);
            return (
              <div
                key={tag.toISOString()}
                onClick={() => setAusgewaehlt(isSameDay(tag, ausgewaehlt!) ? null : tag)}
                className={[
                  'border-r border-b min-h-[100px] p-1 cursor-pointer transition-colors',
                  !isSameMonth(tag, monat) ? 'bg-gray-50' : 'bg-white',
                  istHeute ? 'bg-green-50' : '',
                  istAusgewaehlt ? 'ring-2 ring-inset ring-rikscha-green' : 'hover:bg-gray-50',
                ].join(' ')}
              >
                <div className={['text-xs font-semibold mb-1 w-6 h-6 flex items-center justify-center rounded-full', istHeute ? 'bg-rikscha-green text-white' : 'text-gray-600'].join(' ')}>
                  {format(tag, 'd')}
                </div>
                {tagS.map((s) => (
                  <div key={s.id} className="text-[10px] bg-red-100 text-red-700 border border-red-300 rounded px-1 mb-0.5 truncate">
                    &#128274; {fahrzeugById(s.fahrzeug)?.name ?? s.fahrzeug}
                  </div>
                ))}
                {tagB.slice(0, 1).map((b) => (
                  <BuchungKarte key={b.id} b={b} />
                ))}
                {tagT.slice(0, 1).map((e) => (
                  <div key={e.uid} className="text-[10px] rounded px-1 mb-0.5 truncate border bg-purple-100 border-purple-400 text-purple-800">
                    {e.allDay ? '●' : e.start.slice(11, 16)} {e.summary}
                  </div>
                ))}
                {mehr > 0 && <div className="text-[10px] text-gray-400 pl-1">+{mehr} mehr</div>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail-Panel */}
      {ausgewaehlt && (
        <div className="mt-4 bg-white rounded-xl shadow p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-rikscha-green">
              {format(ausgewaehlt, 'EEEE, d. MMMM yyyy', { locale: de })}
            </h3>
            <a href={`/buchen?datum=${format(ausgewaehlt, 'yyyy-MM-dd')}`}
               className="text-sm bg-rikscha-green text-white px-3 py-1 rounded hover:bg-rikscha-light transition-colors">
              + Fahrt buchen
            </a>
          </div>

          {tagSperren.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-semibold text-red-600 mb-1">Fahrzeugsperren</p>
              {tagSperren.map((s) => (
                <div key={s.id} className="text-sm bg-red-50 border border-red-200 rounded p-2 mb-1 flex justify-between">
                  <span>&#128274; {fahrzeugById(s.fahrzeug)?.name} &mdash; {s.grund ?? 'Gesperrt'}</span>
                  <span className="text-xs text-gray-400">{s.von_datum} bis {s.bis_datum}</span>
                </div>
              ))}
            </div>
          )}

          {tagTeamUp.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-semibold text-purple-600 mb-1">TeamUp-Termine</p>
              {tagTeamUp.map((e) => (
                <div key={e.uid} className="text-sm bg-purple-50 border border-purple-200 rounded p-2 mb-1">
                  <p className="font-semibold text-purple-800">
                    {e.allDay ? 'Ganztags' : `${e.start.slice(11, 16)}–${e.end.slice(11, 16)}`} &middot; {e.summary}
                  </p>
                  {e.description && <p className="text-xs text-gray-500 mt-0.5">{e.description}</p>}
                </div>
              ))}
            </div>
          )}

          {tagBuchungen.length === 0 && tagSperren.length === 0 && tagTeamUp.length === 0 && (
            <p className="text-gray-400 text-sm">Keine Buchungen an diesem Tag.</p>
          )}

          {tagBuchungen.map((b) => {
            const fz = fahrzeugById(b.fahrzeug);
            const pf = pilotFarbe(b.pilot);
            return (
              <div key={b.id} className={`border rounded-lg overflow-hidden mb-3 ${b.storniert ? 'opacity-60' : ''}`}>
                {/* Uhrzeit-Header */}
                <div className="px-3 py-1.5 bg-gray-100 border-b flex items-center justify-between">
                  <span className={`font-semibold text-sm ${b.storniert ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                    {b.startzeit.slice(0, 5)}&ndash;{b.endzeit.slice(0, 5)} Uhr
                  </span>
                  {b.storniert && <span className="text-xs font-bold text-red-600">STORNIERT</span>}
                </div>
                {/* Pilot */}
                <div className={`flex items-center gap-2 px-3 py-2 ${pf.bg}`}>
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${pf.dot}`} />
                  <span className={`text-sm font-semibold ${pf.text}`}>P: {b.pilot}</span>
                </div>
                {/* Gäste */}
                {b.gaeste.map((g, i) => (
                  <div key={i} className={`flex items-center gap-2 px-3 py-1.5 ${GAST_FARBE.bg} border-t border-white/50`}>
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${GAST_FARBE.dot}`} />
                    <span className={`text-sm ${GAST_FARBE.text}`}>G: {g}</span>
                  </div>
                ))}
                {/* Fahrzeug */}
                <div className={`flex items-center gap-2 px-3 py-2 border-t ${fz?.farbe ?? 'bg-gray-100 border-gray-200 text-gray-700'}`}>
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${fz?.farbeDot ?? 'bg-gray-400'}`} />
                  <span className="text-sm font-medium">{fz?.name} &middot; {fz?.typ}</span>
                </div>
                {/* Notiz + Stornieren */}
                {(b.notiz || !b.storniert) && (
                  <div className="px-3 py-2 bg-white border-t border-gray-100 flex items-center justify-between gap-2">
                    {b.notiz
                      ? <p className="text-xs text-gray-500 italic flex-1">{b.notiz}</p>
                      : <span />}
                    {!b.storniert && (
                      <button onClick={() => stornieren(b.id)} disabled={storniereId === b.id}
                        className="text-xs text-red-600 border border-red-300 rounded px-2 py-0.5 hover:bg-red-50 disabled:opacity-50 flex-shrink-0">
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
        <h3 className="font-semibold text-rikscha-green mb-2">&#128197; Kalender abonnieren (iCal)</h3>
        <div className="flex flex-wrap gap-2 text-xs">
          <a href="/api/ical" className="underline text-rikscha-green">Alle Fahrten</a>
          {FAHRZEUGE.map((f) => (
            <a key={f.id} href={`/api/ical?fahrzeug=${f.id}`} className="underline text-rikscha-green">{f.name}</a>
          ))}
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
