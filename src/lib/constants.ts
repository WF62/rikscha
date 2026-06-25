export const FAHRZEUGE = [
  {
    id: 'flotte_lotte',
    name: 'Flotte Lotte',
    typ: 'Rikscha',
    maxGaeste: 2,
    farbe: 'bg-green-200 border-green-600 text-green-900',
    farbeDot: 'bg-green-600',
  },
  {
    id: 'flinker_flitzer',
    name: 'Flinker Flitzer',
    typ: 'Liegetandem',
    maxGaeste: 1,
    farbe: 'bg-blue-200 border-blue-600 text-blue-900',
    farbeDot: 'bg-blue-600',
  },
  {
    id: 'jruuse_piter',
    name: 'Jruuse Piter',
    typ: 'Paralleltandem',
    maxGaeste: 1,
    farbe: 'bg-orange-200 border-orange-500 text-orange-900',
    farbeDot: 'bg-orange-500',
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

export function fahrzeugById(id: string) {
  return FAHRZEUGE.find((f) => f.id === id);
}
