'use client';
import { useEffect, useState, useRef } from 'react';

type Ansicht = 'login' | 'pw-aendern' | 'bereich' | 'banner' | 'fahrzeugfotos' | 'mein-foto' | 'homepage-galerie' | 'dokumente';
type GalerieFoto = { id: string; url: string; beschreibung: string; pilot: string };
type Dokument = { id: string; name: string; kategorie: string; url: string; groesse: number; typ: string; hochgeladen_von: string; erstellt_am: string };

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
  const [fotoUploading, setFotoUploading] = useState<string | null>(null);
  const [fotoMsg, setFotoMsg] = useState<Record<string, string>>({});
  const [alleFotos, setAlleFotos] = useState<GalerieFoto[]>([]);
  const [ausgewaehlteIds, setAusgewaehlteIds] = useState<string[]>([]);
  const [galerieSaving, setGalerieSaving] = useState(false);
  const [dokumente, setDokumente] = useState<Dokument[]>([]);
  const [dokLaden, setDokLaden] = useState(false);
  const [dokUploading, setDokUploading] = useState(false);
  const [dokKategorie, setDokKategorie] = useState('');
  const [dokMsg, setDokMsg] = useState('');
  const dokInputRef = useRef<HTMLInputElement>(null);
  const pwInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleOpen() {
      const gespeichert = localStorage.getItem('pilot_name');
      const gespeichertPw = localStorage.getItem('pilot_pw');
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
        localStorage.setItem('pilot_name', j.pilot);
        localStorage.setItem('pilot_pw', passwort);
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
        localStorage.setItem('pilot_pw', neuesPw);
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

  async function ladeHomepageGalerie() {
    const [fotosRes, auswahlRes] = await Promise.all([
      fetch('/api/galerie'),
      fetch('/api/inhalte'),
    ]);
    const fotos: GalerieFoto[] = fotosRes.ok ? await fotosRes.json() : [];
    const inhalte: { schluessel: string; wert: string }[] = auswahlRes.ok ? await auswahlRes.json() : [];
    setAlleFotos(fotos);
    const eintrag = inhalte.find(x => x.schluessel === 'galerie_homepage');
    try { setAusgewaehlteIds(eintrag ? JSON.parse(eintrag.wert) : []); } catch { setAusgewaehlteIds([]); }
  }

  async function galerieAuswahlSpeichern() {
    setGalerieSaving(true);
    await fetch('/api/inhalte', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pilot: pilotName, password: pilotPw, schluessel: 'galerie_homepage', wert: JSON.stringify(ausgewaehlteIds) }),
    });
    setGalerieSaving(false);
    setAnsicht('bereich');
  }

  function toggleFoto(id: string) {
    setAusgewaehlteIds(ids =>
      ids.includes(id) ? ids.filter(x => x !== id) : ids.length < 8 ? [...ids, id] : ids
    );
  }

  async function fahrzeugFotoHochladen(schluessel: string, datei: File) {
    setFotoUploading(schluessel);
    setFotoMsg(m => ({ ...m, [schluessel]: '' }));
    const form = new FormData();
    form.append('pilot', pilotName);
    form.append('password', pilotPw);
    form.append('schluessel', schluessel);
    form.append('datei', datei);
    try {
      const res = await fetch('/api/flyer-foto', { method: 'POST', body: form });
      const j = await res.json();
      setFotoMsg(m => ({ ...m, [schluessel]: res.ok ? '✓ Gespeichert' : (j.error || 'Fehler') }));
    } catch {
      setFotoMsg(m => ({ ...m, [schluessel]: 'Verbindungsfehler' }));
    }
    setFotoUploading(null);
  }

  async function ladeDokumente() {
    setDokLaden(true);
    try { const res = await fetch('/api/piloten-dateien'); setDokumente(await res.json()); } catch {}
    setDokLaden(false);
  }

  async function dokumentHochladen(files: FileList | null) {
    if (!files || files.length === 0) return;
    setDokUploading(true);
    setDokMsg('');
    let ok = 0;
    let err = 0;
    for (const datei of Array.from(files)) {
      const form = new FormData();
      form.append('pilot', pilotName);
      form.append('password', pilotPw);
      form.append('kategorie', dokKategorie.trim() || 'Sonstiges');
      form.append('datei', datei);
      try {
        const res = await fetch('/api/piloten-dateien', { method: 'POST', body: form });
        if (res.ok) ok++; else err++;
      } catch { err++; }
    }
    setDokMsg(err === 0 ? `✓ ${ok} Datei${ok !== 1 ? 'en' : ''} hochgeladen` : `${ok} ok, ${err} Fehler`);
    await ladeDokumente();
    setDokUploading(false);
  }

  async function dokumentLoeschen(id: string) {
    if (!confirm('Datei wirklich löschen?')) return;
    await fetch('/api/piloten-dateien', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, pilot: pilotName, password: pilotPw }) });
    setDokumente(d => d.filter(x => x.id !== id));
  }

  function formatGroesse(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  function abmelden() {
    localStorage.removeItem('pilot_name');
    localStorage.removeItem('pilot_pw');
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
    width: (ansicht === 'homepage-galerie' || ansicht === 'dokumente') ? 'min(640px, 96vw)' : 'min(420px, 92vw)',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
    position: 'relative',
    maxHeight: '90dvh',
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 9999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', padding: '5vh 0' }}
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
            <button onClick={() => setAnsicht('bereich')} style={{ background: '#F5F0E7', border: '1.5px solid #D6CCB8', borderRadius: 6, color: '#1C1208', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, marginBottom: '1rem', padding: '0.4rem 0.9rem' }}>← Zurück</button>
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
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
                { href: '/flyer', icon: '🖨️', titel: 'Flyer', sub: 'Druckvorlagen & Flyer', border: '#2D6B1E' },
                { href: '#dokumente', icon: '📂', titel: 'Ablage', sub: 'Dokumente & Dateien', border: '#D6CCB8' },
                { href: '/galerie', icon: '🖼️', titel: 'Fotos', sub: 'Galerie & Fotos hochladen', border: '#D6CCB8' },
                { href: '#banner', icon: '📢', titel: 'Banner', sub: 'Ankündigungen bearbeiten', border: '#D6CCB8' },
                { href: '#fahrzeugfotos', icon: '🚲', titel: 'Fahrzeugfotos', sub: 'Fotos der Rikschas hochladen', border: '#D6CCB8' },
                { href: '#mein-foto', icon: '🤳', titel: 'Mein Foto', sub: 'Eigenes Bild für die Teamseite', border: '#D6CCB8' },
                { href: '#homepage-galerie', icon: '🖼️', titel: 'Galerie-Auswahl', sub: 'Bis zu 8 Fotos für die Homepage', border: '#C8881A' },
                { href: '/texte', icon: '✏️', titel: 'Texte bearbeiten', sub: 'Website-Texte anpassen', border: '#D6CCB8' },
                { href: '/admin', icon: '⚙️', titel: 'Verwaltung', sub: 'Piloten & Einstellungen', border: '#D6CCB8' },
                { href: 'tel:022279328383', icon: '📞', titel: '02227 9328383', sub: 'Koordination & Anfragen', border: '#D6CCB8' },
              ].map(k => (
                <a key={k.href + k.titel}
                  href={k.href === '#banner' ? undefined : k.href}
                  target={k.href.startsWith('/') ? '_blank' : undefined}
                  onClick={k.href === '#banner' ? (e) => { e.preventDefault(); ladeBanner(); setAnsicht('banner'); }
                    : k.href === '#fahrzeugfotos' ? (e) => { e.preventDefault(); setAnsicht('fahrzeugfotos'); }
                    : k.href === '#mein-foto' ? (e) => { e.preventDefault(); setAnsicht('mein-foto' as Ansicht); }
                    : k.href === '#homepage-galerie' ? (e) => { e.preventDefault(); ladeHomepageGalerie(); setAnsicht('homepage-galerie'); }
                    : k.href === '#dokumente' ? (e) => { e.preventDefault(); ladeDokumente(); setAnsicht('dokumente'); }
                    : undefined}
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
            <button onClick={() => setAnsicht('bereich')} style={{ background: '#F5F0E7', border: '1.5px solid #D6CCB8', borderRadius: 6, color: '#1C1208', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, marginBottom: '1rem', padding: '0.4rem 0.9rem' }}>← Zurück</button>
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

        {/* HOMEPAGE-GALERIE */}
        {ansicht === 'homepage-galerie' && (
          <>
            <button onClick={() => setAnsicht('bereich')} style={{ background: '#F5F0E7', border: '1.5px solid #D6CCB8', borderRadius: 6, color: '#1C1208', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, marginBottom: '1rem', padding: '0.4rem 0.9rem' }}>← Zurück</button>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <div style={{ fontWeight: 700, color: '#2D6B1E', fontSize: '1.05rem' }}>🖼️ Galerie-Auswahl für Homepage</div>
                <div style={{ fontSize: '0.78rem', color: '#6B5C44' }}>{ausgewaehlteIds.length} / 8 Fotos ausgewählt</div>
              </div>
              <button onClick={galerieAuswahlSpeichern} disabled={galerieSaving}
                style={{ background: '#C8881A', color: '#fff', border: 'none', borderRadius: 7, padding: '0.45rem 1.1rem', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}>
                {galerieSaving ? 'Speichern…' : 'Auswahl speichern'}
              </button>
            </div>
            {alleFotos.length === 0 && (
              <div style={{ color: '#9a8a72', fontSize: '0.85rem', textAlign: 'center', padding: '2rem' }}>Noch keine Fotos in der Galerie.</div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', maxHeight: '55vh', overflowY: 'auto' }}>
              {alleFotos.map(f => {
                const aktiv = ausgewaehlteIds.includes(f.id);
                const pos = ausgewaehlteIds.indexOf(f.id);
                return (
                  <div key={f.id} onClick={() => toggleFoto(f.id)}
                    style={{ position: 'relative', cursor: 'pointer', borderRadius: 8, overflow: 'hidden', border: aktiv ? '2.5px solid #C8881A' : '2.5px solid transparent', opacity: !aktiv && ausgewaehlteIds.length >= 8 ? 0.4 : 1 }}>
                    <img src={f.url} alt={f.beschreibung || ''} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }} />
                    {aktiv && (
                      <div style={{ position: 'absolute', top: 4, right: 4, background: '#C8881A', color: '#fff', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.72rem' }}>
                        {pos + 1}
                      </div>
                    )}
                    {f.beschreibung && (
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: '0.6rem', padding: '0.2rem 0.35rem', lineHeight: 1.3 }}>{f.beschreibung}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* MEIN FOTO */}
        {ansicht === 'mein-foto' && (
          <>
            <button onClick={() => setAnsicht('bereich')} style={{ background: '#F5F0E7', border: '1.5px solid #D6CCB8', borderRadius: 6, color: '#1C1208', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, marginBottom: '1rem', padding: '0.4rem 0.9rem' }}>← Zurück</button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '1.8rem' }}>🤳</span>
              <div>
                <div style={{ fontWeight: 700, color: '#2D6B1E', fontSize: '1.05rem' }}>Mein Foto</div>
                <div style={{ fontSize: '0.78rem', color: '#6B5C44' }}>Erscheint auf der Teamseite der Website</div>
              </div>
            </div>
            <div style={{ background: '#F5F0E7', borderRadius: 10, padding: '1.25rem', border: '1.5px solid #D6CCB8', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.82rem', color: '#5C4E38', marginBottom: '1rem', lineHeight: 1.5 }}>
                Lade ein quadratisches Foto von dir hoch — es wird als Profilbild auf der Teamseite angezeigt.<br/>
                <span style={{ color: '#9a8a72', fontSize: '0.75rem' }}>Empfehlung: quadratisch, min. 200×200 px, JPG oder PNG</span>
              </div>
              <label style={{ display: 'inline-block', background: '#2D6B1E', color: '#fff', borderRadius: 7, padding: '0.55rem 1.25rem', fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer' }}>
                {fotoUploading === `foto_pilot_${pilotName.toLowerCase().replace(/-/g,'_')}` ? 'Lädt hoch…' : '📷 Foto auswählen & hochladen'}
                <input type="file" accept="image/*" style={{ display: 'none' }}
                  disabled={fotoUploading !== null}
                  onChange={e => {
                    const d = e.target.files?.[0];
                    const key = `foto_pilot_${pilotName.toLowerCase().replace(/-/g,'_').replace(/\s+/g,'_')}`;
                    if (d) fahrzeugFotoHochladen(key, d);
                    e.target.value = '';
                  }}
                />
              </label>
              {fotoMsg[`foto_pilot_${pilotName.toLowerCase().replace(/-/g,'_').replace(/\s+/g,'_')}`] && (
                <div style={{ marginTop: '0.75rem', fontSize: '0.82rem', color: fotoMsg[`foto_pilot_${pilotName.toLowerCase().replace(/-/g,'_').replace(/\s+/g,'_')}`].startsWith('✓') ? '#15803d' : '#dc2626' }}>
                  {fotoMsg[`foto_pilot_${pilotName.toLowerCase().replace(/-/g,'_').replace(/\s+/g,'_')}`]}
                </div>
              )}
            </div>
          </>
        )}

        {/* FAHRZEUGFOTOS */}
        {ansicht === 'fahrzeugfotos' && (
          <>
            <button onClick={() => setAnsicht('bereich')} style={{ background: '#F5F0E7', border: '1.5px solid #D6CCB8', borderRadius: 6, color: '#1C1208', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, marginBottom: '1rem', padding: '0.4rem 0.9rem' }}>← Zurück</button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '1.8rem' }}>🚲</span>
              <div>
                <div style={{ fontWeight: 700, color: '#2D6B1E', fontSize: '1.05rem' }}>Fahrzeugfotos</div>
                <div style={{ fontSize: '0.78rem', color: '#6B5C44' }}>Fotos erscheinen sofort auf der Website</div>
              </div>
            </div>
            {[
              { schluessel: 'foto_lotte',   name: 'Flotte Lotte',    farbe: '#15803d' },
              { schluessel: 'foto_flitzer', name: 'Flinker Flitzer', farbe: '#1d4ed8' },
              { schluessel: 'foto_piter',   name: 'Jruuse Piter',    farbe: '#ea580c' },
            ].map(f => (
              <div key={f.schluessel} style={{ background: '#F5F0E7', borderRadius: 10, padding: '1rem 1.1rem', marginBottom: '0.75rem', border: '1.5px solid #D6CCB8' }}>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: f.farbe, marginBottom: '0.5rem' }}>{f.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <label style={{ background: '#2D6B1E', color: '#fff', border: 'none', borderRadius: 6, padding: '0.4rem 1rem', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}>
                    {fotoUploading === f.schluessel ? 'Lädt hoch…' : 'Foto wählen'}
                    <input type="file" accept="image/*" style={{ display: 'none' }}
                      disabled={fotoUploading !== null}
                      onChange={e => { const d = e.target.files?.[0]; if (d) fahrzeugFotoHochladen(f.schluessel, d); e.target.value = ''; }}
                    />
                  </label>
                  {fotoMsg[f.schluessel] && (
                    <span style={{ fontSize: '0.78rem', color: fotoMsg[f.schluessel].startsWith('✓') ? '#15803d' : '#dc2626' }}>
                      {fotoMsg[f.schluessel]}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </>
        )}

        {/* DOKUMENTE */}
        {ansicht === 'dokumente' && (
          <>
            <button onClick={() => setAnsicht('bereich')} style={{ background: '#F5F0E7', border: '1.5px solid #D6CCB8', borderRadius: 6, color: '#1C1208', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, marginBottom: '1rem', padding: '0.4rem 0.9rem' }}>← Zurück</button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '1.8rem' }}>📂</span>
              <div>
                <div style={{ fontWeight: 700, color: '#2D6B1E', fontSize: '1.05rem' }}>Ablage</div>
                <div style={{ fontSize: '0.78rem', color: '#6B5C44' }}>Dokumente, Flyer, PDFs für das Team</div>
              </div>
            </div>

            {/* Upload */}
            <div style={{ background: '#F5F0E7', borderRadius: 10, padding: '1rem 1.1rem', marginBottom: '1.25rem', border: '1.5px solid #D6CCB8' }}>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#2D6B1E', marginBottom: '0.75rem' }}>Datei hochladen</div>
              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '0.6rem' }}>
                <input
                  value={dokKategorie}
                  onChange={e => setDokKategorie(e.target.value)}
                  placeholder="Ordner / Kategorie (z. B. Flyer)"
                  style={{ flex: 1, minWidth: 150, border: '1.5px solid #D6CCB8', borderRadius: 6, padding: '0.45rem 0.7rem', fontSize: '0.85rem', fontFamily: 'inherit', background: '#fff' }}
                />
                <label style={{ background: '#2D6B1E', color: '#fff', border: 'none', borderRadius: 6, padding: '0.45rem 1rem', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  {dokUploading ? 'Lädt hoch…' : '+ Dateien wählen'}
                  <input ref={dokInputRef} type="file" multiple style={{ display: 'none' }} disabled={dokUploading}
                    onChange={e => { dokumentHochladen(e.target.files); e.target.value = ''; }} />
                </label>
              </div>
              {dokMsg && <div style={{ fontSize: '0.8rem', color: dokMsg.startsWith('✓') ? '#15803d' : '#dc2626' }}>{dokMsg}</div>}
            </div>

            {/* Dateiliste */}
            {dokLaden && <div style={{ color: '#6B5C44', fontSize: '0.85rem', textAlign: 'center', padding: '1.5rem 0' }}>Wird geladen …</div>}
            {!dokLaden && dokumente.length === 0 && <div style={{ color: '#6B5C44', fontSize: '0.85rem', textAlign: 'center', padding: '1.5rem 0' }}>Noch keine Dateien vorhanden.</div>}
            {dokumente.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {dokumente.map(d => (
                  <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#F5F0E7', borderRadius: 8, padding: '0.65rem 0.85rem', border: '1px solid #D6CCB8' }}>
                    <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>
                      {d.typ.includes('pdf') ? '📄' : d.typ.includes('image') ? '🖼️' : d.typ.includes('word') ? '📝' : '📎'}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1C1208', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.name}</div>
                      <div style={{ fontSize: '0.72rem', color: '#6B5C44' }}>
                        {d.kategorie} · {formatGroesse(d.groesse)} · {d.hochgeladen_von}
                      </div>
                    </div>
                    <a href={d.url} target="_blank" rel="noopener noreferrer"
                      style={{ background: '#2D6B1E', color: '#fff', borderRadius: 6, padding: '0.35rem 0.7rem', fontSize: '0.75rem', fontWeight: 700, textDecoration: 'none', flexShrink: 0 }}>
                      ↓
                    </a>
                    <button onClick={() => dokumentLoeschen(d.id)}
                      style={{ background: '#FEE2E2', color: '#991b1b', border: 'none', borderRadius: 6, padding: '0.35rem 0.6rem', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}
