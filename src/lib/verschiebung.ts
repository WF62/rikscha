/** Verschiebung einer Fahrt anfragen – gemeinsame Regeln für Server und Seiten */
import { uhrzeitMinuten, zeitPlus } from './touren';

/** So weit darf höchstens verschoben werden (früher oder später) */
export const MAX_VERSCHIEBUNG_MIN = 3 * 60;
export const SCHRITT_MIN = 30;
export const GRUENDE = ['☀️ Hitze', '🌧️ Regen droht', '💨 Wind/Sturm'] as const;

const hhmm = (z: string) => String(z).slice(0, 5);

/** Mögliche neue Zeiten: gleiche Dauer, bis 3 Std. früher/später, am selben Tag (07:00–21:00) */
export function verschiebeOptionen(start: string, ende: string) {
  const s = uhrzeitMinuten(start) ?? 0, e = uhrzeitMinuten(ende) ?? 0, dauer = e - s;
  const liste: { start: string; ende: string; diff: number }[] = [];
  for (let d = -MAX_VERSCHIEBUNG_MIN; d <= MAX_VERSCHIEBUNG_MIN; d += SCHRITT_MIN) {
    if (d === 0) continue;
    const ns = s + d;
    if (ns < 7 * 60 || ns + dauer > 21 * 60) continue;
    const st = zeitPlus('00:00', ns), en = zeitPlus('00:00', ns + dauer);
    if (st && en) liste.push({ start: st, ende: en, diff: d });
  }
  return liste;
}

export function diffText(diff: number) {
  const a = Math.abs(diff), h = Math.floor(a / 60), m = a % 60;
  const t = h && m ? `${h} Std. ${m} Min.` : h ? `${h} Std.` : `${m} Min.`;
  return `${t} ${diff < 0 ? 'früher' : 'später'}`;
}

/** Ist die gewünschte neue Startzeit erlaubt? Gibt die neue Endzeit zurück oder null */
export function verschiebungPruefen(start: string, ende: string, neuStart: string): string | null {
  const o = verschiebeOptionen(start, ende).find((x) => x.start === hhmm(neuStart));
  return o ? o.ende : null;
}

export function anfrageText(b: { verschiebung_start?: string | null; verschiebung_ende?: string | null; verschiebung_grund?: string | null }) {
  if (!b.verschiebung_start || !b.verschiebung_ende) return '';
  return `auf ${hhmm(b.verschiebung_start)}–${hhmm(b.verschiebung_ende)} Uhr${b.verschiebung_grund ? ` (${b.verschiebung_grund})` : ''}`;
}
