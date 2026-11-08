'use client';

import { useEffect, useState } from 'react';
import { Lockfeld, useFormularStart } from '@/lib/Lockfeld';
import { ABHOLORTE, NACH_ABSPRACHE } from '@/lib/touren';

type Zeit = { id: string; datum: string; startzeit: string; endzeit: string; kutscher: string; fahrzeug: string | null; plaetze: number };

const tag = (iso: string) => new Date(iso + 'T12:00:00').toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
const uhr = (z: Zeit) => `${z.startzeit.slice(0, 5)}–${z.endzeit.slice(0, 5)} Uhr`;

/** Freie Fahrzeiten der Kutscher, die für Interessierte aus dem Quartier freigegeben sind */
export default function FreieZeiten() {
  const [zeiten, setZeiten] = useState<Zeit[] | null>(null);
  const [gewaehlt, setGewaehlt] = useState<Zeit | null>(null);
  const [form, setForm] = useState({ name: '', begleitung: '', telefon: '', abholort: ABHOLORTE[0] as string, notiz: '' });
  const [fehler, setFehler] = useState('');
  const [fertig, setFertig] = useState<{ datum: string; startzeit: string; endzeit: string; kutscher: string; fahrzeug: string; abholort: string } | null>(null);
  const [senden, setSenden] = useState(false);
  const start = useFormularStart();
  const [lockfeld, setLockfeld] = useState('');

  const laden = () => fetch('/api/freie-zeiten').then((r) => (r.ok ? r.json() : [])).then(setZeiten).catch(() => setZeiten([]));
  useEffect(() => { laden(); }, []);

  if (!zeiten || zeiten.length === 0) return null;   // nichts freigegeben → Abschnitt ausblenden

  if (fertig) {
    return (
      <div role="status" className="bg-green-50 border-2 border-green-600 rounded-xl p-5 mb-6">
        <p className="font-bold text-green-900 text-lg">Geschafft! Du fährst mit 🚲</p>
        <p className="text-green-900 mt-1">{tag(fertig.datum)}, {fertig.startzeit.slice(0, 5)}–{fertig.endzeit.slice(0, 5)} Uhr</p>
        <p className="text-green-900">Kutscher: {fertig.kutscher} · {fertig.fahrzeug}</p>
        <p className="text-green-900">Treffpunkt: {fertig.abholort}</p>
        <p className="text-sm text-green-800 mt-2">Falls sich etwas ändert, meldet sich der Kutscher telefonisch bei dir.</p>
      </div>
    );
  }

  return (
    <section className="bg-white rounded-xl shadow p-5 mb-6 border-2 border-emerald-200">
      <h3 className="text-lg font-bold text-rikscha-green">🌿 Freie Fahrzeiten – einfach mitfahren</h3>
      <p className="text-sm text-gray-600 mb-3">Diese Zeiten haben Kutscherinnen und Kutscher für Interessierte aus dem Quartier freigehalten. Zeit antippen, Namen und Telefon eintragen – fertig.</p>
      <div className="space-y-2">
        {zeiten.map((z) => (
          <button key={z.id} type="button" onClick={() => { setGewaehlt(z); setFehler(''); }}
            className={`w-full text-left border-2 rounded-lg p-3 ${gewaehlt?.id === z.id ? 'border-rikscha-green bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
            <span className="font-semibold">{tag(z.datum)}, {uhr(z)}</span>
            <span className="block text-sm text-gray-600">mit {z.kutscher}{z.fahrzeug ? ` · ${z.fahrzeug}` : ''} · bis {z.plaetze} {z.plaetze > 1 ? 'Personen' : 'Person'}</span>
          </button>
        ))}
      </div>

      {gewaehlt && (
        <form className="mt-4 space-y-3 relative" onSubmit={async (e) => {
          e.preventDefault();
          setSenden(true); setFehler('');
          try {
            const r = await fetch('/api/freie-zeiten', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ buchung_id: gewaehlt.id, ...form, begleitung: gewaehlt.plaetze > 1 ? form.begleitung : '', website: lockfeld, _t: start }),
            });
            const j = await r.json().catch(() => ({}));
            if (r.ok && j.datum) setFertig(j);
            else if (r.ok) setFehler('Bitte lade die Seite neu und versuche es noch einmal.');
            else { setFehler(j.error ?? 'Das hat leider nicht geklappt.'); if (r.status === 409) { setGewaehlt(null); laden(); } }
          } catch { setFehler('Keine Verbindung – bitte prüfe dein Internet und versuche es erneut.'); }
          setSenden(false);
        }}>
          <Lockfeld wert={lockfeld} onChange={setLockfeld} />
          <p className="text-sm font-semibold text-gray-700">Deine Fahrt am {tag(gewaehlt.datum)}, {uhr(gewaehlt)}</p>
          <label className="block text-sm font-semibold">Dein Name
            <input required maxLength={80} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border rounded px-3 py-2" />
          </label>
          {gewaehlt.plaetze > 1 && (
            <label className="block text-sm font-semibold">Begleitung (optional)
              <input maxLength={80} value={form.begleitung} onChange={(e) => setForm({ ...form, begleitung: e.target.value })} className="w-full border rounded px-3 py-2" placeholder="Name der zweiten Person" />
            </label>
          )}
          <label className="block text-sm font-semibold">Telefon für Rückfragen
            <input required type="tel" maxLength={40} value={form.telefon} onChange={(e) => setForm({ ...form, telefon: e.target.value })} className="w-full border rounded px-3 py-2" />
            <span className="block text-xs font-normal text-gray-500">Sieht nur dein Kutscher. Wird eine Woche nach der Fahrt gelöscht.</span>
          </label>
          <label className="block text-sm font-semibold">Treffpunkt
            <select value={form.abholort} onChange={(e) => setForm({ ...form, abholort: e.target.value })} className="w-full border rounded px-3 py-2">
              {ABHOLORTE.map((o) => <option key={o} value={o}>📍 {o}</option>)}
              <option value={NACH_ABSPRACHE}>💬 {NACH_ABSPRACHE}</option>
            </select>
          </label>
          {fehler && <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">{fehler}</p>}
          <button type="submit" disabled={senden} className="w-full bg-rikscha-green text-white rounded px-4 py-3 font-bold disabled:opacity-50">
            {senden ? 'Wird gebucht…' : 'Mitfahren'}
          </button>
        </form>
      )}
    </section>
  );
}
