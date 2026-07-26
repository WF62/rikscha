'use client';
import { useEffect, useState, useRef } from 'react';

type Ansicht = 'login' | 'pw-aendern' | 'bereich' | 'banner';

export default function PilotenModal() {
  const [offen, setOffen] = useState(false);
  const [ansicht, setAnsicht] = useState<Ansicht>('login');
  const [piloten, setPiloten] = useState<{ name: string; rolle: string }[]>([]);
  const [gewaehlterPilot, setGewaehlterPilot] = useState('');
  const [passwort, setPasswort] = useState('');
  const [neuesPw, setNeuesPw] = useState('');
  const [neuesPwWdh, setNeuesPwWdh] = useState('');
  const [fehler, setFehler] = useState('');
  const [laden, setLaden] = useState(false);
  const [pilotName, setPilotName] = useState('');
  const [pilotPw, setPilotPw] = useState('');
  const [bannerTexte, setBannerTexte] = useState<string[]>(['']);
  const [bannerSaving, setBannerSaving] = useState(false);
  const pwInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleOpen() {
      const gespeichert = sessionStorage.getItem('pilot_name');
      const gespeichertPw = sessionStorage.getItem('pilot_pw');
      if (gespeichert && gespeichertPw) {
        setPilotName(gespeichert);
        setPilotPw(gespeichertPw);
        setAnsicht('bereich');
      } else {
        setAnsicht('login');
        ladePiloten();
      }
      setOffen(true);
    }
    window.addEventListener('open-piloten-modal', handleOpen);
    return () => window.removeEventListener('open-piloten-modal', handleOpen);
  }, []);

  useEffect(() => {
    if (offen && ansicht === 'login') {
      setTimeout(() => pwInputRef.current?.focus(), 50);
    }
  }, [offen, ansicht]);

  async function ladePiloten() {
    try {
      const res = await fetch('/api/piloten');
      const daten = await res.json();
      setPiloten(daten);
      if (daten.length > 0) setGewaehlterPilot(daten[0].name);
    } catch {
      setPiloten([]);
    }
  }

  async function anmelden() {
    setFehler('');
    if (!gewaehlterPilot) { setFehler('Bitte deinen Namen wählen.'); return; }
    if (!passwort) { setFehler('Bitte das Passwort eingeben.'); return; }
    setLaden(true);
    try {
      const res = await fetch('/api/pilot-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pilot: gewaehlterPilot, password: passwort }),
      });
      const j = await res.json();
      if (res.ok) {
        sessionStorage.setItem('pilot_name', j.pilot);
        sessionStorage.setItem('pilot_pw', passwort);
        setPilotName(j.pilot);
        setPilotPw(passwort);
        if (j.muss_pw_aendern) {
          setNeuesPw('');
          setNeuesPwWdh('');
          setAnsicht('pw-aendern');
        } else {
          setAnsicht('bereich');
        }
      } else {
        setFehler(j.error || 'Falscher Name oder Passwort.');
      }
    } catch {
      setFehler('Verbindungsfehler — bitte nochmal versuchen.');
    }
    setLaden(false);
  }

  async function pwAendern() {
    setFehler('');
    if (neuesPw.length < 6) { setFehler('Mindestens 6 Zeichen.'); return; }
    if (neuesPw !== neuesPwWdh) { setFehler('Die Passwörter stimmen nicht überein.'); return; }
    setLaden(true);
    try {
      const res = await fetch('/api/pilot-pw-aendern', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pilot: pilotName, altesPasswort: pilotPw, neuesPasswort: neuesPw }),
      });
      const j = await res.json();
      if (res.ok) {
        sessionStorage.setItem('pilot_pw', neuesPw);
        setPilotPw(neuesPw);
        setAnsicht('bereich');
      } else {
        setFehler(j.error || 'Fehler beim Speichern.');
      }
    } catch {
      setFehler('Verbindungsfehler — bitte nochmal versuchen.');
    }
    setLaden(false);
  }

  async function ladeBanner() {
    try {
      const res = await fetch('/api/banner');
      const texte: string[] = await res.json();
      setBannerTexte(texte.length ? texte : ['']);
    } catch {
      setBannerTexte(['']);
    }
  }

  async function bannerSpeichern() {
    setBannerSaving(true);
    await fetch('/api/banner', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pilot: pilotName, password: pilotPw, texte: bannerTexte }),
    });
    setBannerSaving(false);
    setAnsicht('bereich');
  }

  function abmelden() {
    sessionStorage.removeItem('pilot_name');
    sessionStorage.removeItem('pilot_pw');
    setPilotName('');
    setPilotPw('');
    setPasswort('');
    setGewaehlterPilot('');
    setOffen(false);
  }

  function schliessen() {
    if (ansicht !== 'bereich') setOffen(false);
  }

  if (!offen) return null;

  const card: React.CSSProperties = {
    background: '#fff', borderRadius: 14, padding: '2rem 2.5rem',
    width: 'min(420px, 92vw)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
    position: 'relative',
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={schliessen}
    >
      <div style={card} onClick={e => e.stopPropagation()}>

        {/* LOGIN */}
        {ansicht === 'login' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '1.8rem' }}>🚲</span>
              <div>
                <div style={{ fontWeight: 700, color: '#2D6B1E', fontSize: '1.05rem' }}>Piloten-Bereich</div>
                <div style={{ fontSize: '0.78rem', color: '#6B5C44' }}>Nur für das Rikscha-Team</div>
              </div>
            </div>
            <div style={{ marginBottom: '0.75rem' }}>
              {piloten.length > 0 ? (
                <select
                  value={gewaehlterPilot}
                  onChange={e => setGewaehlterPilot(e.target.value)}
                  style={{ width: '100%', border: '1.5px solid #d0c8bc', borderRadius: 8, padding: '0.65rem 1rem', fontSize: '1rem', background: '#fff', color: '#1a1208', outline: 'none' }}
                >
                  <option value="">— Name wählen —</option>
                  {piloten.map(p => (
                    <option key={p.name} value={p.name}>{p.name}{p.rolle === 'gfo' ? ' (GFO)' : ''}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text" placeholder="Deinen Namen eingeben"
                  value={gewaehlterPilot} onChange={e => setGewaehlterPilot(e.target.value)}
                  style={{ width: '100%', border: '1.5px solid #d0c8bc', borderRadius: 8, padding: '0.65rem 1rem', fontSize: '1rem', background: '#fff', color: '#1a1208', outline: 'none' }}
                />
              )}
            </div>
            <input
              ref={pwInputRef}
              type="password" placeholder="Passwort"
              value={passwort} onChange={e => setPasswort(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && anmelden()}
              style={{ width: '100%', border: '1.5px solid #d0c8bc', borderRadius: 8, padding: '0.65rem 1rem', fontSize: '1rem', background: '#fff', color: '#1a1208', marginBottom: '0.75rem', outline: 'none' }}
            />
            {fehler && <div style={{ color: '#c0392b', fontSize: '0.82rem', marginBottom: '0.75rem' }}>{fehler}</div>}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setOffen(false)} style={{ flex: 1, padding: '0.6rem', border: '1.5px solid #d0c8bc', borderRadius: 8, background: 'transparent', color: '#333', cursor: 'pointer' }}>Abbrechen</button>
              <button onClick={anmelden} disabled={laden} style={{ flex: 1, padding: '0.6rem', border: 'none', borderRadius: 8, background: '#2D6B1E', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
                {laden ? '…' : 'Anmelden'}
              </button>
            </div>
          </>
        )}

        {/* PASSWORT ÄNDERN */}
        {ansicht === 'pw-aendern' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.8rem' }}>🔑</span>
              <div>
                <div style={{ fontWeight: 700, color: '#2D6B1E', fontSize: '1.05rem' }}>Neues Passwort vergeben</div>
                <div style={{ fontSize: '0.78rem', color: '#6B5C44' }}>Bitte wähle jetzt dein persönliches Passwort</div>
              </div>
            </div>
            <p style={{ fontSize: '0.83rem', color: '#6B5C44', marginBottom: '1.25rem', lineHeight: 1.5 }}>
              Hallo <strong>{pilotName}</strong>! Bei deiner ersten Anmeldung musst du ein eigenes Passwort vergeben (mind. 6 Zeichen).
            </p>
            <input
              type="password" placeholder="Neues Passwort"
              value={neuesPw} onChange={e => setNeuesPw(e.target.value)}
              style={{ width: '100%', border: '1.5px solid #d0c8bc', borderRadius: 8, padding: '0.65rem 1rem', fontSize: '1rem', background: '#fff', color: '#1a1208', marginBottom: '0.65rem', outline: 'none' }}
            />
            <input
              type="password" placeholder="Passwort wiederholen"
              value={neuesPwWdh} onChange={e => setNeuesPwWdh(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && pwAendern()}
              style={{ width: '100%', border: '1.5px solid #d0c8bc', borderRadius: 8, padding: '0.65rem 1rem', fontSize: '1rem', background: '#fff', color: '#1a1208', marginBottom: '0.75rem', outline: 'none' }}
            />
            {fehler && <div style={{ color: '#c0392b', fontSize: '0.82rem', marginBottom: '0.75rem' }}>{fehler}</div>}
            <button onClick={pwAendern} disabled={laden} style={{ width: '100%', padding: '0.65rem', border: 'none', borderRadius: 8, background: '#2D6B1E', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '1rem' }}>
              {laden ? '…' : 'Passwort speichern & weiter'}
            </button>
          </>
        )}

        {/* PILOTEN-BEREICH */}
        {ansicht === 'bereich' && (
          <div style={{ maxWidth: 600 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.8rem' }}>🚲</span>
                <div>
                  <div style={{ fontWeight: 700, color: '#2D6B1E', fontSize: '1.1rem' }}>Hallo, {pilotName}!</div>
                  <div style={{ fontSize: '0.78rem', color: '#6B5C44' }}>Mertener Rikschakutscher · intern</div>
                </div>
              </div>
              <button onClick={abmelden} style={{ padding: '0.4rem 1rem', border: '1.5px solid #D6CCB8', borderRadius: 8, background: 'transparent', color: '#6B5C44', fontSize: '0.82rem', cursor: 'pointer' }}>Abmelden</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              {[
                { href: '/kalender', icon: '📅', titel: 'Fahrtenkalender', sub: 'Termine buchen & verwalten', border: '#D6CCB8' },
                { href: '/buchen', icon: '➕', titel: 'Fahrt buchen', sub: 'Neuen Termin eintragen', border: '#2D6B1E' },
                { href: '/dokumente', icon: '📂', titel: 'Ablage', sub: 'Dokumente & Dateien', border: '#D6CCB8' },
                { href: '/galerie', icon: '🖼️', titel: 'Fotos', sub: 'Galerie & Fotos hochladen', border: '#D6CCB8' },
                { href: '#banner', icon: '📢', titel: 'Banner', sub: 'Ankündigungen bearbeiten', border: '#D6CCB8' },
                { href: '/texte', icon: '✏️', titel: 'Texte bearbeiten', sub: 'Website-Texte anpassen', border: '#D6CCB8' },
                { href: '/admin', icon: '⚙️', titel: 'Verwaltung', sub: 'Piloten & Einstellungen', border: '#D6CCB8' },
                { href: 'tel:022279328383', icon: '📞', titel: '02227 9328383', sub: 'Koordination & Anfragen', border: '#D6CCB8' },
              ].map(k => (
                <a key={k.href + k.titel}
                  href={k.href === '#banner' ? undefined : k.href}
                  target={k.href.startsWith('/') ? '_blank' : undefined}
                  onClick={k.href === '#banner' ? (e) => { e.preventDefault(); ladeBanner(); setAnsicht('banner'); } : undefined}
                  style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', padding: '1.1rem', background: '#F5F0E7', borderRadius: 12, border: `1.5px solid ${k.border}`, textDecoration: 'none', color: '#1C1208', cursor: 'pointer' }}>
                  <span style={{ fontSize: '1.4rem' }}>{k.icon}</span>
                  <span style={{ fontWeight: 700, fontSize: '0.92rem' }}>{k.titel}</span>
                  <span style={{ fontSize: '0.75rem', color: '#6B5C44' }}>{k.sub}</span>
                </a>
              ))}
            </div>
            <div style={{ background: '#F5F0E7', borderRadius: 12, border: '1.5px solid #D6CCB8', padding: '1rem 1.25rem' }}>
              <div style={{ fontWeight: 700, marginBottom: '0.6rem', color: '#2D6B1E', fontSize: '0.9rem' }}>📋 Wichtige Hinweise</div>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.82rem', color: '#6B5C44' }}>
                <li>· Fahrten bitte mindestens 24 Stunden vorher buchen</li>
                <li>· Bei Ausfall wegen Wetter: Gäste frühzeitig informieren</li>
                <li>· Fahrzeuge nach jeder Fahrt reinigen und sichern</li>
                <li>· Die Fahrten sind kostenlos — Spendenhinweis nicht vergessen</li>
              </ul>
            </div>
          </div>
        )}

        {/* BANNER */}
        {ansicht === 'banner' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.8rem' }}>📢</span>
              <div>
                <div style={{ fontWeight: 700, color: '#2D6B1E', fontSize: '1.05rem' }}>Banner bearbeiten</div>
                <div style={{ fontSize: '0.78rem', color: '#6B5C44' }}>Mehrere Texte rotieren alle 5 Sekunden</div>
              </div>
            </div>
            <div style={{ marginTop: '1.25rem' }}>
              {bannerTexte.map((t, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.6rem', alignItems: 'center' }}>
                  <input
                    value={t}
                    onChange={e => setBannerTexte(bt => bt.map((x, j) => j === i ? e.target.value : x))}
                    placeholder={`Banner-Text ${i + 1}`}
                    style={{ flex: 1, border: '1.5px solid #D6CCB8', borderRadius: 6, padding: '0.5rem 0.7rem', fontSize: '0.88rem', fontFamily: 'inherit' }}
                  />
                  <button onClick={() => setBannerTexte(bt => bt.filter((_, j) => j !== i))}
                    style={{ background: '#FEE2E2', color: '#991b1b', border: 'none', borderRadius: 6, padding: '0.4rem 0.6rem', cursor: 'pointer', fontWeight: 700 }}>✕</button>
                </div>
              ))}
              {bannerTexte.length < 5 && (
                <button onClick={() => setBannerTexte(bt => [...bt, ''])}
                  style={{ background: '#F5F0E7', border: '1.5px dashed #D6CCB8', borderRadius: 6, padding: '0.4rem 1rem', fontSize: '0.82rem', cursor: 'pointer', color: '#5C4E38', width: '100%', marginBottom: '1rem' }}>
                  + Weiteren Text hinzufügen
                </button>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
              <button onClick={() => setAnsicht('bereich')} style={{ background: '#F5F0E7', border: 'none', borderRadius: 7, padding: '0.5rem 1.2rem', cursor: 'pointer', fontWeight: 600 }}>Abbrechen</button>
              <button onClick={bannerSpeichern} disabled={bannerSaving} style={{ background: '#b45309', color: '#fff', border: 'none', borderRadius: 7, padding: '0.5rem 1.4rem', cursor: 'pointer', fontWeight: 700 }}>
                {bannerSaving ? 'Speichern…' : 'Speichern'}
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
