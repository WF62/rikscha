/** Hilfsfunktionen für die frei aufbaubare Struktur (Bereiche als Baum). Für Server und Browser. */

export type Bereich = {
  id: string; organisation_id: string; eltern_id: string | null; name: string; reihenfolge: number;
  hinweis?: string | null; kalender_token?: string | null;
};

/** Pfad von oben nach unten, z. B. ["Haus St. Elisabeth", "1. Etage", "Lindenhof"] */
export function bereichKette(bereiche: Bereich[], id: string | null | undefined): Bereich[] {
  const kette: Bereich[] = [];
  let aktuell = bereiche.find((b) => b.id === id);
  const gesehen = new Set<string>();
  while (aktuell && !gesehen.has(aktuell.id)) {
    gesehen.add(aktuell.id);
    kette.unshift(aktuell);
    aktuell = bereiche.find((b) => b.id === aktuell!.eltern_id);
  }
  return kette;
}

export const bereichPfad = (bereiche: Bereich[], id: string | null | undefined, trenner = ' › ') =>
  bereichKette(bereiche, id).map((b) => b.name).join(trenner);

/** Der Bereich selbst und alle darunter liegenden */
export function mitUnterbereichen(bereiche: Bereich[], id: string): Set<string> {
  const ergebnis = new Set<string>([id]);
  let gewachsen = true;
  while (gewachsen) {
    gewachsen = false;
    for (const b of bereiche) {
      if (b.eltern_id && ergebnis.has(b.eltern_id) && !ergebnis.has(b.id)) { ergebnis.add(b.id); gewachsen = true; }
    }
  }
  return ergebnis;
}

/** Baum in Anzeige-Reihenfolge mit Tiefe (für eingerückte Listen und Auswahlfelder) */
export function baumListe(bereiche: Bereich[], orgId?: string): { bereich: Bereich; tiefe: number }[] {
  const liste: { bereich: Bereich; tiefe: number }[] = [];
  const sortiert = [...bereiche].filter((b) => !orgId || b.organisation_id === orgId)
    .sort((a, b) => a.reihenfolge - b.reihenfolge || a.name.localeCompare(b.name, 'de'));
  const besucht = new Set<string>();
  const ebene = (eltern: string | null, tiefe: number) => {
    for (const b of sortiert.filter((x) => (x.eltern_id ?? null) === eltern)) {
      if (besucht.has(b.id)) continue;
      besucht.add(b.id);
      liste.push({ bereich: b, tiefe });
      ebene(b.id, tiefe + 1);
    }
  };
  ebene(null, 0);
  return liste;
}

/** Hinweise für Mitarbeitende: vom obersten Bereich bis zum eigenen (gelten nach unten weiter) */
export const bereichHinweise = (bereiche: Bereich[], id: string | null | undefined) =>
  bereichKette(bereiche, id).filter((b) => b.hinweis).map((b) => `${b.name}: ${b.hinweis}`);
