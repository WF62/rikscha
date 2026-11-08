'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Bewohner, Buchung, Organisation } from '@/lib/supabase';
import { authHeaders } from '@/lib/authHeaders';
import { useStammdaten } from '@/lib/useStammdaten';
import { bereichPfad, bereichHinweise, mitUnterbereichen, type Bereich } from '@/lib/struktur';

type Daten = {
  bewohner: Bewohner[]; fahrten: Buchung[]; gruppen: { id: string; titel: string; fahrten: Buchung[] }[];
  bereiche: Bereich[]; organisationen: Organisation[];
};
const TAGE = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];

function montag(d: Date) { const m = new Date(d); m.setHours(12, 0, 0, 0); m.setDate(m.getDate() - ((m.getDay() + 6) % 7)); return m; }
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const kurz = (d: Date) => d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });

/** Wochenplan zum Ausdrucken: Rikscha-Termine eines Bereichs (mit Unterbereichen) oder eines Fahrgasts */
function Wochenplan() {
  const p = useSearchParams();
  const { fahrzeugById } = useStammdaten();
  const [daten, setDaten] = useState<Daten | null>(null);
  const [fehler, setFehler] = useState('');
  const [start, setStart] = useState(() => montag(new Date()));

  useEffect(() => {
    fetch('/api/pflege', { headers: authHeaders() })
      .then(async (r) => { const j = await r.json().catch(() => ({})); if (r.ok) setDaten(j); else setFehler(j.error ?? 'Bitte mit einem Vermittlungs-Zugang anmelden.'); })
      .catch(() => setFehler('Keine Verbindung.'));
  }, []);

  if (fehler) return <p className="p-6 text-red-700">{fehler}</p>;
  if (!daten) return <p className="p-6 text-gray-400">Wird geladen…</p>;

  const fahrgastId = p.get('fahrgast');
  const bereichId = p.get('bereich');
  const bereichIds = bereichId ? mitUnterbereichen(daten.bereiche, bereichId) : null;
  const personen = daten.bewohner.filter((b) => (fahrgastId ? b.id === fahrgastId : !!b.bereich_id && !!bereichIds?.has(b.bereich_id)));
  const pIds = new Set(personen.map((x) => x.id));
  const alleFahrten = [...daten.fahrten, ...daten.gruppen.flatMap((g) => g.fahrten)];
  const titel = fahrgastId ? personen[0]?.name ?? 'Fahrgast' : bereichPfad(daten.bereiche, bereichId) || 'Bereich';

  const tage = TAGE.map((name, i) => { const d = new Date(start); d.setDate(d.getDate() + i); return { name, d }; });
  const ende = tage[6].d;
  const inWoche = alleFahrten.filter((b) => b.datum >= iso(start) && b.datum <= iso(ende) && (pIds.has(b.bewohner_id ?? '') || pIds.has(b.bewohner2_id ?? '')))
    .sort((a, b) => (a.datum + a.startzeit).localeCompare(b.datum + b.startzeit));

  return (
    <div className="wochenplan max-w-4xl mx-auto bg-white p-6">
      <style>{`@media print { body * { visibility: hidden; } .wochenplan, .wochenplan * { visibility: visible; } .wochenplan { position: absolute; left: 0; top: 0; width: 100%; padding: 0; } .nicht-drucken { display: none !important; } } @page { size: A4; margin: 14mm; }`}</style>
      <div className="nicht-drucken flex flex-wrap gap-2 items-center mb-4">
        <button onClick={() => { const d = new Date(start); d.setDate(d.getDate() - 7); setStart(d); }} className="border rounded px-3 py-1.5">◀ Vorwoche</button>
        <button onClick={() => setStart(montag(new Date()))} className="border rounded px-3 py-1.5">Diese Woche</button>
        <button onClick={() => { const d = new Date(start); d.setDate(d.getDate() + 7); setStart(d); }} className="border rounded px-3 py-1.5">Nächste Woche ▶</button>
        <button onClick={() => window.print()} className="ml-auto bg-rikscha-green text-white rounded px-4 py-1.5 font-semibold">🖨️ Drucken</button>
      </div>

      <h1 className="text-2xl font-bold text-rikscha-green">🚲 Rikscha-Wochenplan</h1>
      <p className="text-lg font-semibold">{titel}</p>
      <p className="text-gray-600 mb-4">Woche vom {kurz(start)} bis {kurz(ende)}{ende.getFullYear()}</p>

      <table className="w-full border-collapse text-sm">
        <tbody>
          {tage.map(({ name, d }) => {
            const heute = inWoche.filter((b) => b.datum === iso(d));
            return (
              <tr key={name} className="border-t-2 border-gray-300 align-top">
                <th className="text-left py-2 pr-3 w-28">{name}<br /><span className="font-normal text-gray-500">{kurz(d)}</span></th>
                <td className="py-2">
                  {heute.length === 0 && <span className="text-gray-300">–</span>}
                  {heute.map((b) => {
                    const hier = personen.filter((x) => x.id === b.bewohner_id || x.id === b.bewohner2_id);
                    const hinweise = Array.from(new Set(hier.flatMap((x) => bereichHinweise(daten.bereiche, x.bereich_id))));
                    return (
                      <div key={b.id} className={`mb-2 ${b.storniert ? 'line-through text-gray-400' : ''}`}>
                        <div className="text-base font-bold">{b.startzeit.slice(0, 5)}–{b.endzeit.slice(0, 5)} Uhr · {hier.map((x) => `${x.name}${x.rollstuhl ? ' ♿' : ''}`).join(' & ')}</div>
                        <div>📍 {b.abholort ?? 'nach Absprache'}{b.wunschfahrt ? ` · 🗺️ ${b.wunschfahrt}` : ''}</div>
                        <div>Kutscher: {b.pilot || <em>noch offen</em>} · {fahrzeugById(b.fahrzeug)?.name ?? 'Fahrzeug folgt'}</div>
                        {!fahrgastId && hier.map((x) => <div key={x.id} className="text-gray-600">{x.name}: {bereichPfad(daten.bereiche, x.bereich_id)}{x.hinweis ? ` – ${x.hinweis}` : ''}</div>)}
                        {fahrgastId && hier[0]?.hinweis && <div className="text-gray-600">Hinweis: {hier[0].hinweis}</div>}
                        {hinweise.map((h) => <div key={h} className="text-gray-600">• {h}</div>)}
                        <div className="text-gray-600">☐ Am Vortag erinnert ☐ Kleidung/Decke ☐ Toilette ☐ 10 Min. vorher bereit</div>
                      </div>
                    );
                  })}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="text-xs text-gray-500 mt-4">Stand: {new Date().toLocaleString('de-DE')} · Änderungen und Absagen über „Fahrten vermitteln“. Nur intern verwenden.</p>
    </div>
  );
}

export default function WochenplanSeite() {
  return <Suspense><Wochenplan /></Suspense>;
}
