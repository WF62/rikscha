'use client';

/**
 * Rikscha schnell anmelden – für Pflegekräfte, z. B. per Link aus dem GFO-Kalender.
 * Drei Schritte: Wer? Wann? Wohin? Gibt es am Tag schon eine freie Fahrzeit, wird sie angeboten.
 * Optional ?bereich=<id>: zeigt nur Fahrgäste dieses Bereichs (mit Unterbereichen).
 */
import { useCallback, useEffect, useState } from 'react';
import type { Bewohner, Buchung, Organisation } from '@/lib/supabase';
import { authHeaders } from '@/lib/authHeaders';
import { WUNSCH_TOUREN, tourMinuten, zeitPlus, uhrzeitMinuten } from '@/lib/touren';
import { bereichPfad, mitUnterbereichen, type Bereich } from '@/lib/struktur';
import { useStammdaten } from '@/lib/useStammdaten';

const ERLAUBT = ['pflege', 'gfo', 'admin'];
type Daten = {
  bewohner: Bewohner[]; angebote: Buchung[]; bereiche: Bereich[];
  organisationen: Organisation[]; eigeneOrganisation: string | null; alle: boolean;
};
type Ergebnis = { name: string; zweit: string; tag: string; zeit: string; tour: string; abholort: string; freieZeit: boolean };

const isoTag = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const inTagen = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return isoTag(d); };
const tagText = (iso: string) => new Date(iso + 'T12:00:00').toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
const hhmm = (z: string) => z.slice(0, 5);
const knopf = (an: boolean) => `rounded-lg border-2 px-4 py-3 text-left font-semibold ${an ? 'border-rikscha-green bg-green-50 text-rikscha-green' : 'border-gray-200 bg-white text-gray-800'}`;

