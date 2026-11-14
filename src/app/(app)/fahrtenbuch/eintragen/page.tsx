'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const ERLAUBT = ['kutscher', 'kutscher-admin', 'pilot', 'gfo', 'admin'];

type Buchung = {
  id: string; fahrzeug: string; datum: string; startzeit: string; endzeit: string;
  pilot: string; gaeste?: string[]; eigenfahrt?: boolean; storniert?: boolean; notiz?: string;
};

type FahrtenbuchEintrag = {
  id?: string; buchung_id?: string; fahrzeug: string; datum: string;
  startzeit?: string; endzeit?: string; kutscher: string; fahrttyp: string;
  gast_name?: string; anzahl_fahrgaeste: number; km_start?: number; km_ende?: number;
  spenden: number; ausgaben?: number; ausgaben_beschreibung?: string;
  wetter: string; schaden: boolean; schaden_beschreibung?: string; bemerkungen?: string;
  status?: string; checkliste_vor?: string[]; checkliste_nach?: string[];
};

const CHECKLISTE_VOR = [
  { id: 'reifendruck', text: 'Reifendruck geprüft (vorne & hinten)' },
  { id: 'bremsen', text: 'Bremsen funktionsfähig' },
  { id: 'beleuchtung', text: 'Beleuchtung funktioniert' },
  { id: 'rikscha_zustand', text: 'Rikscha äußerlich in Ordnung (keine sichtbaren Schäden)' },
  { id: 'gurte', text: 'Fahrgast-Sicherung / Gurte geprüft' },
  { id: 'erste_hilfe', text: 'Erste-Hilfe-Set vorhanden' },
  { id: 'handy', text: 'Handy / Akku geladen' },
];

const CHECKLISTE_NACH = [
  { id: 'gereinigt', text: 'Rikscha gereinigt' },
  { id: 'km_notiert', text: 'Kilometerstand notiert' },
  { id: 'schaden_geprueft', text: 'Schäden oder Auffälligkeiten geprüft' },
  { id: 'abgestellt', text: 'Rikscha ordnungsgemäß abgestellt / abgeschlossen' },
];

function formatDatum(d: string) {
  if (!d) return '';
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });
}

