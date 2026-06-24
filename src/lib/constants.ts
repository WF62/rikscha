export const FAHRZEUGE = [
  {
    id: 'flotte_lotte',
    name: 'Flotte Lotte',
    typ: 'Rikscha',
    maxGaeste: 2,
    farbe: 'bg-green-200 border-green-600 text-green-900',
    farbeDot: 'bg-green-600',
    farbeHex: '#16a34a',
  },
  {
    id: 'flinker_flitzer',
    name: 'Flinker Flitzer',
    typ: 'Liegetandem',
    maxGaeste: 1,
    farbe: 'bg-blue-200 border-blue-600 text-blue-900',
    farbeDot: 'bg-blue-600',
    farbeHex: '#2563eb',
  },
  {
    id: 'jruuse_piter',
    name: 'Jruuse Piter',
    typ: 'Paralleltandem',
    maxGaeste: 1,
    farbe: 'bg-orange-200 border-orange-500 text-orange-900',
    farbeDot: 'bg-orange-500',
    farbeHex: '#f97316',
  },
] as const;

export type FahrzeugId = (typeof FAHRZEUGE)[number]['id'];

export const PILOTEN = [
  'Walter',
  'Hans-Heinrich',
  'Lucia',
  'Sabine',
  'Werner',
  'Holger',
  'Guido',
  'Helenah',
] as const;

export type Pilot = (typeof PILOTEN)[number];

export const PILOTEN_FARBEN: Record<string, { bg: string; text: string; dot: string }> = {
  'Walter':       { bg: 'bg-sky-100',    text: 'text-sky-800',    dot: 'bg-sky-500' },
  'Hans-Heinrich':{ bg: 'bg-violet-100', text: 'text-violet-800', dot: 'bg-violet-500' },
  'Lucia':        { bg: 'bg-pink-100',   text: 'text-pink-800',   dot: 'bg-pink-500' },
  'Sabine':       { bg: 'bg-rose-100',   text: 'text-rose-800',   dot: 'bg-rose-500' },
  'Werner':       { bg: 'bg-teal-100',   text: 'text-teal-800',   dot: 'bg-teal-500' },
  'Holger':       { bg: 'bg-lime-100',   text: 'text-lime-800',   dot: 'bg-lime-600' },
  'Guido':        { bg: 'bg-amber-100',  text: 'text-amber-800',  dot: 'bg-amber-500' },
  'Helenah':      { bg: 'bg-fuchsia-100',text: 'text-fuchsia-800',dot: 'bg-fuchsia-500' },
};

export const GAST_FARBE = { bg: 'bg-cyan-100', text: 'text-cyan-800', dot: 'bg-cyan-500' };

export function fahrzeugById(id: string) {
  return FAHRZEUGE.find((f) => f.id === id);
}

export function pilotFarbe(pilot: string) {
  return PILOTEN_FARBEN[pilot] ?? { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400' };
}
