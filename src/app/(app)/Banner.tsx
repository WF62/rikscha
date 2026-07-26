'use client';
import { useEffect, useState } from 'react';

export default function Banner() {
  const [texte, setTexte]     = useState<string[]>([]);
  const [pilot, setPilot]     = useState('');
  const [password, setPassword] = useState('');
  const [istPilot, setIstPilot] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [entwurf, setEntwurf] = useState<string[]>([]);
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    fetch('/api/banner').then(r => r.json()).then((d: string[]) => setTexte(d));
    const name = localStorage.getItem('pilot_name');
    const pw   = localStorage.getItem('pilot_pw');
    if (name && pw) { setPilot(name); setPassword(pw); setIstPilot(true); }
  }, []);

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
    if (res.ok) setTexte(entwurf.filter(t => t.trim()));
    setSaving(false);
    setEditOpen(false);
  }

  // Combine texts with a separator and duplicate for seamless loop
  const separator = '   ·   ';
  const lauftext = texte.join(separator) + separator;

  return (
    <>
      <style>{`
        @keyframes rikscha-laufband {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .rikscha-banner-track {
          display: flex;
          white-space: nowrap;
          animation: rikscha-laufband 28s linear infinite;
        }
        .rikscha-banner-track:hover {
          animation-play-state: paused;
        }
      `}</style>

      {texte.length > 0 && (
        <div style={{
          background: 'linear-gradient(90deg, #92400e 0%, #b45309 40%, #d97706 60%, #b45309 85%, #92400e 100%)',
          color: '#fff',
          overflow: 'hidden',
          position: 'relative',
          height: '36px',
          display: 'flex',
          alignItems: 'center',
        }}>
          {/* fade edges */}
          <div style={{ position:'absolute', left:0, top:0, bottom:0, width:60, background:'linear-gradient(90deg,#92400e,transparent)', zIndex:2, pointerEvents:'none' }} />
          <div style={{ position:'absolute', right: istPilot ? 44 : 0, top:0, bottom:0, width:60, background:'linear-gradient(270deg,#92400e,transparent)', zIndex:2, pointerEvents:'none' }} />

          {/* scrolling track — doubled for seamless loop */}
          <div className="rikscha-banner-track" style={{ fontWeight:600, fontSize:'0.85rem', letterSpacing:'0.03em' }}>
            <span>📢&nbsp;{lauftext}</span>
            <span>📢&nbsp;{lauftext}</span>
          </div>

          {/* edit button for pilots */}
          {istPilot && (
            <button onClick={openEdit} title="Banner bearbeiten" style={{
              position:'absolute', right:0, top:0, bottom:0, zIndex:3,
              background:'rgba(0,0,0,0.25)', border:'none', borderLeft:'1px solid rgba(255,255,255,0.2)',
              color:'#fff', cursor:'pointer', fontSize:'0.75rem', padding:'0 0.8rem',
              display:'flex', alignItems:'center',
            }}>✏️</button>
          )}
        </div>
      )}

      {texte.length === 0 && istPilot && (
        <div style={{
          background:'#fef3c7', borderBottom:'1px solid #fcd34d',
          padding:'0.4rem 1rem', textAlign:'center', fontSize:'0.8rem', color:'#92400e',
        }}>
          Kein Banner aktiv.{' '}
          <button onClick={openEdit} style={{ background:'none', border:'none', color:'#b45309', cursor:'pointer', fontWeight:700, textDecoration:'underline', fontSize:'inherit' }}>
            Banner einrichten
          </button>
        </div>
      )}

      {editOpen && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}
          onClick={() => setEditOpen(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background:'#fff', borderRadius:12, padding:'1.75rem 2rem', width:480, maxWidth:'95vw', boxShadow:'0 8px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ fontWeight:700, fontSize:'1rem', marginBottom:'0.25rem', color:'#1C1208' }}>📢 Laufband-Texte bearbeiten</div>
            <div style={{ fontSize:'0.78rem', color:'#5C4E38', marginBottom:'1.25rem' }}>Mehrere Texte laufen hintereinander durch.</div>

            {entwurf.map((t, i) => (
              <div key={i} style={{ display:'flex', gap:'0.5rem', marginBottom:'0.6rem', alignItems:'center' }}>
                <input
                  value={t}
                  onChange={e => setEntwurf(d => d.map((x, j) => j === i ? e.target.value : x))}
                  placeholder={`Text ${i + 1}`}
                  style={{ flex:1, border:'1.5px solid #D6CCB8', borderRadius:6, padding:'0.5rem 0.7rem', fontSize:'0.88rem', fontFamily:'inherit' }}
                />
                <button onClick={() => setEntwurf(d => d.filter((_, j) => j !== i))}
                  style={{ background:'#FEE2E2', color:'#991b1b', border:'none', borderRadius:6, padding:'0.4rem 0.6rem', cursor:'pointer', fontWeight:700 }}>✕</button>
              </div>
            ))}

            {entwurf.length < 8 && (
              <button onClick={() => setEntwurf(d => [...d, ''])} style={{ background:'#F5F0E7', border:'1.5px dashed #D6CCB8', borderRadius:6, padding:'0.4rem 1rem', fontSize:'0.82rem', cursor:'pointer', color:'#5C4E38', width:'100%', marginBottom:'1.25rem' }}>
                + Weiteren Text hinzufügen
              </button>
            )}

            <div style={{ display:'flex', gap:'0.75rem', justifyContent:'flex-end', marginTop:'0.5rem' }}>
              <button onClick={() => setEditOpen(false)} style={{ background:'#F5F0E7', border:'none', borderRadius:7, padding:'0.5rem 1.2rem', cursor:'pointer', fontWeight:600 }}>Abbrechen</button>
              <button onClick={speichern} disabled={saving} style={{ background:'#b45309', color:'#fff', border:'none', borderRadius:7, padding:'0.5rem 1.4rem', cursor:'pointer', fontWeight:700 }}>
                {saving ? 'Speichern…' : 'Speichern'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
