'use client';

import type { Organisation } from '@/lib/supabase';
import { useState } from 'react';

type Entwurf = { name: string; art: 'einrichtung' | 'quartier'; standard_abholort: string };
const LEER: Entwurf = { name: '', art: 'quartier', standard_abholort: '' };

async function senden(method: 'POST' | 'PATCH', body: Record<string, unknown>) {
  const r = await fetch('/api/admin/organisationen', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (r.ok) return null;
  const j = await r.json().catch(() => ({}));
  return (j.error as string) ?? 'Fehler beim Speichern.';
}

/** Organisationen, die Fahrten vermitteln (Seniorenheim, Quartiersbüro, Kirchengemeinde …) */
export default function OrganisationenVerwaltung({ liste, fehler, neuLaden }: {
  liste: Organisation[]; fehler: string; neuLaden: () => void;
}) {
  const [neu, setNeu] = useState<Entwurf>(LEER);
  const [bearbeiten, setBearbeiten] = useState<(Entwurf & { id: string }) | null>(null);
  const [meldung, setMeldung] = useState('');
  const zeige = (t: string) => { setMeldung(t); setTimeout(() => setMeldung(''), 3500); };
  const feld = 'border rounded px-2 py-1.5 text-sm';

  return (
    <div className="bg-white rounded-xl shadow p-5 mt-8">
      <h3 className="font-semibold text-gray-700 mb-1">Organisationen (Vermittlung)</h3>
      <p className="text-xs text-gray-500 mb-3">
        Stellen, die Fahrten für andere organisieren. Jede sieht nur ihre eigenen Fahrgäste. „Einrichtung“: Bewohner mit Wohnbereich.
        „Quartier“: Fahrgäste mit Adresse und Telefon (werden automatisch nach der Frist gelöscht).
      </p>
      {fehler && <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded px-3 py-2 mb-3">{fehler}</p>}
      {meldung && <p className="text-sm text-green-800 bg-green-50 border border-green-200 rounded px-3 py-2 mb-3">{meldung}</p>}
      <form className="flex flex-wrap gap-2 items-end mb-4" onSubmit={async (e) => {
        e.preventDefault();
        const f = await senden('POST', neu);
        if (f) zeige('Fehler: ' + f); else { zeige(`${neu.name} wurde angelegt.`); setNeu(LEER); neuLaden(); }
      }}>
        <input required maxLength={80} placeholder="Name, z. B. Quartiersbüro Merten" value={neu.name} onChange={(e) => setNeu({ ...neu, name: e.target.value })} className={`${feld} flex-1 min-w-[180px]`} />
        <select value={neu.art} onChange={(e) => setNeu({ ...neu, art: e.target.value as Entwurf['art'] })} className={feld} aria-label="Art">
          <option value="quartier">Quartier</option>
          <option value="einrichtung">Einrichtung</option>
        </select>
        <input maxLength={120} placeholder="Standard-Abholort (optional)" value={neu.standard_abholort} onChange={(e) => setNeu({ ...neu, standard_abholort: e.target.value })} className={`${feld} flex-1 min-w-[160px]`} />
        <button type="submit" className="bg-rikscha-green text-white rounded px-3 py-1.5 text-sm font-semibold">+ Anlegen</button>
      </form>
      <div className="divide-y">
        {liste.map((o) => bearbeiten?.id === o.id ? (
          <form key={o.id} className="py-2 flex flex-wrap gap-2 items-center" onSubmit={async (e) => {
            e.preventDefault();
            const f = await senden('PATCH', bearbeiten);
            if (f) zeige('Fehler: ' + f); else { zeige('Gespeichert.'); setBearbeiten(null); neuLaden(); }
          }}>
            <input required maxLength={80} aria-label="Name" value={bearbeiten.name} onChange={(e) => setBearbeiten({ ...bearbeiten, name: e.target.value })} className={`${feld} flex-1`} />
            <select aria-label="Art" value={bearbeiten.art} onChange={(e) => setBearbeiten({ ...bearbeiten, art: e.target.value as Entwurf['art'] })} className={feld}>
              <option value="quartier">Quartier</option>
              <option value="einrichtung">Einrichtung</option>
            </select>
            <input maxLength={120} aria-label="Standard-Abholort" placeholder="Standard-Abholort" value={bearbeiten.standard_abholort} onChange={(e) => setBearbeiten({ ...bearbeiten, standard_abholort: e.target.value })} className={`${feld} flex-1`} />
            <button type="submit" className="bg-rikscha-green text-white rounded px-3 py-1.5 text-sm font-semibold">Speichern</button>
            <button type="button" onClick={() => setBearbeiten(null)} className="text-sm text-gray-500">Abbrechen</button>
          </form>
        ) : (
          <div key={o.id} className={`py-2 flex flex-wrap items-center gap-2 ${o.aktiv ? '' : 'opacity-50'}`}>
            <span className="font-medium text-sm">{o.name}</span>
            <span className={`text-xs rounded-full px-2 ${o.art === 'quartier' ? 'bg-sky-100 text-sky-800' : 'bg-teal-100 text-teal-800'}`}>{o.art === 'quartier' ? 'Quartier' : 'Einrichtung'}</span>
            {o.standard_abholort && <span className="text-xs text-gray-500">📍 {o.standard_abholort}</span>}
            <span className="ml-auto flex gap-3 text-xs">
              <button onClick={() => setBearbeiten({ id: o.id, name: o.name, art: o.art, standard_abholort: o.standard_abholort ?? '' })} className="text-blue-600 hover:underline">Bearbeiten</button>
              <button onClick={async () => { const f = await senden('PATCH', { id: o.id, aktiv: !o.aktiv }); if (f) zeige('Fehler: ' + f); else neuLaden(); }}
                className="text-orange-500 hover:underline">{o.aktiv ? 'Deaktivieren' : 'Aktivieren'}</button>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
