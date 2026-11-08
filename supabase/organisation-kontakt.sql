-- Kontaktdaten der vermittelnden Stellen (Ansprechperson, Telefon, E-Mail).
-- Einmal im Supabase SQL-Editor (Projekt App_Sammlung) ausführen. Mehrfaches Ausführen schadet nicht.
alter table rikscha_organisationen add column if not exists ansprechperson text check (char_length(ansprechperson) <= 80);
alter table rikscha_organisationen add column if not exists telefon text check (char_length(telefon) <= 40);
alter table rikscha_organisationen add column if not exists email text check (char_length(email) <= 120);
