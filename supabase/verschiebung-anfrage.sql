-- Anfrage, eine Fahrt zeitlich zu verschieben (z. B. wegen Hitze oder Regen).
-- Eine Seite (Kutscher oder Vermittlung) fragt an, die andere bestätigt oder lehnt ab.
alter table rikscha_buchungen add column if not exists verschiebung_start time;
alter table rikscha_buchungen add column if not exists verschiebung_ende time;
alter table rikscha_buchungen add column if not exists verschiebung_grund text;
alter table rikscha_buchungen add column if not exists verschiebung_von text;
alter table rikscha_buchungen add column if not exists verschiebung_seite text;
alter table rikscha_buchungen add column if not exists verschiebung_am timestamptz;
-- Ergebnis der letzten Anfrage (angenommen/abgelehnt), damit die anfragende Seite es sieht
alter table rikscha_buchungen add column if not exists verschiebung_ergebnis text;

alter table rikscha_buchungen drop constraint if exists rikscha_buchungen_verschiebung_seite_check;
alter table rikscha_buchungen add constraint rikscha_buchungen_verschiebung_seite_check
  check (verschiebung_seite is null or verschiebung_seite in ('kutscher', 'vermittlung'));
