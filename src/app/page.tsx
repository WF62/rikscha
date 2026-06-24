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
import { FAHRZEUGE, PILOTEN_FARBEN, GAST_FARBE, fahrzeugById, pilotFarbe } from '@/lib/constants';

const WOCHENTAGE = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

function osterSonntag(jahr: number): Date {
  const a = jahr % 19, b = Math.floor(jahr / 100), c = jahr % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(jahr, month - 1, day);
}

function feiertageDesJahres(jahr: number): Map<string, string> {
  const ostern = osterSonntag(jahr);
  const d = (base: Date, offset: number) => addDays(base, offset);
  const key = (dt: Date) => format(dt, 'yyyy-MM-dd');
  const map = new Map<string, string>();
  map.set(`${jahr}-01-01`, 'Neujahr');
  map.set(`${jahr}-05-01`, 'Tag der Arbeit');
  map.set(`${jahr}-10-03`, 'Tag der Deutschen Einheit');
  map.set(`${jahr}-12-25`, '1. Weihnachtstag');
  map.set(`${jahr}-12-26`, '2. Weihnachtstag');
  map.set(key(d(ostern, -2)),  'Karfreitag');
  map.set(key(d(ostern,  1)),  'Ostermontag');
  map.set(key(d(ostern, 39)), 'Christi Himmelfahrt');
  map.set(key(d(ostern, 50)), 'Pfingstmontag');
  map.set(key(d(ostern, 60)), 'Fronleichnam');
  return map;
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
  const pf = pilotFarbe(b.pilot);
  return (
    <div className={`rounded overflow-hidden border-2 mb-0.5 border-gray-400 shadow-sm ${b.storniert ? 'opacity-50' : ''}`}>
      {/* Pilot */}
      <div className={`flex items-center gap-1 px-1.5 py-1 ${pf.bg} ${pf.text}`}>
        <span className={`flex-shrink-0 w-2 h-2 rounded-full ${pf.dot}`} />
        <span className={`text-[11px] font-bold truncate ${b.storniert ? 'line-through' : ''}`}>
          {b.startzeit.slice(0, 5)} P: {b.pilot}
        </span>
      </div>
      {/* Gäste */}
      {b.gaeste.map((g, i) => (
        <div key={i} className={`flex items-center gap-1 px-1.5 py-0.5 border-t border-white/40 ${GAST_FARBE.bg} ${GAST_FARBE.text}`}>
          <span className={`flex-shrink-0 w-2 h-2 rounded-full ${GAST_FARBE.dot}`} />
          <span className="text-[11px] font-semibold truncate">G: {g}</span>
        </div>
      ))}
      {/* Fahrzeug */}
      <div className={`flex items-center gap-1 px-1.5 py-1 border-t border-white/40 ${fz?.farbe ?? 'bg-gray-200 text-gray-800'}`}>
        <span className={`flex-shrink-0 w-2 h-2 rounded-full ${fz?.farbeDot ?? 'bg-gray-500'}`} />
        <span className="text-[10px] font-semibold truncate">{fz?.name ?? b.fahrzeug}</span>
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
    setBuchungen(b);
    setSperren(s);
    if (tRes.ok) {
      const t = await tRes.json();
      if (Array.isArray(t)) { setTeamup(t); setTeamupVerfuegbar(true); }
      else setTeamupVerfuegbar(false);
    } else setTeamupVerfuegbar(false);
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monat]);

  useEffect(() => { ladeKalenderDaten(); }, [ladeKalenderDaten]);

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
  const tagTeamUp  = ausgewaehlt && zeigTeamUp ? getTeamUpFuerTag(teamup, ausgewaehlt) : [];
  const piloten    = Array.from(new Set(buchungen.map((b) => b.pilot))).sort();

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
            <button onClick={() => setZeigTeamUp(!zeigTeamUp)}
              className={`text-xs px-2 py-1 rounded border transition-colors ${
                zeigTeamUp ? 'bg-purple-100 border-purple-400 text-purple-800' : 'border-gray-300 text-gray-500'
              }`}>
              TeamUp {zeigTeamUp ? 'an' : 'aus'}
            </button>
          )}
        </div>
      </div>

      {/* Legende Fahrzeuge */}
      <div className="flex flex-wrap gap-2 mb-3 text-xs">
        {FAHRZEUGE.map((f) => (
          <span key={f.id} className={`flex items-center gap-1 px-2 py-1 rounded border ${f.farbe}`}>
            <span className={`w-2 h-2 rounded-full ${f.farbeDot}`} />
            {f.name} &middot; {f.typ}
          </span>
        ))}
        <span className="flex items-center gap-1 px-2 py-1 rounded border bg-red-200 border-red-600 text-red-900">
          <span className="w-2 h-2 rounded-full bg-red-600" />Gesperrt
        </span>
        {teamupVerfuegbar && (
          <span className="flex items-center gap-1 px-2 py-1 rounded border bg-purple-200 border-purple-600 text-purple-900">
            <span className="w-2 h-2 rounded-full bg-purple-600" />TeamUp
          </span>
        )}
        <span className="flex items-center gap-1 px-2 py-1 rounded border bg-amber-200 border-amber-500 text-amber-900">
          <span className="w-2 h-2 rounded-full bg-amber-500" />Feiertag
        </span>
        <span className="flex items-center gap-1 px-2 py-1 rounded border bg-blue-200 border-blue-500 text-blue-900">
          <span className="w-2 h-2 rounded-full bg-blue-500" />Wochenende
        </span>
      </div>

      {/* Legende Piloten */}
      <div className="flex flex-wrap gap-2 mb-4 text-xs">
        {Object.entries(PILOTEN_FARBEN).map(([name, f]) => (
          <span key={name} className={`flex items-center gap-1 px-2 py-1 rounded border-2 ${f.bg} border-current ${f.text}`}>
            <span className={`w-2 h-2 rounded-full ${f.dot}`} />
            P: {name}
          </span>
        ))}
        <span className={`flex items-center gap-1 px-2 py-1 rounded border-2 ${GAST_FARBE.bg} border-current ${GAST_FARBE.text}`}>
          <span className={`w-2 h-2 rounded-full ${GAST_FARBE.dot}`} />
          G: Gast
        </span>
      </div>

      {/* Kalender */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="grid grid-cols-7 bg-rikscha-green text-white text-xs font-semibold">
          {WOCHENTAGE.map((t) => <div key={t} className="py-2 text-center">{t}</div>)}
        </div>
        <div className="grid grid-cols-7 border-l border-t">
          {tage.map((tag) => {
            const imAktuellenMonat = isSameMonth(tag, monat);
            const wochentag        = getDay(tag);
            const istWochenende    = wochentag === 0 || wochentag === 6;
            const feiertagName     = feiertage.get(format(tag, 'yyyy-MM-dd'));
            const istFeiertag      = !!feiertagName;
            const kw               = getISOWeek(tag);
            const geradeKW         = kw % 2 === 0;
            const tagB = getBuchungenFuerTag(buchungen, tag).filter(
              (b) => (!filterFahrzeug || b.fahrzeug === filterFahrzeug) &&
                     (!filterPilot || b.pilot === filterPilot)
            );
            const tagS  = getSperrenFuerTag(sperren, tag);
            const tagT  = zeigTeamUp ? getTeamUpFuerTag(teamup, tag) : [];
            const istHeute       = isToday(tag);
            const istAusgewaehlt = ausgewaehlt && isSameDay(tag, ausgewaehlt);
            const mehr = Math.max(0, tagB.length - 1) + Math.max(0, tagT.length - 1);

            // Hintergrund: Priorität heute > ausgewählt > Feiertag > Wochenende > KW-Wechsel
            let bgClass: string;
            if (!imAktuellenMonat) {
              bgClass = istWochenende ? 'bg-blue-100' : geradeKW ? 'bg-gray-100' : 'bg-gray-200';
            } else if (istFeiertag) {
              bgClass = 'bg-amber-100';
            } else if (istWochenende) {
              bgClass = 'bg-blue-100';
            } else {
              bgClass = geradeKW ? 'bg-white' : 'bg-slate-100';
            }
            if (istHeute) bgClass = 'bg-green-100';

            return (
              <div
                key={tag.toISOString()}
                onClick={() => setAusgewaehlt(isSameDay(tag, ausgewaehlt!) ? null : tag)}
                className={[
                  'border-r border-b min-h-[110px] p-1 cursor-pointer transition-all',
                  bgClass,
                  istAusgewaehlt ? 'ring-2 ring-inset ring-rikscha-green brightness-95' : 'hover:brightness-95',
                ].join(' ')}
              >
                <div className="flex items-start justify-between mb-0.5">
                  <div className={[
                    'text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full flex-shrink-0',
                    istHeute     ? 'bg-rikscha-green text-white' :
                    istFeiertag  ? 'bg-amber-400 text-amber-950' :
                    istWochenende ? 'bg-blue-400 text-white' :
                    imAktuellenMonat ? 'text-gray-800' : 'text-gray-400',
                  ].join(' ')}>
                    {format(tag, 'd')}
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    {format(tag, 'd') === '1' && (
                      <span className="text-[10px] font-bold text-rikscha-green">
                        {format(tag, 'MMM', { locale: de })}
                      </span>
                    )}
                    {istFeiertag && (
                      <span className="text-[9px] text-amber-800 font-semibold truncate max-w-[64px] text-right leading-tight">
                        {feiertagName}
                      </span>
                    )}
                  </div>
                </div>

                {tagS.map((s) => (
                  <div key={s.id} className="text-[10px] bg-red-200 text-red-900 border border-red-500 rounded px-1 mb-0.5 truncate font-semibold">
                    &#128274; {fahrzeugById(s.fahrzeug)?.name ?? s.fahrzeug}
                  </div>
                ))}
                {tagB.slice(0, 1).map((b) => <BuchungKarte key={b.id} b={b} />)}
                {tagT.slice(0, 1).map((e) => (
                  <div key={e.uid} className="text-[10px] rounded px-1 mb-0.5 truncate border bg-purple-200 border-purple-600 text-purple-950 font-semibold">
                    {e.allDay ? '●' : e.start.slice(11, 16)} {e.summary}
                  </div>
                ))}
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
              <h3 className="font-bold text-rikscha-green">
                {format(ausgewaehlt, 'EEEE, d. MMMM yyyy', { locale: de })}
              </h3>
              {feiertage.get(format(ausgewaehlt, 'yyyy-MM-dd')) && (
                <p className="text-xs text-amber-800 font-semibold mt-0.5">
                  🎉 {feiertage.get(format(ausgewaehlt, 'yyyy-MM-dd'))}
                </p>
              )}
            </div>
            <a href={`/buchen?datum=${format(ausgewaehlt, 'yyyy-MM-dd')}`}
               className="text-sm bg-rikscha-green text-white px-3 py-1 rounded hover:bg-rikscha-light transition-colors">
              + Fahrt buchen
            </a>
          </div>

          {tagSperren.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-semibold text-red-700 mb-1">Fahrzeugsperren</p>
              {tagSperren.map((s) => (
                <div key={s.id} className="text-sm bg-red-100 border border-red-400 rounded p-2 mb-1 flex justify-between">
                  <span>&#128274; {fahrzeugById(s.fahrzeug)?.name} &mdash; {s.grund ?? 'Gesperrt'}</span>
                  <span className="text-xs text-gray-500">{s.von_datum} bis {s.bis_datum}</span>
                </div>
              ))}
            </div>
          )}

          {tagTeamUp.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-semibold text-purple-700 mb-1">TeamUp-Termine</p>
              {tagTeamUp.map((e) => (
                <div key={e.uid} className="text-sm bg-purple-100 border border-purple-400 rounded p-2 mb-1">
                  <p className="font-semibold text-purple-900">
                    {e.allDay ? 'Ganztags' : `${e.start.slice(11, 16)}–${e.end.slice(11, 16)}`} &middot; {e.summary}
                  </p>
                  {e.description && <p className="text-xs text-gray-600 mt-0.5">{e.description}</p>}
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
              <div key={b.id} className={`border-2 rounded-lg overflow-hidden mb-3 shadow-sm ${b.storniert ? 'opacity-60' : ''}`}>
                <div className="px-3 py-1.5 bg-gray-200 border-b-2 border-gray-400 flex items-center justify-between">
                  <span className={`font-bold text-sm ${b.storniert ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                    {b.startzeit.slice(0, 5)}&ndash;{b.endzeit.slice(0, 5)} Uhr
                  </span>
                  {b.storniert && <span className="text-xs font-bold text-red-700">STORNIERT</span>}
                </div>
                <div className={`flex items-center gap-2 px-3 py-2 ${pf.bg}`}>
                  <span className={`w-3 h-3 rounded-full flex-shrink-0 ${pf.dot}`} />
                  <span className={`text-sm font-bold ${pf.text}`}>P: {b.pilot}</span>
                </div>
                {b.gaeste.map((g, i) => (
                  <div key={i} className={`flex items-center gap-2 px-3 py-2 ${GAST_FARBE.bg} border-t-2 border-white/60`}>
                    <span className={`w-3 h-3 rounded-full flex-shrink-0 ${GAST_FARBE.dot}`} />
                    <span className={`text-sm font-semibold ${GAST_FARBE.text}`}>G: {g}</span>
                  </div>
                ))}
                <div className={`flex items-center gap-2 px-3 py-2 border-t-2 border-white/60 ${fz?.farbe ?? 'bg-gray-200 text-gray-800'}`}>
                  <span className={`w-3 h-3 rounded-full flex-shrink-0 ${fz?.farbeDot ?? 'bg-gray-500'}`} />
                  <span className="text-sm font-bold">{fz?.name} &middot; {fz?.typ}</span>
                </div>
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
