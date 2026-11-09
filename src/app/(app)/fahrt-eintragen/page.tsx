'use client';

/**
 * Schnell eintragen – für Kutscher (und GFO/Admin), die oft Fahrten anlegen.
 * Freie Fahrzeit anbieten oder Fahrt mit eigenem Gast. Merkt sich die letzten Angaben (nur auf diesem Gerät).
 * Keine Bewohnerdaten: Kutscher sehen nur, was sie selbst eintragen.
 */
import { useEffect, useState } from 'react';
import { authHeaders } from '@/lib/authHeaders';
import { zeitPlus, dauerText, uhrzeitMinuten } from '@/lib/touren';

const ERLAUBT = ['pilot', 'gfo', 'admin'];
const MERKEN = 'schnell_kutscher_v1';
type Art = 'angebot' | 'gast';
type Merk = { art: Art; start: string; dauer: number; fahrzeug: string; oeffentlich: boolean };
type Person = { id: string; name: string; einrichtung: string; bereich: string; rollstuhl: boolean };
type Platz = { bw: string; text: string };  // bw: Bewohner-ID, '' = frei eintippen
const ANDERE = '__andere';
type FzWahl = { id: string; name: string; maxGaeste: number; rollstuhl: boolean; frei: boolean; grund?: string };

const DAUERN = [45, 60, 90, 120];
const isoTag = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const inTagen = (n: number, ab?: string) => { const d = ab ? new Date(ab + 'T12:00:00') : new Date(); d.setDate(d.getDate() + n); return isoTag(d); };
const tagText = (iso: string) => new Date(iso + 'T12:00:00').toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
const knopf = (an: boolean) => `rounded-lg border-2 px-4 py-3 text-left font-semibold ${an ? 'border-rikscha-green bg-green-50 text-rikscha-green' : 'border-gray-200 bg-white text-gray-800'}`;

function lesen(): Partial<Merk> {
  try { return JSON.parse(localStorage.getItem(MERKEN) ?? '{}'); } catch { return {}; }
}
function merken(m: Merk) {
  try { localStorage.setItem(MERKEN, JSON.stringify(m)); } catch { /* egal */ }
}