/** Anmeldung direkt auf der Seite, damit der Link aus dem Kalender sofort funktioniert */
function Anmeldung({ onOk }: { onOk: () => void }) {
  const [namen, setNamen] = useState<{ name: string; rolle: string }[]>([]);
  const [name, setName] = useState('');
  const [pw, setPw] = useState('');
  const [fehler, setFehler] = useState('');
  const [laeuft, setLaeuft] = useState(false);
  useEffect(() => {
    fetch('/api/piloten').then((r) => r.json()).then((l: { name: string; rolle: string }[]) => {
      const passend = l.filter((x) => ERLAUBT.includes(x.rolle));
      setNamen(passend);
      setName(passend[0]?.name ?? '');
    }).catch(() => setNamen([]));
  }, []);
  const los = async (e: React.FormEvent) => {
    e.preventDefault(); setFehler(''); setLaeuft(true);
    try {
      const r = await fetch('/api/pilot-login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pilot: name, password: pw }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { setFehler(j.error || 'Name oder Passwort stimmt nicht.'); return; }
      if (!ERLAUBT.includes(j.rolle)) { setFehler('Dieser Zugang kann keine Fahrten anmelden.'); return; }
      localStorage.setItem('pilot_name', j.pilot);
      localStorage.setItem('pilot_pw', j.token ?? pw);
      localStorage.setItem('pilot_rolle', j.rolle);
      window.dispatchEvent(new CustomEvent('pilot-login'));
      if (j.muss_pw_aendern) { setFehler('Bitte zuerst auf der Startseite (Menü „Kutscher-Bereich“) ein eigenes Passwort festlegen. Danach geht es hier weiter.'); return; }
      onOk();
    } catch { setFehler('Keine Verbindung – bitte nochmal versuchen.'); } finally { setLaeuft(false); }
  };
  return (
    <form onSubmit={los} className="max-w-md mx-auto mt-10 bg-white rounded-xl shadow p-6 space-y-4">
      <h2 className="text-xl font-bold text-rikscha-green">🚲 Rikscha anmelden</h2>
      <p className="text-gray-600">Bitte einmal mit dem Zugang eurer Station anmelden. Das Gerät merkt sich das für 3 Monate.</p>
      <label className="block text-sm font-semibold">Zugang
        <select value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full border rounded px-3 py-2 text-base">
          {namen.map((n) => <option key={n.name} value={n.name}>{n.name}{n.rolle === 'gfo' ? ' (GFO – alle Einrichtungen)' : ''}</option>)}
        </select>
      </label>
      <label className="block text-sm font-semibold">Passwort
        <input type="password" required value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" className="mt-1 w-full border rounded px-3 py-2 text-base" />
      </label>
      {fehler && <p role="alert" className="text-sm text-red-700">{fehler}</p>}
      <button disabled={laeuft || !name} className="w-full bg-rikscha-green text-white rounded-lg px-4 py-3 font-semibold disabled:opacity-50">Anmelden</button>
    </form>
  );
}

export default function SchnellAnmelden() {
  const { fahrzeuge, fahrzeugById } = useStammdaten();
  const [zugang, setZugang] = useState<'pruefen' | 'ok' | 'nein'>('pruefen');
  const [wer, setWer] = useState<{ name: string; rolle: string }>({ name: '', rolle: '' });
  const [daten, setDaten] = useState<Daten | null>(null);
  const [fehler, setFehler] = useState('');
  const [bereichId, setBereichId] = useState('');
  const [orgId, setOrgId] = useState('');
  const [suche, setSuche] = useState('');
  const [gast, setGast] = useState('');
  // Zweite Person: '' = niemand, 'gast' = weiterer Fahrgast, 'begleitung' = z. B. Angehörige
  const [zweitArt, setZweitArt] = useState<'' | 'gast' | 'begleitung'>('');
  const [gast2, setGast2] = useState('');
  const [begleitung, setBegleitung] = useState('');
  const [tag, setTag] = useState(inTagen(1));
  const [start, setStart] = useState('14:00');
  const [tour, setTour] = useState('');        // '' = egal, sonst Tour-ID
  const [freiId, setFreiId] = useState('');    // gewählte freie Fahrzeit
  const [hinweis, setHinweis] = useState('');
  const [sendet, setSendet] = useState(false);
  const [fertig, setFertig] = useState<Ergebnis | null>(null);

  const laden = useCallback(async () => {
    const r = await fetch('/api/pflege', { headers: authHeaders() });
    if (r.status === 401) { setZugang('nein'); return; }
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { setFehler(j.error ?? 'Laden hat nicht geklappt.'); return; }
    setDaten(j); setZugang('ok');
    setWer({ name: localStorage.getItem('pilot_name') ?? '', rolle: localStorage.getItem('pilot_rolle') ?? '' });
  }, []);

  useEffect(() => {
    setBereichId(new URLSearchParams(window.location.search).get('bereich') ?? '');
    const rolle = localStorage.getItem('pilot_rolle');
    if (!localStorage.getItem('pilot_name') || !ERLAUBT.includes(rolle ?? '')) { setZugang('nein'); return; }
    laden();
  }, [laden]);

  if (zugang === 'pruefen') return <p className="text-center text-gray-400 mt-16">Einen Moment …</p>;
  if (zugang === 'nein') return <Anmeldung onOk={laden} />;
  if (!daten) return <p className="text-center mt-16 text-red-700">{fehler || 'Einen Moment …'}</p>;

  const bereiche = daten.bereiche ?? [];
  const bereich = bereiche.find((b) => b.id === bereichId);
  // Bereich aus dem Link legt die Organisation fest
  // Einrichtung: aus dem Etagen-Link, sonst die gewählte (GFO/Admin: '' = alle Einrichtungen)
  const filterOrg = bereich?.organisation_id ?? (daten.alle ? orgId : daten.eigeneOrganisation ?? '');
  const orgName = (id: string | null | undefined) => daten.organisationen.find((o) => o.id === id)?.name ?? '';
  const imBereich = bereich ? mitUnterbereichen(bereiche, bereich.id) : null;
  const gaeste = daten.bewohner
    .filter((b) => b.aktiv && (!filterOrg || b.organisation_id === filterOrg))
    .filter((b) => !imBereich || (b.bereich_id && imBereich.has(b.bereich_id)))
    .filter((b) => !suche.trim() || b.name.toLowerCase().includes(suche.trim().toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name, 'de'));
  const gastObj = daten.bewohner.find((b) => b.id === gast);
  const org = daten.organisationen.find((o) => o.id === (gastObj?.organisation_id ?? filterOrg)) ?? null;
  // Für die zweite Person: alle aktiven Fahrgäste der Organisation (auch andere Etagen)
  const andere = daten.bewohner
    .filter((b) => b.aktiv && b.id !== gast && (!org || b.organisation_id === org.id))
    .sort((a, b) => a.name.localeCompare(b.name, 'de'));
  const gast2Obj = zweitArt === 'gast' ? daten.bewohner.find((b) => b.id === gast2) : undefined;
  const zweitName = gast2Obj?.name ?? (zweitArt === 'begleitung' ? begleitung.trim() : '');
  const personen = zweitName ? 2 : 1;
  const rollstuhl = !!gastObj?.rollstuhl || !!gast2Obj?.rollstuhl;
  const zweitFehlt = (zweitArt === 'gast' && !gast2) || (zweitArt === 'begleitung' && !begleitung.trim());
  const zweitDaten = gast2Obj ? { bewohner2_id: gast2Obj.id } : zweitArt === 'begleitung' && begleitung.trim() ? { begleitung: begleitung.trim() } : {};
  // Hat die Flotte überhaupt ein Fahrzeug mit 2 Plätzen (und ggf. Rollstuhl)?
  const flotteZuKlein = personen > 1 && !fahrzeuge.some((f) => f.maxGaeste >= personen && (!rollstuhl || f.rollstuhl));

  const tourObj = WUNSCH_TOUREN.find((t) => t.id === tour);
  const dauer = tourMinuten(tour) ?? 60;
  const ende = zeitPlus(start, dauer);
  // Freie Fahrzeiten an dem Tag, in die die Tour passt
  const freie = (daten.angebote ?? [])
    .filter((a) => a.datum === tag)
    .map((a) => ({ a, laenge: (uhrzeitMinuten(a.endzeit) ?? 0) - (uhrzeitMinuten(a.startzeit) ?? 0) }))
    .sort((x, y) => x.a.startzeit.localeCompare(y.a.startzeit));
  const passtIn = (a: Buchung) => { const fz = a.fahrzeug ? fahrzeugById(a.fahrzeug) : undefined; return !fz || (fz.maxGaeste >= personen && (!rollstuhl || fz.rollstuhl)); };
  const frei = freie.map((x) => x.a).find((a) => a.id === freiId && passtIn(a));
  const abholort = org?.standard_abholort || gastObj?.adresse || 'nach Absprache';

  const absenden = async () => {
    if (!gastObj) return;
    setSendet(true); setFehler('');
    try {
      let body: Record<string, unknown>;
      if (frei) {
        let fahrzeug: string | undefined;
        if (!frei.fahrzeug) {
          // Fahrzeug passend zum Gast wählen (Plätze, Rollstuhl, frei zu der Zeit)
          const l = await fetch(`/api/fahrzeuge-frei?buchung=${frei.id}&personen=${personen}${rollstuhl ? '&rollstuhl=1' : ''}`, { headers: authHeaders() }).then((r) => (r.ok ? r.json() : []));
          fahrzeug = l.find((x: { frei: boolean }) => x.frei)?.id;
          if (!fahrzeug) { setFehler('Für diese freie Fahrzeit ist kein passendes Fahrzeug frei. Bitte eine andere Zeit wählen.'); return; }
        }
        body = { aktion: 'belegen', buchung_id: frei.id, bewohner_id: gastObj.id, ...zweitDaten, ...(fahrzeug ? { fahrzeug } : {}), ...(tourObj ? { wunschfahrt: tourObj.name } : {}), ...(hinweis.trim() ? { notiz: hinweis.trim() } : {}) };
      } else {
        if (!ende) { setFehler('Bitte eine frühere Startzeit wählen.'); return; }
        body = { aktion: 'wunsch', bewohner_id: gastObj.id, ...zweitDaten, datum: tag, startzeit: start, endzeit: ende, fahrzeug: '', notiz: hinweis.trim(), ...(tourObj ? { wunschfahrt: tourObj.name } : {}) };
      }
      const r = await fetch('/api/pflege', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { setFehler(j.error ?? 'Das hat nicht geklappt. Bitte nochmal versuchen.'); return; }
      setFertig({
        name: gastObj.name, zweit: zweitName, tag: tagText(frei?.datum ?? tag),
        zeit: frei ? `${hhmm(frei.startzeit)}–${hhmm(frei.endzeit)} Uhr` : `${start}–${ende} Uhr`,
        tour: tourObj?.name ?? 'Kutscher schlägt etwas vor', abholort: j.abholort ?? abholort, freieZeit: !!frei,
      });
      await laden();
    } catch { setFehler('Keine Verbindung – bitte nochmal versuchen.'); } finally { setSendet(false); }
  };

  if (fertig) {
    return (
      <div className="max-w-lg mx-auto mt-8 bg-white rounded-xl shadow p-6 space-y-4">
        <h2 className="text-2xl font-bold text-rikscha-green">✓ Angemeldet!</h2>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-1 text-gray-800">
          <div><strong>{fertig.name}</strong>{fertig.zweit && <> und <strong>{fertig.zweit}</strong></>}</div>
          <div>{fertig.tag}, {fertig.zeit}</div>
          <div>🗺️ {fertig.tour}</div>
          <div>📍 Abholung: {fertig.abholort}</div>
        </div>
        <p className="text-gray-600">
          {fertig.freieZeit
            ? 'Der Kutscher steht schon fest. Die Fahrt erscheint gleich im Kalender eures Bereichs.'
            : 'Ein Kutscher wird gesucht. Die Fahrt erscheint gleich im Kalender eures Bereichs – erst mit „Kutscher offen“, dann mit Namen.'}
        </p>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => { setFertig(null); setGast(''); setZweitArt(''); setGast2(''); setBegleitung(''); setFreiId(''); setHinweis(''); setTour(''); }} className="bg-rikscha-green text-white rounded-lg px-4 py-3 font-semibold">Noch eine Fahrt anmelden</button>
          <a href={bereich ? `/pflege/wochenplan?bereich=${bereich.id}` : `/pflege/wochenplan?fahrgast=${gast}`} className="border rounded-lg px-4 py-3 font-semibold text-gray-700">🗓️ Wochenplan</a>
        </div>
      </div>
    );
  }

  const nummer = (n: number, text: string) => (
    <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2"><span className="w-7 h-7 rounded-full bg-rikscha-green text-white text-sm flex items-center justify-center">{n}</span>{text}</h3>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-rikscha-green">🚲 Rikscha anmelden</h2>
        <p className="text-gray-600">{bereich ? <>Für <strong>{bereichPfad(bereiche, bereich.id)}</strong>. </> : null}In drei Schritten fertig.</p>
      </div>

      <div className={`flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2 text-sm ${wer.rolle === 'pflege' ? 'bg-sky-50 border-sky-200' : 'bg-amber-50 border-amber-300'}`}>
        <span className="flex-1">
          Angemeldet als <strong>{wer.name}</strong>{' – '}
          {wer.rolle === 'gfo' ? 'GFO, sieht alle Einrichtungen' : wer.rolle === 'admin' ? 'Admin, sieht alle Einrichtungen' : `Vermittlung${orgName(daten.eigeneOrganisation) ? ` ${orgName(daten.eigeneOrganisation)}` : ''}, sieht nur die eigenen Gäste`}
        </span>
        <button type="button" onClick={() => {
          ['pilot_name', 'pilot_pw', 'pilot_rolle'].forEach((k) => localStorage.removeItem(k));
          window.dispatchEvent(new CustomEvent('pilot-logout'));
          setDaten(null); setGast(''); setGast2(''); setFreiId(''); setOrgId(''); setZugang('nein');
        }} className="underline font-semibold text-gray-700">Zugang wechseln</button>
      </div>

      {daten.alle && !bereich && daten.organisationen.length > 1 && (
        <label className="block text-sm font-semibold">Für
          <select value={orgId} onChange={(e) => { setOrgId(e.target.value); setGast(''); setGast2(''); setFreiId(''); }} className="mt-1 w-full border rounded px-3 py-2 text-base">
            <option value="">Alle Einrichtungen</option>
            {daten.organisationen.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        </label>
      )}

      <section className="bg-white rounded-xl shadow p-5 space-y-3">
        {nummer(1, 'Wer fährt mit?')}
        {gaeste.length > 8 || suche ? (
          <input value={suche} onChange={(e) => setSuche(e.target.value)} placeholder="Name suchen …" aria-label="Name suchen" className="w-full border rounded px-3 py-2 text-base" />
        ) : null}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {gaeste.map((b) => (
            <button key={b.id} type="button" onClick={() => { setGast(b.id); if (gast2 === b.id) setGast2(''); setFreiId(''); }} className={knopf(gast === b.id)} aria-pressed={gast === b.id}>
              {b.name}{b.rollstuhl ? ' ♿' : ''}
              {!bereich && (() => {
                const wo = [!filterOrg && daten.alle ? orgName(b.organisation_id) : '', bereichPfad(bereiche, b.bereich_id)].filter(Boolean).join(' · ');
                return wo ? <span className="block text-xs font-normal text-gray-500">{wo}</span> : null;
              })()}
            </button>
          ))}
        </div>
        {gastObj && (
          <div className="border-t pt-3 space-y-2">
            <p className="font-semibold text-gray-800">Fährt noch jemand mit? <span className="font-normal text-gray-500">(optional)</span></p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button type="button" onClick={() => { setZweitArt(''); setFreiId(''); }} className={knopf(zweitArt === '')} aria-pressed={zweitArt === ''}>Nein</button>
              <button type="button" onClick={() => { setZweitArt('gast'); setFreiId(''); }} className={knopf(zweitArt === 'gast')} aria-pressed={zweitArt === 'gast'}>Noch ein Fahrgast</button>
              <button type="button" onClick={() => { setZweitArt('begleitung'); setFreiId(''); }} className={knopf(zweitArt === 'begleitung')} aria-pressed={zweitArt === 'begleitung'}>Begleitung<span className="block text-xs font-normal text-gray-500">z. B. Angehörige</span></button>
            </div>
            {zweitArt === 'gast' && (
              <select aria-label="Zweiter Fahrgast" value={gast2} onChange={(e) => { setGast2(e.target.value); setFreiId(''); }} className="w-full border-2 border-gray-200 rounded-lg px-3 py-3 text-base">
                <option value="">Bitte wählen …</option>
                {andere.map((b) => <option key={b.id} value={b.id}>{b.name}{b.rollstuhl ? ' ♿' : ''}{bereichPfad(bereiche, b.bereich_id) ? ` – ${bereichPfad(bereiche, b.bereich_id)}` : ''}</option>)}
              </select>
            )}
            {zweitArt === 'begleitung' && (
              <input aria-label="Name der Begleitung" maxLength={80} value={begleitung} onChange={(e) => setBegleitung(e.target.value)} placeholder="Name, z. B. Tochter Maria" className="w-full border-2 border-gray-200 rounded-lg px-3 py-3 text-base" />
            )}
            {personen > 1 && !flotteZuKlein && <p className="text-sm text-gray-600">Zu zweit geht es mit einem Fahrzeug mit 2 Plätzen, z. B. der Rikscha.</p>}
            {flotteZuKlein && <p role="alert" className="text-sm text-orange-800">⚠ {rollstuhl ? 'Kein Fahrzeug mit 2 Plätzen ist für Rollstühle eingetragen.' : 'Kein Fahrzeug hat 2 Plätze.'} Bitte eine Person allein anmelden.</p>}
          </div>
        )}
        {gaeste.length === 0 && (
          <p className="text-gray-500">{suche ? 'Niemand gefunden.' : <>Hier sind noch keine Fahrgäste eingetragen. Das geht unter <a href="/pflege" className="underline">Fahrten vermitteln</a>.</>}</p>
        )}
      </section>

      <section className="bg-white rounded-xl shadow p-5 space-y-3">
        {nummer(2, 'Wann?')}
        <div className="flex flex-wrap gap-2">
          {[['Heute', 0], ['Morgen', 1], ['Übermorgen', 2]].map(([t, n]) => (
            <button key={t} type="button" onClick={() => { setTag(inTagen(n as number)); setFreiId(''); }} className={knopf(tag === inTagen(n as number))}>{t}</button>
          ))}
          <input type="date" aria-label="Anderer Tag" min={inTagen(0)} value={tag} onChange={(e) => { setTag(e.target.value); setFreiId(''); }} className="border-2 border-gray-200 rounded-lg px-3 py-2 text-base" />
        </div>
        <p className="text-sm text-gray-600">{tag ? tagText(tag) : ''}</p>

        {freie.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-emerald-800">🌿 An diesem Tag gibt es schon freie Fahrzeiten mit Kutscher:</p>
            {freie.map(({ a, laenge }) => {
              const zuKurz = !!tourObj && tourObj.minuten > laenge;
              const fz = a.fahrzeug ? fahrzeugById(a.fahrzeug) : undefined;
              const zuKlein = !!fz && (fz.maxGaeste < personen || (rollstuhl && !fz.rollstuhl));
              return (
                <button key={a.id} type="button" disabled={zuKlein} onClick={() => setFreiId(freiId === a.id ? '' : a.id)} className={`${knopf(freiId === a.id)} w-full disabled:opacity-50`} aria-pressed={freiId === a.id}>
                  {hhmm(a.startzeit)}–{hhmm(a.endzeit)} Uhr · {a.pilot}{fz ? ` · ${fz.name}` : ''}
                  {zuKlein && <span className="block text-xs font-normal text-gray-600">{fz!.maxGaeste < personen ? `nur ${fz!.maxGaeste} Platz – passt nicht für zwei` : 'nicht für Rollstuhl'}</span>}
                  {zuKurz && <span className="block text-xs font-normal text-orange-700">⚠ zu kurz für die gewählte Tour</span>}
                </button>
              );
            })}
          </div>
        )}

        {!frei && (
          <label className="block text-sm font-semibold">{freie.length ? 'Oder eigene Startzeit (ein Kutscher wird gesucht)' : 'Startzeit'}
            <input type="time" value={start} onChange={(e) => setStart(e.target.value)} className="mt-1 block border-2 border-gray-200 rounded-lg px-3 py-2 text-base" />
          </label>
        )}
      </section>

      <section className="bg-white rounded-xl shadow p-5 space-y-3">
        {nummer(3, 'Wohin?')}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button type="button" onClick={() => setTour('')} className={knopf(tour === '')} aria-pressed={tour === ''}>Egal<span className="block text-xs font-normal text-gray-500">Kutscher schlägt etwas vor</span></button>
          {WUNSCH_TOUREN.map((t) => (
            <button key={t.id} type="button" onClick={() => setTour(t.id)} className={knopf(tour === t.id)} aria-pressed={tour === t.id}>
              {t.name}<span className="block text-xs font-normal text-gray-500">{t.dauer}</span>
            </button>
          ))}
        </div>
        <label className="block text-sm font-semibold">Hinweis für den Kutscher (optional)
          <input value={hinweis} maxLength={500} onChange={(e) => setHinweis(e.target.value)} placeholder="z. B. braucht etwas Hilfe beim Einsteigen" className="mt-1 w-full border rounded px-3 py-2 text-base" />
        </label>
      </section>

      <section className="bg-white rounded-xl shadow p-5 space-y-3">
        <div className="text-gray-800 space-y-1">
          <div>👤 {gastObj ? <><strong>{gastObj.name}</strong>{zweitName && <> und <strong>{zweitName}</strong></>}</> : <span className="text-gray-400">noch niemand gewählt</span>}</div>
          <div>🕑 {tagText(tag)}, {frei ? `${hhmm(frei.startzeit)}–${hhmm(frei.endzeit)} Uhr (freie Fahrzeit)` : ende ? `${start}–${ende} Uhr` : 'Startzeit zu spät'}</div>
          <div>📍 Abholung: {abholort}</div>
        </div>
        {fehler && <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">⚠ {fehler}</p>}
        <button type="button" disabled={!gastObj || sendet || (!frei && !ende) || zweitFehlt || flotteZuKlein} onClick={absenden}
          className="w-full bg-rikscha-green text-white rounded-lg px-4 py-4 text-lg font-bold disabled:opacity-40">
          {sendet ? 'Wird angemeldet …' : 'Rikscha anmelden'}
        </button>
        <p className="text-xs text-gray-500">Anderer Abholort oder Gruppenfahrt? → <a href="/pflege" className="underline">ausführliches Formular</a></p>
      </section>
    </div>
  );
}
