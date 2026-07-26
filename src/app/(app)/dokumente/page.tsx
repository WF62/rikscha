'use client';
import { useState, useEffect, useRef } from 'react';

type Datei = {
  id: string;
  name: string;
  kategorie: string;
  url: string;
  groesse: number;
  typ: string;
  hochgeladen_von: string;
  erstellt_am: string;
};

const KATEGORIEN = ['Schulung', 'Formulare', 'Fotos', 'Protokolle', 'Sonstiges'];

function dateiIcon(typ: string) {
  if (typ.startsWith('image/')) return '🖼️';
  if (typ === 'application/pdf') return '📄';
  if (typ.includes('word')) return '📝';
  if (typ.includes('spreadsheet') || typ.includes('excel')) return '📊';
  return '📎';
}

function groesseLabel(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function datumLabel(iso: string) {
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function DokumentePage() {
  const [pilot, setPilot]       = useState(() => typeof window !== 'undefined' ? localStorage.getItem('pilot_name') ?? '' : '');
  const [password, setPassword] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('pilot_pw') ?? '' : '');
  const [eingeloggt, setEingeloggt] = useState(() => typeof window !== 'undefined' && !!localStorage.getItem('pilot_name'));
  const [loginFehler, setLoginFehler] = useState('');
  const [dateien, setDateien]   = useState<Datei[]>([]);
  const [laden, setLaden]       = useState(false);
  const [kategFilter, setKategFilter] = useState('Alle');
  const [uploading, setUploading] = useState(false);
  const [uploadKat, setUploadKat] = useState('Sonstiges');
  const [uploadFehler, setUploadFehler] = useState('');
  const [loeschenId, setLoeschenId] = useState<string | null>(null);
  const [vorschau, setVorschau] = useState<Datei | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoginFehler('');
    setLaden(true);
    try {
      // Pilot via localStorage vorausfüllen
      const res = await fetch('/api/pilot-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pilot, password }),
      });
      if (!res.ok) { setLoginFehler('Name oder Passwort falsch.'); setLaden(false); return; }
      localStorage.setItem('pilot_name', pilot);
      localStorage.setItem('pilot_pw', password);
      setEingeloggt(true);
      await ladeDateien();
    } catch { setLoginFehler('Verbindungsfehler.'); }
    setLaden(false);
  }

  useEffect(() => {
    if (eingeloggt) ladeDateien();
  }, []);

  async function ladeDateien() {
    const res = await fetch('/api/piloten-dateien');
    if (res.ok) setDateien(await res.json());
  }

  async function hochladen(datei: File) {
    setUploading(true);
    setUploadFehler('');
    const form = new FormData();
    form.append('pilot', pilot);
    form.append('password', password);
    form.append('kategorie', uploadKat);
    form.append('datei', datei);
    const res = await fetch('/api/piloten-dateien', { method: 'POST', body: form });
    if (res.ok) {
      await ladeDateien();
    } else {
      const { error } = await res.json();
      setUploadFehler(error ?? 'Fehler beim Hochladen.');
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  }

  async function loeschen(id: string) {
    const res = await fetch('/api/piloten-dateien', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, pilot, password }),
    });
    if (res.ok) { setDateien(d => d.filter(x => x.id !== id)); setLoeschenId(null); }
  }

  const gefiltert = kategFilter === 'Alle' ? dateien : dateien.filter(d => d.kategorie === kategFilter);
  const kategorienMitAnzahl = KATEGORIEN.map(k => ({ k, n: dateien.filter(d => d.kategorie === k).length }));

  if (!eingeloggt) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <form onSubmit={login} style={{ background: '#fff', borderRadius: 12, padding: '2rem 1.8rem', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', width: 320 }}>
        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#2D6B1E', marginBottom: '0.25rem' }}>📂 Pilotenablage</div>
        <div style={{ fontSize: '0.8rem', color: '#5C4E38', marginBottom: '1.25rem' }}>Bitte anmelden</div>
        <label style={lbl}>Pilotenname</label>
        <input style={inp} value={pilot} onChange={e => setPilot(e.target.value)} required autoFocus />
        <label style={lbl}>Passwort</label>
        <input style={inp} type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        {loginFehler && <div style={{ color: '#dc2626', fontSize: '0.8rem', marginBottom: '0.75rem' }}>{loginFehler}</div>}
        <button style={btn} disabled={laden}>{laden ? 'Prüfe…' : 'Anmelden'}</button>
      </form>
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1C1208' }}>📂 Pilotenablage</h2>
          <div style={{ fontSize: '0.78rem', color: '#5C4E38', marginTop: '0.1rem' }}>{dateien.length} Dateien · angemeldet als {pilot}</div>
        </div>
        {/* Upload-Bereich */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <select value={uploadKat} onChange={e => setUploadKat(e.target.value)} style={{ border: '1.5px solid #D6CCB8', borderRadius: 6, padding: '0.4rem 0.6rem', fontSize: '0.82rem', color: '#1C1208' }}>
            {KATEGORIEN.map(k => <option key={k}>{k}</option>)}
          </select>
          <input ref={fileRef} type="file" style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) hochladen(f); }} />
          <button onClick={() => fileRef.current?.click()} disabled={uploading}
            style={{ background: '#2D6B1E', color: '#fff', border: 'none', borderRadius: 7, padding: '0.45rem 1.1rem', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}>
            {uploading ? '⏳ Hochladen…' : '↑ Datei hochladen'}
          </button>
        </div>
      </div>

      {uploadFehler && <div style={{ color: '#dc2626', fontSize: '0.82rem', marginBottom: '1rem' }}>❌ {uploadFehler}</div>}

      {/* Kategorie-Filter */}
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {['Alle', ...KATEGORIEN].map(k => (
          <button key={k} onClick={() => setKategFilter(k)}
            style={{ background: kategFilter === k ? '#2D6B1E' : '#fff', color: kategFilter === k ? '#fff' : '#5C4E38', border: '1.5px solid #D6CCB8', borderRadius: 999, padding: '0.25rem 0.8rem', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>
            {k}{k !== 'Alle' && kategorienMitAnzahl.find(x => x.k === k)?.n ? ` (${kategorienMitAnzahl.find(x => x.k === k)?.n})` : ''}
          </button>
        ))}
      </div>

      {/* Dateiliste */}
      {gefiltert.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#9a8a72', padding: '3rem', background: '#fff', borderRadius: 10 }}>
          Keine Dateien in dieser Kategorie
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
          {gefiltert.map(d => (
            <div key={d.id} style={{ background: '#fff', borderRadius: 10, padding: '0.9rem', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', display: 'flex', flexDirection: 'column', gap: '0.4rem', position: 'relative' }}>
              {/* Vorschau */}
              <div onClick={() => setVorschau(d)} style={{ cursor: 'pointer', height: 100, borderRadius: 7, overflow: 'hidden', background: '#F5F0E7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {d.typ.startsWith('image/')
                  ? <img src={d.url} alt={d.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: '2.5rem' }}>{dateiIcon(d.typ)}</span>
                }
              </div>
              {/* Info */}
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1C1208', wordBreak: 'break-word', lineHeight: 1.3 }}>{d.name}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#9a8a72' }}>
                <span>{groesseLabel(d.groesse)}</span>
                <span>{datumLabel(d.erstellt_am)}</span>
              </div>
              <div style={{ fontSize: '0.68rem', color: '#5C4E38' }}>von {d.hochgeladen_von}</div>
              {/* Aktionen */}
              <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.2rem' }}>
                <a href={d.url} target="_blank" rel="noreferrer"
                  style={{ flex: 1, textAlign: 'center', background: '#EDE9FE', color: '#4c1d95', borderRadius: 5, padding: '0.3rem', fontSize: '0.72rem', fontWeight: 600, textDecoration: 'none' }}>
                  Öffnen
                </a>
                <button onClick={() => setLoeschenId(d.id)}
                  style={{ background: '#FEE2E2', color: '#991b1b', border: 'none', borderRadius: 5, padding: '0.3rem 0.6rem', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer' }}>
                  🗑
                </button>
              </div>
              {/* Kategorie-Badge */}
              <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.45)', color: '#fff', fontSize: '0.58rem', fontWeight: 700, borderRadius: 4, padding: '0.1rem 0.4rem' }}>
                {d.kategorie}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Löschen-Bestätigung */}
      {loeschenId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}
          onClick={() => setLoeschenId(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 12, padding: '1.75rem 2rem', maxWidth: 340, width: '90%', textAlign: 'center' }}>
            <div style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>🗑️</div>
            <div style={{ fontWeight: 700, marginBottom: '0.4rem' }}>Datei löschen?</div>
            <div style={{ fontSize: '0.82rem', color: '#5C4E38', marginBottom: '1.25rem' }}>Diese Aktion kann nicht rückgängig gemacht werden.</div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button onClick={() => setLoeschenId(null)} style={{ background: '#F5F0E7', border: 'none', borderRadius: 7, padding: '0.5rem 1.2rem', cursor: 'pointer', fontWeight: 600 }}>Abbrechen</button>
              <button onClick={() => loeschen(loeschenId)} style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 7, padding: '0.5rem 1.2rem', cursor: 'pointer', fontWeight: 700 }}>Löschen</button>
            </div>
          </div>
        </div>
      )}

      {/* Bild-Vorschau Modal */}
      {vorschau && vorschau.typ.startsWith('image/') && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: '1rem' }}
          onClick={() => setVorschau(null)}>
          <div onClick={e => e.stopPropagation()} style={{ maxWidth: '90vw', maxHeight: '90vh', position: 'relative' }}>
            <img src={vorschau.url} alt={vorschau.name} style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: 8, display: 'block' }} />
            <div style={{ color: '#fff', fontSize: '0.82rem', marginTop: '0.5rem', textAlign: 'center' }}>{vorschau.name} · {vorschau.hochgeladen_von} · {datumLabel(vorschau.erstellt_am)}</div>
            <button onClick={() => setVorschau(null)} style={{ position: 'absolute', top: -12, right: -12, background: '#fff', border: 'none', borderRadius: '50%', width: 28, height: 28, fontWeight: 700, cursor: 'pointer', fontSize: '1rem' }}>×</button>
          </div>
        </div>
      )}
    </div>
  );
}

const lbl: React.CSSProperties = { display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#5C4E38', marginBottom: '0.25rem', letterSpacing: '0.05em' };
const inp: React.CSSProperties = { width: '100%', border: '1.5px solid #D6CCB8', borderRadius: 6, padding: '0.5rem 0.7rem', fontSize: '0.88rem', marginBottom: '0.9rem', outline: 'none', fontFamily: 'inherit' };
const btn: React.CSSProperties = { width: '100%', background: '#2D6B1E', color: '#fff', border: 'none', borderRadius: 7, padding: '0.6rem', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer' };
