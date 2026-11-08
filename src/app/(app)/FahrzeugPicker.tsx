'use client';
import { useEffect, useState } from 'react';
import { authHeaders } from '@/lib/authHeaders';
import type { FahrzeugWahl } from '@/lib/stammdaten-server';

/**
 * Fahrzeugauswahl für eine Fahrt: zeigt nur, was zu der Zeit frei ist und passt
 * (Plätze, Rollstuhl, Sperren, andere Fahrten). Wählt das erste freie Fahrzeug vor.
 */
export default function FahrzeugPicker({ buchungId, personen, rollstuhl, wert, onChange }: {
  buchungId: string; personen: number; rollstuhl: boolean; wert: string; onChange: (id: string) => void;
}) {
  const [liste, setListe] = useState<FahrzeugWahl[] | null>(null);
  useEffect(() => {
    let aktiv = true;
    setListe(null);
    fetch(`/api/fahrzeuge-frei?buchung=${encodeURIComponent(buchungId)}&personen=${personen}${rollstuhl ? '&rollstuhl=1' : ''}`, { headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : []))
      .then((l: FahrzeugWahl[]) => {
        if (!aktiv) return;
        setListe(l);
        const passt = l.find((x) => x.id === wert && x.frei);
        if (!passt) onChange(l.find((x) => x.frei)?.id ?? '');
      })
      .catch(() => aktiv && setListe([]));
    return () => { aktiv = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buchungId, personen, rollstuhl]);

  if (!liste) return <span className="text-sm text-gray-400 py-2">Fahrzeuge werden geprüft…</span>;
  const frei = liste.filter((x) => x.frei);
  if (!frei.length) {
    return <span className="text-sm text-red-700 py-2">Kein passendes Fahrzeug frei. Bitte andere Zeit wählen.</span>;
  }
  return (
    <select aria-label="Fahrzeug" value={wert} onChange={(e) => onChange(e.target.value)} className="border rounded px-2 py-2">
      {liste.map((f) => (
        <option key={f.id} value={f.id} disabled={!f.frei}>
          🚲 {f.name} ({f.maxGaeste} {f.maxGaeste > 1 ? 'Plätze' : 'Platz'}){f.rollstuhl ? ' ♿' : ''}{f.grund ? ` – ${f.grund}` : ''}
        </option>
      ))}
    </select>
  );
}
