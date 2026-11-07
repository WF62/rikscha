-- Passwörter der Kutscher sicher speichern (bcrypt-Hash statt Klartext).
-- WICHTIG: Erst ausführen, NACHDEM der passende Code live ist (sonst klappt kein Login mehr).
-- Einmal im Supabase SQL-Editor (Projekt App_Sammlung) ausführen. Mehrfaches Ausführen schadet nicht.

alter table piloten_zugang add column if not exists passwort_hash text;
alter table piloten_zugang alter column passwort drop not null;

-- Alle vorhandenen Passwörter hashen …
update piloten_zugang
   set passwort_hash = extensions.crypt(passwort, extensions.gen_salt('bf', 10))
 where passwort_hash is null and passwort is not null and passwort <> '';

-- … und den Klartext löschen
update piloten_zugang set passwort = null where passwort_hash is not null;
