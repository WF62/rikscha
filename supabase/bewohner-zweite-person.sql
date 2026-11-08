-- Zweiter Bewohner in einer Fahrt (z. B. Rikscha mit 2 Plätzen).
-- Einmal im Supabase SQL-Editor (Projekt App_Sammlung) ausführen. Mehrfaches Ausführen schadet nicht.
alter table rikscha_buchungen add column if not exists bewohner2_id uuid references rikscha_bewohner(id) on delete set null;
create index if not exists rikscha_buchungen_bewohner2 on rikscha_buchungen (bewohner2_id);
