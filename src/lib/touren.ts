/**
 * Touren zur Auswahl als „Wunschfahrt“ (gleiche Touren wie auf der Tourenkarte der Startseite).
 * Kurze Liste ohne Kartendaten, damit sie überall leicht geladen werden kann.
 */
export const WUNSCH_TOUREN = [
  { id: 'heide', name: 'Auf der Heide', dauer: 'ca. 45 Min.' },
  { id: 'rhein', name: 'Fahrt zum Rhein', dauer: 'ca. 1 Std.' },
  { id: 'schloesser', name: 'Brühler Schlösserrunde', dauer: 'ca. 2 Std.' },
] as const;

/** Standard-Abholort für Bewohnerfahrten */
export const STANDARD_ABHOLORT = 'GFO, Eingang Elisabeth';
