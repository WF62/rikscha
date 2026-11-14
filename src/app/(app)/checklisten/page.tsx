'use client';
import { useState, useEffect, useCallback } from 'react';
import { authHeaders } from '@/lib/authHeaders';

type Punkt = { id: string; text: string };
type Checkliste = {
  id: string;
  typ: 'allgemein' | 'fahrzeug';
  fahrzeug_id: string | null;
  titel: string;
  punkte: Punkt[];
  version: number;
  bestaetigt: boolean;
  bestaetigt_am: string | null;
  veraltet: boolean;
};

export default function ChecklistenPage() {
  const [listen, setListen] = useState<Checkliste[]>([]);
  const [saison, setSaison] = useState<number>(0);
  const [laden, setLaden] = useState(true);
  const [aktiv, setAktiv] = useState<string | null>(null);
  const [abgehakt, setAbgehakt] = useState<Record<string, Set<string>>>({});
  const [senden, setSenden] = useState<Record<string, boolean>>({});
  const [fehler, setFehler] = useState('');

  const ladeChecklisten = useCallback(async () => {
    setLaden(true);
    const res = await fetch('/api/checklisten', { headers: authHeaders() });
    if (res.ok) {
      const j = await res.json();
      setListen(j.listen);
      setSaison(j.saison);
      // Erste nicht bestätigte automatisch öffnen
      const erste = j.listen.find((l: Checkliste) => !l.bestaetigt || l.veraltet);
      if (erste) setAktiv(erste.id);
    }
    setLaden(false);
  }, []);

  useEffect(() => { ladeChecklisten(); }, [ladeChecklisten]);

  const togglePunkt = (checkId: string, punktId: string) => {
    setAbgehakt(prev => {
      const set = new Set(prev[checkId] ?? []);
      set.has(punktId) ? set.delete(punktId) : set.add(punktId);
      return { ...prev, [checkId]: set };
    });
  };

  const bestaetigen = async (liste: Checkliste) => {
    const checked = abgehakt[liste.id] ?? new Set();
    if (checked.size < liste.punkte.length) {
      setFehler('Bitte alle Punkte abhaken, bevor du bestätigst.');
      return;
    }
    setFehler('');
    setSenden(prev => ({ ...prev, [liste.id]: true }));
    const res = await fetch('/api/checklisten', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ checkliste_id: liste.id, version: liste.version }),
    });
    if (res.ok) {
      await ladeChecklisten();
      setAktiv(null);
    }
    setSenden(prev => ({ ...prev, [liste.id]: false }));
  };

  const alleBestaetigt = listen.length > 0 && listen.every(l => l.bestaetigt && !l.veraltet);

  if (laden) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: '#6B7280' }}>Laden …</div>;
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '1.5rem 1rem', fontFamily: 'sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
        <a href="/" style={{ color: '#6B7280', fontSize: '0.9rem', textDecoration: 'none' }}>← Start</a>
        <h1 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#1a1a18', flex: 1 }}>
          📋 Saisoneinweisung {saison}
        </h1>
      </div>
      <p style={{ margin: '0 0 1.5rem', fontSize: '0.88rem', color: '#6B7280', lineHeight: 1.5 }}>
        Bitte lies jede Liste sorgfältig durch und hake alle Punkte ab, bevor du in der neuen Saison fährst.
      </p>

      {alleBestaetigt && (
        <div style={{ background: '#F0FDF4', border: '1.5px solid #86EFAC', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.6rem' }}>✅</span>
          <div>
            <div style={{ fontWeight: 700, color: '#15803D' }}>Alle Listen bestätigt!</div>
            <div style={{ fontSize: '0.85rem', color: '#16A34A' }}>Du bist für die Saison {saison} freigegeben. Gute Fahrt!</div>
          </div>
        </div>
      )}

      {fehler && (
        <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 8, padding: '0.6rem 0.9rem', fontSize: '0.9rem', color: '#DC2626', marginBottom: '1rem' }}>
          ⚠️ {fehler}
        </div>
      )}

      <div style={{ display: 'grid', gap: '0.75rem' }}>
        {listen.map(liste => {
          const istOffen = aktiv === liste.id;
          const checked = abgehakt[liste.id] ?? new Set();
          const alleHaken = checked.size >= liste.punkte.length;

          return (
            <div key={liste.id}
              style={{
                border: `2px solid ${liste.bestaetigt && !liste.veraltet ? '#86EFAC' : istOffen ? '#93C5FD' : '#E5E7EB'}`,
                borderRadius: 14,
                overflow: 'hidden',
                background: liste.bestaetigt && !liste.veraltet ? '#F0FDF4' : '#fff',
              }}>
              {/* Kopfzeile */}
              <button type="button"
                onClick={() => setAktiv(istOffen ? null : liste.id)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '1rem 1.25rem', background: 'none', border: 'none', cursor: 'pointer',
                  textAlign: 'left',
                }}>
                <span style={{ fontSize: '1.4rem' }}>
                  {liste.bestaetigt && !liste.veraltet ? '✅' : liste.typ === 'allgemein' ? '📜' : '🚲'}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1a1a18' }}>{liste.titel}</div>
                  {liste.bestaetigt && !liste.veraltet ? (
                    <div style={{ fontSize: '0.8rem', color: '#16A34A', marginTop: '0.1rem' }}>
                      Bestätigt am {new Date(liste.bestaetigt_am!).toLocaleDateString('de-DE')}
                    </div>
                  ) : liste.veraltet ? (
                    <div style={{ fontSize: '0.8rem', color: '#D97706', marginTop: '0.1rem' }}>
                      ⚠️ Liste wurde aktualisiert – bitte erneut bestätigen
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.8rem', color: '#6B7280', marginTop: '0.1rem' }}>
                      {liste.punkte.length} Punkte · noch nicht bestätigt
                    </div>
                  )}
                </div>
                <span style={{ color: '#9CA3AF', fontSize: '1.1rem' }}>{istOffen ? '▲' : '▼'}</span>
              </button>

              {/* Inhalt */}
              {istOffen && (
                <div style={{ padding: '0 1.25rem 1.25rem', borderTop: '1px solid #E5E7EB' }}>
                  <div style={{ display: 'grid', gap: '0.5rem', marginTop: '0.9rem', marginBottom: '1.1rem' }}>
                    {liste.punkte.map((p, idx) => {
                      const istChecked = checked.has(p.id);
                      return (
                        <label key={p.id}
                          style={{
                            display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                            cursor: 'pointer', padding: '0.6rem 0.8rem', borderRadius: 9,
                            background: istChecked ? '#F0FDF4' : '#F9FAFB',
                            border: `1.5px solid ${istChecked ? '#86EFAC' : '#E5E7EB'}`,
                            transition: 'background 0.1s',
                          }}>
                          <input type="checkbox" checked={istChecked}
                            onChange={() => togglePunkt(liste.id, p.id)}
                            style={{ width: 18, height: 18, marginTop: 2, cursor: 'pointer', accentColor: '#15803D' }}
                          />
                          <span style={{ fontSize: '0.95rem', color: '#1a1a18', lineHeight: 1.5, flex: 1 }}>
                            <span style={{ color: '#9CA3AF', marginRight: '0.4rem', fontSize: '0.8rem' }}>
                              {String(idx + 1).padStart(2, '0')}
                            </span>
                            {p.text}
                          </span>
                        </label>
                      );
                    })}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <button type="button"
                      onClick={() => bestaetigen(liste)}
                      disabled={!alleHaken || senden[liste.id]}
                      style={{
                        padding: '0.75rem 1.5rem', borderRadius: 10, border: 'none',
                        background: alleHaken ? '#15803D' : '#E5E7EB',
                        color: alleHaken ? '#fff' : '#9CA3AF',
                        fontWeight: 700, fontSize: '0.95rem',
                        cursor: alleHaken ? 'pointer' : 'not-allowed',
                      }}>
                      {senden[liste.id] ? '⏳ …' : '✅ Ich habe alles gelesen und bestätige'}
                    </button>
                    {!alleHaken && (
                      <span style={{ fontSize: '0.82rem', color: '#9CA3AF' }}>
                        {checked.size} / {liste.punkte.length} abgehakt
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
