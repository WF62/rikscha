-- Freie Fahrzeit als Zeitfenster: Gäste buchen darin kürzere Fahrten, auch mehrere nacheinander.
-- Jede gebuchte Fahrt verweist auf ihr Zeitfenster; das Fenster selbst bleibt als „freie Fahrzeit“ bestehen.
alter table rikscha_buchungen add column if not exists angebot_id uuid references rikscha_buchungen(id) on delete set null;
create index if not exists rikscha_buchungen_angebot_id_idx on rikscha_buchungen (angebot_id);
