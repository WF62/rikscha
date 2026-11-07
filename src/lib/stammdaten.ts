import { FAHRZEUGE, PILOTEN } from './constants';

/** Ein Fahrzeug, wie es Kalender und Buchungsseite brauchen. */
export type Fahrzeug = {
  id: string;
  name: string;
  typ: string;
  maxGaeste: number;
  rollstuhl: boolean;
  farbeHex: string;
  bgHex: string;
  /** ISO-Datum (YYYY-MM-DD) ab dem das Fahrzeug buchbar ist, sonst null */
  verfuegbarAb: string | null;
  aktiv: boolean;
  reihenfolge: number;
  notiz: string | null;
};

export type Kutscher = { id: string; name: string; aktiv: boolean; reihenfolge: number };

export type Stammdaten = { fahrzeuge: Fahrzeug[]; kutscher: Kutscher[]; quelle: 'datenbank' | 'standard' };

/** Feste Werte aus dem Code – gelten, solange die Tabellen noch nicht angelegt sind. */
export const STANDARD_STAMMDATEN: Stammdaten = {
  quelle: 'standard',
  fahrzeuge: FAHRZEUGE.map((f, i) => ({
    id: f.id, name: f.name, typ: f.typ, maxGaeste: f.maxGaeste, rollstuhl: false,
    farbeHex: f.farbeHex, bgHex: f.bgHex, verfuegbarAb: null, aktiv: true, reihenfolge: (i + 1) * 10, notiz: null,
  })),
  kutscher: PILOTEN.map((name, i) => ({ id: name, name, aktiv: true, reihenfolge: (i + 1) * 10 })),
};

/** Datenbankzeile → Fahrzeug */
export function fahrzeugAusZeile(r: Record<string, unknown>): Fahrzeug {
  return {
    id: String(r.id), name: String(r.name), typ: String(r.typ ?? ''),
    maxGaeste: Number(r.max_gaeste ?? 1), rollstuhl: !!r.rollstuhl,
    farbeHex: String(r.farbe_hex ?? '#6b7280'), bgHex: String(r.bg_hex ?? '#e5e7eb'),
    verfuegbarAb: (r.verfuegbar_ab as string | null) ?? null, aktiv: r.aktiv !== false,
    reihenfolge: Number(r.reihenfolge ?? 100), notiz: (r.notiz as string | null) ?? null,
  };
}

/** Ist das Fahrzeug an diesem Tag (YYYY-MM-DD) buchbar? */
export function istBuchbarAm(f: Pick<Fahrzeug, 'aktiv' | 'verfuegbarAb'>, datum: string) {
  return f.aktiv && (!f.verfuegbarAb || !datum || datum >= f.verfuegbarAb);
}

export function datumDeutsch(iso: string) {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}
