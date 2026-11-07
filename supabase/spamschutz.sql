-- Spam-Schutz: zählt öffentliche Anfragen pro Gerät (nur ein anonymer Hash, keine IP-Adresse).
-- Einmal im Supabase SQL-Editor (Projekt App_Sammlung) ausführen. Mehrfaches Ausführen schadet nicht.

create table if not exists rikscha_anfragen_log (
  id          bigserial primary key,
  aktion      text not null,           -- z. B. 'buchung', 'kontakt', 'login-fehler'
  schluessel  text not null,           -- gekürzter SHA-256-Hash aus IP + Geheimwert
  erstellt_am timestamptz not null default now()
);

create index if not exists rikscha_anfragen_log_suche
  on rikscha_anfragen_log (aktion, schluessel, erstellt_am desc);

-- Nur die Server-API (Service-Key) greift zu. Keine öffentlichen Policies.
alter table rikscha_anfragen_log enable row level security;
