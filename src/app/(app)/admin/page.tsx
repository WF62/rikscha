'use client';

import { useState, useEffect, useCallback } from 'react';

type Person = { id: string; name: string; rolle: string; aktiv: boolean };
type OrdnerDatei = { id: string; kategorie: string; name: string; url: string; groesse: number; typ: string };

const ROLLEN = [
  { value: 'pilot', label: 'Pilot' },
  { value: 'gfo',   label: 'GFO-Mitarbeiterin' },
];
const ORDNER_KAT = ['Polizeiliches Führungszeugnis', 'Einweisungsprotokoll', 'Ehrenamtsvertrag', 'Sonstiges'] as const;

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
  // Piloten-Ordner
  const [ordnerPilot, setOrdnerPilot] = useState<string | null>(null);
  const [ordnerDateien, setOrdnerDateien] = useState<OrdnerDatei[]>([]);
  const [ordnerLaden, setOrdnerLaden] = useState(false);
  const [ordnerUploading, setOrdnerUploading] = useState<string | null>(null);
  const [ordnerMsg, setOrdnerMsg] = useState<Record<string, string>>({});

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

  const rolleÄndern = async (p: Person, neueRolle: string) => {
    await fetch('/api/admin/piloten', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: p.id, rolle: neueRolle }),
    });
    laden_();
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

  const ladeOrdner = useCallback(async (pilot: string) => {
    setOrdnerLaden(true);
    try {
      const r = await fetch(`/api/pilot-ordner?pilot=${encodeURIComponent(process.env.NEXT_PUBLIC_ADMIN_NAME ?? 'Admin')}&password=${encodeURIComponent(adminPw)}&besitzer=${encodeURIComponent(pilot)}`);
      setOrdnerDateien(r.ok ? await r.json() : []);
    } catch { setOrdnerDateien([]); }
    setOrdnerLaden(false);
  }, [adminPw]);

  const ordnerOeffnen = (pilot: string) => {
    setOrdnerPilot(pilot);
    setOrdnerMsg({});
    ladeOrdner(pilot);
  };

  const ordnerHochladen = async (kat: string, datei: File) => {
    if (!ordnerPilot) return;
    setOrdnerUploading(kat);
    setOrdnerMsg(m => ({ ...m, [kat]: '' }));
    const form = new FormData();
    form.append('pilot', process.env.NEXT_PUBLIC_ADMIN_NAME ?? 'Admin');
    form.append('password', adminPw);
    form.append('besitzer', ordnerPilot);
    form.append('kategorie', kat);
    form.append('datei', datei);
    try {
      const r = await fetch('/api/pilot-ordner', { method: 'POST', body: form });
      const j = await r.json();
      if (r.ok) { setOrdnerMsg(m => ({ ...m, [kat]: '✓ Hochgeladen' })); ladeOrdner(ordnerPilot); }
      else setOrdnerMsg(m => ({ ...m, [kat]: j.error || 'Fehler' }));
    } catch { setOrdnerMsg(m => ({ ...m, [kat]: 'Verbindungsfehler' })); }
    setOrdnerUploading(null);
  };

  const ordnerLoeschen = async (id: string) => {
    if (!confirm('Datei löschen?')) return;
    await fetch('/api/pilot-ordner', { method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, pilot: process.env.NEXT_PUBLIC_ADMIN_NAME ?? 'Admin', password: adminPw }) });
    setOrdnerDateien(d => d.filter(x => x.id !== id));
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
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">Piloten &amp; GFO-Mitarbeiterinnen</span>
          <a href="/anleitung-gfo" target="_blank" className="text-xs text-blue-600 underline">📖 Admin-Anleitung</a>
        </div>
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
              <select
                value={p.rolle}
                onChange={(e) => rolleÄndern(p, e.target.value)}
                title="Rolle ändern"
                className={`text-xs px-2 py-0.5 rounded-full font-semibold border-0 cursor-pointer appearance-none ${
                  p.rolle === 'gfo' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                }`}>
                <option value="pilot">Pilot</option>
                <option value="gfo">GFO</option>
                <option value="angehoeriger">Angehörige/r</option>
              </select>
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

              <button onClick={() => ordnerOeffnen(p.name)}
                className="text-xs text-purple-600 hover:underline">🗂️ Ordner</button>
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
                <select
                  value={p.rolle}
                  onChange={(e) => rolleÄndern(p, e.target.value)}
                  title="Rolle ändern"
                  className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-semibold border-0 cursor-pointer appearance-none">
                  <option value="pilot">Pilot</option>
                  <option value="gfo">GFO</option>
                  <option value="angehoeriger">Angehörige/r</option>
                </select>
                <span className="flex-1 text-sm text-gray-400 line-through">{p.name}</span>
                <button onClick={() => ordnerOeffnen(p.name)} className="text-xs text-purple-400 hover:underline">🗂️ Ordner</button>
                <button onClick={() => aktivToggle(p)} className="text-xs text-green-600 hover:underline">Reaktivieren</button>
                <button onClick={() => löschen(p)} className="text-xs text-red-500 hover:underline">Löschen</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Piloten-Ordner Panel */}
      {ordnerPilot && (
        <div className="bg-white rounded-xl shadow p-5 mt-6 border-2 border-purple-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-700">🗂️ Ordner: <span className="text-purple-700">{ordnerPilot}</span></h3>
            <button onClick={() => setOrdnerPilot(null)} className="text-xs text-gray-400 hover:text-gray-600">✕ Schließen</button>
          </div>
          {ordnerLaden && <p className="text-sm text-gray-400">Wird geladen…</p>}
          <div className="space-y-3">
            {ORDNER_KAT.map(kat => {
              const dateien = ordnerDateien.filter(d => d.kategorie === kat);
              return (
                <div key={kat} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-rikscha-green">{kat}</span>
                    <label className="text-xs bg-rikscha-green text-white rounded px-2 py-0.5 cursor-pointer font-semibold">
                      {ordnerUploading === kat ? 'Lädt…' : '+ Datei'}
                      <input type="file" className="hidden" disabled={ordnerUploading !== null}
                        onChange={e => { const f = e.target.files?.[0]; if (f) ordnerHochladen(kat, f); e.target.value = ''; }} />
                    </label>
                  </div>
                  {ordnerMsg[kat] && <p className={`text-xs mb-1 ${ordnerMsg[kat].startsWith('✓') ? 'text-green-600' : 'text-red-600'}`}>{ordnerMsg[kat]}</p>}
                  {dateien.length === 0 && !ordnerLaden && <p className="text-xs text-gray-400">Noch keine Datei.</p>}
                  {dateien.map(d => (
                    <div key={d.id} className="flex items-center gap-2 mt-1 border-t border-gray-200 pt-1">
                      <span className="text-base">{d.typ?.includes('pdf') ? '📄' : d.typ?.includes('image') ? '🖼️' : '📎'}</span>
                      <span className="flex-1 text-xs text-gray-700 truncate">{d.name}</span>
                      <span className="text-xs text-gray-400 flex-shrink-0">{d.groesse < 1048576 ? `${Math.round(d.groesse/1024)} KB` : `${(d.groesse/1048576).toFixed(1)} MB`}</span>
                      <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-xs bg-rikscha-green text-white rounded px-1.5 py-0.5 font-bold no-underline flex-shrink-0">↓</a>
                      <button onClick={() => ordnerLoeschen(d.id)} className="text-xs bg-red-100 text-red-700 rounded px-1.5 py-0.5 font-bold flex-shrink-0">✕</button>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
