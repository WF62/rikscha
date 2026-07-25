'use client';

import { useState, useEffect, useCallback } from 'react';

type Person = { id: string; name: string; rolle: string; aktiv: boolean };

const ROLLEN = [
  { value: 'pilot', label: 'Pilot' },
  { value: 'gfo',   label: 'GFO-Mitarbeiterin' },
];

export default function AdminSeite() {
  const [eingeloggt, setEingeloggt] = useState(false);
  const [adminPw, setAdminPw]       = useState('');
  const [loginFehler, setLoginFehler] = useState('');

  const [personen, setPersonen]     = useState<Person[]>([]);
  const [laden, setLaden]           = useState(false);
  const [form, setForm]             = useState({ name: '', passwort: '', rolle: 'pilot' });
  const [speichern, setSpeichern]   = useState(false);
  const [meldung, setMeldung]       = useState('');
  const [editId, setEditId]         = useState<string | null>(null);
  const [editPw, setEditPw]         = useState('');

  const laden_ = useCallback(async () => {
    setLaden(true);
    const res = await fetch('/api/admin/piloten');
    if (res.ok) setPersonen(await res.json());
    setLaden(false);
  }, []);

  const adminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: adminPw }),
    });
    if (res.ok) { setEingeloggt(true); laden_(); }
    else setLoginFehler('Falsches Passwort.');
  };

  const hinzufügen = async (e: React.FormEvent) => {
    e.preventDefault();
    setSpeichern(true);
    const res = await fetch('/api/admin/piloten', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setMeldung(`${form.name} wurde hinzugefügt.`);
      setForm({ name: '', passwort: '', rolle: 'pilot' });
      laden_();
    } else {
      const j = await res.json();
      setMeldung('Fehler: ' + j.error);
    }
    setSpeichern(false);
    setTimeout(() => setMeldung(''), 3000);
  };

  const passwortÄndern = async (id: string) => {
    if (!editPw) return;
    await fetch('/api/admin/piloten', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, passwort: editPw }),
    });
    setEditId(null); setEditPw('');
    setMeldung('Passwort geändert.');
    setTimeout(() => setMeldung(''), 2000);
  };

  const aktivToggle = async (p: Person) => {
    await fetch('/api/admin/piloten', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: p.id, aktiv: !p.aktiv }),
    });
    laden_();
  };

  const löschen = async (p: Person) => {
    if (!confirm(`${p.name} wirklich löschen?`)) return;
    await fetch('/api/admin/piloten', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: p.id }),
    });
    laden_();
  };

  if (!eingeloggt) {
    return (
      <div className="max-w-sm mx-auto mt-16">
        <h2 className="text-2xl font-bold text-rikscha-green mb-6">Admin-Bereich</h2>
        <form onSubmit={adminLogin} className="bg-white rounded-xl shadow p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1">Admin-Passwort</label>
            <input type="password" value={adminPw} onChange={(e) => setAdminPw(e.target.value)}
              autoFocus required className="w-full border rounded px-3 py-2" placeholder="••••••••" />
          </div>
          {loginFehler && <p className="text-red-600 text-sm">{loginFehler}</p>}
          <button type="submit" className="w-full bg-rikscha-green text-white rounded px-4 py-2 font-semibold">
            Anmelden
          </button>
        </form>
      </div>
    );
  }

  const aktive   = personen.filter((p) => p.aktiv);
  const inaktive = personen.filter((p) => !p.aktiv);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-rikscha-green">Zugang verwalten</h2>
        <span className="text-xs text-gray-400">Piloten &amp; GFO-Mitarbeiterinnen</span>
      </div>

      {meldung && (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg px-4 py-2 mb-4 text-sm">
          {meldung}
        </div>
      )}

      {/* Neue Person hinzufügen */}
      <form onSubmit={hinzufügen} className="bg-white rounded-xl shadow p-5 mb-6 space-y-3">
        <h3 className="font-semibold text-gray-700">Person hinzufügen</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold mb-1">Name</label>
            <input type="text" required value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border rounded px-3 py-2 text-sm" placeholder="Vorname" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Rolle</label>
            <select value={form.rolle} onChange={(e) => setForm({ ...form, rolle: e.target.value })}
              className="w-full border rounded px-3 py-2 text-sm">
              {ROLLEN.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">Passwort</label>
          <input type="text" required value={form.passwort}
            onChange={(e) => setForm({ ...form, passwort: e.target.value })}
            className="w-full border rounded px-3 py-2 text-sm" placeholder="Persönliches Passwort" />
        </div>
        <button type="submit" disabled={speichern}
          className="bg-rikscha-green text-white rounded px-4 py-2 text-sm font-semibold hover:bg-rikscha-light disabled:opacity-50">
          {speichern ? 'Wird gespeichert…' : '+ Hinzufügen'}
        </button>
      </form>

      {/* Aktive Personen */}
      <div className="bg-white rounded-xl shadow p-5 mb-4">
        <h3 className="font-semibold text-gray-700 mb-3">Aktiv ({aktive.length})</h3>
        {laden && <p className="text-sm text-gray-400">Wird geladen…</p>}
        <div className="space-y-2">
          {aktive.map((p) => (
            <div key={p.id} className="flex items-center gap-2 p-2 rounded-lg border border-gray-100">
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                p.rolle === 'gfo' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
              }`}>{p.rolle === 'gfo' ? 'GFO' : 'Pilot'}</span>
              <span className="flex-1 font-medium text-sm">{p.name}</span>

              {editId === p.id ? (
                <div className="flex gap-1">
                  <input type="text" value={editPw} onChange={(e) => setEditPw(e.target.value)}
                    placeholder="Neues Passwort" className="border rounded px-2 py-1 text-xs w-32" />
                  <button onClick={() => passwortÄndern(p.id)}
                    className="bg-rikscha-green text-white text-xs px-2 py-1 rounded">OK</button>
                  <button onClick={() => setEditId(null)} className="text-gray-400 text-xs px-2 py-1">✕</button>
                </div>
              ) : (
                <button onClick={() => { setEditId(p.id); setEditPw(''); }}
                  className="text-xs text-blue-600 hover:underline">Passwort</button>
              )}

              <button onClick={() => aktivToggle(p)}
                className="text-xs text-orange-500 hover:underline">Deaktivieren</button>
              <button onClick={() => löschen(p)}
                className="text-xs text-red-500 hover:underline">Löschen</button>
            </div>
          ))}
          {aktive.length === 0 && !laden && <p className="text-sm text-gray-400">Keine aktiven Personen.</p>}
        </div>
      </div>

      {/* Inaktive */}
      {inaktive.length > 0 && (
        <div className="bg-white rounded-xl shadow p-5 opacity-70">
          <h3 className="font-semibold text-gray-500 mb-3">Deaktiviert ({inaktive.length})</h3>
          <div className="space-y-2">
            {inaktive.map((p) => (
              <div key={p.id} className="flex items-center gap-2 p-2 rounded-lg border border-gray-100">
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-semibold">
                  {p.rolle === 'gfo' ? 'GFO' : 'Pilot'}
                </span>
                <span className="flex-1 text-sm text-gray-400 line-through">{p.name}</span>
                <button onClick={() => aktivToggle(p)} className="text-xs text-green-600 hover:underline">Reaktivieren</button>
                <button onClick={() => löschen(p)} className="text-xs text-red-500 hover:underline">Löschen</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
