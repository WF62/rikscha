-- Zweiter Bewohner in einer Fahrt (z. B. Rikscha mit 2 Plätzen) und Wunschfahrt.
-- Einmal im Supabase SQL-Editor (Projekt App_Sammlung) ausführen. Mehrfaches Ausführen schadet nicht.
alter table rikscha_buchungen add column if not exists bewohner2_id uuid references rikscha_bewohner(id) on delete set null;
create index if not exists rikscha_buchungen_bewohner2 on rikscha_buchungen (bewohner2_id);

-- Wunschfahrt (Tour oder eigener Wunsch, z. B. "Zum Rhein")
alter table rikscha_buchungen add column if not exists wunschfahrt text check (char_length(wunschfahrt) <= 120);
