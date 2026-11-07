-- Rikscha Buchungen
create table if not exists rikscha_buchungen (
  id uuid primary key default gen_random_uuid(),
  fahrzeug text not null check (fahrzeug in ('flotte_lotte', 'flinker_flitzer', 'jruuse_piter')),
  pilot text not null,
  gaeste text[] not null default '{}',
  datum date not null,
  startzeit time not null,
  endzeit time not null,
  notiz text,
  storniert boolean not null default false,
  storniert_am timestamptz,
  erstellt_am timestamptz not null default now()
);

-- Rikscha Sperren
create table if not exists rikscha_sperren (
  id uuid primary key default gen_random_uuid(),
  fahrzeug text not null check (fahrzeug in ('flotte_lotte', 'flinker_flitzer', 'jruuse_piter')),
  von_datum date not null,
  bis_datum date not null,
  grund text,
  erstellt_am timestamptz not null default now()
);

alter table rikscha_buchungen enable row level security;
alter table rikscha_sperren enable row level security;

-- Keine Policies für anon/authenticated: Zugriff ausschließlich über die
-- Serverrouten der App (Service-Role). Öffentliche Policies würden es jedem mit
-- dem öffentlichen Schlüssel erlauben, Buchungen zu lesen, zu ändern und zu löschen.
drop policy if exists "public read buchungen"   on rikscha_buchungen;
drop policy if exists "public insert buchungen" on rikscha_buchungen;
drop policy if exists "public update buchungen" on rikscha_buchungen;
drop policy if exists "public delete buchungen" on rikscha_buchungen;
drop policy if exists "public read sperren"     on rikscha_sperren;
drop policy if exists "public insert sperren"   on rikscha_sperren;
drop policy if exists "public delete sperren"   on rikscha_sperren;

create index if not exists idx_buchungen_datum on rikscha_buchungen(datum);
create index if not exists idx_sperren_zeitraum on rikscha_sperren(von_datum, bis_datum);

-- Piloten Dateien
create table if not exists piloten_dateien (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kategorie text not null default 'Sonstiges',
  url text not null,
  groesse bigint not null default 0,
  typ text not null default '',
  hochgeladen_von text not null,
  storage_pfad text not null,
  erstellt_am timestamptz not null default now()
);

alter table piloten_dateien enable row level security;

create policy "public read piloten_dateien" on piloten_dateien for select using (true);
create policy "public insert piloten_dateien" on piloten_dateien for insert with check (true);
create policy "public delete piloten_dateien" on piloten_dateien for delete using (true);

create index if not exists idx_piloten_dateien_erstellt on piloten_dateien(erstellt_am desc);
