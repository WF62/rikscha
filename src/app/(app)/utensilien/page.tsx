'use client';
import { useState, useEffect, useCallback } from 'react';
import { authHeaders } from '@/lib/authHeaders';

type Punkt = { id: string; text: string };
type Utensilienliste = {
  id: string;
  fahrzeug_id: string;
  titel: string;
  punkte: Punkt[];
  version: number;
};

export default function UtensilienPage() {
  const [listen, setListen] = useState<Utensilienliste[]>([]);
  const [laden, setLaden] = useState(true);
  const [aktiv, setAktiv] = useState<string | null>(null);
  const [abgehakt, setAbgehakt] = useState<Record<string, Set<string>>>({});

  const ladeUtensilien = useCallback(async () => {
    setLaden(true);
    const res = await fetch('/api/utensilien', { headers: authHeaders() });
    if (res.ok) {
      const j = await res.json();
      setListen(j.listen);
      if (j.listen.length === 1) setAktiv(j.listen[0].id);
    }
    setLaden(false);
  }, []);

  useEffect(() => { ladeUtensilien(); }, [ladeUtensilien]);

  const toggle = (listId: string, punktId: string) => {
    setAbgehakt(prev => {
      const set = new Set(prev[listId] ?? []);
      set.has(punktId) ? set.delete(punktId) : set.add(punktId);
      return { ...prev, [listId]: set };
    });
  };

  const resetListe = (listId: string) => {
    setAbgehakt(prev => ({ ...prev, [listId]: new Set() }));
  };

  const alleAbgehakt = (liste: Utensilienliste) => {
    const checked = abgehakt[liste.id] ?? new Set();
    return checked.size >= liste.punkte.length;
  };

  if (laden) return <div style={{ padding: '3rem', textAlign: 'center', color: '#6B7280' }}>Laden …</div>;

  if (!listen.length) {
    return (
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '2rem 1rem', fontFamily: 'sans-serif' }}>
        <a href="/" style={{ color: '#6B7280', fontSize: '0.9rem', textDecoration: 'none' }}>← Start</a>
        <p style={{ marginTop: '2rem', color: '#6B7280' }}>Keine Utensilienlisten für deine Rikschas gefunden.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '1.5rem 1rem', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
        <a href="/" style={{ color: '#6B7280', fontSize: '0.9rem', textDecoration: 'none' }}>← Start</a>
        <h1 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#1a1a18', flex: 1 }}>
          🎒 Utensilienliste
        </h1>
      </div>
      <p style={{ margin: '0 0 1.5rem', fontSize: '0.88rem', color: '#6B7280', lineHeight: 1.5 }}>
        Kontrolle vor der Fahrt: Hake ab, was in der Fahrradtasche ist. Die Haken werden nicht gespeichert.
      </p>

      <div style={{ display: 'grid', gap: '0.75rem' }}>
        {listen.map(liste => {
          const istOffen = aktiv === liste.id;
          const checked = abgehakt[liste.id] ?? new Set();
          const fertig = alleAbgehakt(liste);

          return (
            <div key={liste.id} style={{
              border: `2px solid ${fertig ? '#86EFAC' : istOffen ? '#93C5FD' : '#E5E7EB'}`,
              borderRadius: 14,
              overflow: 'hidden',
              background: fertig ? '#F0FDF4' : '#fff',
            }}>
              {/* Kopfzeile */}
              <button type="button" onClick={() => setAktiv(istOffen ? null : liste.id)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 1.25rem', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                <span style={{ fontSize: '1.4rem' }}>{fertig ? '✅' : '🎒'}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1a1a18' }}>{liste.titel}</div>
                  <div style={{ fontSize: '0.8rem', color: fertig ? '#16A34A' : '#6B7280', marginTop: '0.1rem' }}>
                    {fertig
                      ? 'Alles vollständig abgehakt'
                      : `${checked.size} / ${liste.punkte.length} abgehakt`}
                  </div>
                </div>
                <span style={{ color: '#9CA3AF', fontSize: '1.1rem' }}>{istOffen ? '▲' : '▼'}</span>
              </button>

              {istOffen && (
                <div style={{ padding: '0 1.25rem 1.25rem', borderTop: '1px solid #E5E7EB' }}>
                  <div style={{ display: 'grid', gap: '0.5rem', marginTop: '0.9rem', marginBottom: '1rem' }}>
                    {liste.punkte.map((p, idx) => {
                      const istChecked = checked.has(p.id);
                      return (
                        <label key={p.id} style={{
                          display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                          cursor: 'pointer', padding: '0.6rem 0.8rem', borderRadius: 9,
                          background: istChecked ? '#F0FDF4' : '#F9FAFB',
                          border: `1.5px solid ${istChecked ? '#86EFAC' : '#E5E7EB'}`,
                        }}>
                          <input type="checkbox" checked={istChecked}
                            onChange={() => toggle(liste.id, p.id)}
                            style={{ width: 18, height: 18, marginTop: 2, cursor: 'pointer', accentColor: '#15803D' }}
                          />
                          <span style={{ fontSize: '0.95rem', color: istChecked ? '#15803D' : '#1a1a18', lineHeight: 1.5, flex: 1,
                            textDecoration: istChecked ? 'line-through' : 'none' }}>
                            <span style={{ color: '#9CA3AF', marginRight: '0.4rem', fontSize: '0.8rem' }}>
                              {String(idx + 1).padStart(2, '0')}
                            </span>
                            {p.text}
                          </span>
                        </label>
                      );
                    })}
                  </div>

                  {checked.size > 0 && (
                    <button type="button" onClick={() => resetListe(liste.id)}
                      style={{ padding: '0.5rem 1rem', background: 'none', border: '1.5px solid #E5E7EB', borderRadius: 8, color: '#6B7280', cursor: 'pointer', fontSize: '0.85rem' }}>
                      ↺ Zurücksetzen
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
