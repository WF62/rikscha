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
  updated_at: string;
};

function newId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function AdminChecklistenPage() {
  const [zugang, setZugang] = useState<'pruefen' | 'ok' | 'nein'>('pruefen');
  const [listen, setListen] = useState<Checkliste[]>([]);
  const [laden, setLaden] = useState(true);
  const [aktiv, setAktiv] = useState<string | null>(null);
  const [lokal, setLokal] = useState<Record<string, Checkliste>>({});
  const [speichert, setSpeichert] = useState<Record<string, boolean>>({});
  const [gespeichert, setGespeichert] = useState<Record<string, boolean>>({});
  const [neuerText, setNeuerText] = useState<Record<string, string>>({});

  useEffect(() => {
    const rolle = localStorage.getItem('pilot_rolle') ?? '';
    if (!['kutscher-admin', 'gfo', 'admin'].includes(rolle)) { setZugang('nein'); return; }
    setZugang('ok');
  }, []);

  const laden_ = useCallback(async () => {
    setLaden(true);
    const res = await fetch('/api/admin/checklisten', { headers: authHeaders() });
    if (res.ok) {
      const data: Checkliste[] = await res.json();
      setListen(data);
      const map: Record<string, Checkliste> = {};
      data.forEach(l => { map[l.id] = { ...l, punkte: [...l.punkte] }; });
      setLokal(map);
    }
    setLaden(false);
  }, []);

  useEffect(() => { if (zugang === 'ok') laden_(); }, [zugang, laden_]);

  const setPunkte = (id: string, punkte: Punkt[]) => {
    setLokal(prev => ({ ...prev, [id]: { ...prev[id], punkte } }));
    setGespeichert(prev => ({ ...prev, [id]: false }));
  };

  const setTitel = (id: string, titel: string) => {
    setLokal(prev => ({ ...prev, [id]: { ...prev[id], titel } }));
    setGespeichert(prev => ({ ...prev, [id]: false }));
  };

  const punktHoch = (id: string, idx: number) => {
    if (idx === 0) return;
    const p = [...(lokal[id]?.punkte ?? [])];
    [p[idx - 1], p[idx]] = [p[idx], p[idx - 1]];
    setPunkte(id, p);
  };

  const punktRunter = (id: string, idx: number) => {
    const p = [...(lokal[id]?.punkte ?? [])];
    if (idx >= p.length - 1) return;
    [p[idx], p[idx + 1]] = [p[idx + 1], p[idx]];
    setPunkte(id, p);
  };

  const punktLoeschen = (id: string, punktId: string) => {
    const p = (lokal[id]?.punkte ?? []).filter(x => x.id !== punktId);
    setPunkte(id, p);
  };

  const punktHinzufuegen = (id: string) => {
    const text = (neuerText[id] ?? '').trim();
    if (!text) return;
    const p = [...(lokal[id]?.punkte ?? []), { id: newId(), text }];
    setPunkte(id, p);
    setNeuerText(prev => ({ ...prev, [id]: '' }));
  };

  const speichern = async (id: string) => {
    setSpeichert(prev => ({ ...prev, [id]: true }));
    const l = lokal[id];
    const res = await fetch('/api/admin/checklisten', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ id, punkte: l.punkte, titel: l.titel }),
    });
    if (res.ok) {
      setGespeichert(prev => ({ ...prev, [id]: true }));
      await laden_();
    }
    setSpeichert(prev => ({ ...prev, [id]: false }));
  };

  if (zugang === 'pruefen') return <p className="text-center text-gray-400 mt-16">Einen Moment …</p>;
  if (zugang === 'nein') return <div className="p-8 text-red-600">Kein Zugang.</div>;

  const allgemein = listen.filter(l => l.typ === 'allgemein');
  const fahrzeuge = listen.filter(l => l.typ === 'fahrzeug');

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: '1.5rem 1rem', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <a href="/admin" style={{ color: '#6B7280', fontSize: '0.9rem', textDecoration: 'none' }}>← Admin</a>
        <h1 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#1a1a18', flex: 1 }}>
          📋 Checklisten bearbeiten
        </h1>
      </div>

      <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '1.5rem', fontSize: '0.85rem', color: '#1D4ED8', lineHeight: 1.5 }}>
        ℹ️ Wenn du Punkte änderst und speicherst, wird die Version erhöht. Kutscher, die die alte Version bestätigt haben, müssen die Checkliste erneut bestätigen.
      </div>

      {laden ? <p style={{ color: '#6B7280', textAlign: 'center' }}>Laden …</p> : (
        <>
          {[...allgemein, ...fahrzeuge].map(liste => {
            const l = lokal[liste.id];
            if (!l) return null;
            const istOffen = aktiv === liste.id;
            const hatAenderung = JSON.stringify(l.punkte) !== JSON.stringify(liste.punkte) || l.titel !== liste.titel;

            return (
              <div key={liste.id} style={{ border: `2px solid ${istOffen ? '#93C5FD' : '#E5E7EB'}`, borderRadius: 14, marginBottom: '0.75rem', overflow: 'hidden' }}>
                {/* Kopfzeile */}
                <button type="button" onClick={() => setAktiv(istOffen ? null : liste.id)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.9rem 1.25rem', background: '#F9FAFB', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                  <span style={{ fontSize: '1.2rem' }}>{liste.typ === 'allgemein' ? '📜' : '🚲'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1a1a18' }}>{liste.titel}</div>
                    <div style={{ fontSize: '0.78rem', color: '#9CA3AF', marginTop: '0.1rem' }}>
                      Version {liste.version} · {liste.punkte.length} Punkte
                      {hatAenderung && <span style={{ color: '#D97706', marginLeft: '0.5rem' }}>● ungespeicherte Änderungen</span>}
                      {gespeichert[liste.id] && <span style={{ color: '#15803D', marginLeft: '0.5rem' }}>✓ gespeichert</span>}
                    </div>
                  </div>
                  <span style={{ color: '#9CA3AF' }}>{istOffen ? '▲' : '▼'}</span>
                </button>

                {istOffen && (
                  <div style={{ padding: '1rem 1.25rem' }}>
                    {/* Titel */}
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#374151', marginBottom: '0.3rem' }}>Titel</label>
                      <input type="text" value={l.titel} onChange={e => setTitel(liste.id, e.target.value)}
                        style={{ width: '100%', border: '1.5px solid #D1D5DB', borderRadius: 8, padding: '0.5rem 0.75rem', fontSize: '0.95rem', boxSizing: 'border-box' }} />
                    </div>

                    {/* Punkte */}
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#374151', marginBottom: '0.5rem' }}>Punkte</div>
                      <div style={{ display: 'grid', gap: '0.4rem' }}>
                        {l.punkte.map((p, idx) => (
                          <div key={p.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, padding: '0.5rem 0.6rem' }}>
                            <span style={{ color: '#9CA3AF', fontSize: '0.78rem', minWidth: 22, paddingTop: 2 }}>{idx + 1}.</span>
                            <input type="text" value={p.text}
                              onChange={e => {
                                const np = [...l.punkte];
                                np[idx] = { ...np[idx], text: e.target.value };
                                setPunkte(liste.id, np);
                              }}
                              style={{ flex: 1, border: '1px solid #E5E7EB', borderRadius: 6, padding: '0.3rem 0.5rem', fontSize: '0.9rem' }}
                            />
                            <div style={{ display: 'flex', gap: '0.2rem', flexShrink: 0 }}>
                              <button type="button" onClick={() => punktHoch(liste.id, idx)} disabled={idx === 0}
                                style={{ padding: '0.2rem 0.4rem', border: '1px solid #E5E7EB', borderRadius: 5, background: '#fff', cursor: idx === 0 ? 'default' : 'pointer', color: idx === 0 ? '#D1D5DB' : '#374151', fontSize: '0.8rem' }}>↑</button>
                              <button type="button" onClick={() => punktRunter(liste.id, idx)} disabled={idx >= l.punkte.length - 1}
                                style={{ padding: '0.2rem 0.4rem', border: '1px solid #E5E7EB', borderRadius: 5, background: '#fff', cursor: idx >= l.punkte.length - 1 ? 'default' : 'pointer', color: idx >= l.punkte.length - 1 ? '#D1D5DB' : '#374151', fontSize: '0.8rem' }}>↓</button>
                              <button type="button" onClick={() => punktLoeschen(liste.id, p.id)}
                                style={{ padding: '0.2rem 0.4rem', border: '1px solid #FCA5A5', borderRadius: 5, background: '#FEF2F2', cursor: 'pointer', color: '#DC2626', fontSize: '0.8rem' }}>✕</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Neuen Punkt hinzufügen */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                      <input type="text" value={neuerText[liste.id] ?? ''}
                        onChange={e => setNeuerText(prev => ({ ...prev, [liste.id]: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && punktHinzufuegen(liste.id)}
                        placeholder="Neuen Punkt eingeben …"
                        style={{ flex: 1, border: '1.5px solid #93C5FD', borderRadius: 8, padding: '0.5rem 0.75rem', fontSize: '0.9rem' }}
                      />
                      <button type="button" onClick={() => punktHinzufuegen(liste.id)}
                        style={{ padding: '0.5rem 1rem', background: '#2563EB', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>
                        + Hinzufügen
                      </button>
                    </div>

                    {/* Speichern */}
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      <button type="button" onClick={() => speichern(liste.id)} disabled={speichert[liste.id]}
                        style={{ padding: '0.65rem 1.3rem', background: hatAenderung ? '#1D4ED8' : '#6B7280', color: '#fff', border: 'none', borderRadius: 9, fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}>
                        {speichert[liste.id] ? '⏳ Speichern …' : '💾 Speichern'}
                      </button>
                      {hatAenderung && (
                        <button type="button" onClick={() => { setLokal(prev => ({ ...prev, [liste.id]: { ...liste, punkte: [...liste.punkte] } })); setGespeichert(prev => ({ ...prev, [liste.id]: false })); }}
                          style={{ padding: '0.65rem 1rem', background: 'none', border: '1.5px solid #E5E7EB', borderRadius: 9, color: '#6B7280', cursor: 'pointer', fontSize: '0.9rem' }}>
                          Zurücksetzen
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
