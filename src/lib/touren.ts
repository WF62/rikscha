/**
 * Touren zur Auswahl als „Wunschfahrt“ (gleiche Touren wie auf der Tourenkarte der Startseite).
 * Kurze Liste ohne Kartendaten, damit sie überall leicht geladen werden kann.
 */
export const WUNSCH_TOUREN = [
  { id: 'heide', name: 'Auf der Heide', dauer: 'ca. 45 Min.', minuten: 45 },
  { id: 'rhein', name: 'Fahrt zum Rhein', dauer: 'ca. 1 Std.', minuten: 60 },
  { id: 'schloesser', name: 'Brühler Schlösserrunde', dauer: 'ca. 2 Std.', minuten: 120 },
] as const;

/** Dauer einer bekannten Tour in Minuten (null bei eigenem Wunsch oder ohne Tour) */
export function tourMinuten(wunschfahrt: string | null | undefined): number | null {
  if (!wunschfahrt) return null;
  return WUNSCH_TOUREN.find((t) => t.name === wunschfahrt || t.id === wunschfahrt)?.minuten ?? null;
}

/** "14:30" oder "14:30:00" → Minuten seit Mitternacht */
export function uhrzeitMinuten(z: string | null | undefined): number | null {
  const m = /^(\d{1,2}):(\d{2})/.exec(z ?? '');
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

/** Startzeit + Minuten → "HH:MM" (null, wenn es über Mitternacht ginge) */
export function zeitPlus(start: string, minuten: number): string | null {
  const s = uhrzeitMinuten(start);
  if (s === null) return null;
  const e = s + minuten;
  if (e >= 24 * 60) return null;
  return `${String(Math.floor(e / 60)).padStart(2, '0')}:${String(e % 60).padStart(2, '0')}`;
}

export function dauerText(min: number): string {
  if (min < 60) return `${min} Min.`;
  const h = Math.floor(min / 60), r = min % 60;
  return r ? `${h} Std. ${r} Min.` : `${h} Std.`;
}

/** Warnung, wenn die gebuchte Zeit für die Tour nicht reicht – sonst null */
export function zeitWarnung(wunschfahrt: string | null | undefined, start: string | null | undefined, ende: string | null | undefined): string | null {
  const noetig = tourMinuten(wunschfahrt);
  const s = uhrzeitMinuten(start), e = uhrzeitMinuten(ende);
  if (noetig === null || s === null || e === null) return null;
  const da = e - s;
  if (da >= noetig) return null;
  return `Eingeplant sind nur ${dauerText(Math.max(da, 0))}, die Tour dauert aber ca. ${dauerText(noetig)}`;
}

/** Standard-Abholort für Fahrten des Seniorenheims (GFO) */
export const STANDARD_ABHOLORT = 'Seniorenheim St. Elisabeth – Eingang Elisabeth';

/** Feste Abholorte zur Auswahl – für alle Kutscher sichtbar (keine Privatadressen) */
export const ABHOLORTE = ['Pfarrzentrum Merten', STANDARD_ABHOLORT, 'Betreutes Wohnen Paulinenhof'] as const;

/** Text, wenn der Ort noch abgesprochen wird */
export const NACH_ABSPRACHE = 'Anderer Abholort nach Absprache';