export default function FahrtEintragen() {
  const [zugang, setZugang] = useState<'pruefen' | 'ok' | 'nein'>('pruefen');
  const [ich, setIch] = useState('');
  const [art, setArt] = useState<Art>('angebot');
  const [tag, setTag] = useState(inTagen(1));
  const [start, setStart] = useState('14:00');
  const [dauer, setDauer] = useState(60);
  const [fahrzeug, setFahrzeug] = useState('');
  const [plaetze, setPlaetze] = useState<Platz[]>([{ bw: '', text: '' }, { bw: '', text: '' }]);
  const [leute, setLeute] = useState<Person[]>([]);
  const [oeffentlich, setOeffentlich] = useState(false);
  const [notiz, setNotiz] = useState('');
  const [liste, setListe] = useState<FzWahl[] | null>(null);
  const [fehler, setFehler] = useState('');
  const [sendet, setSendet] = useState(false);
  const [fertig, setFertig] = useState<string | null>(null);

  useEffect(() => {
    const rolle = localStorage.getItem('pilot_rolle') ?? '';
    const name = localStorage.getItem('pilot_name') ?? '';
    if (!name || !ERLAUBT.includes(rolle)) { setZugang('nein'); return; }
    setIch(name);
    const m = lesen();
    if (m.art) setArt(m.art);
    if (m.start) setStart(m.start);
    if (m.dauer) setDauer(m.dauer);
    if (m.fahrzeug) setFahrzeug(m.fahrzeug);
    if (m.oeffentlich) setOeffentlich(true);
    setZugang('ok');
    // Namensliste der Fahrgäste (nur Name, Einrichtung, Bereich, ♿)
    fetch('/api/bewohner-liste', { headers: authHeaders() }).then((r) => (r.ok ? r.json() : [])).then(setLeute).catch(() => setLeute([]));
  }, []);

  const ende = zeitPlus(start, dauer);
  const person = (id: string) => leute.find((x) => x.id === id);
  const gewaehlt = plaetze.map((p) => (p.bw && p.bw !== ANDERE ? person(p.bw) : undefined)).filter(Boolean) as Person[];
  const freiNamen = plaetze.filter((p) => p.bw === ANDERE || (!p.bw && !leute.length)).map((p) => p.text.trim()).filter(Boolean);
  const namen = [...gewaehlt.map((x) => x.name), ...freiNamen];
  const personen = art === 'gast' ? Math.max(1, namen.length) : 1;
  const rollstuhl = art === 'gast' && gewaehlt.some((x) => x.rollstuhl);

  // Freie Fahrzeuge zur gewählten Zeit
  useEffect(() => {
    if (zugang !== 'ok' || !tag || !ende) { setListe(null); return; }
    let aktiv = true;
    setListe(null);
    fetch(`/api/fahrzeuge-frei?datum=${tag}&von=${start}&bis=${ende}&personen=${personen}${rollstuhl ? '&rollstuhl=1' : ''}`, { headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : [])).then((l: FzWahl[]) => {
        if (!aktiv) return;
        setListe(l);
        setFahrzeug((alt) => (alt && !l.some((x) => x.id === alt && x.frei) ? '' : alt));
      }).catch(() => aktiv && setListe([]));
    return () => { aktiv = false; };
  }, [zugang, tag, start, ende, personen, rollstuhl]);

  if (zugang === 'pruefen') return <p className="text-center text-gray-400 mt-16">Einen Moment …</p>;
  if (zugang === 'nein') {
    return (
      <div className="max-w-md mx-auto mt-16 bg-white rounded-xl shadow p-6 text-center space-y-3">
        <h2 className="text-xl font-bold text-rikscha-green">⚡ Fahrt schnell eintragen</h2>
        <p className="text-gray-600">Bitte melde dich auf der Startseite als Kutscher an (Menü „Kutscher-Bereich“).</p>
        <a href="/" className="inline-block bg-rikscha-green text-white rounded px-4 py-2 font-semibold">Zur Startseite</a>
      </div>
    );
  }

  const fzObj = liste?.find((f) => f.id === fahrzeug);
  const fehlt = !ende ? 'Bitte eine frühere Startzeit wählen.'
    : art === 'gast' && !namen.length ? 'Bitte einen Gast wählen oder den Namen eintragen.'
    : art === 'gast' && gewaehlt.length === 2 && gewaehlt[0].id === gewaehlt[1].id ? 'Bitte zwei verschiedene Gäste wählen.'
    : art === 'gast' && !fahrzeug ? 'Mit Gast bitte ein Fahrzeug wählen – sonst kann es doppelt gebucht werden.'
    : '';

  const absenden = async () => {
    if (fehlt || !ende) { setFehler(fehlt); return; }
    setSendet(true); setFehler('');
    try {
      const r = await fetch('/api/buchungen', {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          pilot: ich, fahrzeug, datum: tag, startzeit: start, endzeit: ende, notiz: notiz.trim(),
          gaeste: art === 'gast' ? freiNamen : [],
          ...(art === 'gast' && gewaehlt[0] ? { bewohner_id: gewaehlt[0].id } : {}),
          ...(art === 'gast' && gewaehlt[1] ? { bewohner2_id: gewaehlt[1].id } : {}),
          ...(art === 'angebot' ? { angebot: true, oeffentlich } : {}),
        }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { setFehler(j.error ?? 'Das hat nicht geklappt. Bitte nochmal versuchen.'); return; }
      merken({ art, start, dauer, fahrzeug, oeffentlich });
      setFertig(`${tagText(tag)}, ${start}–${ende} Uhr${fzObj ? ` · ${fzObj.name}` : ''}`);
    } catch { setFehler('Keine Verbindung – bitte nochmal versuchen.'); } finally { setSendet(false); }
  };

  if (fertig) {
    return (
      <div className="max-w-lg mx-auto mt-8 bg-white rounded-xl shadow p-6 space-y-4">
        <h2 className="text-2xl font-bold text-rikscha-green">✓ Eingetragen!</h2>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-gray-800">
          <div className="font-semibold">{art === 'angebot' ? 'Freie Fahrzeit' : `Fahrt mit ${namen.join(' und ')}`}</div>
          <div>{fertig}</div>
        </div>
        <p className="text-gray-600">{art === 'angebot' ? 'Die Vermittlung sieht die Zeit jetzt und kann einen Gast eintragen.'
          : gewaehlt.length ? 'Die Fahrt steht im Kalender – und automatisch im Kalender und Wochenplan der Einrichtung.' : 'Die Fahrt steht im Kalender.'}</p>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => { setTag(inTagen(7, tag)); setFertig(null); }} className="bg-rikscha-green text-white rounded-lg px-4 py-3 font-semibold">
            Gleiche Fahrt eine Woche später
          </button>
          <button onClick={() => { setFertig(null); setPlaetze([{ bw: '', text: '' }, { bw: '', text: '' }]); setNotiz(''); }} className="border rounded-lg px-4 py-3 font-semibold text-gray-700">Andere Fahrt eintragen</button>
          <a href="/kalender" className="border rounded-lg px-4 py-3 font-semibold text-gray-700">📅 Kalender</a>
        </div>
      </div>
    );
  }

  const nummer = (n: number, text: string) => (
    <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2"><span className="w-7 h-7 rounded-full bg-rikscha-green text-white text-sm flex items-center justify-center">{n}</span>{text}</h3>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-rikscha-green">⚡ Fahrt schnell eintragen</h2>
          <p className="text-gray-600">Kutscher: <strong>{ich}</strong>. Deine letzten Angaben sind schon vorausgewählt.</p>
        </div>
        <a href="/buchen" className="shrink-0 text-sm font-semibold text-rikscha-green border-2 border-rikscha-green rounded-lg px-3 py-2 hover:bg-green-50">📋 Ausführlich</a>
      </div>

      <section className="bg-white rounded-xl shadow p-5 space-y-3">
        {nummer(1, 'Was?')}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button type="button" onClick={() => setArt('angebot')} className={knopf(art === 'angebot')} aria-pressed={art === 'angebot'}>
            🏠 Freie Fahrzeit anbieten<span className="block text-xs font-normal text-gray-500">Die Vermittlung sucht einen Gast</span>
          </button>
          <button type="button" onClick={() => setArt('gast')} className={knopf(art === 'gast')} aria-pressed={art === 'gast'}>
            👤 Fahrt mit eigenem Gast<span className="block text-xs font-normal text-gray-500">Du kennst den Gast schon</span>
          </button>
        </div>
        {art === 'gast' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {plaetze.map((p, i) => {
              const setze = (neu: Partial<Platz>) => setPlaetze(plaetze.map((x, k) => (k === i ? { ...x, ...neu } : x)));
              const gruppen = Array.from(new Set(leute.map((x) => x.einrichtung || 'Ohne Einrichtung')));
              return (
                <div key={i} className="flex flex-col gap-1">
                  {leute.length > 0 && (
                    <select aria-label={`Gast ${i + 1}`} value={p.bw} onChange={(e) => setze({ bw: e.target.value })} className="border-2 border-gray-200 rounded-lg px-3 py-3 text-base">
                      <option value="">{i === 0 ? 'Gast wählen …' : 'zweiter Gast (optional)'}</option>
                      {gruppen.map((g) => (
                        <optgroup key={g} label={g}>
                          {leute.filter((x) => (x.einrichtung || 'Ohne Einrichtung') === g).map((x) => (
                            <option key={x.id} value={x.id} disabled={plaetze.some((q, k) => k !== i && q.bw === x.id)}>{x.name}{x.bereich ? ` – ${x.bereich}` : ''}{x.rollstuhl ? ' ♿' : ''}</option>
                          ))}
                        </optgroup>
                      ))}
                      <option value={ANDERE}>✍️ Anderer Gast – Name eintippen</option>
                    </select>
                  )}
                  {(p.bw === ANDERE || !leute.length) && (
                    <input aria-label={`Name Gast ${i + 1}`} maxLength={80} value={p.text} placeholder={i === 0 ? 'Name des Gasts' : 'zweiter Gast (optional)'}
                      onChange={(e) => setze({ text: e.target.value })} className="border-2 border-gray-200 rounded-lg px-3 py-3 text-base" />
                  )}
                </div>
              );
            })}
            {leute.length > 0 && <p className="sm:col-span-2 text-xs text-gray-500">Gäste aus der Liste erscheinen automatisch im Kalender und Wochenplan ihrer Einrichtung (z. B. Etage). Du siehst nur Name, Bereich und ♿.</p>}
          </div>
        )}
        {art === 'angebot' && (
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" checked={oeffentlich} onChange={(e) => setOeffentlich(e.target.checked)} className="mt-1" />
            <span>Auch für Interessierte aus dem Quartier öffentlich buchbar</span>
          </label>
        )}
      </section>

      <section className="bg-white rounded-xl shadow p-5 space-y-3">
        {nummer(2, 'Wann?')}
        <div className="flex flex-wrap gap-2">
          {([['Heute', 0], ['Morgen', 1], ['Übermorgen', 2]] as const).map(([t, n]) => (
            <button key={t} type="button" onClick={() => setTag(inTagen(n))} className={knopf(tag === inTagen(n))}>{t}</button>
          ))}
          <input type="date" aria-label="Anderer Tag" min={inTagen(0)} value={tag} onChange={(e) => setTag(e.target.value)} className="border-2 border-gray-200 rounded-lg px-3 py-2 text-base" />
        </div>
        <p className="text-sm text-gray-600">{tag ? tagText(tag) : ''}</p>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm font-semibold">Von
            <input type="time" value={start} onChange={(e) => setStart(e.target.value)} className="mt-1 block border-2 border-gray-200 rounded-lg px-3 py-2 text-base" />
          </label>
          <label className="text-sm font-semibold">Bis
            <input type="time" aria-label="Bis" value={ende ?? ''} onChange={(e) => {
              // Freie Endzeit: Dauer daraus berechnen (höchstens 10 Std.)
              const d = (uhrzeitMinuten(e.target.value) ?? 0) - (uhrzeitMinuten(start) ?? 0);
              if (d > 0 && d <= 600) setDauer(d);
            }} className="mt-1 block border-2 border-gray-200 rounded-lg px-3 py-2 text-base" />
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-600">oder Dauer:</span>
          <div className="flex flex-wrap gap-2">
            {DAUERN.map((d) => (
              <button key={d} type="button" onClick={() => setDauer(d)} className={`${knopf(dauer === d)} py-2`} aria-pressed={dauer === d}>{dauerText(d)}</button>
            ))}
          </div>
        </div>
        <p className="text-sm text-gray-600">{ende ? `${start}–${ende} Uhr (${dauerText(dauer)})` : 'Startzeit zu spät'}</p>
        {art === 'angebot' && <p className="text-xs text-gray-500">Tipp: Freie Zeit gern großzügig eintragen, z. B. 10–16 Uhr. Gäste buchen darin kürzere Fahrten, auch mehrere nacheinander.</p>}
      </section>

      <section className="bg-white rounded-xl shadow p-5 space-y-3">
        {nummer(3, 'Womit?')}
        {!liste ? <p className="text-sm text-gray-400">Fahrzeuge werden geprüft …</p> : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {art === 'angebot' && (
              <button type="button" onClick={() => setFahrzeug('')} className={knopf(fahrzeug === '')} aria-pressed={fahrzeug === ''}>
                Egal<span className="block text-xs font-normal text-gray-500">wird passend zum Gast gewählt</span>
              </button>
            )}
            {liste.map((f) => (
              <button key={f.id} type="button" disabled={!f.frei} onClick={() => setFahrzeug(f.id)} className={`${knopf(fahrzeug === f.id)} disabled:opacity-50`} aria-pressed={fahrzeug === f.id}>
                🚲 {f.name}{f.rollstuhl ? ' ♿' : ''}
                <span className="block text-xs font-normal text-gray-500">{f.frei ? `${f.maxGaeste} ${f.maxGaeste > 1 ? 'Plätze' : 'Platz'} · frei` : f.grund ?? 'nicht frei'}</span>
              </button>
            ))}
          </div>
        )}
        <label className="block text-sm font-semibold">Notiz (optional)
          <input value={notiz} maxLength={500} onChange={(e) => setNotiz(e.target.value)} placeholder="z. B. Treffpunkt am Pfarrzentrum" className="mt-1 w-full border rounded px-3 py-2 text-base" />
        </label>
      </section>

      <section className="bg-white rounded-xl shadow p-5 space-y-3">
        {(fehler || fehlt) && <p role="alert" className="text-sm text-orange-800 bg-orange-50 border border-orange-200 rounded px-3 py-2">⚠ {fehler || fehlt}</p>}
        <button type="button" disabled={!!fehlt || sendet} onClick={absenden}
          className="w-full bg-rikscha-green text-white rounded-lg px-4 py-4 text-lg font-bold disabled:opacity-40">
          {sendet ? 'Wird eingetragen …' : 'Eintragen'}
        </button>
        <p className="text-xs text-gray-500">Für Sonderfälle: <a href="/buchen" className="underline">ausführliches Formular</a></p>
      </section>
    </div>
  );
}
