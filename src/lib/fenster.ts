/**
 * Freie Fahrzeit = Zeitfenster des Kutschers (z. B. 10–16 Uhr).
 * Gäste buchen darin kürzere Fahrten, auch mehrere nacheinander. Hier: freie Abschnitte berechnen.
 */
import { uhrzeitMinuten, zeitPlus } from './touren';

export type Abschnitt = { von: string; bis: string };
/** Kürzere Reste lohnen sich nicht */
export const MIN_ABSCHNITT_MIN = 30;
export const START_SCHRITT_MIN = 15;

const m = (z: string) => uhrzeitMinuten(z) ?? 0;
const z = (min: number) => zeitPlus('00:00', min) ?? '23:59';

/** Fenster minus gebuchte Fahrten → freie Abschnitte (mind. 30 Min.) */
export function freieAbschnitte(fenster: { startzeit: string; endzeit: string }, belegt: { startzeit: string; endzeit: string }[]): Abschnitt[] {
  let frei: [number, number][] = [[m(fenster.startzeit), m(fenster.endzeit)]];
  for (const b of belegt) {
    const bs = m(b.startzeit), be = m(b.endzeit);
    frei = frei.flatMap(([s, e]) => {
      if (be <= s || bs >= e) return [[s, e] as [number, number]];
      const rest: [number, number][] = [];
      if (bs > s) rest.push([s, bs]);
      if (be < e) rest.push([be, e]);
      return rest;
    });
  }
  return frei.filter(([s, e]) => e - s >= MIN_ABSCHNITT_MIN).map(([s, e]) => ({ von: z(s), bis: z(e) }));
}

/** Mögliche Startzeiten für eine Fahrt der Dauer `dauer` (Minuten) in den freien Abschnitten */
export function startOptionen(abschnitte: Abschnitt[], dauer: number): string[] {
  const liste: string[] = [];
  for (const a of abschnitte) {
    for (let s = m(a.von); s + dauer <= m(a.bis); s += START_SCHRITT_MIN) liste.push(z(s));
  }
  return liste;
}

/** Passt [start, ende] vollständig in einen freien Abschnitt? */
export function passtInFenster(abschnitte: Abschnitt[], start: string, ende: string) {
  const s = m(start), e = m(ende);
  return e > s && abschnitte.some((a) => s >= m(a.von) && e <= m(a.bis));
}

export const abschnitteText = (a: Abschnitt[]) => a.map((x) => `${x.von}–${x.bis}`).join(', ');
