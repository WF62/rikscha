export const FAHRZEUGE = [
  {
    id: 'flotte_lotte',
    name: 'Flotte Lotte',
    typ: 'Rikscha',
    maxGaeste: 2,
    farbe: 'bg-green-100 border-green-400 text-green-800',
    farbeDot: 'bg-green-500',
  },
  {
    id: 'flinker_flitzer',
    name: 'Flinker Flitzer',
    typ: 'Liegetandem',
    maxGaeste: 1,
    farbe: 'bg-blue-100 border-blue-400 text-blue-800',
    farbeDot: 'bg-blue-500',
  },
  {
    id: 'jruuse_piter',
    name: 'Jruuse Piter',
    typ: 'Paralleltandem',
    maxGaeste: 1,
    farbe: 'bg-amber-100 border-amber-400 text-amber-800',
    farbeDot: 'bg-amber-500',
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
