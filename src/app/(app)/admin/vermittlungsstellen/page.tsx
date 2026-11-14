'use client';
import { useEffect, useState, useCallback } from 'react';
import { authHeaders } from '@/lib/authHeaders';

type Einweisung = { id: string; kutscher_name: string; fahrzeug_id: string; eingewiesen_von: string; eingewiesen_am: string };
type Fahrzeug = { id: string; name: string };
type Stelle = { id: string; name: string; aktiv: boolean; reihenfolge: number; rolle?: string };

export default function VermittlungsstellenPage() {
  const [zugang, setZugang] = useState<'pruefen' | 'ok' | 'nein'>('pruefen');
  const [stellen, setStellen] = useState<Stelle[]>([]);
  const [einweisungen, setEinweisungen] = useState<Einweisung[]>([]);
  const [fahrzeuge, setFahrzeuge] = useState<Fahrzeug[]>([]);
  const [laden, setLaden] = useState(false);

  const [neueStelle, setNeueStelle] = useState('');
  const [neuesFahrzeug, setNeuesFahrzeug] = useState('');
  const [eingewiesen_am, setEingewiesen_am] = useState(new Date().toISOString().slice(0, 10));
  const [speichert, setSpeichert] = useState(false);
  const [fehler, setFehler] = useState('');

  useEffect(() => {
    const rolle = localStorage.getItem('kutscher_rolle') ?? '';
    if (!['kutscher-admin', 'gfo', 'admin'].includes(rolle)) { setZugang('nein'); return; }
    setZugang('ok');
    laden_();
  }, []);

  const laden_ = useCallback(async () => {
    setLaden(true);
    const h = authHeaders();
    const [ewRes, kRes, fzRes] = await Promise.all([
      fetch('/api/kutscher-fahrzeuge', { headers: h }),
      fetch('/api/kutscher', { headers: h }),
      fetch('/api/fahrzeuge', { headers: h }),
    ]);
    if (ewRes.ok) setEinweisungen(await ewRes.json());
    if (kRes.ok) {
      const alle: Stelle[] = await kRes.json();
      setStellen(alle.filter(k => k.rolle === 'pflege'));
    }
    if (fzRes.ok) setFahrzeuge(await fzRes.json());
    setLaden(false);
  }, []);

  const hinzufuegen = async () => {
    if (!neueStelle || !neuesFahrzeug) { setFehler('Bitte Stelle und Fahrzeug wählen.'); return; }
    setSpeichert(true); setFehler('');
    const res = await fetch('/api/kutscher-fahrzeuge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ kutscher_name: neueStelle, fahrzeug_id: neuesFahrzeug, eingewiesen_am }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setFehler(j.error ?? 'Fehler beim Speichern.');
    } else {
      setNeuesFahrzeug('');
      await laden_();
    }
    setSpeichert(false);
  };

  const entfernen = async (id: string) => {
    if (!confirm('Fahrzeugzugang entfernen?')) return;
    await fetch('/api/kutscher-fahrzeuge', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ id }),
    });
    await laden_();
  };

  const fzName = (id: string) => fahrzeuge.find(f => f.id === id)?.name ?? id;

  if (zugang === 'pruefen') return <p className="text-center text-gray-400 mt-16">Einen Moment …</p>;
  if (zugang === 'nein') return <div className="p-8 text-red-600">Kein Zugang.</div>;

  const aktiveStellen = stellen.filter(s => s.aktiv);

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: '1.5rem 1rem', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <a href="/admin" style={{ color: '#6B7280', fontSize: '0.9rem', textDecoration: 'none' }}>← Admin</a>
        <h1 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#1a1a18' }}>
          🏠 Vermittlungsstellen & Fahrzeugzugänge
        </h1>
      </div>

      {/* ===== FAHRZEUGZUGANG HINZUFÜGEN ===== */}
      <div style={{ background: '#F0FDF4', border: '1.5px solid #86EFAC', borderRadius: 12, padding: '1.25rem', marginBottom: '2rem' }}>
        <div style={{ fontWeight: 700, color: '#15803D', marginBottom: '0.9rem' }}>Fahrzeugzugang eintragen</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '0.6rem', alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: '0.3rem' }}>Vermittlungsstelle</label>
            <select value={neueStelle} onChange={e => setNeueStelle(e.target.value)}
              style={{ width: '100%', border: '1.5px solid #D1D5DB', borderRadius: 7, padding: '0.5rem 0.6rem', fontSize: '0.9rem' }}>
              <option value="">– wählen –</option>
              {aktiveStellen.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: '0.3rem' }}>Fahrzeug</label>
            <select value={neuesFahrzeug} onChange={e => setNeuesFahrzeug(e.target.value)}
              style={{ width: '100%', border: '1.5px solid #D1D5DB', borderRadius: 7, padding: '0.5rem 0.6rem', fontSize: '0.9rem' }}>
              <option value="">– wählen –</option>
              {fahrzeuge.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: '0.3rem' }}>Seit</label>
            <input type="date" value={eingewiesen_am} onChange={e => setEingewiesen_am(e.target.value)}
              style={{ width: '100%', border: '1.5px solid #D1D5DB', borderRadius: 7, padding: '0.5rem 0.6rem', fontSize: '0.9rem', boxSizing: 'border-box' }} />
          </div>
          <button onClick={hinzufuegen} disabled={speichert}
            style={{ background: '#2D6B1E', color: '#fff', border: 'none', borderRadius: 8, padding: '0.55rem 1.1rem', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            {speichert ? '…' : '+ Hinzufügen'}
          </button>
        </div>
        {fehler && <div style={{ color: '#DC2626', fontSize: '0.85rem', marginTop: '0.5rem' }}>{fehler}</div>}
      </div>

      {/* ===== ÜBERSICHT ===== */}
      {laden ? (
        <p style={{ color: '#6B7280', textAlign: 'center' }}>Laden …</p>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {aktiveStellen.map(s => {
            const eingewiesen = einweisungen.filter(e => e.kutscher_name === s.name);
            return (
              <div key={s.name} style={{ background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ background: '#F9FAFB', padding: '0.7rem 1rem', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{s.name}</span>
                  {eingewiesen.length === 0 ? (
                    <span style={{ fontSize: '0.8rem', background: '#FEE2E2', color: '#DC2626', borderRadius: 5, padding: '0.15rem 0.5rem' }}>
                      Kein Fahrzeugzugang
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.8rem', background: '#D1FAE5', color: '#065F46', borderRadius: 5, padding: '0.15rem 0.5rem' }}>
                      {eingewiesen.length} Fahrzeug{eingewiesen.length > 1 ? 'e' : ''}
                    </span>
                  )}
                </div>
                {eingewiesen.length > 0 && (
                  <div style={{ padding: '0.6rem 1rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {eingewiesen.map(e => (
                      <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 7, padding: '0.3rem 0.6rem', fontSize: '0.88rem' }}>
                        <span style={{ fontWeight: 600 }}>{fzName(e.fahrzeug_id)}</span>
                        {e.eingewiesen_am && <span style={{ color: '#6B7280' }}>seit {new Date(e.eingewiesen_am).toLocaleDateString('de-DE')}</span>}
                        <button onClick={() => entfernen(e.id)}
                          style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', fontSize: '0.9rem', padding: '0 2px', lineHeight: 1 }}
                          title="Fahrzeugzugang entfernen">×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          {aktiveStellen.length === 0 && (
            <p style={{ color: '#6B7280', textAlign: 'center' }}>Keine aktiven Vermittlungsstellen gefunden.</p>
          )}
        </div>
      )}
    </div>
  );
}
