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
  nachbestellen: string[];
};

export default function UtensilienPage() {
  const [listen, setListen] = useState<Utensilienliste[]>([]);
  const [laden, setLaden] = useState(true);
  const [aktiv, setAktiv] = useState<string | null>(null);
  const [abgehakt, setAbgehakt] = useState<Record<string, Set<string>>>({});
  const [sending, setSending] = useState<Record<string, boolean>>({});

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

  const toggleNachbestellen = async (liste: Utensilienliste, punktId: string) => {
    const key = `${liste.id}:${punktId}`;
    if (sending[key]) return;
    setSending(prev => ({ ...prev, [key]: true }));
    const markieren = !liste.nachbestellen.includes(punktId);
    const res = await fetch('/api/utensilien', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ id: liste.id, punkt_id: punktId, markieren }),
    });
    if (res.ok) {
      const j = await res.json();
      setListen(prev => prev.map(l => l.id === liste.id ? { ...l, nachbestellen: j.nachbestellen } : l));
    }
    setSending(prev => ({ ...prev, [key]: false }));
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

  const gesamtNachbestellen = listen.reduce((n, l) => n + l.nachbestellen.length, 0);

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '1.5rem 1rem', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
        <a href="/" style={{ color: '#6B7280', fontSize: '0.9rem', textDecoration: 'none' }}>← Start</a>
        <h1 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#1a1a18', flex: 1 }}>
          🎒 Utensilienliste
        </h1>
      </div>
      <p style={{ margin: '0 0 1rem', fontSize: '0.88rem', color: '#6B7280', lineHeight: 1.5 }}>
        Kontrolle vor der Fahrt: Hake ab, was in der Fahrradtasche ist. Fehlt etwas oder muss ersetzt werden? Mit 🔴 markieren – der Admin sieht es dann.
      </p>

      {gesamtNachbestellen > 0 && (
        <div style={{ background: '#FEF2F2', border: '1.5px solid #FCA5A5', borderRadius: 10, padding: '0.65rem 1rem', marginBottom: '1rem', fontSize: '0.88rem', color: '#DC2626', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>🔴</span>
          <span><strong>{gesamtNachbestellen} {gesamtNachbestellen === 1 ? 'Utensil' : 'Utensilien'}</strong> zum Nachbestellen / Ersetzen gemeldet</span>
        </div>
      )}

      <div style={{ display: 'grid', gap: '0.75rem' }}>
        {listen.map(liste => {
          const istOffen = aktiv === liste.id;
          const checked = abgehakt[liste.id] ?? new Set();
          const fertig = checked.size >= liste.punkte.length;
          const nbCount = liste.nachbestellen.length;

          return (
            <div key={liste.id} style={{
              border: `2px solid ${nbCount > 0 ? '#FCA5A5' : fertig ? '#86EFAC' : istOffen ? '#93C5FD' : '#E5E7EB'}`,
              borderRadius: 14,
              overflow: 'hidden',
              background: nbCount > 0 ? '#FFF5F5' : fertig ? '#F0FDF4' : '#fff',
            }}>
              <button type="button" onClick={() => setAktiv(istOffen ? null : liste.id)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 1.25rem', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                <span style={{ fontSize: '1.4rem' }}>{nbCount > 0 ? '🔴' : fertig ? '✅' : '🎒'}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1a1a18' }}>{liste.titel}</div>
                  <div style={{ fontSize: '0.8rem', color: nbCount > 0 ? '#DC2626' : fertig ? '#16A34A' : '#6B7280', marginTop: '0.1rem' }}>
                    {nbCount > 0
                      ? `${nbCount} ${nbCount === 1 ? 'Utensil' : 'Utensilien'} zum Nachbestellen`
                      : fertig
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
                      const istNb = liste.nachbestellen.includes(p.id);
                      const isSending = sending[`${liste.id}:${p.id}`];
                      return (
                        <div key={p.id} style={{
                          display: 'flex', alignItems: 'center', gap: '0.5rem',
                          padding: '0.6rem 0.8rem', borderRadius: 9,
                          background: istNb ? '#FEF2F2' : istChecked ? '#F0FDF4' : '#F9FAFB',
                          border: `1.5px solid ${istNb ? '#FCA5A5' : istChecked ? '#86EFAC' : '#E5E7EB'}`,
                        }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flex: 1, cursor: 'pointer' }}>
                            <input type="checkbox" checked={istChecked}
                              onChange={() => toggle(liste.id, p.id)}
                              style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#15803D', flexShrink: 0 }}
                            />
                            <span style={{
                              fontSize: '0.95rem',
                              color: istNb ? '#DC2626' : istChecked ? '#15803D' : '#1a1a18',
                              lineHeight: 1.5,
                              textDecoration: istChecked && !istNb ? 'line-through' : 'none',
                            }}>
                              <span style={{ color: '#9CA3AF', marginRight: '0.4rem', fontSize: '0.8rem' }}>
                                {String(idx + 1).padStart(2, '0')}
                              </span>
                              {p.text}
                              {istNb && <span style={{ marginLeft: '0.5rem', fontSize: '0.78rem', background: '#FEE2E2', color: '#DC2626', borderRadius: 5, padding: '0.1rem 0.4rem', fontWeight: 600 }}>nachbestellen</span>}
                            </span>
                          </label>
                          <button
                            type="button"
                            title={istNb ? 'Nachbestell-Markierung entfernen' : 'Als nachzubestellen markieren'}
                            onClick={() => toggleNachbestellen(liste, p.id)}
                            disabled={isSending}
                            style={{
                              flexShrink: 0, width: 30, height: 30, borderRadius: 7,
                              border: `1.5px solid ${istNb ? '#FCA5A5' : '#E5E7EB'}`,
                              background: istNb ? '#FEE2E2' : '#fff',
                              cursor: 'pointer', fontSize: '0.9rem',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              opacity: isSending ? 0.5 : 1,
                            }}>
                            {istNb ? '🔴' : '🔘'}
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {checked.size > 0 && (
                    <button type="button" onClick={() => resetListe(liste.id)}
                      style={{ padding: '0.5rem 1rem', background: 'none', border: '1.5px solid #E5E7EB', borderRadius: 8, color: '#6B7280', cursor: 'pointer', fontSize: '0.85rem' }}>
                      ↺ Haken zurücksetzen
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
