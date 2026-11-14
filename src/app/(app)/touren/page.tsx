'use client';
import { useEffect, useRef, useState } from 'react';

const ERLAUBT = ['kutscher', 'kutscher-admin', 'pilot', 'gfo', 'admin'];

type Tour = { id: string; name: string; kurzname: string; beschreibung?: string; farbe: string; laenge?: string; dauer?: string; erstellt_von: string; erstellt_am: string };

function parseGpx(text: string): [number, number][] {
  const parser = typeof window !== 'undefined' ? new DOMParser() : null;
  if (!parser) return [];
  const doc = parser.parseFromString(text, 'application/xml');
  const pts = Array.from(doc.querySelectorAll('trkpt, rtept, wpt'));
  return pts
    .map((p) => [parseFloat(p.getAttribute('lat') ?? ''), parseFloat(p.getAttribute('lon') ?? '')] as [number, number])
    .filter(([lat, lon]) => !isNaN(lat) && !isNaN(lon));
}

function schaetzeLaenge(wps: [number, number][]): string {
  if (wps.length < 2) return '';
  let m = 0;
  for (let i = 1; i < wps.length; i++) {
    const [lat1, lon1] = wps[i - 1], [lat2, lon2] = wps[i];
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    m += R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
  const km = m / 1000;
  return `ca. ${km < 10 ? km.toFixed(1) : Math.round(km)} km`;
}

export default function TourenVerwaltung() {
  const [zugang, setZugang] = useState<'laden' | 'nein' | 'ja'>('laden');
  const [pilot, setPilot] = useState('');
  const [pw, setPw] = useState('');
  const [touren, setTouren] = useState<Tour[]>([]);
  const [fehler, setFehler] = useState('');
  const [erfolg, setErfolg] = useState('');
  const [speichert, setSpeichert] = useState(false);

  const [name, setName] = useState('');
  const [kurzname, setKurzname] = useState('');
  const [beschreibung, setBeschreibung] = useState('');
  const [farbe, setFarbe] = useState('#2D6B1E');
  const [laenge, setLaenge] = useState('');
  const [dauer, setDauer] = useState('');
  const [waypoints, setWaypoints] = useState<[number, number][]>([]);
  const [gpxRoh, setGpxRoh] = useState('');
  const [dateiName, setDateiName] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

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
    fetch('/api/touren').then(r => r.json()).then(setTouren).catch(() => {});
  }, [zugang]);

  const gpxWaehlen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDateiName(file.name);
    const text = await file.text();
    setGpxRoh(text);
    const wps = parseGpx(text);
    setWaypoints(wps);
    if (wps.length) setLaenge(schaetzeLaenge(wps));
    if (!name) setName(file.name.replace(/\.gpx$/i, '').replace(/[-_]/g, ' '));
  };

  const speichern = async () => {
    if (!name.trim()) { setFehler('Bitte einen Namen eingeben.'); return; }
    if (!waypoints.length) { setFehler('Bitte eine GPX-Datei wählen oder Wegpunkte eingeben.'); return; }
    setSpeichert(true); setFehler('');
    const res = await fetch('/api/touren', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pilot, password: pw, name: name.trim(), kurzname: kurzname.trim() || name.trim(), beschreibung: beschreibung.trim(), farbe, laenge, dauer, waypoints, gpx_original: gpxRoh || null }),
    });
    setSpeichert(false);
    if (!res.ok) { const d = await res.json(); setFehler(d.error ?? 'Fehler beim Speichern.'); return; }
    setErfolg(`Tour "${name}" wurde gespeichert und erscheint jetzt auf der Karte.`);
    setName(''); setKurzname(''); setBeschreibung(''); setFarbe('#2D6B1E'); setLaenge(''); setDauer(''); setWaypoints([]); setGpxRoh(''); setDateiName('');
    if (fileRef.current) fileRef.current.value = '';
    fetch('/api/touren').then(r => r.json()).then(setTouren).catch(() => {});
  };

  const loeschen = async (id: string, tourName: string) => {
    if (!confirm(`Tour "${tourName}" wirklich löschen?`)) return;
    await fetch('/api/touren', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pilot, password: pw, id }) });
    setTouren(t => t.filter(x => x.id !== id));
  };

  if (zugang === 'laden') return <div style={{ padding: '2rem', textAlign: 'center' }}>⏳</div>;
  if (zugang === 'nein') return <div style={{ padding: '2rem', color: '#dc2626' }}>Bitte als Kutscher anmelden.</div>;

  const inp: React.CSSProperties = { width: '100%', border: '1.5px solid #D6CCB8', borderRadius: 8, padding: '0.5rem 0.75rem', fontSize: '0.9rem', boxSizing: 'border-box' };
  const label: React.CSSProperties = { display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#5C4E38', marginBottom: '0.3rem' };

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '1.5rem 1rem' }}>
      <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2D6B1E', marginBottom: '0.25rem' }}>Touren verwalten</h1>
      <p style={{ color: '#5C4E38', fontSize: '0.88rem', marginBottom: '1.5rem' }}>Lade eine GPX-Datei hoch oder gib Wegpunkte ein. Die Tour erscheint sofort auf der öffentlichen Karte.</p>

      <div style={{ background: '#F7F3EC', border: '1.5px solid #D6CCB8', borderRadius: 12, padding: '1.25rem', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#1C1208', marginBottom: '1rem' }}>Neue Tour hinzufügen</h2>

        <div style={{ marginBottom: '0.75rem' }}>
          <label style={label}>GPX-Datei</label>
          <input ref={fileRef} type="file" accept=".gpx,application/gpx+xml" onChange={gpxWaehlen} style={{ display: 'none' }} />
          <button onClick={() => fileRef.current?.click()} style={{ background: waypoints.length ? '#2D6B1E' : '#fff', color: waypoints.length ? '#fff' : '#2D6B1E', border: '1.5px solid #2D6B1E', borderRadius: 8, padding: '0.5rem 1rem', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600 }}>
            {dateiName ? `✓ ${dateiName} (${waypoints.length} Punkte)` : '📂 GPX-Datei wählen…'}
          </button>
          {waypoints.length > 0 && <span style={{ marginLeft: '0.75rem', fontSize: '0.8rem', color: '#5C4E38' }}>Länge automatisch berechnet: {laenge}</span>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div>
            <label style={label}>Name *</label>
            <input style={inp} value={name} onChange={e => setName(e.target.value)} placeholder="z.B. Mertener Heide" />
          </div>
          <div>
            <label style={label}>Kurzname (für Karte)</label>
            <input style={inp} value={kurzname} onChange={e => setKurzname(e.target.value)} placeholder="z.B. Heide" />
          </div>
          <div>
            <label style={label}>Länge</label>
            <input style={inp} value={laenge} onChange={e => setLaenge(e.target.value)} placeholder="ca. 8 km" />
          </div>
          <div>
            <label style={label}>Dauer</label>
            <input style={inp} value={dauer} onChange={e => setDauer(e.target.value)} placeholder="ca. 45 Min." />
          </div>
        </div>

        <div style={{ marginBottom: '0.75rem' }}>
          <label style={label}>Beschreibung</label>
          <textarea style={{ ...inp, minHeight: 70, resize: 'vertical' }} value={beschreibung} onChange={e => setBeschreibung(e.target.value)} placeholder="Was macht diese Tour besonders?" />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={label}>Farbe auf der Karte</label>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {['#2D6B1E', '#92400E', '#1D4ED8', '#B45309', '#7C3AED', '#DC2626'].map(c => (
              <button key={c} onClick={() => setFarbe(c)} style={{ width: 32, height: 32, borderRadius: '50%', background: c, border: farbe === c ? '3px solid #1C1208' : '2px solid transparent', cursor: 'pointer' }} />
            ))}
            <input type="color" value={farbe} onChange={e => setFarbe(e.target.value)} style={{ width: 32, height: 32, border: 'none', borderRadius: '50%', cursor: 'pointer', padding: 0 }} title="Eigene Farbe" />
          </div>
        </div>

        {fehler && <div style={{ background: '#FEE2E2', color: '#DC2626', borderRadius: 8, padding: '0.5rem 0.75rem', fontSize: '0.85rem', marginBottom: '0.75rem' }}>❌ {fehler}</div>}
        {erfolg && <div style={{ background: '#D1FAE5', color: '#065F46', borderRadius: 8, padding: '0.5rem 0.75rem', fontSize: '0.85rem', marginBottom: '0.75rem' }}>✅ {erfolg}</div>}

        <button onClick={speichern} disabled={speichert || !waypoints.length || !name.trim()} style={{ background: '#2D6B1E', color: '#fff', border: 'none', borderRadius: 8, padding: '0.6rem 1.5rem', fontWeight: 700, fontSize: '0.95rem', cursor: speichert || !waypoints.length || !name.trim() ? 'not-allowed' : 'pointer', opacity: speichert || !waypoints.length || !name.trim() ? 0.6 : 1 }}>
          {speichert ? '⏳ Speichern…' : '✓ Tour speichern'}
        </button>
      </div>

      <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#1C1208', marginBottom: '0.75rem' }}>Gespeicherte Touren ({touren.length})</h2>
      {touren.length === 0 && <p style={{ color: '#5C4E38', fontSize: '0.88rem' }}>Noch keine Touren gespeichert.</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {touren.map(t => (
          <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#fff', border: '1.5px solid #D6CCB8', borderRadius: 10, padding: '0.75rem 1rem' }}>
            <span style={{ width: 14, height: 14, borderRadius: '50%', background: t.farbe, flexShrink: 0, display: 'inline-block' }} />
            <span style={{ flex: 1 }}>
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{t.name}</span>
              {(t.beschreibung) && <span style={{ display: 'block', fontSize: '0.78rem', color: '#5C4E38' }}>{t.beschreibung.slice(0, 80)}{t.beschreibung.length > 80 ? '…' : ''}</span>}
              <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>von {t.erstellt_von}</span>
            </span>
            <a href={`/touren/${t.id}`} style={{ background: '#2D6B1E', color: '#fff', border: 'none', borderRadius: 7, padding: '0.25rem 0.65rem', fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none', cursor: 'pointer' }}>Bearbeiten</a>
            <button onClick={() => loeschen(t.id, t.name)} style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}>Löschen</button>
          </div>
        ))}
      </div>
    </div>
  );
}
