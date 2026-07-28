'use client';
import { useState, useEffect, useRef } from 'react';

type Foto = { id: string; url: string; beschreibung: string; pilot: string; kategorie?: string; created_at: string; sichtbar: boolean; freigegeben: boolean; stimmen: number };
type UploadDatei = { datei: File; vorschau: string; beschreibung: string; sichtbar: boolean; status: 'warten' | 'laden' | 'ok' | 'err'; meldung?: string };

async function komprimieren(datei: File, maxPx = 1920, qualitaet = 0.82): Promise<File> {
  return new Promise(resolve => {
    const img = new Image();
    const url = URL.createObjectURL(datei);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width <= maxPx && height <= maxPx) { resolve(datei); return; }
      const scale = Math.min(maxPx / width, maxPx / height);
      width  = Math.round(width  * scale);
      height = Math.round(height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
      canvas.toBlob(blob => {
        resolve(blob ? new File([blob], datei.name, { type: 'image/jpeg' }) : datei);
      }, 'image/jpeg', qualitaet);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(datei); };
    img.src = url;
  });
}

export default function GaleriePage() {
  const [fotos, setFotos]         = useState<Foto[]>([]);
  const [galLaden, setGalLaden]   = useState(true);
  const [pilot]                    = useState(() => typeof window !== 'undefined' ? localStorage.getItem('pilot_name') ?? '' : '');
  const [password]                 = useState(() => typeof window !== 'undefined' ? localStorage.getItem('pilot_pw') ?? '' : '');
  const [dateien, setDateien]     = useState<UploadDatei[]>([]);
  const [kategorie, setKategorie] = useState('Ausfahrten');
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver]   = useState(false);
  const [filterPilot, setFilterPilot] = useState('');
  const [filterKat, setFilterKat]     = useState('');
  const [filterSaison, setFilterSaison] = useState('');
  const [gestimmt, setGestimmt]       = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set();
    try { return new Set(JSON.parse(localStorage.getItem('gestimmt') ?? '[]')); } catch { return new Set(); }
  });
  const [freigabeQueue, setFreigabeQueue] = useState<Foto[]>([]);
  const inputRef   = useRef<HTMLInputElement>(null);
  const kameraRef  = useRef<HTMLInputElement>(null);
  const ordnerRef  = useRef<HTMLInputElement>(null);

  const istPilot = !!pilot;

  useEffect(() => { ladeGalerie(); }, []);
  useEffect(() => { ladeGalerie(); }, [filterPilot, filterKat]);
  useEffect(() => { if (istPilot) ladeFreigabeQueue(); }, [istPilot]);

  async function ladeFreigabeQueue() {
    const res = await fetch('/api/galerie?nurUnfreigegeben=1&pilot=' + encodeURIComponent(pilot));
    const data = await res.json();
    setFreigabeQueue(Array.isArray(data) ? data.filter((f: Foto) => !f.freigegeben) : []);
  }

  async function freigeben(id: string, ja: boolean) {
    await fetch(`/api/galerie/${id}/freigeben`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pilot, password, freigeben: ja }),
    });
    setFreigabeQueue(q => q.filter(f => f.id !== id));
    if (ja) ladeGalerie();
  }

  async function abstimmen(id: string) {
    if (gestimmt.has(id)) return;
    await fetch(`/api/galerie/${id}/stimme`, { method: 'POST' });
    const neu = new Set(gestimmt).add(id);
    setGestimmt(neu);
    localStorage.setItem('gestimmt', JSON.stringify(Array.from(neu)));
    setFotos(f => f.map(x => x.id === id ? { ...x, stimmen: x.stimmen + 1 } : x));
  }

  async function gastStimme(id: string) {
    await fetch(`/api/galerie/${id}/stimme`, { method: 'POST' });
    setFotos(f => f.map(x => x.id === id ? { ...x, stimmen: x.stimmen + 1 } : x));
  }

  async function ladeGalerie() {
    setGalLaden(true);
    try {
      const params = new URLSearchParams();
      if (filterPilot) params.set('pilot', filterPilot);
      if (filterKat)   params.set('kategorie', filterKat);
      if (!istPilot)   params.set('nurSichtbare', '1');
      const res = await fetch('/api/galerie?' + params.toString());
      const data = await res.json();
      setFotos(Array.isArray(data) ? data : []);
    } catch {}
    setGalLaden(false);
  }

  function dateiHinzufuegen(files: FileList | null) {
    if (!files) return;
    const neu: UploadDatei[] = Array.from(files)
      .filter(f => f.type.startsWith('image/'))
      .map(f => ({ datei: f, vorschau: URL.createObjectURL(f), beschreibung: '', sichtbar: true, status: 'warten' }));
    setDateien(d => [...d, ...neu]);
  }

  function entfernen(i: number) {
    setDateien(d => { URL.revokeObjectURL(d[i].vorschau); return d.filter((_, j) => j !== i); });
  }

  function beschreibungSetzen(i: number, text: string) {
    setDateien(d => d.map((x, j) => j === i ? { ...x, beschreibung: text } : x));
  }

  function sichtbarToggle(i: number) {
    setDateien(d => d.map((x, j) => j === i ? { ...x, sichtbar: !x.sichtbar } : x));
  }

  const aktiveKat = kategorie.trim() || 'Sonstiges';
  const anzahlOffen = dateien.filter(d => d.status === 'warten' || d.status === 'err').length;
  const anzahlOk    = dateien.filter(d => d.status === 'ok').length;
  const allePiloten = Array.from(new Set(fotos.map(f => f.pilot))).sort();
  const alleKats    = Array.from(new Set(fotos.map(f => f.kategorie).filter(Boolean))).sort() as string[];
  const alleSaisons = Array.from(new Set(fotos.map(f => new Date(f.created_at).getFullYear().toString()))).sort((a, b) => b.localeCompare(a));
  const gefilterteFotos = filterSaison ? fotos.filter(f => new Date(f.created_at).getFullYear().toString() === filterSaison) : fotos;

  async function hochladen() {
    const offene = dateien.filter(d => d.status === 'warten' || d.status === 'err');
    if (offene.length === 0) return;
    setUploading(true);

    for (let i = 0; i < dateien.length; i++) {
      const d = dateien[i];
      if (d.status !== 'warten' && d.status !== 'err') continue;
      setDateien(prev => prev.map((x, j) => j === i ? { ...x, status: 'laden' } : x));

      const komprimiert = await komprimieren(d.datei);
      const form = new FormData();
      form.append('pilot', pilot);
      form.append('password', password || 'skip');
      form.append('beschreibung', d.beschreibung);
      form.append('kategorie', aktiveKat);
      form.append('sichtbar', d.sichtbar ? '1' : '0');
      form.append('datei', komprimiert);

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
    .lead { color: var(--mid); margin-bottom: 1.5rem; }
    .filter-bar { display: flex; gap: 0.6rem; flex-wrap: wrap; margin-bottom: 1.5rem; align-items: center; }
    .filter-bar select { border: 1.5px solid var(--border); border-radius: var(--radius); padding: 0.45rem 0.7rem; font-size: 0.85rem; background: var(--surface); color: var(--ink); cursor: pointer; }
    .filter-bar select:focus { outline: none; border-color: var(--green); }
    .filter-reset { background: none; border: none; color: var(--mid); font-size: 0.82rem; cursor: pointer; text-decoration: underline; }
    .filter-reset:hover { color: var(--ink); }
    .filter-label { font-size: 0.78rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: var(--green); }
    .galerie-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.25rem; margin-bottom: 3rem; }
    .galerie-card { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; overflow: hidden; position: relative; display: flex; flex-direction: column; }
    .galerie-card img { width: 100%; aspect-ratio: 4/3; object-fit: cover; display: block; }
    .galerie-info { padding: 0.75rem 1rem 0.5rem; flex: 1; display: flex; flex-direction: column; gap: 0.25rem; }
    .galerie-fotograf { font-size: 0.95rem; font-weight: 700; color: var(--ink); }
    .galerie-titel { font-size: 0.85rem; color: var(--mid); font-style: italic; line-height: 1.4; }
    .galerie-beschreibung { font-size: 0.85rem; color: var(--mid); font-style: italic; line-height: 1.4; }
    .galerie-meta { font-size: 0.72rem; color: var(--mid); display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center; margin-top: 0.15rem; }
    .galerie-kat { background: var(--green-soft); color: var(--green); border-radius: 3px; padding: 0.1rem 0.4rem; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
    .galerie-datum { font-variant-numeric: tabular-nums; }
    .badge-versteckt { position: absolute; top: 0.5rem; right: 0.5rem; background: rgba(0,0,0,0.6); color: #fff; font-size: 0.68rem; font-weight: 700; padding: 0.15rem 0.45rem; border-radius: 3px; }
    .vote-bar { padding: 0.5rem 1rem 0.75rem; display: flex; align-items: center; gap: 0.6rem; border-top: 1px solid var(--border); margin-top: auto; flex-wrap: wrap; }
    .btn-vote { background: none; border: 2px solid var(--border); border-radius: 999px; padding: 0.3rem 0.85rem; font-size: 0.88rem; cursor: pointer; display: flex; align-items: center; gap: 0.35rem; transition: all 0.15s; color: var(--ink); }
    .btn-vote:hover:not(:disabled) { border-color: var(--gold); color: var(--gold); }
    .btn-vote.voted { border-color: var(--gold); background: #fef3c7; color: #92400e; font-weight: 700; cursor: default; }
    .btn-gast-stimme { border-color: var(--green); color: var(--green); font-size: 0.78rem; padding: 0.3rem 0.65rem; }
    .btn-gast-stimme:hover { background: var(--green); color: #fff; }
    .vote-count { font-size: 0.95rem; font-weight: 700; color: var(--gold); margin-left: auto; }
    .galerie-empty { text-align: center; color: var(--mid); padding: 4rem 2rem; font-size: 0.95rem; grid-column: 1/-1; }
    .queue-section { background: #fff8e7; border: 2px solid var(--gold); border-radius: 8px; padding: 1.5rem; margin-bottom: 2rem; }
    .queue-section h2 { font-family: var(--serif); font-size: 1.2rem; color: #92400e; margin-bottom: 1rem; }
    .queue-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1rem; }
    .queue-card { background: var(--surface); border: 1px solid var(--border); border-radius: 6px; overflow: hidden; }
    .queue-card img { width: 100%; aspect-ratio: 4/3; object-fit: cover; display: block; }
    .queue-info { padding: 0.5rem 0.75rem; font-size: 0.8rem; color: var(--mid); }
    .queue-actions { display: flex; gap: 0.5rem; padding: 0.5rem 0.75rem 0.75rem; }
    .btn-freigeben { flex: 1; background: var(--green); color: #fff; border: none; padding: 0.5rem; border-radius: 4px; font-size: 0.82rem; font-weight: 600; cursor: pointer; }
    .btn-ablehnen  { flex: 1; background: #dc2626; color: #fff; border: none; padding: 0.5rem; border-radius: 4px; font-size: 0.82rem; font-weight: 600; cursor: pointer; }
    .wettbewerb-banner { background: linear-gradient(135deg, var(--green) 0%, #1a4a0e 100%); color: #fff; border-radius: 8px; padding: 1.25rem 1.5rem; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
    .wettbewerb-text h3 { font-family: var(--serif); font-size: 1.1rem; margin-bottom: 0.2rem; }
    .wettbewerb-text p { font-size: 0.82rem; opacity: 0.85; }
    .btn-mitmachen { background: var(--gold); color: #fff; border: none; padding: 0.6rem 1.4rem; border-radius: 4px; font-size: 0.88rem; font-weight: 700; cursor: pointer; text-decoration: none; white-space: nowrap; flex-shrink: 0; }
    .upload-section { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 2rem; }
    .upload-section h2 { font-family: var(--serif); font-size: 1.4rem; font-weight: normal; color: var(--ink); margin-bottom: 0.5rem; }
    .kat-row { display: flex; gap: 0.6rem; align-items: center; flex-wrap: wrap; margin: 1rem 0 0; }
    .kat-row label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: var(--green); white-space: nowrap; }
    .kat-row input { border: 1.5px solid var(--border); border-radius: var(--radius); padding: 0.5rem 0.7rem; font-size: 0.9rem; background: var(--ground); color: var(--ink); font-family: var(--sans); outline: none; }
    .kat-row input:focus { border-color: var(--green); }
    .drop-zone { border: 2px dashed var(--border); border-radius: 8px; padding: 2.5rem 2rem; text-align: center; cursor: pointer; transition: border-color 0.15s, background 0.15s; margin: 1.25rem 0; }
    .drop-zone:hover, .drop-zone.active { border-color: var(--green); background: var(--green-soft); }
    .drop-zone-icon { font-size: 2.5rem; margin-bottom: 0.5rem; }
    .drop-zone-text { font-size: 0.95rem; color: var(--mid); }
    .drop-zone-hint { font-size: 0.78rem; color: var(--mid); margin-top: 0.35rem; opacity: 0.7; }
    .btn-row { display: flex; gap: 0.6rem; justify-content: center; flex-wrap: wrap; margin-top: 0.75rem; }
    .btn-waehlen { background: var(--green); color: #fff; border: none; padding: 0.55rem 1.4rem; border-radius: var(--radius); font-size: 0.88rem; font-weight: 600; cursor: pointer; }
    .btn-kamera { background: #1a6fa8; color: #fff; border: none; padding: 0.55rem 1.4rem; border-radius: var(--radius); font-size: 0.88rem; font-weight: 600; cursor: pointer; }
    .btn-waehlen-grau { background: var(--mid); color: #fff; border: none; padding: 0.55rem 1.4rem; border-radius: var(--radius); font-size: 0.88rem; font-weight: 600; cursor: pointer; }
    .upload-liste { display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1.25rem; }
    .upload-item { display: grid; grid-template-columns: 80px 1fr auto; gap: 0.75rem; align-items: start; background: var(--ground); border: 1px solid var(--border); border-radius: 6px; padding: 0.6rem 0.75rem; }
    .upload-item.status-ok { border-color: #86efac; background: #f0fdf4; }
    .upload-item.status-err { border-color: #fca5a5; background: #fef2f2; }
    .upload-item.status-laden { opacity: 0.7; }
    .upload-thumb { width: 80px; height: 60px; object-fit: cover; border-radius: 4px; display: block; }
    .upload-item-info { display: flex; flex-direction: column; gap: 0.35rem; min-width: 0; }
    .upload-item-name { font-size: 0.8rem; font-weight: 600; color: var(--ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .upload-item-input { border: 1.5px solid var(--border); border-radius: var(--radius); padding: 0.4rem 0.6rem; font-size: 0.82rem; background: var(--surface); color: var(--ink); font-family: var(--sans); outline: none; width: 100%; }
    .upload-item-input:focus { border-color: var(--green); }
    .sichtbar-toggle { display: flex; align-items: center; gap: 0.4rem; font-size: 0.78rem; cursor: pointer; user-select: none; margin-top: 0.1rem; }
    .sichtbar-toggle input[type=checkbox] { width: 15px; height: 15px; accent-color: var(--green); cursor: pointer; }
    .sichtbar-toggle.versteckt { color: var(--mid); }
    .sichtbar-toggle.sichtbar { color: var(--green); font-weight: 600; }
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
    .motiv-box { display:flex; gap:1rem; align-items:flex-start; background:var(--surface); border:1.5px solid var(--border); border-left:4px solid var(--gold); border-radius:var(--radius); padding:1rem 1.25rem; margin-bottom:1.25rem; font-size:0.92rem; line-height:1.6; color:var(--ink); }
    .motiv-icon { font-size:2rem; flex-shrink:0; }
    .motiv-box p { margin:0.3rem 0 0; color:var(--mid); }
    .rangliste-section { margin-bottom:2rem; }
    .rangliste-title { font-size:1rem; font-weight:700; color:var(--ink); margin-bottom:0.75rem; display:flex; align-items:center; gap:0.5rem; }
    .rangliste-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:0.75rem; }
    .rang-card { background:var(--surface); border:2px solid var(--border); border-radius:var(--radius); overflow:hidden; position:relative; }
    .rang-card.rang-1 { border-color:#f59e0b; }
    .rang-card.rang-2 { border-color:#94a3b8; }
    .rang-card.rang-3 { border-color:#b45309; }
    .rang-card img { width:100%; aspect-ratio:4/3; object-fit:cover; display:block; }
    .rang-badge { position:absolute; top:0.4rem; left:0.4rem; background:rgba(0,0,0,0.7); color:#fff; border-radius:999px; padding:0.2rem 0.55rem; font-size:0.75rem; font-weight:700; }
    .rang-info { padding:0.5rem 0.6rem; }
    .rang-name { font-size:0.8rem; font-weight:600; color:var(--ink); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .rang-stimmen { font-size:0.75rem; color:var(--gold); font-weight:700; }
    @media (max-width:500px) { .rangliste-grid { grid-template-columns:repeat(2,1fr); } .rang-card:last-child { display:none; } }
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

        {/* Motivationstext Wettbewerb */}
        <div className="motiv-box">
          <div className="motiv-icon">📸</div>
          <div>
            <strong>Warum solltest du mitmachen?</strong>
            <p>Jede Rikscha-Fahrt ist ein einzigartiger Moment — voller Lächeln, Entdeckungen und unvergesslicher Orte. Teile deinen schönsten Augenblick mit unserer Community und lass andere dafür abstimmen. Die <strong>drei Fotos mit den meisten Stimmen</strong> gewinnen: Ihre Fotografinnen und Fotografen werden zu einem <strong>besonderen Exklusiv-Event</strong> eingeladen. Sei dabei!</p>
          </div>
        </div>

        {/* Wettbewerbs-Banner */}
        <div className="wettbewerb-banner">
          <div className="wettbewerb-text">
            <h3>🏆 Foto-Wettbewerb läuft!</h3>
            <p>Lade dein Foto hoch, sammle Stimmen — die Top 3 gewinnen ein Exklusiv-Event.</p>
          </div>
          <a href="/galerie/hochladen" className="btn-mitmachen">Jetzt mitmachen →</a>
        </div>

        {/* Moderations-Queue für Piloten */}
        {istPilot && freigabeQueue.length > 0 && (
          <div className="queue-section">
            <h2>📬 Gäste-Fotos zur Freigabe ({freigabeQueue.length})</h2>
            <div className="queue-grid">
              {freigabeQueue.map(f => (
                <div key={f.id} className="queue-card">
                  <img src={f.url} alt={f.beschreibung || ''} />
                  <div className="queue-info">
                    <strong>{f.pilot}</strong>{f.beschreibung ? ` · ${f.beschreibung}` : ''}
                    <br/>{new Date(f.created_at).toLocaleDateString('de-DE')}
                  </div>
                  <div className="queue-actions">
                    <button className="btn-freigeben" onClick={() => freigeben(f.id, true)}>✓ Freigeben</button>
                    <button className="btn-ablehnen"  onClick={() => freigeben(f.id, false)}>✗ Ablehnen</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filter */}
        {(allePiloten.length > 0 || alleKats.length > 0) && (
          <div className="filter-bar">
            <span className="filter-label">Filtern:</span>
            {allePiloten.length > 1 && (
              <select value={filterPilot} onChange={e => setFilterPilot(e.target.value)}>
                <option value="">Alle Piloten</option>
                {allePiloten.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            )}
            {alleKats.length > 1 && (
              <select value={filterKat} onChange={e => setFilterKat(e.target.value)}>
                <option value="">Alle Kategorien</option>
                {alleKats.map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            )}
            {alleSaisons.length > 1 && (
              <select value={filterSaison} onChange={e => setFilterSaison(e.target.value)}>
                <option value="">Alle Saisons</option>
                {alleSaisons.map(s => <option key={s} value={s}>Saison {s}</option>)}
              </select>
            )}
            {(filterPilot || filterKat || filterSaison) && (
              <button className="filter-reset" onClick={() => { setFilterPilot(''); setFilterKat(''); setFilterSaison(''); }}>
                Filter zurücksetzen
              </button>
            )}
          </div>
        )}

        {/* Top-3-Rangliste */}
        {(() => {
          const top3 = [...fotos].filter(f => f.stimmen > 0).sort((a, b) => b.stimmen - a.stimmen).slice(0, 3);
          if (top3.length === 0) return null;
          const medal = ['🥇', '🥈', '🥉'];
          const cls   = ['rang-1', 'rang-2', 'rang-3'];
          return (
            <div className="rangliste-section">
              <div className="rangliste-title">🏆 Aktuelle Top-3</div>
              <div className="rangliste-grid">
                {top3.map((f, i) => (
                  <div key={f.id} className={`rang-card ${cls[i]}`}>
                    <img src={f.url} alt={f.beschreibung || ''} loading="lazy" />
                    <span className="rang-badge">{medal[i]} Platz {i + 1}</span>
                    <div className="rang-info">
                      <div className="rang-name">📷 {f.pilot}</div>
                      {f.beschreibung && <div style={{fontSize:'0.75rem',color:'var(--mid)',fontStyle:'italic',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>„{f.beschreibung}"</div>}
                      <div className="rang-stimmen">👍 {f.stimmen} Stimme{f.stimmen !== 1 ? 'n' : ''}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Galerie-Grid */}
        <div className="galerie-grid">
          {galLaden && <div className="galerie-empty">Fotos werden geladen …</div>}
          {!galLaden && gefilterteFotos.length === 0 && <div className="galerie-empty">Keine Fotos gefunden.</div>}
          {gefilterteFotos.map(f => (
            <div key={f.id} className="galerie-card">
              <img src={f.url} alt={f.beschreibung || ''} loading="lazy" />
              {istPilot && !f.sichtbar && <span className="badge-versteckt">🔒 Nur Piloten</span>}
              <div className="galerie-info">
                <div className="galerie-fotograf">📷 {f.pilot || 'Unbekannt'}</div>
                {f.beschreibung
                  ? <div className="galerie-titel">„{f.beschreibung}"</div>
                  : null
                }
                <div className="galerie-meta">
                  {f.kategorie && <span className="galerie-kat">{f.kategorie}</span>}
                  <span className="galerie-datum">{new Date(f.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                </div>
              </div>
              <div className="vote-bar">
                <button
                  className={`btn-vote${gestimmt.has(f.id) ? ' voted' : ''}`}
                  onClick={() => abstimmen(f.id)}
                  disabled={gestimmt.has(f.id)}
                >
                  👍 {gestimmt.has(f.id) ? 'Abgestimmt' : 'Gefällt mir'}
                </button>
                {istPilot && (
                  <button
                    className="btn-vote btn-gast-stimme"
                    onClick={() => gastStimme(f.id)}
                    title="Stimme für einen Gast ohne Smartphone eintragen"
                  >
                    +1 Gast
                  </button>
                )}
                <span className="vote-count">👍 {f.stimmen} Stimme{f.stimmen !== 1 ? 'n' : ''}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Upload für Piloten */}
        {istPilot && (
          <>
            <hr className="divider" />
            <div className="upload-section">
              <h2>📷 Fotos hochladen</h2>
              <p style={{fontSize:'0.85rem',color:'var(--mid)'}}>Hochladen als: <strong style={{color:'var(--ink)'}}>{pilot}</strong></p>

              <div className="kat-row">
                <label>Kategorie:</label>
                <input
                  value={kategorie}
                  onChange={e => setKategorie(e.target.value)}
                  placeholder="z. B. Ausfahrten, Geburtstag, Sommer 2025"
                  style={{minWidth: 220}}
                />
              </div>

              <div
                className={`drop-zone${dragOver ? ' active' : ''}`}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); dateiHinzufuegen(e.dataTransfer.files); }}
                onClick={() => inputRef.current?.click()}
              >
                <div className="drop-zone-icon">🖼️</div>
                <div className="drop-zone-text">Fotos hier hineinziehen oder auswählen</div>
                <div className="drop-zone-hint">JPG, PNG, HEIC, WebP · Mehrere Dateien und Ordner möglich</div>
                <div className="btn-row">
                  <button className="btn-kamera" onClick={e => { e.stopPropagation(); kameraRef.current?.click(); }}>
                    📸 Kamera
                  </button>
                  <button className="btn-waehlen" onClick={e => { e.stopPropagation(); inputRef.current?.click(); }}>
                    Dateien auswählen
                  </button>
                  <button className="btn-waehlen-grau" onClick={e => { e.stopPropagation(); ordnerRef.current?.click(); }}>
                    📁 Ordner
                  </button>
                </div>
              </div>

              {/* Versteckte Inputs */}
              <input ref={kameraRef} type="file" accept="image/*" capture="environment" style={{display:'none'}} onChange={e => dateiHinzufuegen(e.target.files)} />
              <input ref={inputRef}  type="file" accept="image/*" multiple style={{display:'none'}} onChange={e => dateiHinzufuegen(e.target.files)} />
              <input
                ref={ordnerRef} type="file" accept="image/*" multiple
                // @ts-expect-error webkitdirectory is non-standard but widely supported
                webkitdirectory=""
                style={{display:'none'}} onChange={e => dateiHinzufuegen(e.target.files)}
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
                          {d.status !== 'ok' && (
                            <label className={`sichtbar-toggle ${d.sichtbar ? 'sichtbar' : 'versteckt'}`}>
                              <input
                                type="checkbox"
                                checked={d.sichtbar}
                                onChange={() => sichtbarToggle(i)}
                                disabled={d.status === 'laden'}
                              />
                              {d.sichtbar ? '🌐 Für Besucher sichtbar' : '🔒 Nur für Piloten'}
                            </label>
                          )}
                          {d.status === 'ok'    && <div className="upload-item-status ok">✓ Hochgeladen in „{aktiveKat}" · {d.sichtbar ? '🌐 Öffentlich' : '🔒 Nur Piloten'}</div>}
                          {d.status === 'laden' && <div className="upload-item-status laden">Wird hochgeladen …</div>}
                          {d.status === 'err'   && <div className="upload-item-status err">✗ {d.meldung}</div>}
                        </div>
                        <button className="btn-entfernen" onClick={() => entfernen(i)} title="Entfernen">×</button>
                      </div>
                    ))}
                  </div>

                  <div className="upload-actions">
                    <button className="btn-submit" onClick={hochladen} disabled={uploading || anzahlOffen === 0}>
                      {uploading
                        ? 'Wird hochgeladen …'
                        : `${anzahlOffen} Foto${anzahlOffen !== 1 ? 's' : ''} → „${aktiveKat}" hochladen`}
                    </button>
                    {anzahlOk > 0 && (
                      <button className="btn-clear" onClick={alleErfolgreichEntfernen}>Erledigte entfernen ({anzahlOk})</button>
                    )}
                    <span className="upload-summary">
                      {dateien.length} Datei{dateien.length !== 1 ? 'en' : ''}
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
