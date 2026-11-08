'use client';
import { useEffect, useState } from 'react';
import type { Buchung } from '@/lib/supabase';
import { authHeaders } from '@/lib/authHeaders';
import { verschiebeOptionen, diffText, anfrageText, GRUENDE } from '@/lib/verschiebung';

/**
 * Zeit einer Fahrt verschieben anfragen (Hitze, Regen …) – und Anfragen beantworten.
 * Eine Seite fragt an, die andere (Kutscher bzw. Vermittlung) bestätigt oder lehnt ab.
 */
export default function VerschiebenAnfrage({ b, onDone, meldung }: { b: Buchung; onDone: () => void; meldung?: (text: string, ok: boolean) => void }) {
  const [ich, setIch] = useState({ name: '', rolle: '' });
  const [offen, setOffen] = useState(false);
  const [start, setStart] = useState('');
  const [grund, setGrund] = useState('');
  const [eigen, setEigen] = useState('');
  const [laeuft, setLaeuft] = useState(false);
  const [fehler, setFehler] = useState('');
  useEffect(() => { setIch({ name: localStorage.getItem('pilot_name') ?? '', rolle: localStorage.getItem('pilot_rolle') ?? '' }); }, []);

  const buero = ich.rolle === 'gfo' || ich.rolle === 'admin';
  const binKutscher = (ich.rolle === 'pilot' && !!b.pilot && b.pilot === ich.name) || buero;
  const binVermittlung = ich.rolle === 'pflege' || buero;
  const hatGast = !!b.bewohner_id || (b.gaeste ?? []).some((g) => g && g !== 'Gast');
  const heute = new Date().toISOString().slice(0, 10);
  if (b.storniert || b.datum < heute || !hatGast || (!binKutscher && !binVermittlung)) {
    return b.verschiebung_ergebnis ? <p className="text-xs text-gray-500">ℹ️ {b.verschiebung_ergebnis}</p> : null;
  }

  const senden = async (methode: 'POST' | 'PATCH' | 'DELETE', body?: Record<string, unknown>, ok?: string) => {
    setLaeuft(true); setFehler('');
    try {
      const r = await fetch(`/api/buchungen/${b.id}/verschiebung`, {
        method: methode, headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: body ? JSON.stringify(body) : undefined,
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { setFehler(j.error ?? 'Das hat nicht geklappt.'); meldung?.(j.error ?? 'Das hat nicht geklappt.', false); return; }
      const text = j.direkt ? 'Zeit geändert.' : ok ?? 'Gespeichert.';
      meldung?.(text, true);
      setOffen(false); setStart(''); setGrund(''); setEigen('');
      onDone();
    } catch { setFehler('Keine Verbindung.'); } finally { setLaeuft(false); }
  };

  // Offene Anfrage
  if (b.verschiebung_start) {
    const vonMir = b.verschiebung_von === ich.name;
    const andere = b.verschiebung_seite === 'kutscher' ? 'vermittlung' : 'kutscher';
    const darfAntworten = (andere === 'kutscher' ? binKutscher : binVermittlung) && (!vonMir || buero);
    return (
      <div className="rounded-lg border-2 border-sky-300 bg-sky-50 px-3 py-2 text-sm space-y-2">
        <div>🔄 <strong>Verschiebung angefragt</strong> {anfrageText(b)} – von {b.verschiebung_von}
          <span className="text-gray-600"> · wartet auf {andere === 'kutscher' ? `den Kutscher (${b.pilot})` : 'die Vermittlung'}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {darfAntworten && <>
            <button disabled={laeuft} onClick={() => senden('PATCH', { antwort: 'ja' }, 'Verschiebung bestätigt – die neue Zeit gilt.')} className="bg-rikscha-green text-white rounded px-3 py-1.5 font-semibold disabled:opacity-50">✓ Passt, verschieben</button>
            <button disabled={laeuft} onClick={() => { const n = prompt('Kurze Begründung (optional):') ; if (n !== null) senden('PATCH', { antwort: 'nein', notiz: n }, 'Abgelehnt – es bleibt bei der alten Zeit.'); }} className="border rounded px-3 py-1.5 font-semibold text-gray-700 disabled:opacity-50">✕ Geht nicht</button>
          </>}
          {(vonMir || buero) && <button disabled={laeuft} onClick={() => senden('DELETE', undefined, 'Anfrage zurückgezogen.')} className="text-sm text-gray-600 underline">Anfrage zurückziehen</button>}
        </div>
        {fehler && <p role="alert" className="text-red-700">⚠ {fehler}</p>}
      </div>
    );
  }

  const direkt = !b.pilot;   // ohne Kutscher muss niemand zustimmen
  const optionen = verschiebeOptionen(b.startzeit, b.endzeit);
  return (
    <div className="space-y-2 text-sm">
      {b.verschiebung_ergebnis && <p className="text-xs text-gray-500">ℹ️ {b.verschiebung_ergebnis}</p>}
      {!offen ? (
        <button onClick={() => setOffen(true)} className="text-sky-700 underline font-semibold">🔄 {direkt ? 'Zeit verschieben' : 'Verschiebung anfragen'} (Hitze, Regen …)</button>
      ) : (
        <div className="rounded-lg border bg-white p-3 space-y-2">
          <p className="font-semibold">{direkt ? 'Neue Zeit wählen' : `Neue Zeit anfragen – ${binKutscher && b.pilot === ich.name ? 'die Vermittlung' : 'der Kutscher'} muss zustimmen`}</p>
          <select aria-label="Neue Zeit" value={start} onChange={(e) => setStart(e.target.value)} className="w-full border rounded px-2 py-2">
            <option value="">Bitte wählen …</option>
            {optionen.map((o) => <option key={o.start} value={o.start}>{o.start}–{o.ende} Uhr ({diffText(o.diff)})</option>)}
          </select>
          <div className="flex flex-wrap gap-2">
            {GRUENDE.map((g) => (
              <button key={g} type="button" onClick={() => setGrund(grund === g ? '' : g)} aria-pressed={grund === g}
                className={`rounded-full border px-3 py-1 ${grund === g ? 'border-rikscha-green bg-green-50 text-rikscha-green font-semibold' : ''}`}>{g}</button>
            ))}
          </div>
          <input aria-label="Anderer Grund" maxLength={100} value={eigen} onChange={(e) => setEigen(e.target.value)} placeholder="anderer Grund (optional)" className="w-full border rounded px-2 py-2" />
          {fehler && <p role="alert" className="text-red-700">⚠ {fehler}</p>}
          <div className="flex gap-2">
            <button disabled={!start || laeuft} onClick={() => senden('POST', { start, grund: [grund, eigen.trim()].filter(Boolean).join(' – ') }, 'Anfrage gesendet. Die andere Seite sieht sie jetzt.')}
              className="bg-sky-700 text-white rounded px-3 py-1.5 font-semibold disabled:opacity-50">{direkt ? 'Zeit ändern' : 'Anfrage senden'}</button>
            <button onClick={() => { setOffen(false); setFehler(''); }} className="text-gray-600">Abbrechen</button>
          </div>
        </div>
      )}
    </div>
  );
}
