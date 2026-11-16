'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAdminAuth } from '@/components/AdminGuard';

const FAHRZEUGE = ['flinker_flitzer', 'flotte_lotte', 'flotte_lotte_2', 'hase', 'jruuse_piter'];
const FAHRZEUGTYPEN = ['rikscha', 'paralleltandem'];
const MODELLE = ['vollpate', 'betriebspate', 'zukunftspate', 'foerderer'];
const POSTEN = ['inspektion', 'reparatur', 'versicherung', 'verschleiss', 'ruecklage', 'sonstiges'];
const POSTEN_LABEL: Record<string, string> = {
  inspektion: 'Jahresinspektion', reparatur: 'Reparatur', versicherung: 'Versicherung',
  verschleiss: 'Verschleißteile', ruecklage: 'Rücklage', sonstiges: 'Sonstiges',
};

function fahrzeugLabel(id: string) {
  return id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

type Pate = {
  id: string; name: string; email: string; fahrzeug_id: string; fahrzeugtyp: string;
  betrag_jahr: number | null; modell: string | null; aktiv: boolean; notizen: string | null; erstellt_am: string;
};
type Kosten = { id: string; fahrzeug_id: string; jahr: number; posten: string; betrag: number; beschreibung?: string };

const LEER_PATE = { name: '', email: '', password: '', fahrzeug_id: 'flinker_flitzer', fahrzeugtyp: 'rikscha', betrag_jahr: '', modell: 'vollpate', notizen: '' };
const LEER_KOSTEN = { fahrzeug_id: 'flinker_flitzer', jahr: new Date().getFullYear(), posten: 'inspektion', betrag: '', beschreibung: '' };

export default function PatenschatenPage() {
  const { getToken } = useAdminAuth();
  const headers = useCallback(() => ({
    'Content-Type': 'application/json',
    'x-admin-password': getToken(),
  }), [getToken]);

  const [tab, setTab] = useState<'paten' | 'kosten'>('paten');
  const [paten, setPaten] = useState<Pate[]>([]);
  const [kosten, setKosten] = useState<Kosten[]>([]);
  const [aktivFahrzeug, setAktivFahrzeug] = useState('flinker_flitzer');
  const [laden, setLaden] = useState(false);
  const [meldung, setMeldung] = useState('');

  const [neuPate, setNeuPate] = useState({ ...LEER_PATE });
  const [neuKosten, setNeuKosten] = useState({ ...LEER_KOSTEN });

  const ladePaten = useCallback(async () => {
    setLaden(true);
    const res = await fetch('/api/paten', { headers: headers() });
    if (res.ok) setPaten(await res.json());
    setLaden(false);
  }, [headers]);

  const ladeKosten = useCallback(async (fahrzeug_id: string) => {
    const res = await fetch(`/api/fahrzeug-kosten?fahrzeug_id=${fahrzeug_id}`, { headers: headers() });
    if (res.ok) setKosten(await res.json());
  }, [headers]);

  useEffect(() => { ladePaten(); }, [ladePaten]);
  useEffect(() => { ladeKosten(aktivFahrzeug); }, [aktivFahrzeug, ladeKosten]);

  const zeigeMeldung = (m: string) => { setMeldung(m); setTimeout(() => setMeldung(''), 3000); };

  const patenAnlegen = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/paten', {
      method: 'POST', headers: headers(),
      body: JSON.stringify({ ...neuPate, betrag_jahr: neuPate.betrag_jahr ? Number(neuPate.betrag_jahr) : null }),
    });
    if (res.ok) { zeigeMeldung('Pate angelegt.'); setNeuPate({ ...LEER_PATE }); ladePaten(); }
    else { const d = await res.json(); zeigeMeldung('Fehler: ' + d.error); }
  };

  const pateToggle = async (id: string, aktiv: boolean) => {
    await fetch('/api/paten', { method: 'PATCH', headers: headers(), body: JSON.stringify({ id, aktiv: !aktiv }) });
    ladePaten();
  };

  const kostenSpeichern = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/fahrzeug-kosten', {
      method: 'POST', headers: headers(),
      body: JSON.stringify({ ...neuKosten, betrag: Number(neuKosten.betrag) }),
    });
    if (res.ok) { zeigeMeldung('Gespeichert.'); ladeKosten(aktivFahrzeug); }
    else { const d = await res.json(); zeigeMeldung('Fehler: ' + d.error); }
  };

  const kostenLoeschen = async (id: string) => {
    if (!confirm('Eintrag löschen?')) return;
    await fetch('/api/fahrzeug-kosten', { method: 'DELETE', headers: headers(), body: JSON.stringify({ id }) });
    ladeKosten(aktivFahrzeug);
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '1.5rem 1rem', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2D6B1E', marginBottom: '1.5rem' }}>Patenschaften</h1>

      {meldung && (
        <div style={{ background: '#D1FAE5', border: '1px solid #6EE7B7', borderRadius: 8, padding: '0.6rem 1rem',
                      marginBottom: '1rem', fontSize: '0.9rem', color: '#065F46' }}>
          {meldung}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: '1.5rem', borderBottom: '2px solid #E5E7EB' }}>
        {(['paten', 'kosten'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            background: 'none', border: 'none', padding: '0.5rem 1rem', cursor: 'pointer',
            fontWeight: tab === t ? 700 : 400, fontSize: '0.95rem',
            color: tab === t ? '#2D6B1E' : '#6B7280',
            borderBottom: tab === t ? '2px solid #2D6B1E' : '2px solid transparent',
            marginBottom: -2,
          }}>
            {t === 'paten' ? 'Paten' : 'Fahrzeugkosten'}
          </button>
        ))}
      </div>

      {tab === 'paten' && (
        <>
          {/* Neuen Paten anlegen */}
          <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 10, padding: '1rem', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem' }}>Neuen Paten anlegen</h2>
            <form onSubmit={patenAnlegen} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.6rem' }}>
              <input placeholder="Name *" value={neuPate.name} onChange={e => setNeuPate(p => ({...p, name: e.target.value}))} required style={inputStyle} />
              <input placeholder="E-Mail *" type="email" value={neuPate.email} onChange={e => setNeuPate(p => ({...p, email: e.target.value}))} required style={inputStyle} />
              <input placeholder="Passwort *" type="password" value={neuPate.password} onChange={e => setNeuPate(p => ({...p, password: e.target.value}))} required style={inputStyle} />
              <select value={neuPate.fahrzeug_id} onChange={e => setNeuPate(p => ({...p, fahrzeug_id: e.target.value}))} style={inputStyle}>
                {FAHRZEUGE.map(f => <option key={f} value={f}>{fahrzeugLabel(f)}</option>)}
              </select>
              <select value={neuPate.fahrzeugtyp} onChange={e => setNeuPate(p => ({...p, fahrzeugtyp: e.target.value}))} style={inputStyle}>
                {FAHRZEUGTYPEN.map(f => <option key={f} value={f}>{f === 'rikscha' ? 'Rikscha' : 'Paralleltandem'}</option>)}
              </select>
              <select value={neuPate.modell} onChange={e => setNeuPate(p => ({...p, modell: e.target.value}))} style={inputStyle}>
                {MODELLE.map(m => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
              </select>
              <input placeholder="Betrag/Jahr (€)" type="number" value={neuPate.betrag_jahr} onChange={e => setNeuPate(p => ({...p, betrag_jahr: e.target.value}))} style={inputStyle} />
              <input placeholder="Notizen" value={neuPate.notizen} onChange={e => setNeuPate(p => ({...p, notizen: e.target.value}))} style={inputStyle} />
              <button type="submit" style={btnStyle}>Anlegen</button>
            </form>
          </div>

          {/* Paten-Liste */}
          {laden ? <p style={{ color: '#6B7280' }}>Lädt…</p> : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: '#F3F4F6' }}>
                  {['Name', 'E-Mail', 'Fahrzeug', 'Modell', 'Betrag/Jahr', 'Status', ''].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '0.5rem 0.6rem', fontWeight: 600, fontSize: '0.78rem', color: '#6B7280', borderBottom: '1px solid #E5E7EB' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paten.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #F3F4F6', opacity: p.aktiv ? 1 : 0.5 }}>
                    <td style={tdStyle}>{p.name}</td>
                    <td style={tdStyle}>{p.email}</td>
                    <td style={tdStyle}>{fahrzeugLabel(p.fahrzeug_id)}</td>
                    <td style={tdStyle}>{p.modell ?? '—'}</td>
                    <td style={tdStyle}>{p.betrag_jahr ? p.betrag_jahr.toLocaleString('de-DE') + ' €' : '—'}</td>
                    <td style={tdStyle}>
                      <span style={{ background: p.aktiv ? '#D1FAE5' : '#F3F4F6', color: p.aktiv ? '#065F46' : '#6B7280',
                                     borderRadius: 4, padding: '0.1rem 0.5rem', fontSize: '0.78rem', fontWeight: 600 }}>
                        {p.aktiv ? 'Aktiv' : 'Inaktiv'}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <button onClick={() => pateToggle(p.id, p.aktiv)} style={{ ...btnSmall, background: p.aktiv ? '#FEF2F2' : '#D1FAE5', color: p.aktiv ? '#DC2626' : '#065F46' }}>
                        {p.aktiv ? 'Deaktivieren' : 'Aktivieren'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      {tab === 'kosten' && (
        <>
          {/* Fahrzeug auswählen */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: '1.25rem' }}>
            {FAHRZEUGE.map(f => (
              <button key={f} onClick={() => setAktivFahrzeug(f)} style={{
                background: aktivFahrzeug === f ? '#2D6B1E' : '#F3F4F6',
                color: aktivFahrzeug === f ? '#fff' : '#374151',
                border: 'none', borderRadius: 6, padding: '0.4rem 0.8rem',
                fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
              }}>
                {fahrzeugLabel(f)}
              </button>
            ))}
          </div>

          {/* Neuen Kosteneintrag */}
          <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 10, padding: '1rem', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem' }}>Kosten eintragen — {fahrzeugLabel(aktivFahrzeug)}</h2>
            <form onSubmit={kostenSpeichern} style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.2rem' }}>Jahr</label>
                <input type="number" value={neuKosten.jahr} onChange={e => setNeuKosten(p => ({...p, jahr: Number(e.target.value), fahrzeug_id: aktivFahrzeug}))} style={{ ...inputStyle, width: 90 }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.2rem' }}>Posten</label>
                <select value={neuKosten.posten} onChange={e => setNeuKosten(p => ({...p, posten: e.target.value}))} style={inputStyle}>
                  {POSTEN.map(p => <option key={p} value={p}>{POSTEN_LABEL[p]}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.2rem' }}>Betrag (€)</label>
                <input type="number" step="0.01" value={neuKosten.betrag} onChange={e => setNeuKosten(p => ({...p, betrag: e.target.value as unknown as string}))} required style={{ ...inputStyle, width: 110 }} />
              </div>
              <div style={{ flex: 1, minWidth: 150 }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.2rem' }}>Beschreibung (optional)</label>
                <input value={neuKosten.beschreibung} onChange={e => setNeuKosten(p => ({...p, beschreibung: e.target.value}))} style={inputStyle} />
              </div>
              <button type="submit" style={btnStyle}>Speichern</button>
            </form>
          </div>

          {/* Kostenliste */}
          {kosten.length === 0 ? (
            <p style={{ color: '#9CA3AF', fontSize: '0.9rem' }}>Noch keine Einträge für {fahrzeugLabel(aktivFahrzeug)}.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: '#F3F4F6' }}>
                  {['Jahr', 'Posten', 'Betrag', 'Beschreibung', ''].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '0.5rem 0.6rem', fontWeight: 600, fontSize: '0.78rem', color: '#6B7280', borderBottom: '1px solid #E5E7EB' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {kosten.map(k => (
                  <tr key={k.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <td style={tdStyle}>{k.jahr}</td>
                    <td style={tdStyle}>{POSTEN_LABEL[k.posten] ?? k.posten}</td>
                    <td style={{ ...tdStyle, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{Number(k.betrag).toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</td>
                    <td style={{ ...tdStyle, color: '#9CA3AF' }}>{k.beschreibung ?? '—'}</td>
                    <td style={tdStyle}>
                      <button onClick={() => kostenLoeschen(k.id)} style={{ ...btnSmall, background: '#FEF2F2', color: '#DC2626' }}>Löschen</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  border: '1.5px solid #D1D5DB', borderRadius: 6, padding: '0.45rem 0.6rem',
  fontSize: '0.88rem', width: '100%', background: '#fff', color: '#111',
};
const btnStyle: React.CSSProperties = {
  background: '#2D6B1E', color: '#fff', border: 'none', borderRadius: 6,
  padding: '0.5rem 1rem', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer',
};
const btnSmall: React.CSSProperties = {
  border: 'none', borderRadius: 4, padding: '0.2rem 0.5rem',
  fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
};
const tdStyle: React.CSSProperties = { padding: '0.5rem 0.6rem' };
