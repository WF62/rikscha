'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Bewohner, Buchung } from '@/lib/supabase';
import { authHeaders } from '@/lib/authHeaders';
import { useStammdaten } from '@/lib/useStammdaten';
import { istBuchbarAm } from '@/lib/stammdaten';

type Daten = { bewohner: Bewohner[]; angebote: Buchung[]; fahrten: Buchung[] };
const ERLAUBT = ['pflege', 'gfo', 'admin'];
const feld = 'w-full border rounded px-3 py-2 text-base';

function tagText(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
}
const zeit = (b: Buchung) => `${b.startzeit.slice(0, 5)}–${b.endzeit.slice(0, 5)} Uhr`;

async function senden(body: Record<string, unknown>) {
  const r = await fetch('/api/pflege', {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body),
  });
  if (r.ok) return null;
  const j = await r.json().catch(() => ({}));
  return (j.error as string) ?? 'Das hat nicht geklappt.';
}

export default function PflegeSeite() {
  const { fahrzeuge, fahrzeugById } = useStammdaten();
  const [zugang, setZugang] = useState<'pruefen' | 'ok' | 'nein'>('pruefen');
  const [daten, setDaten] = useState<Daten | null>(null);
  const [ladeFehler, setLadeFehler] = useState('');
  const [meldung, setMeldung] = useState<{ text: string; ok: boolean } | null>(null);
  const [auswahl, setAuswahl] = useState<Record<string, string>>({}); // Angebot-ID → Bewohner-ID
  const [wunsch, setWunsch] = useState({ bewohner_id: '', datum: '', startzeit: '14:00', endzeit: '15:00', fahrzeug: '', notiz: '' });
  const [neuerBewohner, setNeuerBewohner] = useState({ name: '', wohnbereich: '', rollstuhl: false, hinweis: '' });
  const [bearbeiten, setBearbeiten] = useState<Bewohner | null>(null);

  const laden = useCallback(async () => {
    const r = await fetch('/api/pflege', { headers: authHeaders() });
    if (r.status === 401) { setZugang('nein'); return; }
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { setLadeFehler(j.error ?? 'Laden fehlgeschlagen.'); return; }
    setLadeFehler(''); setDaten(j);
  }, []);

  useEffect(() => {
    const rolle = localStorage.getItem('pilot_rolle');
    if (!localStorage.getItem('pilot_name') || !ERLAUBT.includes(rolle ?? '')) { setZugang('nein'); return; }
    setZugang('ok'); laden();
  }, [laden]);

  const zeige = (text: string, ok = true) => { setMeldung({ text, ok }); setTimeout(() => setMeldung(null), 4000); };
  const ausfuehren = async (body: Record<string, unknown>, ok: string) => {
    const f = await senden(body);
    if (f) { zeige(f, false); return false; }
    zeige(ok); await laden(); return true;
  };

  if (zugang === 'pruefen') return null;
  if (zugang === 'nein') {
    return (
      <div className="max-w-md mx-auto mt-16 bg-white rounded-xl shadow p-6 text-center space-y-3">
        <h2 className="text-xl font-bold text-rikscha-green">Bereich für die Pflege</h2>
        <p className="text-gray-600">Bitte melde dich auf der Startseite mit deinem Pflege-Zugang an (Menü „Kutscher-Bereich“).</p>
        <a href="/" className="inline-block bg-rikscha-green text-white rounded px-4 py-2 font-semibold">Zur Startseite</a>
      </div>
    );
  }

  const bewohner = daten?.bewohner ?? [];
  const aktive = bewohner.filter((b) => b.aktiv);
  const bewohnerById = (id?: string | null) => bewohner.find((b) => b.id === id);

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-2xl font-bold text-rikscha-green">🚲 Rikscha-Fahrten für Bewohner</h2>
        <a href="/kalender" className="text-sm text-rikscha-green underline">Zum Kalender</a>
      </div>

      {meldung && (
        <div role="status" className={`rounded-lg px-4 py-2 text-sm border ${meldung.ok ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
          {meldung.text}
        </div>
      )}
      {ladeFehler && <div className="rounded-lg px-4 py-3 text-sm bg-amber-50 border border-amber-300 text-amber-900">{ladeFehler}</div>}
      {!daten && !ladeFehler && <p className="text-gray-400">Wird geladen…</p>}

      {daten && (
        <>
          {/* 1. Freie Fahrzeiten der Kutscher */}
          <section className="bg-white rounded-xl shadow p-5">
            <h3 className="font-bold text-lg text-gray-800 mb-1">Freie Fahrzeiten der Kutscher</h3>
            <p className="text-sm text-gray-500 mb-3">Kutscher bieten diese Zeiten an. Wähle einen Bewohner und tippe auf „Zuordnen“.</p>
            {daten.angebote.length === 0 && <p className="text-sm text-gray-400">Im Moment sind keine freien Zeiten eingetragen.</p>}
            <div className="space-y-3">
              {daten.angebote.map((a) => {
                const fz = fahrzeugById(a.fahrzeug);
                return (
                  <div key={a.id} className="border rounded-lg p-3 flex flex-wrap items-center gap-3">
                    <div className="flex-1 min-w-[200px]">
                      <div className="font-semibold">{tagText(a.datum)}, {zeit(a)}</div>
                      <div className="text-sm text-gray-600">
                        Kutscher: {a.pilot} · {fz?.name ?? a.fahrzeug} (max. {fz?.maxGaeste ?? 1} {(fz?.maxGaeste ?? 1) > 1 ? 'Gäste' : 'Gast'}){fz?.rollstuhl ? ' · ♿ Rollstuhl möglich' : ''}
                      </div>
                    </div>
                    <select aria-label="Bewohner wählen" value={auswahl[a.id] ?? ''} onChange={(e) => setAuswahl({ ...auswahl, [a.id]: e.target.value })}
                      className="border rounded px-2 py-2">
                      <option value="">Bewohner wählen…</option>
                      {aktive.map((b) => (
                        <option key={b.id} value={b.id} disabled={b.rollstuhl && !fz?.rollstuhl}>
                          {b.name}{b.wohnbereich ? ` (${b.wohnbereich})` : ''}{b.rollstuhl ? ' ♿' : ''}{b.rollstuhl && !fz?.rollstuhl ? ' – Fahrzeug passt nicht' : ''}
                        </option>
                      ))}
                    </select>
                    <button disabled={!auswahl[a.id]} className="bg-rikscha-green text-white rounded px-4 py-2 font-semibold disabled:opacity-40"
                      onClick={async () => { if (await ausfuehren({ aktion: 'belegen', buchung_id: a.id, bewohner_id: auswahl[a.id] }, 'Zugeordnet. Der Kutscher sieht die Fahrt im Kalender.')) setAuswahl({ ...auswahl, [a.id]: '' }); }}>
                      Zuordnen
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 2. Fahrtwunsch melden */}
          <section className="bg-white rounded-xl shadow p-5">
            <h3 className="font-bold text-lg text-gray-800 mb-1">Fahrtwunsch melden</h3>
            <p className="text-sm text-gray-500 mb-3">Kein passender Termin dabei? Trage einen Wunsch ein. Ein Kutscher übernimmt ihn im Kalender.</p>
            <form className="grid grid-cols-1 sm:grid-cols-2 gap-3" onSubmit={async (e) => {
              e.preventDefault();
              if (await ausfuehren({ aktion: 'wunsch', ...wunsch }, 'Fahrtwunsch gemeldet. Das Rikscha-Team wird benachrichtigt.')) {
                setWunsch({ ...wunsch, bewohner_id: '', notiz: '' });
              }
            }}>
              <label className="sm:col-span-2 text-sm font-semibold">Bewohner
                <select required value={wunsch.bewohner_id} onChange={(e) => setWunsch({ ...wunsch, bewohner_id: e.target.value })} className={feld}>
                  <option value="">Bitte wählen…</option>
                  {aktive.map((b) => <option key={b.id} value={b.id}>{b.name}{b.wohnbereich ? ` (${b.wohnbereich})` : ''}{b.rollstuhl ? ' ♿' : ''}</option>)}
                </select>
              </label>
              <label className="text-sm font-semibold">Tag
                <input required type="date" value={wunsch.datum} onChange={(e) => setWunsch({ ...wunsch, datum: e.target.value })} className={feld} />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="text-sm font-semibold">Von
                  <input required type="time" value={wunsch.startzeit} onChange={(e) => setWunsch({ ...wunsch, startzeit: e.target.value })} className={feld} />
                </label>
                <label className="text-sm font-semibold">Bis
                  <input required type="time" value={wunsch.endzeit} onChange={(e) => setWunsch({ ...wunsch, endzeit: e.target.value })} className={feld} />
                </label>
              </div>
              <label className="text-sm font-semibold">Fahrzeug (optional)
                <select value={wunsch.fahrzeug} onChange={(e) => setWunsch({ ...wunsch, fahrzeug: e.target.value })} className={feld}>
                  <option value="">Egal – sucht der Kutscher aus</option>
                  {fahrzeuge.map((f) => {
                    const passtNicht = !!bewohnerById(wunsch.bewohner_id)?.rollstuhl && !f.rollstuhl;
                    return <option key={f.id} value={f.id} disabled={passtNicht || !istBuchbarAm(f, wunsch.datum)}>{f.name}{f.rollstuhl ? ' ♿' : ''}{passtNicht ? ' – nicht für Rollstuhl' : ''}</option>;
                  })}
                </select>
              </label>
              <label className="text-sm font-semibold">Hinweis für den Kutscher (optional)
                <input value={wunsch.notiz} maxLength={500} onChange={(e) => setWunsch({ ...wunsch, notiz: e.target.value })} className={feld} placeholder="z. B. am Haupteingang abholen" />
              </label>
              <div className="sm:col-span-2">
                <button type="submit" className="bg-rikscha-green text-white rounded px-5 py-2 font-semibold">Wunsch melden</button>
              </div>
            </form>
          </section>

          {/* 3. Geplante Bewohnerfahrten */}
          <section className="bg-white rounded-xl shadow p-5">
            <h3 className="font-bold text-lg text-gray-800 mb-3">Geplante Bewohnerfahrten ({daten.fahrten.length})</h3>
            {daten.fahrten.length === 0 && <p className="text-sm text-gray-400">Noch keine Fahrten geplant.</p>}
            <div className="space-y-2">
              {daten.fahrten.map((f) => {
                const bw = bewohnerById(f.bewohner_id);
                return (
                  <div key={f.id} className="border rounded-lg p-3 flex flex-wrap items-center gap-3">
                    <div className="flex-1 min-w-[200px]">
                      <div className="font-semibold">{bw?.name ?? f.gaeste?.[0] ?? 'Bewohner'}{bw?.rollstuhl ? ' ♿' : ''}</div>
                      <div className="text-sm text-gray-600">{tagText(f.datum)}, {zeit(f)}{f.fahrzeug ? ` · ${fahrzeugById(f.fahrzeug)?.name ?? f.fahrzeug}` : ''}</div>
                    </div>
                    {f.pilot
                      ? <span className="text-sm bg-green-100 text-green-800 rounded-full px-3 py-1">✓ Kutscher: {f.pilot}</span>
                      : <span className="text-sm bg-orange-100 text-orange-800 rounded-full px-3 py-1">Kutscher gesucht</span>}
                    <button className="text-sm text-red-600 underline"
                      onClick={async () => { if (confirm(`Fahrt für ${bw?.name ?? 'den Bewohner'} absagen?`)) await ausfuehren({ aktion: 'absagen', buchung_id: f.id }, 'Die Fahrt wurde abgesagt.'); }}>
                      Absagen
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 4. Bewohner */}
          <section className="bg-white rounded-xl shadow p-5">
            <h3 className="font-bold text-lg text-gray-800 mb-1">Bewohner ({aktive.length})</h3>
            <p className="text-sm text-gray-500 mb-3">Nur das Nötigste eintragen: keine Diagnosen, kein Geburtsdatum. Kutscher sehen Name, Wohnbereich, Rollstuhl und Hinweis.</p>
            <form className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-4 items-end" onSubmit={async (e) => {
              e.preventDefault();
              if (await ausfuehren({ aktion: 'bewohner-neu', ...neuerBewohner }, `${neuerBewohner.name} wurde angelegt.`)) setNeuerBewohner({ name: '', wohnbereich: '', rollstuhl: false, hinweis: '' });
            }}>
              <label className="text-sm font-semibold">Name
                <input required maxLength={80} value={neuerBewohner.name} onChange={(e) => setNeuerBewohner({ ...neuerBewohner, name: e.target.value })} className={feld} />
              </label>
              <label className="text-sm font-semibold">Wohnbereich
                <input maxLength={60} value={neuerBewohner.wohnbereich} onChange={(e) => setNeuerBewohner({ ...neuerBewohner, wohnbereich: e.target.value })} className={feld} />
              </label>
              <label className="text-sm font-semibold sm:col-span-2">Hinweis (optional)
                <input maxLength={200} value={neuerBewohner.hinweis} onChange={(e) => setNeuerBewohner({ ...neuerBewohner, hinweis: e.target.value })} className={feld} placeholder="z. B. braucht eine Decke" />
              </label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={neuerBewohner.rollstuhl} onChange={(e) => setNeuerBewohner({ ...neuerBewohner, rollstuhl: e.target.checked })} /> ♿ Rollstuhl</label>
              <button type="submit" className="bg-rikscha-green text-white rounded px-4 py-2 font-semibold sm:col-span-1">+ Anlegen</button>
            </form>
            <div className="divide-y">
              {bewohner.map((b) => bearbeiten?.id === b.id ? (
                <form key={b.id} className="py-2 grid grid-cols-1 sm:grid-cols-4 gap-2 items-end" onSubmit={async (e) => {
                  e.preventDefault();
                  if (await ausfuehren({ aktion: 'bewohner-aendern', ...bearbeiten }, 'Gespeichert.')) setBearbeiten(null);
                }}>
                  <input required maxLength={80} aria-label="Name" value={bearbeiten.name} onChange={(e) => setBearbeiten({ ...bearbeiten, name: e.target.value })} className={feld} />
                  <input maxLength={60} aria-label="Wohnbereich" value={bearbeiten.wohnbereich ?? ''} onChange={(e) => setBearbeiten({ ...bearbeiten, wohnbereich: e.target.value })} className={feld} />
                  <input maxLength={200} aria-label="Hinweis" value={bearbeiten.hinweis ?? ''} onChange={(e) => setBearbeiten({ ...bearbeiten, hinweis: e.target.value })} className={`${feld} sm:col-span-2`} />
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={bearbeiten.rollstuhl} onChange={(e) => setBearbeiten({ ...bearbeiten, rollstuhl: e.target.checked })} /> ♿ Rollstuhl</label>
                  <div className="flex gap-2">
                    <button type="submit" className="bg-rikscha-green text-white rounded px-3 py-1.5 font-semibold">Speichern</button>
                    <button type="button" onClick={() => setBearbeiten(null)} className="text-gray-500 px-2">Abbrechen</button>
                  </div>
                </form>
              ) : (
                <div key={b.id} className={`py-2 flex flex-wrap items-center gap-2 ${b.aktiv ? '' : 'opacity-50'}`}>
                  <span className="font-medium">{b.name}</span>
                  {b.wohnbereich && <span className="text-sm text-gray-500">{b.wohnbereich}</span>}
                  {b.rollstuhl && <span title="Rollstuhl">♿</span>}
                  {b.hinweis && <span className="text-sm text-gray-500 italic">„{b.hinweis}“</span>}
                  {!b.aktiv && <span className="text-xs bg-gray-100 rounded-full px-2">ausgeblendet</span>}
                  <span className="ml-auto flex gap-3 text-sm">
                    <button onClick={() => setBearbeiten(b)} className="text-blue-600 underline">Bearbeiten</button>
                    <button onClick={() => ausfuehren({ aktion: 'bewohner-aendern', id: b.id, aktiv: !b.aktiv }, b.aktiv ? `${b.name} ist ausgeblendet.` : `${b.name} ist wieder sichtbar.`)}
                      className="text-orange-600 underline">{b.aktiv ? 'Ausblenden' : 'Wieder anzeigen'}</button>
                    <button onClick={async () => { if (confirm(`${b.name} endgültig löschen? Künftige Fahrten werden abgesagt, in alten Fahrten wird der Name entfernt.`)) await ausfuehren({ aktion: 'bewohner-loeschen', id: b.id }, `${b.name} wurde gelöscht.`); }}
                      className="text-red-600 underline">Löschen</button>
                  </span>
                </div>
              ))}
              {bewohner.length === 0 && <p className="text-sm text-gray-400 py-2">Noch keine Bewohner eingetragen.</p>}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
