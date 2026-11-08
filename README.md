# Rikscha Fahrtenkalender

Kalender & Buchungssystem fuer das Rikscha-Team.

## Fahrzeuge

| ID | Name | Typ | Max. Gaeste |
|---|---|---|---|
| `flotte_lotte` | Flotte Lotte | Rikscha | 2 |
| `flinker_flitzer` | Flinker Flitzer | Liegetandem | 1 |
| `jruuse_piter` | Jruuse Piter | Paralleltandem | 1 |

## Piloten

Walter, Hans-Heinrich, Lucia, Sabine, Werner, Holger, Guido, Helenah

## Setup

1. `supabase/schema.sql` im Supabase SQL-Editor ausfuehren
2. `.env.example` nach `.env.local` kopieren und Werte eintragen
3. `npm install && npm run dev`

## Umgebungsvariablen

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## API

| Methode | Route | Beschreibung |
|---|---|---|
| GET/POST | `/api/buchungen` | Buchungen abrufen / erstellen |
| PATCH/DELETE | `/api/buchungen/[id]` | Stornieren / loeschen |
| GET/POST | `/api/sperren` | Sperren abrufen / erstellen |
| DELETE | `/api/sperren/[id]` | Sperre loeschen |
| GET | `/api/ical?pilot=&fahrzeug=&key=` | iCal Feed (Gastnamen nur mit `key` = `ICAL_KEY`) |

## Zugriffsschutz

- Fahrten ändern/stornieren und Fahrzeuge sperren: nur angemeldete Kutscher, GFO und Admin
  (Zugangsdaten als Header `x-pilot` / `x-password`, siehe `src/lib/authHeaders.ts`).
  Angehörige dürfen nur ihre eigenen Buchungen ändern. Endgültig löschen: nur Admin.
- Gastnamen und Notizen in `/api/buchungen` sehen nur angemeldete Kutscher; alle anderen sehen „Gast“.
- Im iCal-Feed stehen Gastnamen nur, wenn der Link `?key=<ICAL_KEY>` enthält. Ohne `ICAL_KEY` zeigt der Feed nur die Anzahl der Gäste.

## Fahrzeuge und Kutscher pflegen

Fahrzeuge und die Kutscher-Auswahlliste stehen in den Tabellen `rikscha_fahrzeuge` und `rikscha_kutscher`
(einmalig `supabase/stammdaten-fahrzeuge-kutscher.sql` im Supabase SQL-Editor ausführen).
Gepflegt wird im Admin-Bereich unter „Fahrzeuge & Kutscher“. Ein Fahrzeug mit „Verfügbar ab“ ist vorher
nicht buchbar – so können bestellte Fahrzeuge schon eingetragen werden. Solange die Tabellen fehlen,
nutzt die App die festen Werte aus `src/lib/constants.ts`.

## Spam-Schutz

Öffentliche Formulare (Buchen, Kontakt, Gäste-Fotos, Abstimmung) und die Logins sind geschützt durch:
ein unsichtbares Lockfeld, eine Mindest-Ausfüllzeit von 3 Sekunden und Obergrenzen pro Gerät
(Tabelle `rikscha_anfragen_log`, einmalig `supabase/spamschutz.sql` ausführen). Gespeichert wird nur ein
gekürzter Hash aus IP-Adresse und Geheimwert (`SPAM_SALT`, optional), keine IP-Adresse. Angemeldete
Kutscher sind von den Grenzen ausgenommen. Fehlt die Tabelle, greifen nur Lockfeld und Ausfüllzeit.

| Aktion | Grenze pro Gerät |
|---|---|
| Buchung (nicht angemeldet) | 5 pro Stunde, 15 pro Tag |
| Kontaktformular | 3 pro Stunde, 10 pro Tag |
| Gäste-Foto | 10 pro Stunde, 30 pro Tag (nur Bilder, max. 10 MB) |
| Abstimmung | 1 pro Foto und Tag, 50 pro Tag |
| Falsches Passwort | 10 in 15 Minuten, 30 pro Tag |

## Passwörter

Kutscher-Passwörter stehen nur als bcrypt-Hash in `piloten_zugang.passwort_hash`
(einmalig `supabase/passwoerter-hashen.sql` ausführen – erst nachdem der Code live ist).
Nach dem Login speichert der Browser nicht das Passwort, sondern einen Anmelde-Token (90 Tage gültig,
ungültig nach Passwortänderung). Signiert wird mit `SESSION_SECRET` (optional, sonst Service-Key).
Alte Anmeldungen werden beim nächsten Seitenaufruf automatisch auf einen Token umgestellt.

## Bewohnerfahrten (Pflege)

Rolle `pflege` (im Admin-Bereich vergeben) öffnet die Seite `/pflege`:
- **Bewohner** anlegen: Name, Wohnbereich, Rollstuhl, kurzer Hinweis – bewusst keine Gesundheitsdaten. Löschen entfernt den Namen auch aus alten Fahrten.
- **Freie Fahrzeiten belegen:** Kutscher bieten beim Buchen „freie Fahrzeit für Bewohner“ an, die Pflege ordnet einen Bewohner zu.
- **Fahrtwunsch melden:** erscheint im Kalender als offene Fahrt, ein Kutscher tippt „Ich übernehme“.
- Rollstuhl-Bewohner nur mit Fahrzeugen, die als rollstuhlgeeignet eingetragen sind.

Bewohnernamen sehen nur Kutscher und Pflege; öffentlich erscheinen sie als „Gast“, in der Team-Mail gar nicht.
Einmalig `supabase/bewohner-pflege.sql` ausführen.

## Vermittlung durch Organisationen und Gruppenfahrten

- **Organisationen** (Admin-Bereich): z. B. „GFO Seniorenheim“ (Einrichtung, Standard-Abholort „GFO, Eingang Elisabeth“),
  Quartiersbüro, Kirchengemeinde (Quartier). Zugänge mit der Rolle „Vermittlung“ gehören zu einer Organisation
  und sehen nur deren Fahrgäste. Freie Fahrzeiten der Kutscher sehen alle gleich – wer zuerst zuordnet, bekommt sie.
- **Fahrgäste aus dem Quartier** haben Adresse und Telefon. Beides sehen nur der Kutscher, der die Fahrt übernimmt,
  Admin/GFO und die eigene Organisation. Es wird **12 Monate nach dem letzten Kontakt** automatisch gelöscht
  (`DATEN_FRIST_MONATE` in `src/lib/datenschutz-server.ts`); jede neue Fahrt oder Änderung startet die Frist neu.
- **Gruppenfahrten**: Eine Person plant Tag, Uhrzeit, Fahrgäste und mehrere Fahrzeuge. Die App verteilt alle
  (Rollstuhl zuerst auf geeignete Fahrzeuge) und legt je Fahrzeug eine Fahrt an, die ein Kutscher übernimmt.
- Einmalig `supabase/vermittlung-gruppen.sql` ausführen – **vor** dem Code-Update.
