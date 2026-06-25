export const FAHRZEUGE = [
  {
    id: 'flotte_lotte',
    name: 'Flotte Lotte',
    typ: 'Rikscha',
    maxGaeste: 2,
    farbe: 'bg-green-300 border-green-700 text-green-950',
    farbeDot: 'bg-green-700',
    farbeHex: '#15803d',
  },
  {
    id: 'flinker_flitzer',
    name: 'Flinker Flitzer',
    typ: 'Liegetandem',
    maxGaeste: 1,
    farbe: 'bg-blue-300 border-blue-700 text-blue-950',
    farbeDot: 'bg-blue-700',
    farbeHex: '#1d4ed8',
  },
  {
    id: 'jruuse_piter',
    name: 'Jruuse Piter',
    typ: 'Paralleltandem',
    maxGaeste: 1,
    farbe: 'bg-orange-300 border-orange-600 text-orange-950',
    farbeDot: 'bg-orange-600',
    farbeHex: '#ea580c',
  },
] as const;

export type FahrzeugId = (typeof FAHRZEUGE)[number]['id'];

// Alphabetisch sortiert
export const PILOTEN = [
  'Doro',
  'Guido',
  'Hans-Heinrich',
  'Helenah',
  'Heribert',
  'Holger',
  'Lucia',
  'Rolf',
  'Sabine',
  'Walter',
  'Werner',
] as const;

export type Pilot = (typeof PILOTEN)[number];

export const PILOTEN_FARBEN: Record<string, { bg: string; text: string; dot: string }> = {
  'Doro':          { bg: 'bg-indigo-300',  text: 'text-indigo-950',  dot: 'bg-indigo-700' },
  'Guido':         { bg: 'bg-amber-300',   text: 'text-amber-950',   dot: 'bg-amber-700' },
  'Hans-Heinrich': { bg: 'bg-violet-300',  text: 'text-violet-950',  dot: 'bg-violet-700' },
  'Helenah':       { bg: 'bg-fuchsia-300', text: 'text-fuchsia-950', dot: 'bg-fuchsia-700' },
  'Heribert':      { bg: 'bg-yellow-300',  text: 'text-yellow-950',  dot: 'bg-yellow-700' },
  'Holger':        { bg: 'bg-lime-300',    text: 'text-lime-950',    dot: 'bg-lime-700' },
  'Lucia':         { bg: 'bg-pink-300',    text: 'text-pink-950',    dot: 'bg-pink-700' },
  'Rolf':          { bg: 'bg-emerald-300', text: 'text-emerald-950', dot: 'bg-emerald-700' },
  'Sabine':        { bg: 'bg-rose-300',    text: 'text-rose-950',    dot: 'bg-rose-700' },
  'Walter':        { bg: 'bg-sky-300',     text: 'text-sky-950',     dot: 'bg-sky-700' },
  'Werner':        { bg: 'bg-teal-300',    text: 'text-teal-950',    dot: 'bg-teal-700' },
};

export const GAST_FARBE = { bg: 'bg-cyan-300', text: 'text-cyan-950', dot: 'bg-cyan-700' };

export function fahrzeugById(id: string) {
  return FAHRZEUGE.find((f) => f.id === id);
}

export function pilotFarbe(pilot: string) {
  return PILOTEN_FARBEN[pilot] ?? { bg: 'bg-gray-200', text: 'text-gray-800', dot: 'bg-gray-500' };
}
