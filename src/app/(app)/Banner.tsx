'use client';
import { useEffect, useState, useRef } from 'react';

export default function Banner() {
  const [texte, setTexte]       = useState<string[]>([]);
  const [pilot, setPilot]       = useState('');
  const [password, setPassword] = useState('');
  const [istPilot, setIstPilot] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [entwurf, setEntwurf]   = useState<string[]>([]);
  const [saving, setSaving]     = useState(false);
  const [aktiv, setAktiv]       = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch('/api/banner').then(r => r.json()).then((d: string[]) => setTexte(d));
    const name = sessionStorage.getItem('pilot_name');
    const pw   = sessionStorage.getItem('pilot_pw');
    if (name && pw) { setPilot(name); setPassword(pw); setIstPilot(true); }
  }, []);

  // Rotiere bei mehreren Texten
  useEffect(() => {
    if (texte.length <= 1) return;
    timerRef.current = setInterval(() => setAktiv(a => (a + 1) % texte.length), 5000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [texte]);

  if (texte.length === 0 && !istPilot) return null;

  function openEdit() {
    setEntwurf(texte.length ? [...texte] : ['']);
    setEditOpen(true);
  }

  async function speichern() {
    setSaving(true);
    const res = await fetch('/api/banner', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pilot, password, texte: entwurf }),
    });
    if (res.ok) {
      const neu = entwurf.filter(t => t.trim());
      setTexte(neu);
      setAktiv(0);
    }
    setSaving(false);
    setEditOpen(false);
  }

  return (
    <>
      {texte.length > 0 && (
        <div style={{
          background: 'linear-gradient(90deg, #b45309 0%, #d97706 50%, #b45309 100%)',
          color: '#fff',
          padding: '0.55rem 1rem',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Lauflicht-Hintergrund */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'repeating-linear-gradient(90deg, transparent 0 40px, rgba(255,255,255,0.06) 40px 80px)',
          }} />
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1rem', flexShrink: 0 }}>📢</span>
            <span style={{
              fontWeight: 700, fontSize: '0.92rem', letterSpacing: '0.02em',
              textShadow: '0 1px 3px rgba(0,0,0,0.3)',
              transition: 'opacity 0.4s',
            }}>
              {texte[aktiv]}
            </span>
            {texte.length > 1 && (
              <span style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                {texte.map((_, i) => (
                  <span key={i} onClick={() => setAktiv(i)} style={{
                    width: 7, height: 7, borderRadius: '50%', cursor: 'pointer',
                    background: i === aktiv ? '#fff' : 'rgba(255,255,255,0.4)',
                    display: 'inline-block', transition: 'background 0.3s',
                  }} />
                ))}
              </span>
            )}
            {istPilot && (
              <button onClick={openEdit} title="Banner bearbeiten" style={{
                background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 4,
                color: '#fff', cursor: 'pointer', fontSize: '0.72rem', padding: '0.15rem 0.45rem',
                flexShrink: 0,
              }}>✏️</button>
            )}
          </div>
        </div>
      )}

      {texte.length === 0 && istPilot && (
        <div style={{
          background: '#fef3c7', borderBottom: '1px solid #fcd34d',
          padding: '0.4rem 1rem', textAlign: 'center', fontSize: '0.8rem', color: '#92400e',
        }}>
          Kein Banner aktiv.{' '}
          <button onClick={openEdit} style={{
            background: 'none', border: 'none', color: '#b45309',
            cursor: 'pointer', fontWeight: 700, textDecoration: 'underline', fontSize: 'inherit',
          }}>Banner einrichten</button>
        </div>
      )}

      {/* Edit-Modal */}
      {editOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }} onClick={() => setEditOpen(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#fff', borderRadius: 12, padding: '1.75rem 2rem',
            width: 480, maxWidth: '95vw', boxShadow: '0 8px 40px rgba(0,0,0,0.2)',
          }}>
            <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.25rem', color: '#1C1208' }}>
              📢 Banner-Texte bearbeiten
            </div>
            <div style={{ fontSize: '0.78rem', color: '#5C4E38', marginBottom: '1.25rem' }}>
              Mehrere Texte rotieren automatisch alle 5 Sekunden.
            </div>

            {entwurf.map((t, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.6rem', alignItems: 'center' }}>
                <input
                  value={t}
                  onChange={e => setEntwurf(d => d.map((x, j) => j === i ? e.target.value : x))}
                  placeholder={`Banner-Text ${i + 1}`}
                  style={{
                    flex: 1, border: '1.5px solid #D6CCB8', borderRadius: 6,
                    padding: '0.5rem 0.7rem', fontSize: '0.88rem', fontFamily: 'inherit',
                  }}
                />
                <button onClick={() => setEntwurf(d => d.filter((_, j) => j !== i))}
                  style={{
                    background: '#FEE2E2', color: '#991b1b', border: 'none',
                    borderRadius: 6, padding: '0.4rem 0.6rem', cursor: 'pointer', fontWeight: 700,
                  }}>✕</button>
              </div>
            ))}

            {entwurf.length < 5 && (
              <button onClick={() => setEntwurf(d => [...d, ''])} style={{
                background: '#F5F0E7', border: '1.5px dashed #D6CCB8', borderRadius: 6,
                padding: '0.4rem 1rem', fontSize: '0.82rem', cursor: 'pointer',
                color: '#5C4E38', width: '100%', marginBottom: '1.25rem',
              }}>+ Weiteren Text hinzufügen</button>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button onClick={() => setEditOpen(false)} style={{
                background: '#F5F0E7', border: 'none', borderRadius: 7,
                padding: '0.5rem 1.2rem', cursor: 'pointer', fontWeight: 600,
              }}>Abbrechen</button>
              <button onClick={speichern} disabled={saving} style={{
                background: '#b45309', color: '#fff', border: 'none', borderRadius: 7,
                padding: '0.5rem 1.4rem', cursor: 'pointer', fontWeight: 700,
              }}>{saving ? 'Speichern…' : 'Speichern'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
