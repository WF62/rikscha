'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FAHRZEUGE, PILOTEN, fahrzeugById } from '@/lib/constants';

function BuchenFormular() {
  const router = useRouter();
  const params = useSearchParams();
  const [form, setForm] = useState({
    fahrzeug: 'flotte_lotte',
    pilot: 'Walter',
    gast1: '',
    gast2: '',
    datum: params.get('datum') ?? '',
    startzeit: '10:00',
    endzeit: '11:00',
    notiz: '',
  });
  const [speichern, setSpeichern] = useState(false);
  const [fehler, setFehler] = useState('');
  const [sperren, setSperren] = useState<{ fahrzeug: string }[]>([]);

  useEffect(() => {
    if (form.datum) {
      fetch(`/api/sperren?von=${form.datum}&bis=${form.datum}`)
        .then((r) => r.json())
        .then(setSperren);
    }
  }, [form.datum]);

  const fahrzeug = fahrzeugById(form.fahrzeug)!;
  const gesperrt = sperren.some((s) => s.fahrzeug === form.fahrzeug);
  const gaeste = [form.gast1, form.gast2].filter(Boolean).slice(0, fahrzeug.maxGaeste);

  const absenden = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.datum) { setFehler('Bitte ein Datum waehlen.'); return; }
    if (gesperrt) { setFehler('Dieses Fahrzeug ist an dem Tag gesperrt.'); return; }
    setSpeichern(true);
    setFehler('');
    const res = await fetch('/api/buchungen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fahrzeug: form.fahrzeug,
        pilot: form.pilot,
        gaeste,
        datum: form.datum,
        startzeit: form.startzeit,
        endzeit: form.endzeit,
        notiz: form.notiz,
      }),
    });
    if (res.ok) {
      router.push('/');
    } else {
      const j = await res.json();
      setFehler(j.error ?? 'Fehler beim Speichern.');
      setSpeichern(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <h2 className="text-2xl font-bold text-rikscha-green mb-6">Fahrt buchen</h2>
      <form onSubmit={absenden} className="bg-white rounded-xl shadow p-6 space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-1">Fahrzeug</label>
          <div className="grid grid-cols-1 gap-2">
            {FAHRZEUGE.map((f) => (
              <label key={f.id} className={['flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors', form.fahrzeug === f.id ? 'border-rikscha-green bg-green-50' : 'border-gray-200 hover:border-gray-300'].join(' ')}>
                <input type="radio" name="fahrzeug" value={f.id} checked={form.fahrzeug === f.id}
                  onChange={(e) => setForm({ ...form, fahrzeug: e.target.value, gast2: '' })} className="sr-only" />
                <span className={`w-3 h-3 rounded-full ${f.farbeDot}`}></span>
                <div>
                  <p className="font-semibold">{f.name}</p>
                  <p className="text-xs text-gray-500">{f.typ} &middot; max. {f.maxGaeste} Gast{f.maxGaeste > 1 ? 'e' : ''}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">Pilot</label>
          <select value={form.pilot} onChange={(e) => setForm({ ...form, pilot: e.target.value })} className="w-full border rounded px-3 py-2">
            {PILOTEN.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">Gaeste</label>
          <input type="text" placeholder="Gast 1" value={form.gast1}
            onChange={(e) => setForm({ ...form, gast1: e.target.value })} className="w-full border rounded px-3 py-2 mb-2" />
          {fahrzeug.maxGaeste >= 2 && (
            <input type="text" placeholder="Gast 2" value={form.gast2}
              onChange={(e) => setForm({ ...form, gast2: e.target.value })} className="w-full border rounded px-3 py-2" />
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">Datum</label>
          <input type="date" value={form.datum} onChange={(e) => setForm({ ...form, datum: e.target.value })} required className="w-full border rounded px-3 py-2" />
          {gesperrt && <p className="text-red-600 text-xs mt-1">&#9888; {fahrzeug.name} ist an diesem Tag gesperrt!</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold mb-1">Startzeit</label>
            <input type="time" value={form.startzeit} onChange={(e) => setForm({ ...form, startzeit: e.target.value })} required className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Endzeit</label>
            <input type="time" value={form.endzeit} onChange={(e) => setForm({ ...form, endzeit: e.target.value })} required className="w-full border rounded px-3 py-2" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">Notiz (optional)</label>
          <textarea value={form.notiz} onChange={(e) => setForm({ ...form, notiz: e.target.value })} rows={2} className="w-full border rounded px-3 py-2 text-sm" placeholder="z.B. Treffpunkt, Sonderwuensche..." />
        </div>

        {fehler && <p className="text-red-600 text-sm">{fehler}</p>}

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => router.back()} className="flex-1 border border-gray-300 rounded px-4 py-2 hover:bg-gray-50 transition-colors">Abbrechen</button>
          <button type="submit" disabled={speichern || gesperrt} className="flex-1 bg-rikscha-green text-white rounded px-4 py-2 font-semibold hover:bg-rikscha-light disabled:opacity-50 transition-colors">
            {speichern ? 'Wird gespeichert...' : 'Fahrt buchen'}
          </button>
        </div>
      </form>
      <SperreFormular />
    </div>
  );
}

function SperreFormular() {
  const [offen, setOffen] = useState(false);
  const [form, setForm] = useState({ fahrzeug: 'flotte_lotte', von: '', bis: '', grund: '' });
  const [gespeichert, setGespeichert] = useState(false);

  const absenden = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/sperren', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fahrzeug: form.fahrzeug, von_datum: form.von, bis_datum: form.bis, grund: form.grund }),
    });
    setGespeichert(true);
    setTimeout(() => { setGespeichert(false); setOffen(false); }, 2000);
  };

  return (
    <div className="mt-6 bg-white rounded-xl shadow p-4">
      <button onClick={() => setOffen(!offen)} className="text-sm text-red-600 font-semibold w-full text-left">
        &#128274; Fahrzeug fuer Reparatur/Zeitraum sperren {offen ? '▲' : '▼'}
      </button>
      {offen && (
        <form onSubmit={absenden} className="mt-3 space-y-3">
          <select value={form.fahrzeug} onChange={(e) => setForm({ ...form, fahrzeug: e.target.value })} className="w-full border rounded px-3 py-2 text-sm">
            {FAHRZEUGE.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold">Von</label>
              <input type="date" required value={form.von} onChange={(e) => setForm({ ...form, von: e.target.value })} className="w-full border rounded px-2 py-1 text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold">Bis</label>
              <input type="date" required value={form.bis} onChange={(e) => setForm({ ...form, bis: e.target.value })} className="w-full border rounded px-2 py-1 text-sm" />
            </div>
          </div>
          <input type="text" placeholder="Grund (z.B. Reparatur)" value={form.grund} onChange={(e) => setForm({ ...form, grund: e.target.value })} className="w-full border rounded px-3 py-2 text-sm" />
          <button type="submit" className="w-full bg-red-600 text-white rounded px-4 py-2 text-sm font-semibold hover:bg-red-700 transition-colors">
            {gespeichert ? 'Gesperrt!' : 'Sperre eintragen'}
          </button>
        </form>
      )}
    </div>
  );
}

export default function BuchenSeite() {
  return (
    <Suspense>
      <BuchenFormular />
    </Suspense>
  );
}
