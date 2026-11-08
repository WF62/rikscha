-- Abholort für Fahrten (Standard bei Bewohnerfahrten: "GFO, Eingang Elisabeth").
-- Einmal im Supabase SQL-Editor (Projekt App_Sammlung) ausführen. Mehrfaches Ausführen schadet nicht.
alter table rikscha_buchungen add column if not exists abholort text check (char_length(abholort) <= 120);
