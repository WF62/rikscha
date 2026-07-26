'use client';
import { useState, useEffect, useRef } from 'react';

const FOTOS: { schluessel: string; label: string; hinweis: string }[] = [
  { schluessel: 'flyer_foto_fahrt1',  label: 'Foto Fahrt 1',       hinweis: 'Erscheint im Abschnitt „Fahrtwind für alle" (linkes Foto)' },
  { schluessel: 'flyer_foto_fahrt2',  label: 'Foto Fahrt 2',       hinweis: 'Erscheint im Abschnitt „Fahrtwind für alle" (rechtes Foto)' },
  { schluessel: 'flyer_foto_lotte',   label: 'Foto Flotte Lotte',  hinweis: 'Erscheint auf der Rückseite beim Rikscha-Abschnitt' },
  { schluessel: 'flyer_foto_flitzer', label: 'Foto Flinker Flitzer', hinweis: 'Erscheint auf der Rückseite beim Liegetandem-Abschnitt' },
  { schluessel: 'flyer_foto_piter',   label: 'Foto Jruuse Piter',  hinweis: 'Erscheint auf der Rückseite beim Paralleltandem-Abschnitt' },
];

const TEXTE: { schluessel: string; label: string; hinweis: string }[] = [
  { schluessel: 'flyer_fahrten_text',  label: 'Text „Fahrtwind für alle"', hinweis: 'Haupttext im grünen Fahrten-Abschnitt (Vorderseite)' },
  { schluessel: 'flyer_lotte_text',    label: 'Text Flotte Lotte',         hinweis: 'Beschreibungstext auf der Rückseite' },
  { schluessel: 'flyer_flitzer_text',  label: 'Text Flinker Flitzer',      hinweis: 'Beschreibungstext auf der Rückseite' },
  { schluessel: 'flyer_piter_text',    label: 'Text Jruuse Piter',         hinweis: 'Beschreibungstext auf der Rückseite' },
];

type Feld = { schluessel: string; wert: string };

