-- Vermittlung durch Organisationen (Seniorenheim, Quartier …), Fahrgäste mit Adresse/Telefon,
-- automatische Löschfrist und Gruppenfahrten.
-- BITTE VOR dem Code-Update ausführen. Einmal im Supabase SQL-Editor (Projekt App_Sammlung).
-- Mehrfaches Ausführen schadet nicht.

-- 1. Organisationen, die Fahrten vermitteln
create table if not exists rikscha_organisationen (
  id                uuid primary key default gen_random_uuid(),
  name              text not null unique check (char_length(name) between 1 and 80),
  art               text not null default 'einrichtung' check (art in ('einrichtung', 'quartier')),
  standard_abholort text check (char_length(standard_abholort) <= 120),
  aktiv             boolean not null default true,
  erstellt_am       timestamptz not null default now()
);
alter table rikscha_organisationen enable row level security;   -- nur über die Server-API

insert into rikscha_organisationen (name, art, standard_abholort)
values ('GFO Seniorenheim', 'einrichtung', 'GFO, Eingang Elisabeth')
on conflict (name) do nothing;

-- 2. Vermittlungs-Zugänge gehören zu einer Organisation (bisherige Pflege-Zugänge → GFO)
alter table piloten_zugang add column if not exists organisation_id uuid references rikscha_organisationen(id) on delete set null;
update piloten_zugang set organisation_id = (select id from rikscha_organisationen where name = 'GFO Seniorenheim')
 where rolle = 'pflege' and organisation_id is null;

-- 3. Fahrgäste (Tabelle heißt historisch rikscha_bewohner)
alter table rikscha_bewohner add column if not exists organisation_id uuid references rikscha_organisationen(id) on delete set null;
alter table rikscha_bewohner add column if not exists telefon text check (char_length(telefon) <= 40);
alter table rikscha_bewohner add column if not exists adresse text check (char_length(adresse) <= 160);
-- Löschfrist: Telefon und Adresse werden 12 Monate nach dem letzten Kontakt gelöscht
alter table rikscha_bewohner add column if not exists letzter_kontakt date not null default current_date;
update rikscha_bewohner set organisation_id = (select id from rikscha_organisationen where name = 'GFO Seniorenheim')
 where organisation_id is null;

-- 4. Gruppenfahrten: eine Gruppe, mehrere Fahrzeuge (= mehrere Fahrten mit derselben gruppe_id)
create table if not exists rikscha_gruppen (
  id              uuid primary key default gen_random_uuid(),
  titel           text not null check (char_length(titel) between 1 and 80),
  organisation_id uuid references rikscha_organisationen(id) on delete set null,
  organisator     text check (char_length(organisator) <= 80),
  datum           date not null,
  erstellt_am     timestamptz not null default now()
);
alter table rikscha_gruppen enable row level security;

alter table rikscha_buchungen add column if not exists gruppe_id uuid references rikscha_gruppen(id) on delete set null;
create index if not exists rikscha_buchungen_gruppe on rikscha_buchungen (gruppe_id);

-- 5. Abholort und zweite Person (falls noch nicht ausgeführt)
alter table rikscha_buchungen add column if not exists abholort text check (char_length(abholort) <= 120);
alter table rikscha_buchungen add column if not exists bewohner2_id uuid references rikscha_bewohner(id) on delete set null;
