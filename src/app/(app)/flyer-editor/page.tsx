'use client';
import { useState, useEffect, useRef } from 'react';

type Feld = {
  schluessel: string;
  label: string;
  typ: 'text' | 'textarea' | 'foto';
};

type Gruppe = { titel: string; felder: Feld[] };

const GRUPPEN: Gruppe[] = [
  {
    titel: 'V1 · Gutschein',
    felder: [
      { schluessel: 'flyer_gutschein_hinweis', label: 'Hinweiszeile (unten im Gutschein)', typ: 'text' },
    ],
  },
  {
    titel: 'V2 · Fahrten',
    felder: [
      { schluessel: 'flyer_v2_eyebrow', label: 'Augenbraue (kleine Zeile oben)', typ: 'text' },
      { schluessel: 'flyer_v2_h3',      label: 'Überschrift',                    typ: 'text' },
      { schluessel: 'flyer_fahrten_text', label: 'Beschreibungstext',            typ: 'textarea' },
      { schluessel: 'flyer_foto_fahrt1', label: 'Foto Fahrt 1',                  typ: 'foto' },
      { schluessel: 'flyer_foto_fahrt2', label: 'Foto Fahrt 2',                  typ: 'foto' },
    ],
  },
  {
    titel: 'V3 · Kutscher',
    felder: [
      { schluessel: 'flyer_v3_eyebrow',     label: 'Augenbraue',               typ: 'text' },
      { schluessel: 'flyer_v3_h3',          label: 'Überschrift',              typ: 'text' },
      { schluessel: 'flyer_v3_card1_titel', label: 'Karte 1 – Titel',          typ: 'text' },
      { schluessel: 'flyer_v3_card1_text',  label: 'Karte 1 – Text',           typ: 'textarea' },
      { schluessel: 'flyer_v3_card2_titel', label: 'Karte 2 – Titel',          typ: 'text' },
      { schluessel: 'flyer_v3_card2_text',  label: 'Karte 2 – Text',           typ: 'textarea' },
    ],
  },
  {
    titel: 'V4 · Cover',
    felder: [
      { schluessel: 'flyer_v4_meta',  label: 'Unterzeile (Pilotenzahl usw.)', typ: 'text' },
      { schluessel: 'flyer_v4_badge', label: 'Badge (z. B. „11 Piloten")',    typ: 'text' },
    ],
  },
  {
    titel: 'H1 · Flotte Lotte',
    felder: [
      { schluessel: 'flyer_r1_label', label: 'Typ-Zeile (z. B. Rikscha · max. 2 Gäste)', typ: 'text' },
      { schluessel: 'flyer_r1_h3',   label: 'Name / Überschrift',                         typ: 'text' },
      { schluessel: 'flyer_lotte_text', label: 'Beschreibungstext',                        typ: 'textarea' },
      { schluessel: 'flyer_foto_lotte', label: 'Foto Flotte Lotte',                        typ: 'foto' },
    ],
  },
  {
    titel: 'H2 · Flinker Flitzer',
    felder: [
      { schluessel: 'flyer_r2_label',    label: 'Typ-Zeile',            typ: 'text' },
      { schluessel: 'flyer_r2_h3',       label: 'Name / Überschrift',   typ: 'text' },
      { schluessel: 'flyer_flitzer_text', label: 'Beschreibungstext',   typ: 'textarea' },
      { schluessel: 'flyer_foto_flitzer', label: 'Foto Flinker Flitzer', typ: 'foto' },
    ],
  },
  {
    titel: 'H3 · Jruuse Piter',
    felder: [
      { schluessel: 'flyer_r3_label',  label: 'Typ-Zeile',           typ: 'text' },
      { schluessel: 'flyer_r3_h3',     label: 'Name / Überschrift',  typ: 'text' },
      { schluessel: 'flyer_piter_text', label: 'Beschreibungstext',  typ: 'textarea' },
      { schluessel: 'flyer_foto_piter', label: 'Foto Jruuse Piter',  typ: 'foto' },
    ],
  },
];

// flat list for initial werte loading
const FELDER: Feld[] = GRUPPEN.flatMap(g => g.felder);

