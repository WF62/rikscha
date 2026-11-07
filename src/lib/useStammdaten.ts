'use client';
import { useEffect, useState } from 'react';
import { STANDARD_STAMMDATEN, type Fahrzeug, type Stammdaten } from './stammdaten';

// Einmal pro Seitenaufruf laden, egal wie viele Komponenten den Hook nutzen.
let cache: Stammdaten | null = null;
let laufend: Promise<Stammdaten> | null = null;

function lade(): Promise<Stammdaten> {
  if (!laufend) {
    laufend = fetch('/api/stammdaten')
      .then((r) => (r.ok ? r.json() : null))
      .then((d: Stammdaten | null) => (cache = d?.fahrzeuge ? d : STANDARD_STAMMDATEN))
      .catch(() => (cache = STANDARD_STAMMDATEN));
  }
  return laufend;
}

/** Fahrzeuge und Kutscher für Client-Seiten. Startet mit den festen Werten, lädt dann aus der Datenbank. */
export function useStammdaten(): Stammdaten & { fahrzeugById: (id: string) => Fahrzeug | undefined } {
  const [daten, setDaten] = useState<Stammdaten>(cache ?? STANDARD_STAMMDATEN);
  useEffect(() => {
    let aktiv = true;
    if (!cache) lade().then((d) => { if (aktiv) setDaten(d); });
    else setDaten(cache);
    return () => { aktiv = false; };
  }, []);
  return { ...daten, fahrzeugById: (id: string) => daten.fahrzeuge.find((f) => f.id === id) };
}
