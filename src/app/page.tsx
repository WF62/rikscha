'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, addMonths, subMonths, isSameMonth, isToday,
  isSameDay, parseISO,
} from 'date-fns';
import { de } from 'date-fns/locale';
import type { Buchung, Sperre } from '@/lib/supabase';
import { FAHRZEUGE, fahrzeugById } from '@/lib/constants';

const WOCHENTAGE = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

function getBuchungenFuerTag(buchungen: Buchung[], tag: Date) {
  return buchungen.filter((b) => isSameDay(parseISO(b.datum), tag));
}

function getSperrenFuerTag(sperren: Sperre[], tag: Date) {
  return sperren.filter((s) => {
    const von = parseISO(s.von_datum);
    const bis = parseISO(s.bis_datum);
    return tag >= von && tag <= bis;
  });
}

export default function KalenderSeite() {
  const [monat, setMonat] = useState(new Date());
  const [buchungen, setBuchungen] = useState<Buchung[]>([]);
  const [sperren, setSperren] = useState<Sperre[]>([]);
  const [loading, setLoading] = useState(true);
  const [ausgewaehlt, setAusgewaehlt] = useState<Date | null>(null);
  const [filterFahrzeug, setFilterFahrzeug] = useState('');
  const [storniereId, setStorniereId] = useState<string | null>(null);

  const ladeKalenderDaten = useCallback(async () => {
    setLoading(true);
    const von = format(startOfMonth(monat), 'yyyy-MM-dd');
    const bis = format(endOfMonth(monat), 'yyyy-MM-dd');
    const [bRes, sRes] = await Promise.all([
      fetch(`/api/buchungen?von=${von}&bis=${bis}`),
      fetch(`/api/sperren?von=${von}&bis=${bis}`),
    ]);
    const [b, s] = await Promise.all([bRes.json(), sRes.json()]);
    setBuchungen(b);
    setSperren(s);
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
        (b) => !filterFahrzeug || b.fahrzeug === filterFahrzeug
      )
    : [];
  const tagSperren = ausgewaehlt ? getSperrenFuerTag(sperren, ausgewaehlt) : [];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <button onClick={() => setMonat(subMonths(monat, 1))} className="p-2 rounded hover:bg-white hover:shadow transition-all">&#9664;</button>
          <h2 className="text-xl font-bold text-rikscha-green min-w-[180px] text-center">
            {format(monat, 'MMMM yyyy', { locale: de })}
          </h2>
          <button onClick={() => setMonat(addMonths(monat, 1))} className="p-2 rounded hover:bg-white hover:shadow transition-all">&#9654;</button>
          <button onClick={() => setMonat(new Date())} className="text-xs border border-rikscha-green text-rikscha-green px-2 py-1 rounded hover:bg-rikscha-green hover:text-white transition-colors">Heute</button>
        </div>
        <select value={filterFahrzeug} onChange={(e) => setFilterFahrzeug(e.target.value)} className="text-sm border rounded px-2 py-1">
          <option value="">Alle Fahrzeuge</option>
          {FAHRZEUGE.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
      </div>

      <div className="flex flex-wrap gap-3 mb-4 text-xs">
        {FAHRZEUGE.map((f) => (
          <span key={f.id} className={`flex items-center gap-1 px-2 py-1 rounded border ${f.farbe}`}>
            <span className={`w-2 h-2 rounded-full ${f.farbeDot}`}></span>
            {f.name} &middot; {f.typ}
          </span>
        ))}
        <span className="flex items-center gap-1 px-2 py-1 rounded border bg-red-100 border-red-400 text-red-800">
          <span className="w-2 h-2 rounded-full bg-red-500"></span>Gesperrt
        </span>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="grid grid-cols-7 bg-rikscha-green text-white text-xs font-semibold">
          {WOCHENTAGE.map((t) => <div key={t} className="py-2 text-center">{t}</div>)}
        </div>
        <div className="grid grid-cols-7 border-l border-t">
          {Array.from({ length: erstWochentag }).map((_, i) => (
            <div key={`leer-${i}`} className="border-r border-b bg-gray-50 min-h-[90px]" />
          ))}
          {tage.map((tag) => {
            const tagB = getBuchungenFuerTag(buchungen, tag).filter(
              (b) => !filterFahrzeug || b.fahrzeug === filterFahrzeug
            );
            const tagS = getSperrenFuerTag(sperren, tag);
            const istHeute = isToday(tag);
            const istAusgewaehlt = ausgewaehlt && isSameDay(tag, ausgewaehlt);
            return (
              <div
                key={tag.toISOString()}
                onClick={() => setAusgewaehlt(isSameDay(tag, ausgewaehlt!) ? null : tag)}
                className={[
                  'border-r border-b min-h-[90px] p-1 cursor-pointer transition-colors',
                  !isSameMonth(tag, monat) ? 'bg-gray-50' : 'bg-white',
                  istHeute ? 'bg-green-50' : '',
                  istAusgewaehlt ? 'ring-2 ring-inset ring-rikscha-green' : 'hover:bg-gray-50',
                ].join(' ')}
              >
                <div className={['text-xs font-semibold mb-1 w-6 h-6 flex items-center justify-center rounded-full', istHeute ? 'bg-rikscha-green text-white' : 'text-gray-600'].join(' ')}>
                  {format(tag, 'd')}
                </div>
                {tagS.map((s) => (
                  <div key={s.id} className="text-xs bg-red-100 text-red-700 rounded px-1 mb-0.5 truncate">
                    &#128274; {fahrzeugById(s.fahrzeug)?.name ?? s.fahrzeug}
                  </div>
                ))}
                {tagB.slice(0, 3).map((b) => {
                  const fz = fahrzeugById(b.fahrzeug);
                  return (
                    <div key={b.id} className={`text-xs rounded px-1 mb-0.5 truncate border ${fz?.farbe ?? 'bg-gray-100'} ${b.storniert ? 'opacity-50 line-through' : ''}`}>
                      {b.startzeit.slice(0, 5)} {b.pilot}
                    </div>
                  );
                })}
                {tagB.length > 3 && <div className="text-xs text-gray-400">+{tagB.length - 3} mehr</div>}
              </div>
            );
          })}
        </div>
      </div>

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
                <div key={s.id} className="text-sm bg-red-50 border border-red-200 rounded p-2 mb-1 flex justify-between items-center">
                  <span>&#128274; {fahrzeugById(s.fahrzeug)?.name} &mdash; {s.grund ?? 'Gesperrt'}</span>
                  <span className="text-xs text-gray-400">{s.von_datum} bis {s.bis_datum}</span>
                </div>
              ))}
            </div>
          )}
          {tagBuchungen.length === 0 && tagSperren.length === 0 && (
            <p className="text-gray-400 text-sm">Keine Buchungen an diesem Tag.</p>
          )}
          {tagBuchungen.map((b) => {
            const fz = fahrzeugById(b.fahrzeug);
            return (
              <div key={b.id} className={`border rounded p-3 mb-2 ${fz?.farbe ?? 'bg-gray-50 border-gray-200'} ${b.storniert ? 'opacity-60' : ''}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className={`font-semibold ${b.storniert ? 'line-through' : ''}`}>
                      {b.startzeit.slice(0, 5)}&ndash;{b.endzeit.slice(0, 5)} &middot; {fz?.name}
                    </p>
                    <p className="text-sm">Pilot: <strong>{b.pilot}</strong></p>
                    {b.gaeste.length > 0 && <p className="text-sm">Gaeste: {b.gaeste.join(', ')}</p>}
                    {b.notiz && <p className="text-xs text-gray-500 mt-1">{b.notiz}</p>}
                  </div>
                  <div className="ml-2">
                    {!b.storniert && (
                      <button onClick={() => stornieren(b.id)} disabled={storniereId === b.id}
                        className="text-xs text-red-600 border border-red-300 rounded px-2 py-0.5 hover:bg-red-50 disabled:opacity-50">
                        {storniereId === b.id ? '...' : 'Stornieren'}
                      </button>
                    )}
                    {b.storniert && <span className="text-xs text-red-500 font-semibold">Storniert</span>}
                  </div>
                </div>
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
