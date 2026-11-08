-- Frei aufbaubare Struktur je Organisation: Bereiche (beliebig tief, z. B. Haus → Etage → Wohnbereich)
-- und Gruppen quer dazu (z. B. Sitztanz, Erzählcafé). Wird nach und nach in der App ergänzt.
-- Einmal im Supabase SQL-Editor (Projekt App_Sammlung) ausführen. Mehrfaches Ausführen schadet nicht.

create table if not exists rikscha_bereiche (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references rikscha_organisationen(id) on delete cascade,
  eltern_id       uuid references rikscha_bereiche(id) on delete restrict,   -- leer = oberste Ebene
  name            text not null check (char_length(name) between 1 and 60),
  reihenfolge     int  not null default 100,
  erstellt_am     timestamptz not null default now()
);
create index if not exists rikscha_bereiche_org on rikscha_bereiche (organisation_id);
-- Hinweis für die Mitarbeitenden des Bereichs (gilt auch für Unterbereiche), z. B. „10 Min. vorher im Foyer bereitstellen“
alter table rikscha_bereiche add column if not exists hinweis text check (char_length(hinweis) <= 300);
-- Geheimer Kalender-Link je Bereich (für Outlook/Dienstplan der Einrichtung)
alter table rikscha_bereiche add column if not exists kalender_token text unique
  default replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
update rikscha_bereiche set kalender_token = replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '')
 where kalender_token is null;
alter table rikscha_bereiche enable row level security;   -- nur über die Server-API

alter table rikscha_bewohner add column if not exists bereich_id uuid references rikscha_bereiche(id) on delete set null;

-- Gruppen (in der App „Gruppen“, technisch „Kreise“, um sie von Gruppenfahrten zu unterscheiden)
create table if not exists rikscha_kreise (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references rikscha_organisationen(id) on delete cascade,
  name            text not null check (char_length(name) between 1 and 60),
  erstellt_am     timestamptz not null default now(),
  unique (organisation_id, name)
);
alter table rikscha_kreise enable row level security;

create table if not exists rikscha_kreis_mitglieder (
  kreis_id    uuid not null references rikscha_kreise(id) on delete cascade,
  bewohner_id uuid not null references rikscha_bewohner(id) on delete cascade,
  primary key (kreis_id, bewohner_id)
);
alter table rikscha_kreis_mitglieder enable row level security;
