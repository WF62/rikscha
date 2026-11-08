-- Freie Fahrzeiten der Kutscher auch für Interessierte aus dem Quartier öffnen.
-- Einmal im Supabase SQL-Editor (Projekt App_Sammlung) ausführen. Mehrfaches Ausführen schadet nicht.
alter table rikscha_buchungen add column if not exists oeffentlich boolean not null default false;
-- Telefon für Rückfragen bei öffentlich gebuchten Zeiten; wird 7 Tage nach dem Fahrttag automatisch gelöscht
alter table rikscha_buchungen add column if not exists kontakt_telefon text check (char_length(kontakt_telefon) <= 40);
