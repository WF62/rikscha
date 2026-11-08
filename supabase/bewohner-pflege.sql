-- Bewohnerfahrten: Rolle "Pflege", Bewohnerliste, Fahrtwünsche und freie Fahrzeiten.
-- Einmal im Supabase SQL-Editor (Projekt App_Sammlung) ausführen. Mehrfaches Ausführen schadet nicht.
-- Kann vor oder nach dem Code-Update laufen.

-- 1. Neue Rolle "pflege" erlauben
alter table piloten_zugang drop constraint if exists piloten_zugang_rolle_check;
alter table piloten_zugang add constraint piloten_zugang_rolle_check
  check (rolle = any (array['pilot', 'gfo', 'admin', 'angehoeriger', 'pflege']));

-- 2. Bewohner (bewusst sparsam: keine Diagnosen, kein Geburtsdatum)
create table if not exists rikscha_bewohner (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 80),
  wohnbereich text check (char_length(wohnbereich) <= 60),
  rollstuhl   boolean not null default false,
  hinweis     text check (char_length(hinweis) <= 200),   -- z. B. "braucht eine Decke"
  aktiv       boolean not null default true,
  erstellt_am timestamptz not null default now()
);
alter table rikscha_bewohner enable row level security;   -- nur über die Server-API

-- 3. Fahrten: Bezug zum Bewohner und "freie Fahrzeit" (Angebot eines Kutschers)
alter table rikscha_buchungen add column if not exists bewohner_id uuid references rikscha_bewohner(id) on delete set null;
alter table rikscha_buchungen add column if not exists angebot boolean not null default false;
create index if not exists rikscha_buchungen_bewohner on rikscha_buchungen (bewohner_id);

-- 4. Zweiter Bewohner in derselben Fahrt (siehe auch bewohner-zweite-person.sql)
alter table rikscha_buchungen add column if not exists bewohner2_id uuid references rikscha_bewohner(id) on delete set null;
create index if not exists rikscha_buchungen_bewohner2 on rikscha_buchungen (bewohner2_id);

-- Wunschfahrt (Tour oder eigener Wunsch, z. B. "Zum Rhein")
alter table rikscha_buchungen add column if not exists wunschfahrt text check (char_length(wunschfahrt) <= 120);

-- Abholort (siehe auch abholort.sql)
alter table rikscha_buchungen add column if not exists abholort text check (char_length(abholort) <= 120);
