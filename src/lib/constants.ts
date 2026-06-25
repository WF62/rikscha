export const FAHRZEUGE = [
  {
    id: 'flotte_lotte',
    name: 'Flotte Lotte',
    typ: 'Rikscha',
    maxGaeste: 2,
    farbe: 'bg-green-300 border-green-700 text-green-950',
    farbeDot: 'bg-green-700',
    farbeHex: '#15803d',
    bgHex: '#86efac',
  },
  {
    id: 'flinker_flitzer',
    name: 'Flinker Flitzer',
    typ: 'Liegetandem',
    maxGaeste: 1,
    farbe: 'bg-blue-300 border-blue-700 text-blue-950',
    farbeDot: 'bg-blue-700',
    farbeHex: '#1d4ed8',
    bgHex: '#93c5fd',
  },
  {
    id: 'jruuse_piter',
    name: 'Jruuse Piter',
    typ: 'Paralleltandem',
    maxGaeste: 1,
    farbe: 'bg-orange-300 border-orange-600 text-orange-950',
    farbeDot: 'bg-orange-600',
    farbeHex: '#ea580c',
    bgHex: '#fdba74',
  },
] as const;

export type FahrzeugId = (typeof FAHRZEUGE)[number]['id'];

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

// Einheitliche Farbe für alle Piloten
export const PILOT_FARBE = {
  bgHex:     '#a5b4fc',   // indigo-300
  dotHex:    '#3730a3',   // indigo-800
  textClass: 'text-indigo-950',
  bg:  'bg-indigo-300',
  text:'text-indigo-950',
  dot: 'bg-indigo-800',
};

export const GAST_FARBE = {
  bgHex:     '#67e8f9',   // cyan-300
  dotHex:    '#164e63',   // cyan-900
  textClass: 'text-cyan-950',
  bg:  'bg-cyan-300',
  text:'text-cyan-950',
  dot: 'bg-cyan-700',
};

export function fahrzeugById(id: string) {
  return FAHRZEUGE.find((f) => f.id === id);
}

/** Gibt immer dieselbe einheitliche Pilotfarbe zurück */
export function pilotFarbe(_pilot: string) {
  return PILOT_FARBE;
}