function ChecklisteAbschnitt({
  titel, items, checked, onChange,
}: { titel: string; items: { id: string; text: string }[]; checked: string[]; onChange: (id: string) => void }) {
  const alle = items.every(i => checked.includes(i.id));
  return (
    <div style={{ background: '#F7F3EC', border: '1.5px solid #D6CCB8', borderRadius: 12, padding: '1rem', marginBottom: '0.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
        <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#5C4E38' }}>{titel}</h3>
        {alle
          ? <span style={{ fontSize: '0.78rem', color: '#065F46', fontWeight: 700 }}>✓ Alle bestätigt</span>
          : <span style={{ fontSize: '0.78rem', color: '#B45309' }}>{checked.filter(id => items.some(i => i.id === id)).length}/{items.length}</span>
        }
      </div>
      {items.map(item => (
        <label key={item.id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', cursor: 'pointer', marginBottom: '0.35rem', fontSize: '0.85rem', color: checked.includes(item.id) ? '#065F46' : '#1C1208' }}>
          <input type="checkbox" checked={checked.includes(item.id)} onChange={() => onChange(item.id)}
            style={{ marginTop: 2, flexShrink: 0, width: 15, height: 15, accentColor: '#2D6B1E' }} />
          <span style={{ textDecoration: checked.includes(item.id) ? 'line-through' : 'none', opacity: checked.includes(item.id) ? 0.7 : 1 }}>{item.text}</span>
        </label>
      ))}
    </div>
  );
}

export default function FahrtenbuchEintragen() {
  const router = useRouter();
  const params = useSearchParams();
  const vorBuchungId = params.get('buchung_id');

  const [zugang, setZugang] = useState<'laden' | 'nein' | 'ja'>('laden');
  const [pilot, setPilot] = useState('');
  const [pw, setPw] = useState('');
  const [buchungen, setBuchungen] = useState<Buchung[]>([]);
  const [gewaehlt, setGewaehlt] = useState<Buchung | null>(null);
  const [fehler, setFehler] = useState('');
  const [erfolg, setErfolg] = useState('');
  const [speichert, setSpeichert] = useState(false);
  const [existingId, setExistingId] = useState('');

  const [fahrttyp, setFahrttyp] = useState('gast');
  const [gastName, setGastName] = useState('');
  const [anzahl, setAnzahl] = useState(1);
  const [kmStart, setKmStart] = useState('');
  const [kmEnde, setKmEnde] = useState('');
  const [spenden, setSpenden] = useState('');
  const [wetter, setWetter] = useState('');
  const [ausgaben, setAusgaben] = useState('');
  const [ausgabenBeschreibung, setAusgabenBeschreibung] = useState('');
  const [schaden, setSchaden] = useState(false);
  const [schadenBeschreibung, setSchadenBeschreibung] = useState('');
  const [bemerkungen, setBemerkungen] = useState('');
  const [checklisteVor, setChecklisteVor] = useState<string[]>([]);
  const [checklisteNach, setChecklisteNach] = useState<string[]>([]);

  useEffect(() => {
    try {
      const n = localStorage.getItem('pilot_name') ?? '';
      const p = localStorage.getItem('pilot_pw') ?? '';
      const r = localStorage.getItem('pilot_rolle') ?? '';
      if (n && p && ERLAUBT.includes(r)) { setPilot(n); setPw(p); setZugang('ja'); }
      else setZugang('nein');
    } catch { setZugang('nein'); }
  }, []);

  useEffect(() => {
    if (zugang !== 'ja') return;
    const bis = new Date().toISOString().slice(0, 10);
    const vonDt = new Date(); vonDt.setDate(vonDt.getDate() - 14);
    const von = vonDt.toISOString().slice(0, 10);
    fetch(`/api/buchungen?von=${von}&bis=${bis}&pilot=${encodeURIComponent(pilot)}`)
      .then(r => r.json())
      .then((data: Buchung[]) => {
        if (!Array.isArray(data)) return;
        const eigene = data.filter(b => !b.eigenfahrt && !b.storniert).sort((a: Buchung, b: Buchung) => b.datum.localeCompare(a.datum) || b.startzeit.localeCompare(a.startzeit));
        setBuchungen(eigene);
        if (vorBuchungId) {
          const b = eigene.find(x => x.id === vorBuchungId);
          if (b) buchungWaehlen(b);
        }
      }).catch(() => {});
  }, [zugang, pilot]);

  const toggleCheck = (liste: string[], setListe: (v: string[]) => void, id: string) => {
    setListe(liste.includes(id) ? liste.filter(x => x !== id) : [...liste, id]);
  };

  const buchungWaehlen = (b: Buchung) => {
    setGewaehlt(b);
    setFahrttyp(b.eigenfahrt ? 'eigenfahrt' : 'gast');
    setGastName(b.gaeste?.[0] ?? '');
    setAnzahl(b.gaeste?.length ?? 1);
    setFehler('');
  };

  const speichern = async () => {
    if (!gewaehlt && !pilot) return;
    setSpeichert(true); setFehler(''); setErfolg('');

    const eintrag: FahrtenbuchEintrag & { pilot: string; password: string; buchung_id?: string } = {
      pilot, password: pw,
      buchung_id: gewaehlt?.id,
      fahrzeug: gewaehlt?.fahrzeug ?? '',
      datum: gewaehlt?.datum ?? new Date().toISOString().slice(0, 10),
      startzeit: gewaehlt?.startzeit,
      endzeit: gewaehlt?.endzeit,
      kutscher: pilot,
      fahrttyp,
      gast_name: gastName.trim() || undefined,
      anzahl_fahrgaeste: anzahl,
      km_start: kmStart ? parseInt(kmStart) : undefined,
      km_ende: kmEnde ? parseInt(kmEnde) : undefined,
      spenden: spenden ? parseFloat(spenden) : 0,
      ausgaben: ausgaben ? parseFloat(ausgaben) : 0,
      ausgaben_beschreibung: ausgabenBeschreibung.trim() || undefined,
      wetter,
      schaden,
      schaden_beschreibung: schaden ? schadenBeschreibung.trim() : undefined,
      bemerkungen: bemerkungen.trim() || undefined,
      status: 'abgeschlossen',
      checkliste_vor: checklisteVor.length ? checklisteVor : undefined,
      checkliste_nach: checklisteNach.length ? checklisteNach : undefined,
    };

    if (!eintrag.fahrzeug) { setFehler('Bitte eine Fahrt wählen.'); setSpeichert(false); return; }

    const res = await fetch('/api/fahrtenbuch', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(eintrag) });
    setSpeichert(false);
    if (res.status === 409) {
      const d = await res.json();
      setExistingId(d.existing_id);
      setFehler('Für diese Fahrt existiert bereits ein Eintrag.');
      return;
    }
    if (!res.ok) { const d = await res.json(); setFehler(d.error ?? 'Fehler.'); return; }
    setErfolg('Eintrag gespeichert!');
    setTimeout(() => router.push('/fahrtenbuch'), 1500);
  };

  if (zugang === 'laden') return <div style={{ padding: '2rem', textAlign: 'center' }}>⏳</div>;
  if (zugang === 'nein') return <div style={{ padding: '2rem', color: '#dc2626' }}>Bitte als Kutscher anmelden.</div>;

  const inp: React.CSSProperties = { width: '100%', border: '1.5px solid #D6CCB8', borderRadius: 8, padding: '0.5rem 0.75rem', fontSize: '0.9rem', boxSizing: 'border-box', background: '#fff' };
  const lbl: React.CSSProperties = { display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#5C4E38', marginBottom: '0.3rem' };

  const kmGefahren = kmStart && kmEnde && parseInt(kmEnde) > parseInt(kmStart) ? parseInt(kmEnde) - parseInt(kmStart) : null;

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '1.5rem 1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <button onClick={() => router.push('/fahrtenbuch')} style={{ background: '#F7F3EC', border: '1.5px solid #D6CCB8', borderRadius: 7, padding: '0.4rem 0.8rem', cursor: 'pointer', fontSize: '0.85rem' }}>← Zurück</button>
        <h1 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#2D6B1E', margin: 0 }}>Fahrtenbuch-Eintrag</h1>
      </div>

      {/* Checkliste vor Fahrt */}
      <ChecklisteAbschnitt
        titel="✅ Checkliste vor Fahrtbeginn"
        items={CHECKLISTE_VOR}
        checked={checklisteVor}
        onChange={id => toggleCheck(checklisteVor, setChecklisteVor, id)}
      />

      {/* Fahrt auswählen */}
      <div style={{ background: '#F7F3EC', border: '1.5px solid #D6CCB8', borderRadius: 12, padding: '1.25rem', marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem' }}>Fahrt aus Kalender wählen</h2>
        {buchungen.length === 0 ? (
          <p style={{ color: '#9CA3AF', fontSize: '0.85rem' }}>Keine Fahrten der letzten 14 Tage gefunden.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: 240, overflowY: 'auto' }}>
            {buchungen.map(b => (
              <button key={b.id} onClick={() => buchungWaehlen(b)}
                style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', background: gewaehlt?.id === b.id ? '#2D6B1E' : '#fff', color: gewaehlt?.id === b.id ? '#fff' : '#1C1208', border: `1.5px solid ${gewaehlt?.id === b.id ? '#2D6B1E' : '#D6CCB8'}`, borderRadius: 8, padding: '0.5rem 0.75rem', cursor: 'pointer', textAlign: 'left', fontSize: '0.85rem' }}>
                <span style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{formatDatum(b.datum)}</span>
                <span>{b.startzeit?.slice(0, 5)}–{b.endzeit?.slice(0, 5)}</span>
                <span style={{ background: gewaehlt?.id === b.id ? 'rgba(255,255,255,0.2)' : '#F7F3EC', borderRadius: 5, padding: '0.1rem 0.4rem', fontSize: '0.78rem' }}>{b.fahrzeug}</span>
                {b.gaeste?.[0] && <span style={{ opacity: 0.8 }}>mit {b.gaeste[0]}</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {gewaehlt && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div>
              <label style={lbl}>Fahrttyp</label>
              <select style={inp} value={fahrttyp} onChange={e => setFahrttyp(e.target.value)}>
                <option value="gast">Fahrt mit Gast</option>
                <option value="eigenfahrt">Eigenfahrt / Leerfahrt</option>
                <option value="leerfahrt">Überführungsfahrt</option>
              </select>
            </div>
            <div>
              <label style={lbl}>Anzahl Fahrgäste</label>
              <input style={inp} type="number" min={0} max={10} value={anzahl} onChange={e => setAnzahl(parseInt(e.target.value) || 0)} />
            </div>
            {fahrttyp === 'gast' && (
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={lbl}>Gast-Name</label>
                <input style={inp} value={gastName} onChange={e => setGastName(e.target.value)} placeholder="Name des Gastes" />
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div>
              <label style={lbl}>Kilometerstand Start</label>
              <input style={inp} type="number" min={0} value={kmStart} onChange={e => setKmStart(e.target.value)} placeholder="z.B. 1250" />
            </div>
            <div>
              <label style={lbl}>Kilometerstand Ende</label>
              <input style={inp} type="number" min={0} value={kmEnde} onChange={e => setKmEnde(e.target.value)} placeholder="z.B. 1258" />
            </div>
            {kmGefahren !== null && (
              <div style={{ gridColumn: '1 / -1', background: '#D1FAE5', color: '#065F46', borderRadius: 8, padding: '0.4rem 0.75rem', fontSize: '0.85rem', fontWeight: 600 }}>
                🛣 Gefahrene Kilometer: {kmGefahren} km
              </div>
            )}
            <div>
              <label style={lbl}>Spenden / Einnahmen (€)</label>
              <input style={inp} type="number" min={0} step={0.01} value={spenden} onChange={e => setSpenden(e.target.value)} placeholder="0,00" />
            </div>
            <div>
              <label style={lbl}>Ausgaben (€)</label>
              <input style={inp} type="number" min={0} step={0.01} value={ausgaben} onChange={e => setAusgaben(e.target.value)} placeholder="0,00" />
            </div>
            {ausgaben && parseFloat(ausgaben) > 0 && (
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={lbl}>Ausgaben-Beschreibung</label>
                <input style={inp} value={ausgabenBeschreibung} onChange={e => setAusgabenBeschreibung(e.target.value)} placeholder="z.B. Reifenreparatur, Reinigungsmittel …" />
              </div>
            )}
            <div>
              <label style={lbl}>Wetter</label>
              <select style={inp} value={wetter} onChange={e => setWetter(e.target.value)}>
                <option value="">– keine Angabe –</option>
                <option value="sonne">☀️ Sonnig</option>
                <option value="bewoelkt">⛅ Bewölkt</option>
                <option value="regen">🌧 Regen</option>
                <option value="schnee">❄️ Schnee</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '0.75rem' }}>
            <label style={{ ...lbl, display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={schaden} onChange={e => setSchaden(e.target.checked)} style={{ width: 16, height: 16 }} />
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: schaden ? '#DC2626' : '#5C4E38' }}>⚠️ Schaden / Wartungsbedarf melden</span>
            </label>
            {schaden && (
              <textarea style={{ ...inp, marginTop: '0.5rem', minHeight: 70, resize: 'vertical' }}
                value={schadenBeschreibung} onChange={e => setSchadenBeschreibung(e.target.value)}
                placeholder="Was ist passiert? Was muss kontrolliert/repariert werden?" />
            )}
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={lbl}>Bemerkungen</label>
            <textarea style={{ ...inp, minHeight: 70, resize: 'vertical' }} value={bemerkungen} onChange={e => setBemerkungen(e.target.value)} placeholder="Besonderheiten, Rückmeldungen vom Gast, …" />
          </div>

          {/* Checkliste nach Fahrt */}
          <ChecklisteAbschnitt
            titel="✅ Checkliste nach Fahrtende"
            items={CHECKLISTE_NACH}
            checked={checklisteNach}
            onChange={id => toggleCheck(checklisteNach, setChecklisteNach, id)}
          />

          {fehler && (
            <div style={{ background: '#FEE2E2', color: '#DC2626', borderRadius: 8, padding: '0.5rem 0.75rem', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
              ❌ {fehler}
              {existingId && <span> — <a href={`/fahrtenbuch?id=${existingId}`} style={{ color: '#DC2626' }}>Eintrag öffnen</a></span>}
            </div>
          )}
          {erfolg && <div style={{ background: '#D1FAE5', color: '#065F46', borderRadius: 8, padding: '0.5rem 0.75rem', fontSize: '0.85rem', marginBottom: '0.75rem' }}>✅ {erfolg}</div>}

          <button onClick={speichern} disabled={speichert} style={{ background: '#2D6B1E', color: '#fff', border: 'none', borderRadius: 8, padding: '0.65rem 1.5rem', fontWeight: 700, fontSize: '0.95rem', cursor: speichert ? 'not-allowed' : 'pointer', opacity: speichert ? 0.6 : 1 }}>
            {speichert ? '⏳ Speichern…' : '✓ Eintrag speichern'}
          </button>
        </>
      )}
    </div>
  );
}
