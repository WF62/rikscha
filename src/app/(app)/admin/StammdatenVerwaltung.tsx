'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Fahrzeug, Kutscher, Stammdaten } from '@/lib/stammdaten';
import { datumDeutsch } from '@/lib/stammdaten';

type Entwurf = {
  name: string; typ: string; max_gaeste: number; rollstuhl: boolean;
  farbe_hex: string; bg_hex: string; verfuegbar_ab: string; aktiv: boolean; reihenfolge: number; notiz: string;
};

const LEER: Entwurf = {
  name: '', typ: 'Rikscha', max_gaeste: 2, rollstuhl: false,
  farbe_hex: '#7c3aed', bg_hex: '#ddd6fe', verfuegbar_ab: '', aktiv: true, reihenfolge: 100, notiz: '',
};

function zuEntwurf(f: Fahrzeug): Entwurf {
  return {
    name: f.name, typ: f.typ, max_gaeste: f.maxGaeste, rollstuhl: f.rollstuhl,
    farbe_hex: f.farbeHex, bg_hex: f.bgHex, verfuegbar_ab: f.verfuegbarAb ?? '', aktiv: f.aktiv,
    reihenfolge: f.reihenfolge, notiz: f.notiz ?? '',
  };
}

async function senden(method: 'POST' | 'PATCH' | 'DELETE', body: Record<string, unknown>) {
  const r = await fetch('/api/admin/stammdaten', {
    method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  if (r.ok) return null;
  const j = await r.json().catch(() => ({}));
  return (j.error as string) ?? 'Fehler beim Speichern.';
}

function FahrzeugFelder({ e, setE }: { e: Entwurf; setE: (e: Entwurf) => void }) {
  const feld = 'w-full border rounded px-2 py-1 text-sm';
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
      <label className="col-span-2"><span className="font-semibold">Name</span>
        <input className={feld} value={e.name} onChange={(x) => setE({ ...e, name: x.target.value })} required /></label>
      <label><span className="font-semibold">Typ</span>
        <input className={feld} value={e.typ} onChange={(x) => setE({ ...e, typ: x.target.value })} placeholder="Rikscha" /></label>
      <label><span className="font-semibold">Max. Gäste</span>
        <input className={feld} type="number" min={0} max={6} value={e.max_gaeste}
          onChange={(x) => setE({ ...e, max_gaeste: Number(x.target.value) })} /></label>
      <label><span className="font-semibold">Verfügbar ab</span>
        <input className={feld} type="date" value={e.verfuegbar_ab} onChange={(x) => setE({ ...e, verfuegbar_ab: x.target.value })} /></label>
      <label><span className="font-semibold">Farbe</span>
        <input className="w-full h-8 border rounded" type="color" value={e.farbe_hex} onChange={(x) => setE({ ...e, farbe_hex: x.target.value })} /></label>
      <label><span className="font-semibold">Hintergrund</span>
        <input className="w-full h-8 border rounded" type="color" value={e.bg_hex} onChange={(x) => setE({ ...e, bg_hex: x.target.value })} /></label>
      <label><span className="font-semibold">Reihenfolge</span>
        <input className={feld} type="number" value={e.reihenfolge} onChange={(x) => setE({ ...e, reihenfolge: Number(x.target.value) })} /></label>
      <label className="col-span-2 sm:col-span-3"><span className="font-semibold">Notiz (nur intern)</span>
        <input className={feld} value={e.notiz} onChange={(x) => setE({ ...e, notiz: x.target.value })} placeholder="z. B. Lieferung bestellt" /></label>
      <div className="flex flex-col justify-end gap-1">
        <label className="flex items-center gap-1"><input type="checkbox" checked={e.rollstuhl} onChange={(x) => setE({ ...e, rollstuhl: x.target.checked })} /> ♿ Rollstuhl</label>
        <label className="flex items-center gap-1"><input type="checkbox" checked={e.aktiv} onChange={(x) => setE({ ...e, aktiv: x.target.checked })} /> aktiv</label>
      </div>
    </div>
  );
}

export default function StammdatenVerwaltung() {
  const [daten, setDaten] = useState<Stammdaten | null>(null);
  const [meldung, setMeldung] = useState('');
  const [neu, setNeu] = useState<Entwurf | null>(null);
  const [bearbeiten, setBearbeiten] = useState<{ id: string; e: Entwurf } | null>(null);
  const [neuerKutscher, setNeuerKutscher] = useState('');

  const laden = useCallback(async () => {
    const r = await fetch('/api/admin/stammdaten');
    if (r.ok) setDaten(await r.json());
  }, []);
  useEffect(() => { laden(); }, [laden]);

  const zeige = (text: string) => { setMeldung(text); setTimeout(() => setMeldung(''), 3500); };
  const ergebnis = async (fehler: string | null, ok: string) => {
    if (fehler) zeige('Fehler: ' + fehler); else { zeige(ok); await laden(); }
    return !fehler;
  };

  if (!daten) return <div className="bg-white rounded-xl shadow p-5 mt-6 text-sm text-gray-400">Fahrzeuge werden geladen…</div>;

  const ohneTabellen = daten.quelle === 'standard';
  const kutscherAktiv = daten.kutscher.filter((k) => k.aktiv);
  const kutscherInaktiv = daten.kutscher.filter((k) => !k.aktiv);

  return (
    <div className="mt-8 space-y-4">
      <h2 className="text-2xl font-bold text-rikscha-green">Fahrzeuge &amp; Kutscher</h2>
      {ohneTabellen && (
        <div className="bg-amber-50 border border-amber-300 text-amber-900 rounded-lg px-4 py-3 text-sm">
          Noch nicht eingerichtet: Bitte einmal die Datei <code>supabase/stammdaten-fahrzeuge-kutscher.sql</code> im
          Supabase SQL-Editor ausführen. Bis dahin gelten die bisherigen festen Fahrzeuge und Kutscher.
        </div>
      )}
      {meldung && <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg px-4 py-2 text-sm">{meldung}</div>}

      {/* Fahrzeuge */}
      <div className="bg-white rounded-xl shadow p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-700">Fahrzeuge ({daten.fahrzeuge.length})</h3>
          {!ohneTabellen && !neu && (
            <button onClick={() => setNeu({ ...LEER })} className="bg-rikscha-green text-white rounded px-3 py-1 text-sm font-semibold">+ Fahrzeug</button>
          )}
        </div>
        {neu && (
          <form className="border-2 border-rikscha-green/30 rounded-lg p-3 mb-3 space-y-2" onSubmit={async (ev) => {
            ev.preventDefault();
            if (await ergebnis(await senden('POST', { art: 'fahrzeug', ...neu }), `${neu.name} wurde angelegt.`)) setNeu(null);
          }}>
            <FahrzeugFelder e={neu} setE={setNeu} />
            <p className="text-xs text-gray-500">Tipp: Bei „Verfügbar ab“ das Lieferdatum eintragen. Vorher kann niemand das Fahrzeug buchen.</p>
            <div className="flex gap-2">
              <button type="submit" className="bg-rikscha-green text-white rounded px-3 py-1 text-sm font-semibold">Anlegen</button>
              <button type="button" onClick={() => setNeu(null)} className="text-sm text-gray-500 px-2">Abbrechen</button>
            </div>
          </form>
        )}
        <div className="space-y-2">
          {daten.fahrzeuge.map((f) => (
            <div key={f.id} className={`rounded-lg border p-2 ${f.aktiv ? 'border-gray-200' : 'border-gray-100 opacity-60'}`}>
              {bearbeiten?.id === f.id ? (
                <form className="space-y-2" onSubmit={async (ev) => {
                  ev.preventDefault();
                  if (await ergebnis(await senden('PATCH', { art: 'fahrzeug', id: f.id, ...bearbeiten.e }), 'Gespeichert.')) setBearbeiten(null);
                }}>
                  <FahrzeugFelder e={bearbeiten.e} setE={(e) => setBearbeiten({ id: f.id, e })} />
                  <div className="flex gap-2">
                    <button type="submit" className="bg-rikscha-green text-white rounded px-3 py-1 text-sm font-semibold">Speichern</button>
                    <button type="button" onClick={() => setBearbeiten(null)} className="text-sm text-gray-500 px-2">Abbrechen</button>
                  </div>
                </form>
              ) : (
                <div className="flex items-center gap-2 flex-wrap">
                  <span style={{ backgroundColor: f.bgHex, borderColor: f.farbeHex }} className="w-5 h-5 rounded-full border-4 flex-shrink-0" />
                  <span className="font-medium text-sm">{f.name}</span>
                  <span className="text-xs text-gray-500">{f.typ} · max. {f.maxGaeste} Gäste{f.rollstuhl ? ' · ♿' : ''}</span>
                  {f.verfuegbarAb && <span className="text-xs bg-amber-100 text-amber-800 rounded-full px-2">ab {datumDeutsch(f.verfuegbarAb)}</span>}
                  {!f.aktiv && <span className="text-xs bg-gray-100 text-gray-500 rounded-full px-2">nicht aktiv</span>}
                  {f.notiz && <span className="text-xs text-gray-400 italic">{f.notiz}</span>}
                  {!ohneTabellen && (
                    <span className="ml-auto flex gap-3">
                      <button onClick={() => setBearbeiten({ id: f.id, e: zuEntwurf(f) })} className="text-xs text-blue-600 hover:underline">Bearbeiten</button>
                      <button onClick={async () => {
                        if (confirm(`${f.name} wirklich löschen? (Geht nur, wenn noch keine Fahrten damit gebucht sind.)`))
                          await ergebnis(await senden('DELETE', { art: 'fahrzeug', id: f.id }), `${f.name} wurde gelöscht.`);
                      }} className="text-xs text-red-500 hover:underline">Löschen</button>
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Kutscher */}
      <div className="bg-white rounded-xl shadow p-5">
        <h3 className="font-semibold text-gray-700 mb-1">Kutscher in der Auswahlliste ({kutscherAktiv.length})</h3>
        <p className="text-xs text-gray-500 mb-3">
          Diese Namen erscheinen im Kalender und beim Buchen. Die Anmeldung (Passwort) wird oben unter „Zugang verwalten“ gepflegt.
        </p>
        {!ohneTabellen && (
          <form className="flex gap-2 mb-3" onSubmit={async (ev) => {
            ev.preventDefault();
            const name = neuerKutscher.trim();
            if (name && await ergebnis(await senden('POST', { art: 'kutscher', name }), `${name} wurde hinzugefügt.`)) setNeuerKutscher('');
          }}>
            <input value={neuerKutscher} onChange={(e) => setNeuerKutscher(e.target.value)} placeholder="Vorname"
              className="flex-1 border rounded px-3 py-1.5 text-sm" />
            <button type="submit" className="bg-rikscha-green text-white rounded px-3 py-1.5 text-sm font-semibold">+ Hinzufügen</button>
          </form>
        )}
        <div className="flex flex-wrap gap-2">
          {[...kutscherAktiv, ...kutscherInaktiv].map((k: Kutscher) => (
            <span key={k.id} className={`flex items-center gap-2 text-sm rounded-full border px-3 py-1 ${k.aktiv ? 'bg-indigo-50 border-indigo-200' : 'bg-gray-50 border-gray-200 text-gray-400 line-through'}`}>
              {k.name}
              {!ohneTabellen && (
                <>
                  <button title={k.aktiv ? 'Aus der Liste nehmen' : 'Wieder aufnehmen'} className="text-xs text-orange-500 no-underline"
                    onClick={async () => ergebnis(await senden('PATCH', { art: 'kutscher', id: k.id, aktiv: !k.aktiv }), k.aktiv ? `${k.name} ist ausgeblendet.` : `${k.name} ist wieder in der Liste.`)}>
                    {k.aktiv ? '⏸' : '▶'}
                  </button>
                  <button title="Löschen" className="text-xs text-red-500"
                    onClick={async () => { if (confirm(`${k.name} löschen?`)) await ergebnis(await senden('DELETE', { art: 'kutscher', id: k.id }), `${k.name} wurde gelöscht.`); }}>
                    ✕
                  </button>
                </>
              )}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
