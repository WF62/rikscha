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
| GET | `/api/ical?pilot=&fahrzeug=` | iCal Feed |
