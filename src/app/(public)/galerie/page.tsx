'use client';
import { useState, useEffect, useRef } from 'react';

type Foto = { id: string; url: string; beschreibung: string; pilot: string; created_at: string };
type UploadDatei = { datei: File; vorschau: string; beschreibung: string; status: 'warten' | 'laden' | 'ok' | 'err'; meldung?: string };

export default function GaleriePage() {
  const [fotos, setFotos]       = useState<Foto[]>([]);
  const [galLaden, setGalLaden] = useState(true);
  const [pilot]                  = useState(() => typeof window !== 'undefined' ? localStorage.getItem('pilot_name') ?? '' : '');
  const [password]               = useState(() => typeof window !== 'undefined' ? localStorage.getItem('pilot_pw') ?? '' : '');
  const [dateien, setDateien]   = useState<UploadDatei[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { ladeGalerie(); }, []);

  async function ladeGalerie() {
    setGalLaden(true);
    try { const res = await fetch('/api/galerie'); setFotos(await res.json()); } catch {}
    setGalLaden(false);
  }

  function dateiHinzufuegen(files: FileList | null) {
    if (!files) return;
    const neu: UploadDatei[] = Array.from(files)
      .filter(f => f.type.startsWith('image/'))
      .map(f => ({ datei: f, vorschau: URL.createObjectURL(f), beschreibung: '', status: 'warten' }));
    setDateien(d => [...d, ...neu]);
  }

  function entfernen(i: number) {
    setDateien(d => { URL.revokeObjectURL(d[i].vorschau); return d.filter((_, j) => j !== i); });
  }

  function beschreibungSetzen(i: number, text: string) {
    setDateien(d => d.map((x, j) => j === i ? { ...x, beschreibung: text } : x));
  }

  async function hochladen() {
    const offene = dateien.filter(d => d.status === 'warten' || d.status === 'err');
    if (offene.length === 0) return;
    setUploading(true);

    for (let i = 0; i < dateien.length; i++) {
      const d = dateien[i];
      if (d.status !== 'warten' && d.status !== 'err') continue;

      setDateien(prev => prev.map((x, j) => j === i ? { ...x, status: 'laden' } : x));

      const form = new FormData();
      form.append('pilot', pilot);
      form.append('password', password || 'skip');
      form.append('beschreibung', d.beschreibung);
      form.append('datei', d.datei);

      try {
        const res = await fetch('/api/galerie', { method: 'POST', body: form });
        const j = await res.json();
        if (res.ok) {
          setDateien(prev => prev.map((x, k) => k === i ? { ...x, status: 'ok' } : x));
        } else {
          setDateien(prev => prev.map((x, k) => k === i ? { ...x, status: 'err', meldung: j.error || 'Fehler' } : x));
        }
      } catch {
        setDateien(prev => prev.map((x, k) => k === i ? { ...x, status: 'err', meldung: 'Verbindungsfehler' } : x));
      }
    }

    setUploading(false);
    await ladeGalerie();
  }

  function alleErfolgreichEntfernen() {
    setDateien(d => d.filter(x => x.status !== 'ok'));
  }

  const istPilot = !!pilot;
  const anzahlOffen = dateien.filter(d => d.status === 'warten' || d.status === 'err').length;
  const anzahlOk = dateien.filter(d => d.status === 'ok').length;

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
    .upload-section h2 { font-family: var(--serif); font-size: 1.4rem; font-weight: normal; color: var(--ink); margin-bottom: 0.5rem; }
    .drop-zone { border: 2px dashed var(--border); border-radius: 8px; padding: 2.5rem 2rem; text-align: center; cursor: pointer; transition: border-color 0.15s, background 0.15s; margin: 1.25rem 0; }
    .drop-zone:hover, .drop-zone.active { border-color: var(--green); background: var(--green-soft); }
    .drop-zone-icon { font-size: 2.5rem; margin-bottom: 0.5rem; }
    .drop-zone-text { font-size: 0.95rem; color: var(--mid); }
    .drop-zone-hint { font-size: 0.78rem; color: var(--mid); margin-top: 0.35rem; opacity: 0.7; }
    .btn-waehlen { background: var(--green); color: #fff; border: none; padding: 0.55rem 1.4rem; border-radius: var(--radius); font-size: 0.88rem; font-weight: 600; cursor: pointer; margin-top: 0.75rem; }
    .upload-liste { display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1.25rem; }
    .upload-item { display: grid; grid-template-columns: 80px 1fr auto; gap: 0.75rem; align-items: center; background: var(--ground); border: 1px solid var(--border); border-radius: 6px; padding: 0.6rem 0.75rem; }
    .upload-item.status-ok { border-color: #86efac; background: #f0fdf4; }
    .upload-item.status-err { border-color: #fca5a5; background: #fef2f2; }
    .upload-item.status-laden { opacity: 0.7; }
    .upload-thumb { width: 80px; height: 60px; object-fit: cover; border-radius: 4px; display: block; }
    .upload-item-info { display: flex; flex-direction: column; gap: 0.35rem; min-width: 0; }
    .upload-item-name { font-size: 0.8rem; font-weight: 600; color: var(--ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .upload-item-input { border: 1.5px solid var(--border); border-radius: var(--radius); padding: 0.4rem 0.6rem; font-size: 0.82rem; background: var(--surface); color: var(--ink); font-family: var(--sans); outline: none; width: 100%; }
    .upload-item-input:focus { border-color: var(--green); }
    .upload-item-status { font-size: 0.75rem; margin-top: 0.2rem; }
    .upload-item-status.ok { color: #16a34a; }
    .upload-item-status.err { color: #dc2626; }
    .upload-item-status.laden { color: var(--mid); }
    .btn-entfernen { background: none; border: none; cursor: pointer; color: var(--mid); font-size: 1.1rem; padding: 0.2rem; line-height: 1; flex-shrink: 0; }
    .btn-entfernen:hover { color: #dc2626; }
    .upload-actions { display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap; }
    .btn-submit { background: var(--green); color: #fff; border: none; padding: 0.7rem 2rem; border-radius: var(--radius); font-size: 0.95rem; font-weight: 600; cursor: pointer; }
    .btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-clear { background: none; border: 1.5px solid var(--border); color: var(--mid); padding: 0.65rem 1.2rem; border-radius: var(--radius); font-size: 0.88rem; cursor: pointer; }
    .btn-clear:hover { border-color: var(--ink); color: var(--ink); }
    .upload-summary { font-size: 0.85rem; color: var(--mid); }
    .divider { border: none; border-top: 1px solid var(--border); margin: 2.5rem 0; }
    @media (max-width: 600px) {
      .upload-item { grid-template-columns: 60px 1fr auto; }
      .upload-thumb { width: 60px; height: 45px; }
      .page-body { padding: 2rem 1rem 4rem; }
    }
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
              <h2>📷 Fotos hochladen</h2>
              <p style={{fontSize:'0.85rem',color:'var(--mid)'}}>Hochladen als: <strong style={{color:'var(--ink)'}}>{pilot}</strong></p>

              {/* Drop-Zone */}
              <div
                className={`drop-zone${dragOver ? ' active' : ''}`}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); dateiHinzufuegen(e.dataTransfer.files); }}
                onClick={() => inputRef.current?.click()}
              >
                <div className="drop-zone-icon">🖼️</div>
                <div className="drop-zone-text">Fotos hier hineinziehen oder klicken zum Auswählen</div>
                <div className="drop-zone-hint">Mehrere Dateien auf einmal möglich · JPG, PNG, HEIC, WebP</div>
                <button className="btn-waehlen" onClick={e => { e.stopPropagation(); inputRef.current?.click(); }}>
                  Dateien auswählen
                </button>
              </div>
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                multiple
                style={{display:'none'}}
                onChange={e => dateiHinzufuegen(e.target.files)}
              />

              {/* Dateiliste */}
              {dateien.length > 0 && (
                <>
                  <div className="upload-liste">
                    {dateien.map((d, i) => (
                      <div key={i} className={`upload-item status-${d.status}`}>
                        <img src={d.vorschau} alt="" className="upload-thumb" />
                        <div className="upload-item-info">
                          <div className="upload-item-name">{d.datei.name}</div>
                          {d.status !== 'ok' && (
                            <input
                              className="upload-item-input"
                              value={d.beschreibung}
                              onChange={e => beschreibungSetzen(i, e.target.value)}
                              placeholder="Kurze Bildbeschreibung (optional)"
                              disabled={d.status === 'laden'}
                            />
                          )}
                          {d.status === 'ok' && <div className="upload-item-status ok">✓ Hochgeladen</div>}
                          {d.status === 'laden' && <div className="upload-item-status laden">Wird hochgeladen …</div>}
                          {d.status === 'err' && <div className="upload-item-status err">✗ {d.meldung}</div>}
                        </div>
                        <button className="btn-entfernen" onClick={() => entfernen(i)} title="Entfernen">×</button>
                      </div>
                    ))}
                  </div>

                  <div className="upload-actions">
                    <button className="btn-submit" onClick={hochladen} disabled={uploading || anzahlOffen === 0}>
                      {uploading
                        ? 'Wird hochgeladen …'
                        : `${anzahlOffen} Foto${anzahlOffen !== 1 ? 's' : ''} hochladen`}
                    </button>
                    {anzahlOk > 0 && (
                      <button className="btn-clear" onClick={alleErfolgreichEntfernen}>
                        Erledigte entfernen ({anzahlOk})
                      </button>
                    )}
                    <span className="upload-summary">
                      {dateien.length} Datei{dateien.length !== 1 ? 'en' : ''} ausgewählt
                      {anzahlOk > 0 ? ` · ${anzahlOk} fertig` : ''}
                    </span>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