export default function FlyerEditorPage() {
  const [pilot, setPilot]       = useState('');
  const [password, setPassword] = useState('');
  const [eingeloggt, setEingeloggt] = useState(false);
  const [loginFehler, setLoginFehler] = useState('');
  const [werte, setWerte]       = useState<Record<string, string>>({});
  const [speichern, setSpeichern] = useState<Record<string, 'idle'|'saving'|'ok'|'err'>>({});
  const [laden, setLaden]       = useState(false);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoginFehler('');
    setLaden(true);
    try {
      const res = await fetch('/api/inhalte');
      if (!res.ok) throw new Error();
      const alle: { schluessel: string; wert: string }[] = await res.json();
      // Pilot-Check via inhalte POST (leerer Test-Wert)
      const check = await fetch('/api/pilot-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pilot, password }),
      });
      if (!check.ok) { setLoginFehler('Name oder Passwort falsch.'); setLaden(false); return; }
      const map: Record<string, string> = {};
      for (const f of FELDER) {
        const gefunden = alle.find(a => a.schluessel === f.schluessel);
        map[f.schluessel] = gefunden?.wert ?? '';
      }
      setWerte(map);
      setEingeloggt(true);
    } catch {
      setLoginFehler('Verbindungsfehler.');
    }
    setLaden(false);
  }

  async function textSpeichern(schluessel: string) {
    setSpeichern(s => ({ ...s, [schluessel]: 'saving' }));
    try {
      const res = await fetch('/api/inhalte', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pilot, password, schluessel, wert: werte[schluessel] }),
      });
      setSpeichern(s => ({ ...s, [schluessel]: res.ok ? 'ok' : 'err' }));
    } catch {
      setSpeichern(s => ({ ...s, [schluessel]: 'err' }));
    }
    setTimeout(() => setSpeichern(s => ({ ...s, [schluessel]: 'idle' })), 2500);
  }

  async function fotoHochladen(schluessel: string, datei: File) {
    setSpeichern(s => ({ ...s, [schluessel]: 'saving' }));
    const form = new FormData();
    form.append('pilot', pilot);
    form.append('password', password);
    form.append('schluessel', schluessel);
    form.append('datei', datei);
    try {
      const res = await fetch('/api/flyer-foto', { method: 'POST', body: form });
      if (res.ok) {
        const { url } = await res.json();
        setWerte(w => ({ ...w, [schluessel]: url }));
        setSpeichern(s => ({ ...s, [schluessel]: 'ok' }));
      } else {
        setSpeichern(s => ({ ...s, [schluessel]: 'err' }));
      }
    } catch {
      setSpeichern(s => ({ ...s, [schluessel]: 'err' }));
    }
    setTimeout(() => setSpeichern(s => ({ ...s, [schluessel]: 'idle' })), 2500);
  }

  const statusLabel = (s: string) =>
    speichern[s] === 'saving' ? '⏳ Wird gespeichert…' :
    speichern[s] === 'ok'     ? '✅ Gespeichert'       :
    speichern[s] === 'err'    ? '❌ Fehler'            : '';

  if (!eingeloggt) return (
    <div style={{ minHeight:'100vh', background:'#F5F0E7', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <form onSubmit={login} style={{ background:'#fff', borderRadius:12, padding:'2.5rem 2rem', boxShadow:'0 4px 24px rgba(0,0,0,0.12)', width:340 }}>
        <div style={{ fontFamily:'Palatino Linotype,Georgia,serif', fontSize:'1.3rem', color:'#2D6B1E', marginBottom:'0.3rem' }}>Flyer-Editor</div>
        <div style={{ fontSize:'0.8rem', color:'#5C4E38', marginBottom:'1.5rem' }}>Nur für Piloten · Texte &amp; Fotos bearbeiten</div>
        <label style={lbl}>Pilotenname</label>
        <input style={inp} value={pilot} onChange={e => setPilot(e.target.value)} required autoFocus/>
        <label style={lbl}>Passwort</label>
        <input style={inp} type="password" value={password} onChange={e => setPassword(e.target.value)} required/>
        {loginFehler && <div style={{ color:'#dc2626', fontSize:'0.8rem', marginBottom:'0.75rem' }}>{loginFehler}</div>}
        <button style={btn} disabled={laden}>{laden ? 'Prüfe…' : 'Anmelden'}</button>
      </form>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:'#F5F0E7' }}>
      {/* Nav */}
      <nav style={{ background:'#2D6B1E', color:'#fff', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 2rem', height:52 }}>
        <span style={{ fontWeight:700, fontSize:'0.95rem' }}>Flyer-Editor · {pilot}</span>
        <div style={{ display:'flex', gap:'1rem', alignItems:'center' }}>
          <a href="/flyer" target="_blank" style={{ color:'rgba(255,255,255,0.8)', fontSize:'0.85rem', textDecoration:'none' }}>Flyer ansehen →</a>
          <button onClick={() => setEingeloggt(false)} style={{ background:'none', border:'1px solid rgba(255,255,255,0.4)', color:'#fff', borderRadius:6, padding:'0.3rem 0.8rem', cursor:'pointer', fontSize:'0.82rem' }}>Abmelden</button>
        </div>
      </nav>

      {/* Felder */}
      <div style={{ maxWidth:720, margin:'0 auto', padding:'2rem 1.5rem 4rem' }}>
        <p style={{ fontSize:'0.82rem', color:'#5C4E38', marginBottom:'2rem', lineHeight:1.6 }}>
          Hier können Texte und Fotos für den Flyer angepasst werden. Änderungen werden sofort auf der Druckseite sichtbar.
        </p>

        {GRUPPEN.map(g => (
          <div key={g.titel}>
            <div style={{ fontSize:'0.7rem', fontWeight:800, letterSpacing:'0.1em', textTransform:'uppercase', color:'#2D6B1E', margin:'1.75rem 0 0.6rem', borderBottom:'2px solid #2D6B1E', paddingBottom:'0.3rem' }}>{g.titel}</div>
            {g.felder.map(f => (
              <div key={f.schluessel} style={{ background:'#fff', borderRadius:10, padding:'1.1rem 1.5rem', marginBottom:'0.75rem', boxShadow:'0 1px 4px rgba(0,0,0,0.07)' }}>
                <div style={{ fontWeight:700, fontSize:'0.8rem', color:'#5C4E38', marginBottom:'0.5rem', letterSpacing:'0.03em' }}>{f.label}</div>

                {(f.typ === 'text' || f.typ === 'textarea') && (
                  <>
                    {f.typ === 'text'
                      ? <input
                          value={werte[f.schluessel] ?? ''}
                          onChange={e => setWerte(w => ({ ...w, [f.schluessel]: e.target.value }))}
                          style={{ width:'100%', border:'1.5px solid #D6CCB8', borderRadius:6, padding:'0.5rem 0.8rem', fontFamily:'inherit', fontSize:'0.88rem', outline:'none', color:'#1C1208' }}
                        />
                      : <textarea
                          rows={3}
                          value={werte[f.schluessel] ?? ''}
                          onChange={e => setWerte(w => ({ ...w, [f.schluessel]: e.target.value }))}
                          style={{ width:'100%', border:'1.5px solid #D6CCB8', borderRadius:6, padding:'0.5rem 0.8rem', fontFamily:'inherit', fontSize:'0.88rem', resize:'vertical', outline:'none', color:'#1C1208' }}
                        />
                    }
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'0.4rem' }}>
                      <span style={{ fontSize:'0.73rem', color: speichern[f.schluessel]==='ok' ? '#16a34a' : speichern[f.schluessel]==='err' ? '#dc2626' : '#9a8a72' }}>{statusLabel(f.schluessel)}</span>
                      <button onClick={() => textSpeichern(f.schluessel)} disabled={speichern[f.schluessel]==='saving'} style={saveBtn}>Speichern</button>
                    </div>
                  </>
                )}

                {f.typ === 'foto' && (
                  <div style={{ display:'flex', gap:'1.2rem', alignItems:'flex-start' }}>
                    <div style={{ width:110, height:82, borderRadius:6, overflow:'hidden', background:'#F5F0E7', border:'1.5px dashed #D6CCB8', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      {werte[f.schluessel]
                        ? <img src={werte[f.schluessel]} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                        : <span style={{ fontSize:'1.5rem', opacity:0.3 }}>📷</span>
                      }
                    </div>
                    <div style={{ flex:1 }}>
                      <input type="file" accept="image/*" ref={el => { fileRefs.current[f.schluessel] = el; }} style={{ display:'none' }}
                        onChange={e => { const file = e.target.files?.[0]; if (file) fotoHochladen(f.schluessel, file); }}/>
                      <button onClick={() => fileRefs.current[f.schluessel]?.click()} disabled={speichern[f.schluessel]==='saving'} style={saveBtn}>
                        {speichern[f.schluessel]==='saving' ? '⏳ Hochladen…' : 'Foto hochladen'}
                      </button>
                      <div style={{ fontSize:'0.72rem', color:'#9a8a72', marginTop:'0.4rem' }}>JPG oder PNG · max. empfohlen 2 MB</div>
                      {speichern[f.schluessel]==='ok' && <div style={{ fontSize:'0.75rem', color:'#16a34a', marginTop:'0.3rem' }}>✅ Gespeichert</div>}
                      {speichern[f.schluessel]==='err' && <div style={{ fontSize:'0.75rem', color:'#dc2626', marginTop:'0.3rem' }}>❌ Fehler beim Hochladen</div>}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

const lbl: React.CSSProperties = { display:'block', fontSize:'0.75rem', fontWeight:700, color:'#5C4E38', marginBottom:'0.3rem', letterSpacing:'0.05em' };
const inp: React.CSSProperties = { width:'100%', border:'1.5px solid #D6CCB8', borderRadius:6, padding:'0.55rem 0.75rem', fontSize:'0.9rem', marginBottom:'1rem', outline:'none', fontFamily:'inherit' };
const btn: React.CSSProperties = { width:'100%', background:'#2D6B1E', color:'#fff', border:'none', borderRadius:7, padding:'0.65rem', fontSize:'0.9rem', fontWeight:700, cursor:'pointer' };
const saveBtn: React.CSSProperties = { background:'#C8881A', color:'#fff', border:'none', borderRadius:6, padding:'0.4rem 1rem', fontSize:'0.82rem', fontWeight:700, cursor:'pointer' };
