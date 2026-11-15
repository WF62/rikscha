'use client';
import { useEffect, useState } from 'react';

type Thema = { id: number; gruppe: string; punkte: string[]; reihenfolge: number };

export default function EinweisungsthemenAdmin() {
  const [themen, setThemen] = useState<Thema[]>([]);
  const [laden, setLaden] = useState(true);
  const [meldung, setMeldung] = useState('');

  const headers = () => ({
    'Content-Type': 'application/json',
    'x-kutscher-name': localStorage.getItem('kutscher_name') ?? '',
    'x-kutscher-pw': localStorage.getItem('kutscher_pw') ?? '',
  });

  const laden_ = () => {
    setLaden(true);
    fetch('/api/einweisungsthemen')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setThemen(d); })
      .finally(() => setLaden(false));
  };

  useEffect(() => { laden_(); }, []);

  const zeig = (msg: string) => { setMeldung(msg); setTimeout(() => setMeldung(''), 3000); };

  const speichern = async (t: Thema) => {
    const r = await fetch('/api/einweisungsthemen', {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(t),
    });
    if (r.ok) zeig('Gespeichert.');
    else zeig('Fehler beim Speichern.');
  };

  const loeschen = async (id: number) => {
    if (!confirm('Gruppe wirklich löschen?')) return;
    const r = await fetch('/api/einweisungsthemen', {
      method: 'DELETE',
      headers: headers(),
      body: JSON.stringify({ id }),
    });
    if (r.ok) { zeig('Gelöscht.'); laden_(); }
    else zeig('Fehler beim Löschen.');
  };

  const neueGruppe = async () => {
    const name = prompt('Name der neuen Gruppe:');
    if (!name) return;
    const maxReihenfolge = Math.max(0, ...themen.map(t => t.reihenfolge));
    const r = await fetch('/api/einweisungsthemen', {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ gruppe: name, punkte: [], reihenfolge: maxReihenfolge + 1 }),
    });
    if (r.ok) { zeig('Gruppe angelegt.'); laden_(); }
    else zeig('Fehler.');
  };

  const updateGruppe = (id: number, gruppe: string) =>
    setThemen(prev => prev.map(t => t.id === id ? { ...t, gruppe } : t));

  const updatePunkt = (id: number, idx: number, wert: string) =>
    setThemen(prev => prev.map(t => t.id === id
      ? { ...t, punkte: t.punkte.map((p, i) => i === idx ? wert : p) }
      : t));

  const punktLoeschen = (id: number, idx: number) =>
    setThemen(prev => prev.map(t => t.id === id
      ? { ...t, punkte: t.punkte.filter((_, i) => i !== idx) }
      : t));

  const punktHinzufuegen = (id: number) =>
    setThemen(prev => prev.map(t => t.id === id
      ? { ...t, punkte: [...t.punkte, ''] }
      : t));

  const verschiebenOben = (idx: number) => {
    if (idx === 0) return;
    setThemen(prev => {
      const neu = [...prev];
      [neu[idx - 1], neu[idx]] = [neu[idx], neu[idx - 1]];
      return neu.map((t, i) => ({ ...t, reihenfolge: i + 1 }));
    });
  };

  const verschiebenUnten = (idx: number) => {
    if (idx === themen.length - 1) return;
    setThemen(prev => {
      const neu = [...prev];
      [neu[idx], neu[idx + 1]] = [neu[idx + 1], neu[idx]];
      return neu.map((t, i) => ({ ...t, reihenfolge: i + 1 }));
    });
  };

  const allesSpeichern = async () => {
    for (const t of themen) await speichern(t);
    zeig('Alle Änderungen gespeichert.');
  };

  if (laden) return <div style={{ padding: '2rem' }}>Lädt…</div>;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#2D6B1E' }}>Einweisungsthemen bearbeiten</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={neueGruppe} style={{ background: '#2D6B1E', color: '#fff', border: 'none', borderRadius: 6, padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 600 }}>
            + Neue Gruppe
          </button>
          <button onClick={allesSpeichern} style={{ background: '#1D4ED8', color: '#fff', border: 'none', borderRadius: 6, padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 600 }}>
            Alle speichern
          </button>
        </div>
      </div>

      {meldung && (
        <div style={{ background: '#D1FAE5', color: '#065F46', borderRadius: 6, padding: '0.6rem 1rem', marginBottom: '1rem', fontWeight: 600 }}>
          {meldung}
        </div>
      )}

      {themen.map((t, idx) => (
        <div key={t.id} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, padding: '1rem', marginBottom: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <button onClick={() => verschiebenOben(idx)} disabled={idx === 0} style={{ background: 'none', border: '1px solid #D1D5DB', borderRadius: 4, cursor: 'pointer', padding: '1px 6px', fontSize: '0.75rem', color: idx === 0 ? '#D1D5DB' : '#374151' }}>▲</button>
              <button onClick={() => verschiebenUnten(idx)} disabled={idx === themen.length - 1} style={{ background: 'none', border: '1px solid #D1D5DB', borderRadius: 4, cursor: 'pointer', padding: '1px 6px', fontSize: '0.75rem', color: idx === themen.length - 1 ? '#D1D5DB' : '#374151' }}>▼</button>
            </div>
            <input
              value={t.gruppe}
              onChange={e => updateGruppe(t.id, e.target.value)}
              style={{ flex: 1, fontSize: '1rem', fontWeight: 700, border: '1px solid #D1D5DB', borderRadius: 6, padding: '0.4rem 0.6rem', color: '#2D6B1E' }}
            />
            <button onClick={() => speichern(t)} style={{ background: '#2D6B1E', color: '#fff', border: 'none', borderRadius: 6, padding: '0.4rem 0.75rem', cursor: 'pointer', fontSize: '0.85rem' }}>Speichern</button>
            <button onClick={() => loeschen(t.id)} style={{ background: '#FEE2E2', color: '#991B1B', border: 'none', borderRadius: 6, padding: '0.4rem 0.75rem', cursor: 'pointer', fontSize: '0.85rem' }}>Löschen</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {t.punkte.map((p, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                <span style={{ color: '#9CA3AF', fontSize: '0.8rem', minWidth: 20 }}>{i + 1}.</span>
                <input
                  value={p}
                  onChange={e => updatePunkt(t.id, i, e.target.value)}
                  style={{ flex: 1, fontSize: '0.9rem', border: '1px solid #E5E7EB', borderRadius: 5, padding: '0.3rem 0.5rem' }}
                />
                <button onClick={() => punktLoeschen(t.id, i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', fontSize: '1rem', padding: '0 0.3rem' }}>✕</button>
              </div>
            ))}
            <button onClick={() => punktHinzufuegen(t.id)} style={{ alignSelf: 'flex-start', background: 'none', border: '1px dashed #9CA3AF', borderRadius: 5, padding: '0.25rem 0.75rem', cursor: 'pointer', color: '#6B7280', fontSize: '0.85rem', marginTop: '0.25rem' }}>
              + Punkt hinzufügen
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
