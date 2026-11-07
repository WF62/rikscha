-- Fahrzeuge und Kutscher in der Datenbank pflegen (statt fest im Code).
-- Einmal im Supabase SQL-Editor (Projekt App_Sammlung) ausführen. Mehrfaches Ausführen schadet nicht.

create table if not exists rikscha_fahrzeuge (
  id            text primary key,              -- kurzer Schlüssel, z. B. 'flotte_lotte'
  name          text not null,
  typ           text not null default 'Rikscha',
  max_gaeste    int  not null default 1 check (max_gaeste between 0 and 6),
  rollstuhl     boolean not null default false,
  farbe_hex     text not null default '#6b7280',  -- Punkt-/Rahmenfarbe
  bg_hex        text not null default '#e5e7eb',  -- Hintergrundfarbe
  verfuegbar_ab date,                           -- leer = sofort buchbar
  aktiv         boolean not null default true,
  reihenfolge   int  not null default 100,
  notiz         text,
  erstellt_am   timestamptz not null default now()
);

create table if not exists rikscha_kutscher (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  aktiv       boolean not null default true,
  reihenfolge int  not null default 100,
  erstellt_am timestamptz not null default now()
);

-- Zugriff nur über die Server-API (Service-Key). Keine öffentlichen Policies.
alter table rikscha_fahrzeuge enable row level security;
alter table rikscha_kutscher  enable row level security;

-- Bisherige Fahrzeuge übernehmen
insert into rikscha_fahrzeuge (id, name, typ, max_gaeste, farbe_hex, bg_hex, reihenfolge) values
  ('flotte_lotte',    'Flotte Lotte',    'Rikscha',        2, '#15803d', '#86efac', 10),
  ('flinker_flitzer', 'Flinker Flitzer', 'Liegetandem',    1, '#1d4ed8', '#93c5fd', 20),
  ('jruuse_piter',    'Jruuse Piter',    'Paralleltandem', 1, '#ea580c', '#fdba74', 30)
on conflict (id) do nothing;

-- Bisherige Kutscher übernehmen
insert into rikscha_kutscher (name, reihenfolge)
select n, row_number() over () * 10
from unnest(array['Doro','Guido','Hans-Heinrich','Helenah','Heribert','Holger','Lucia','Rolf','Sabine','Walter','Werner']) as n
on conflict (name) do nothing;

-- Feste Fahrzeugliste in den Buchungs-/Sperr-Tabellen aufheben, damit neue Fahrzeuge möglich sind
alter table rikscha_sperren   drop constraint if exists rikscha_sperren_fahrzeug_check;
alter table rikscha_buchungen drop constraint if exists rikscha_buchungen_fahrzeug_check;
