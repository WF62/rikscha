'use client';
import { useState, useEffect } from 'react';

type Foto = { id: string; url: string; beschreibung: string; pilot: string; created_at: string };

export default function GaleriePage() {
  const [fotos, setFotos]       = useState<Foto[]>([]);
  const [galLaden, setGalLaden] = useState(true);
  const [piloten, setPiloten]   = useState<{ name: string; rolle: string }[]>([]);
  const [pilot, setPilot]       = useState(() => typeof window !== 'undefined' ? localStorage.getItem('pilot_name') ?? '' : '');
  const [password]               = useState(() => typeof window !== 'undefined' ? localStorage.getItem('pilot_pw') ?? '' : '');
  const [datei, setDatei]       = useState<File | null>(null);
  const [beschreibung, setBeschreibung] = useState('');
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg]           = useState<{ typ: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    ladeGalerie();
    if (!pilot) ladePiloten();
  }, []);

  async function ladeGalerie() {
    setGalLaden(true);
    try {
      const res = await fetch('/api/galerie');
      setFotos(await res.json());
    } catch {}
    setGalLaden(false);
  }

  async function ladePiloten() {
    try {
      const res = await fetch('/api/piloten');
      const daten = await res.json();
      setPiloten(daten);
      if (daten.length > 0 && !pilot) setPilot(daten[0].name);
    } catch {}
  }

  async function hochladen() {
    setMsg(null);
    if (!pilot) { setMsg({ typ: 'err', text: 'Bitte deinen Namen wählen.' }); return; }
    if (!datei) { setMsg({ typ: 'err', text: 'Bitte ein Foto auswählen.' }); return; }
    setUploading(true);
    const form = new FormData();
    form.append('pilot', pilot);
    form.append('password', password || 'skip');
    form.append('beschreibung', beschreibung);
    form.append('datei', datei);
    try {
      const res = await fetch('/api/galerie', { method: 'POST', body: form });
      const j = await res.json();
      if (res.ok) {
        setMsg({ typ: 'ok', text: 'Foto erfolgreich hochgeladen!' });
        setDatei(null);
        setBeschreibung('');
        const inp = document.getElementById('upload-datei') as HTMLInputElement;
        if (inp) inp.value = '';
        await ladeGalerie();
      } else {
        setMsg({ typ: 'err', text: j.error || 'Fehler beim Hochladen.' });
      }
    } catch {
      setMsg({ typ: 'err', text: 'Verbindungsfehler — bitte nochmal versuchen.' });
    }
    setUploading(false);
  }

  const istPilot = !!pilot;

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
      :root { --green: #5DB84A; --green-soft: #1A2E16; --gold: #E8A030; --ink: #F0EBE0; --mid: #A89880; --ground: #141008; --surface: #1C1610; --border: #3A3020; }
    }
    body { font-family: var(--sans); background: var(--ground); color: var(--ink); min-height: 100vh; }
    .page-nav { background: #2D6B1E; color: #fff; display: flex; align-items: center; gap: 1rem; padding: 0 2rem; height: 56px; }
    .page-nav a { color: rgba(255,255,255,0.8); text-decoration: none; font-size: 0.88rem; }
    .page-nav a:hover { color: #fff; }
    .page-nav .sep { color: rgba(255,255,255,0.3); }
    .page-body { max-width: 1080px; margin: 0 auto; padding: 3rem 1.5rem 5rem; }
    h1 { font-family: var(--serif); font-size: clamp(1.8rem, 4vw, 2.8rem); font-weight: normal; color: var(--ink); margin-bottom: 0.5rem; }
    .eyebrow { font-size: 0.75rem; letter-spacing: 0.14em; text-transform: uppercase; color: var(--gold); font-weight: 600; margin-bottom: 0.5rem; }
    .lead { color: var(--mid); margin-bottom: 2.5rem; }
    .galerie-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.25rem; margin-bottom: 3rem; }
    .galerie-card { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; overflow: hidden; }
    .galerie-card img { width: 100%; aspect-ratio: 4/3; object-fit: cover; display: block; }
    .galerie-info { padding: 0.75rem 1rem; }
    .galerie-beschreibung { font-size: 0.92rem; color: var(--ink); margin-bottom: 0.3rem; line-height: 1.45; }
    .galerie-meta { font-size: 0.75rem; color: var(--mid); }
    .galerie-empty { text-align: center; color: var(--mid); padding: 4rem 2rem; font-size: 0.95rem; grid-column: 1/-1; }
    .upload-section { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 2rem; }
    .upload-section h2 { font-family: var(--serif); font-size: 1.4rem; font-weight: normal; color: var(--ink); margin-bottom: 1.5rem; }
    .upload-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .upload-field { display: flex; flex-direction: column; gap: 0.35rem; }
    .upload-field.full { grid-column: 1/-1; }
    .upload-field label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: var(--green); }
    .upload-field input, .upload-field textarea, .upload-field select { border: 1.5px solid var(--border); border-radius: var(--radius); padding: 0.6rem 0.8rem; font-size: 0.95rem; background: var(--ground); color: var(--ink); font-family: var(--sans); outline: none; width: 100%; }
    .upload-field input:focus, .upload-field textarea:focus { border-color: var(--green); }
    .upload-field textarea { resize: vertical; min-height: 80px; }
    .btn-submit { background: var(--green); color: #fff; border: none; padding: 0.7rem 2rem; border-radius: var(--radius); font-size: 0.95rem; font-weight: 600; cursor: pointer; margin-top: 0.5rem; }
    .btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }
    .upload-msg-ok { background: var(--green-soft); color: var(--green); font-size: 0.85rem; margin-top: 0.75rem; padding: 0.6rem 0.9rem; border-radius: var(--radius); }
    .upload-msg-err { background: #fde8e8; color: #c0392b; font-size: 0.85rem; margin-top: 0.75rem; padding: 0.6rem 0.9rem; border-radius: var(--radius); }
    .divider { border: none; border-top: 1px solid var(--border); margin: 2.5rem 0; }
    @media (max-width: 600px) { .upload-grid { grid-template-columns: 1fr; } .upload-field.full { grid-column: 1; } .page-body { padding: 2rem 1rem 4rem; } }
  `;

  return (
    <>
      <style>{css}</style>
      <nav className="page-nav">
        <a href="/">← Zurück zur Website</a>
        <span className="sep">·</span>
        <span style={{color:'rgba(255,255,255,0.6)',fontSize:'0.88rem'}}>Galerie</span>
      </nav>

      <div className="page-body">
        <div className="eyebrow">Eindrücke</div>
        <h1>Galerie</h1>
        <p className="lead">Fotos von unseren Piloten — echte Augenblicke aus dem Rikscha-Alltag.</p>

        <div className="galerie-grid">
          {galLaden && <div className="galerie-empty">Fotos werden geladen …</div>}
          {!galLaden && fotos.length === 0 && <div className="galerie-empty">Noch keine Fotos vorhanden — ladet das erste Foto hoch!</div>}
          {fotos.map(f => (
            <div key={f.id} className="galerie-card">
              <img src={f.url} alt={f.beschreibung || ''} loading="lazy" />
              <div className="galerie-info">
                {f.beschreibung && <div className="galerie-beschreibung">{f.beschreibung}</div>}
                <div className="galerie-meta">
                  {f.pilot} · {new Date(f.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </div>
              </div>
            </div>
          ))}
        </div>

        {istPilot && (
          <>
            <hr className="divider" />
            <div className="upload-section">
              <h2>📷 Foto hinzufügen</h2>
              <div className="upload-grid">
                <div className="upload-field full">
                  <label>Dein Name</label>
                  <select value={pilot} onChange={e => setPilot(e.target.value)}>
                    {piloten.length > 0
                      ? piloten.map(p => <option key={p.name} value={p.name}>{p.name}</option>)
                      : <option value={pilot}>{pilot}</option>
                    }
                  </select>
                </div>
                <div className="upload-field full">
                  <label>Foto auswählen</label>
                  <input id="upload-datei" type="file" accept="image/*" onChange={e => setDatei(e.target.files?.[0] ?? null)} />
                </div>
                <div className="upload-field full">
                  <label>Bildbeschreibung</label>
                  <textarea value={beschreibung} onChange={e => setBeschreibung(e.target.value)} placeholder="Was ist auf dem Foto zu sehen? Wo wurde es gemacht?" />
                </div>
                <div className="upload-field full">
                  <button className="btn-submit" onClick={hochladen} disabled={uploading}>
                    {uploading ? 'Wird hochgeladen …' : 'Foto hochladen'}
                  </button>
                  {msg && <div className={msg.typ === 'ok' ? 'upload-msg-ok' : 'upload-msg-err'}>{msg.text}</div>}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