export default function FlyerBearbeitenPage() {
  const [pilot, setPilot]       = useState(() => typeof window !== 'undefined' ? localStorage.getItem('pilot_name') ?? '' : '');
  const [password, setPassword] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('pilot_pw') ?? '' : '');
  const [eingeloggt, setEingeloggt] = useState(() => typeof window !== 'undefined' && !!localStorage.getItem('pilot_name'));
  const [piloten, setPiloten]   = useState<{ name: string; rolle: string }[]>([]);
  const [felder, setFelder]     = useState<Feld[]>([]);
  const [fehler, setFehler]     = useState('');
  const [laden, setLaden]       = useState(false);
  const [uploadStatus, setUploadStatus] = useState<Record<string, 'uploading' | 'ok' | 'err' | ''>>({});
  const [speicherStatus, setSpeicherStatus] = useState<Record<string, 'ok' | 'err' | ''>>({});
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    if (eingeloggt) ladeFelder();
    else ladePiloten();
  }, []);

  async function ladePiloten() {
    try {
      const res = await fetch('/api/piloten');
      const daten = await res.json();
      setPiloten(daten);
      if (daten.length > 0 && !pilot) setPilot(daten[0].name);
    } catch {}
  }

  async function ladeFelder() {
    try {
      const res = await fetch('/api/inhalte');
      const daten = await res.json();
      setFelder(daten);
    } catch {}
  }

  function feldWert(schluessel: string) {
    return felder.find(f => f.schluessel === schluessel)?.wert ?? '';
  }

  async function anmelden(e: React.FormEvent) {
    e.preventDefault();
    setFehler('');
    setLaden(true);
    try {
      const res = await fetch('/api/pilot-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pilot, password }),
      });
      if (res.ok) {
        localStorage.setItem('pilot_name', pilot);
        localStorage.setItem('pilot_pw', password);
        setEingeloggt(true);
        await ladeFelder();
      } else {
        const j = await res.json();
        setFehler(j.error || 'Falscher Name oder Passwort.');
      }
    } catch {
      setFehler('Verbindungsfehler.');
    }
    setLaden(false);
  }

  async function fotoHochladen(schluessel: string, datei: File) {
    setUploadStatus(s => ({ ...s, [schluessel]: 'uploading' }));
    const form = new FormData();
    form.append('pilot', pilot);
    form.append('password', password);
    form.append('schluessel', schluessel);
    form.append('datei', datei);
    try {
      const res = await fetch('/api/flyer-foto', { method: 'POST', body: form });
      if (res.ok) {
        const { url } = await res.json();
        setFelder(f => {
          const exists = f.find(x => x.schluessel === schluessel);
          if (exists) return f.map(x => x.schluessel === schluessel ? { ...x, wert: url } : x);
          return [...f, { schluessel, wert: url }];
        });
        setUploadStatus(s => ({ ...s, [schluessel]: 'ok' }));
        setTimeout(() => setUploadStatus(s => ({ ...s, [schluessel]: '' })), 4000);
      } else {
        setUploadStatus(s => ({ ...s, [schluessel]: 'err' }));
      }
    } catch {
      setUploadStatus(s => ({ ...s, [schluessel]: 'err' }));
    }
  }

  async function speichern(schluessel: string, wert: string) {
    setSpeicherStatus(s => ({ ...s, [schluessel]: '' }));
    try {
      const res = await fetch('/api/inhalte', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pilot, password, schluessel, wert }),
      });
      if (res.ok) {
        setSpeicherStatus(s => ({ ...s, [schluessel]: 'ok' }));
        setFelder(f => f.map(x => x.schluessel === schluessel ? { ...x, wert } : x));
        setTimeout(() => setSpeicherStatus(s => ({ ...s, [schluessel]: '' })), 4000);
      } else {
        setSpeicherStatus(s => ({ ...s, [schluessel]: 'err' }));
      }
    } catch {
      setSpeicherStatus(s => ({ ...s, [schluessel]: 'err' }));
    }
  }

  const css = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --green: #2D6B1E; --green-soft: #EBF3E7;
      --gold: #C8881A;
      --ink: #1C1208; --mid: #6B5C44;
      --ground: #F5F0E7; --surface: #FDFAF5; --border: #D6CCB8;
      --radius: 4px;
      --sans: system-ui, -apple-system, Segoe UI, sans-serif;
      --serif: Palatino Linotype, Palatino, Book Antiqua, Georgia, serif;
    }
    @media (prefers-color-scheme: dark) {
      :root { --green: #5DB84A; --green-soft: #1A2E16; --ink: #F0EBE0; --mid: #A89880; --ground: #141008; --surface: #1C1610; --border: #3A3020; }
    }
    body { font-family: var(--sans); background: var(--ground); color: var(--ink); min-height: 100vh; }
    .page-nav { background: #2D6B1E; color: #fff; display: flex; align-items: center; gap: 0.75rem; padding: 0 2rem; height: 56px; flex-wrap: wrap; }
    .page-nav a { color: rgba(255,255,255,0.8); text-decoration: none; font-size: 0.88rem; }
    .page-nav a:hover { color: #fff; }
    .page-nav .sep { color: rgba(255,255,255,0.3); }
    .page-body { max-width: 820px; margin: 0 auto; padding: 3rem 1.5rem 5rem; }
    h1 { font-family: var(--serif); font-size: 1.9rem; font-weight: normal; margin-bottom: 0.4rem; }
    .lead { color: var(--mid); margin-bottom: 2rem; font-size: 0.95rem; }
    .login-box { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 2rem; max-width: 420px; }
    .login-box h2 { font-family: var(--serif); font-size: 1.3rem; font-weight: normal; margin-bottom: 1.25rem; }
    .field { display: flex; flex-direction: column; gap: 0.35rem; margin-bottom: 0.85rem; }
    .field label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: var(--green); }
    .field input, .field select { border: 1.5px solid var(--border); border-radius: var(--radius); padding: 0.6rem 0.8rem; font-size: 0.95rem; background: var(--ground); color: var(--ink); font-family: var(--sans); outline: none; width: 100%; }
    .field input:focus, .field select:focus { border-color: var(--green); }
    .btn-primary { background: var(--green); color: #fff; border: none; padding: 0.65rem 1.75rem; border-radius: var(--radius); font-size: 0.95rem; font-weight: 600; cursor: pointer; }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .err-msg { color: #c0392b; font-size: 0.82rem; margin-top: 0.5rem; }
    .section-head { font-family: var(--serif); font-size: 1.3rem; font-weight: normal; margin: 2.5rem 0 1rem; padding-bottom: 0.5rem; border-bottom: 1.5px solid var(--border); }
    .editor-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
    .editor-header h2 { font-family: var(--serif); font-size: 1.4rem; font-weight: normal; }
    .btn-abmelden { background: transparent; border: 1.5px solid var(--border); border-radius: var(--radius); padding: 0.4rem 1rem; font-size: 0.82rem; color: var(--mid); cursor: pointer; }
    .preview-link { display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.82rem; color: var(--gold); text-decoration: none; border: 1px solid var(--gold); border-radius: var(--radius); padding: 0.35rem 0.8rem; margin-bottom: 2rem; }
    .preview-link:hover { background: var(--gold); color: #fff; }

    /* Foto-Karten */
    .foto-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; margin-bottom: 1rem; }
    .foto-card { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 1.25rem; display: flex; flex-direction: column; gap: 0.75rem; }
    .foto-card-label { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.09em; color: var(--green); }
    .foto-card-hinweis { font-size: 0.72rem; color: var(--mid); }
    .foto-preview { width: 100%; aspect-ratio: 4/3; object-fit: cover; border-radius: 4px; display: block; }
    .foto-placeholder { width: 100%; aspect-ratio: 4/3; background: var(--ground); border: 2px dashed var(--border); border-radius: 4px; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 0.4rem; color: var(--mid); font-size: 0.78rem; }
    .foto-placeholder span:first-child { font-size: 2rem; opacity: 0.35; }
    .foto-actions { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
    .btn-upload { background: var(--green); color: #fff; border: none; padding: 0.45rem 1.1rem; border-radius: var(--radius); font-size: 0.82rem; font-weight: 600; cursor: pointer; }
    .btn-upload:disabled { opacity: 0.5; cursor: not-allowed; }
    .status-ok  { color: var(--green); font-size: 0.78rem; }
    .status-err { color: #c0392b; font-size: 0.78rem; }
    .status-uploading { color: var(--mid); font-size: 0.78rem; }

    /* Text-Blöcke */
    .text-block { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 1.25rem 1.5rem; margin-bottom: 1rem; }
    .text-block-label { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.09em; color: var(--green); margin-bottom: 0.2rem; }
    .text-block-hinweis { font-size: 0.72rem; color: var(--mid); margin-bottom: 0.7rem; }
    .text-block textarea { width: 100%; border: 1.5px solid var(--border); border-radius: var(--radius); padding: 0.65rem 0.8rem; font-size: 0.95rem; font-family: var(--sans); background: var(--ground); color: var(--ink); outline: none; resize: vertical; min-height: 90px; line-height: 1.6; }
    .text-block textarea:focus { border-color: var(--green); }
    .text-block-footer { display: flex; align-items: center; justify-content: flex-end; gap: 0.75rem; margin-top: 0.6rem; flex-wrap: wrap; }
    .btn-save { background: var(--green); color: #fff; border: none; padding: 0.4rem 1.1rem; border-radius: var(--radius); font-size: 0.82rem; font-weight: 600; cursor: pointer; }
    @media (max-width: 600px) { .page-body { padding: 2rem 1rem 4rem; } .foto-grid { grid-template-columns: 1fr; } }
  `;

  return (
    <>
      <style>{css}</style>
      <nav className="page-nav">
        <a href="/">← Zur Website</a>
        <span className="sep">·</span>
        <a href="/flyer">Flyer ansehen</a>
        <span className="sep">·</span>
        <span style={{color:'rgba(255,255,255,0.6)',fontSize:'0.88rem'}}>Flyer bearbeiten</span>
      </nav>

      <div className="page-body">
        <h1>Flyer bearbeiten</h1>
        <p className="lead">Fotos hochladen und Texte anpassen — Änderungen erscheinen sofort im Flyer.</p>

        {!eingeloggt && (
          <div className="login-box">
            <h2>Anmelden</h2>
            <form onSubmit={anmelden}>
              <div className="field">
                <label>Dein Name</label>
                {piloten.length > 0 ? (
                  <select value={pilot} onChange={e => setPilot(e.target.value)}>
                    <option value="">— Name wählen —</option>
                    {piloten.map(p => (
                      <option key={p.name} value={p.name}>{p.name}{p.rolle === 'gfo' ? ' (GFO)' : ''}</option>
                    ))}
                  </select>
                ) : (
                  <input type="text" value={pilot} onChange={e => setPilot(e.target.value)} placeholder="Deinen Namen eingeben" />
                )}
              </div>
              <div className="field">
                <label>Passwort</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Dein Passwort" />
              </div>
              {fehler && <div className="err-msg">{fehler}</div>}
              <button type="submit" className="btn-primary" disabled={laden} style={{marginTop:'1rem'}}>
                {laden ? '…' : 'Anmelden'}
              </button>
            </form>
          </div>
        )}

        {eingeloggt && (
          <>
            <div className="editor-header">
              <h2>Eingeloggt als {pilot}</h2>
              <button className="btn-abmelden" onClick={() => {
                localStorage.removeItem('pilot_name');
                localStorage.removeItem('pilot_pw');
                setEingeloggt(false);
                setFelder([]);
              }}>Abmelden</button>
            </div>

            <a href="/flyer" target="_blank" className="preview-link">↗ Flyer in neuem Tab öffnen</a>

            {/* Fotos */}
            <h2 className="section-head">📷 Fotos</h2>
            <div className="foto-grid">
              {FOTOS.map(({ schluessel, label, hinweis }) => {
                const url = feldWert(schluessel);
                const st  = uploadStatus[schluessel] || '';
                return (
                  <div key={schluessel} className="foto-card">
                    <div className="foto-card-label">{label}</div>
                    <div className="foto-card-hinweis">{hinweis}</div>
                    {url
                      ? <img src={url} alt={label} className="foto-preview" />
                      : <div className="foto-placeholder"><span>📷</span><span>Noch kein Foto</span></div>
                    }
                    <div className="foto-actions">
                      <button
                        className="btn-upload"
                        disabled={st === 'uploading'}
                        onClick={() => fileRefs.current[schluessel]?.click()}
                      >
                        {st === 'uploading' ? 'Wird hochgeladen …' : url ? 'Foto ersetzen' : 'Foto hochladen'}
                      </button>
                      {st === 'ok'  && <span className="status-ok">Gespeichert ✓</span>}
                      {st === 'err' && <span className="status-err">Fehler beim Upload</span>}
                      <input
                        type="file"
                        accept="image/*"
                        style={{display:'none'}}
                        ref={el => { fileRefs.current[schluessel] = el; }}
                        onChange={e => {
                          const f = e.target.files?.[0];
                          if (f) fotoHochladen(schluessel, f);
                          e.target.value = '';
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Texte */}
            <h2 className="section-head">✏️ Texte</h2>
            {TEXTE.map(({ schluessel, label, hinweis }) => {
              const wert = feldWert(schluessel);
              const st   = speicherStatus[schluessel] || '';
              return (
                <div key={schluessel} className="text-block">
                  <div className="text-block-label">{label}</div>
                  <div className="text-block-hinweis">{hinweis}</div>
                  <textarea
                    id={`ta-${schluessel}`}
                    defaultValue={wert}
                    rows={4}
                    onKeyDown={e => {
                      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                        e.preventDefault();
                        speichern(schluessel, (e.target as HTMLTextAreaElement).value);
                      }
                    }}
                  />
                  <div className="text-block-footer">
                    {st === 'ok'  && <span className="status-ok">Gespeichert ✓</span>}
                    {st === 'err' && <span className="status-err">Fehler</span>}
                    <button className="btn-save" onClick={() => {
                      const ta = document.getElementById(`ta-${schluessel}`) as HTMLTextAreaElement;
                      speichern(schluessel, ta.value);
                    }}>Speichern</button>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </>
  );
}
