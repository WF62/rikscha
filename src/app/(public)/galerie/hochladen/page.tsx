'use client';
import { useState, useRef, useEffect } from 'react';

type UploadDatei = { datei: File; vorschau: string; name: string; status: 'warten' | 'laden' | 'ok' | 'err'; meldung?: string };

export default function GasteUploadPage() {
  const [dateien, setDateien] = useState<UploadDatei[]>([]);
  const [uploading, setUploading] = useState(false);
  const [gastName, setGastName] = useState('');
  const kameraRef = useRef<HTMLInputElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  function dateiHinzufuegen(files: FileList | null) {
    if (!files) return;
    const neu: UploadDatei[] = Array.from(files)
      .filter(f => f.type.startsWith('image/'))
      .map(f => ({ datei: f, vorschau: URL.createObjectURL(f), name: '', status: 'warten' }));
    setDateien(d => [...d, ...neu]);
  }

  function nameSetzen(i: number, text: string) {
    setDateien(d => d.map((x, j) => j === i ? { ...x, name: text } : x));
  }

  function entfernen(i: number) {
    setDateien(d => { URL.revokeObjectURL(d[i].vorschau); return d.filter((_, j) => j !== i); });
  }

  async function hochladen() {
    const offene = dateien.filter(d => d.status === 'warten' || d.status === 'err');
    if (!offene.length) return;
    setUploading(true);

    for (let i = 0; i < dateien.length; i++) {
      const d = dateien[i];
      if (d.status !== 'warten' && d.status !== 'err') continue;
      setDateien(prev => prev.map((x, j) => j === i ? { ...x, status: 'laden' } : x));

      const form = new FormData();
      form.append('pilot', gastName.trim() || 'Gast');
      form.append('password', '__gast__');
      form.append('beschreibung', d.name);
      form.append('kategorie', 'Gäste-Wettbewerb');
      form.append('sichtbar', '0');
      form.append('freigegeben', '0');
      form.append('datei', d.datei);

      try {
        const res = await fetch('/api/galerie/gast', { method: 'POST', body: form });
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
  }

  const anzahlOffen = dateien.filter(d => d.status === 'warten' || d.status === 'err').length;
  const alleOk = dateien.length > 0 && dateien.every(d => d.status === 'ok');

  const css = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root { --green:#2D6B1E; --gold:#C8881A; --ink:#1C1208; --mid:#6B5C44; --ground:#F5F0E7; --surface:#FDFAF5; --border:#D6CCB8; --r:6px; --sans:system-ui,-apple-system,sans-serif; --serif:Palatino Linotype,Georgia,serif; }
    @media (prefers-color-scheme:dark) { :root { --green:#5DB84A; --gold:#E8A030; --ink:#F0EBE0; --mid:#A89880; --ground:#141008; --surface:#1C1610; --border:#3A3020; } }
    body { font-family:var(--sans); background:var(--ground); color:var(--ink); min-height:100vh; }
    .hero { background:var(--green); color:#fff; text-align:center; padding:2.5rem 1.5rem 2rem; }
    .hero-eyebrow { font-size:0.72rem; letter-spacing:0.16em; text-transform:uppercase; opacity:0.75; margin-bottom:0.5rem; }
    .hero h1 { font-family:var(--serif); font-size:clamp(1.6rem,5vw,2.4rem); font-weight:normal; margin-bottom:0.5rem; }
    .hero p { font-size:0.95rem; opacity:0.85; max-width:480px; margin:0 auto; }
    .card { background:var(--surface); border:1px solid var(--border); border-radius:var(--r); padding:1.5rem; max-width:560px; margin:2rem auto; }
    .field-label { font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; color:var(--green); margin-bottom:0.4rem; display:block; }
    .field-input { width:100%; border:1.5px solid var(--border); border-radius:var(--r); padding:0.6rem 0.8rem; font-size:0.95rem; background:var(--ground); color:var(--ink); font-family:var(--sans); outline:none; }
    .field-input:focus { border-color:var(--green); }
    .btn-row { display:flex; gap:0.6rem; margin-top:1.25rem; flex-wrap:wrap; }
    .btn-kamera { flex:1; background:var(--green); color:#fff; border:none; padding:0.85rem 1rem; border-radius:var(--r); font-size:1rem; font-weight:700; cursor:pointer; }
    .btn-datei  { flex:1; background:var(--gold); color:#fff; border:none; padding:0.85rem 1rem; border-radius:var(--r); font-size:1rem; font-weight:700; cursor:pointer; }
    .liste { display:flex; flex-direction:column; gap:0.75rem; margin-top:1.25rem; }
    .item { display:grid; grid-template-columns:72px 1fr auto; gap:0.6rem; align-items:start; background:var(--ground); border:1px solid var(--border); border-radius:var(--r); padding:0.6rem; }
    .item.ok { border-color:#86efac; background:#f0fdf4; }
    .item.err { border-color:#fca5a5; background:#fef2f2; }
    .thumb { width:72px; height:54px; object-fit:cover; border-radius:4px; display:block; }
    .item-name { font-size:0.78rem; font-weight:600; color:var(--mid); margin-bottom:0.3rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .item-input { width:100%; border:1.5px solid var(--border); border-radius:4px; padding:0.35rem 0.55rem; font-size:0.82rem; background:var(--surface); color:var(--ink); outline:none; font-family:var(--sans); }
    .item-input:focus { border-color:var(--green); }
    .item-status { font-size:0.75rem; margin-top:0.25rem; }
    .item-status.ok { color:#16a34a; }
    .item-status.err { color:#dc2626; }
    .item-status.laden { color:var(--mid); }
    .btn-x { background:none; border:none; color:var(--mid); font-size:1.2rem; cursor:pointer; padding:0; line-height:1; }
    .btn-x:hover { color:#dc2626; }
    .btn-submit { width:100%; background:var(--green); color:#fff; border:none; padding:0.9rem; border-radius:var(--r); font-size:1rem; font-weight:700; cursor:pointer; margin-top:1.25rem; }
    .btn-submit:disabled { opacity:0.45; cursor:not-allowed; }
    .success-box { text-align:center; padding:2.5rem 1.5rem; }
    .success-icon { font-size:3rem; margin-bottom:0.75rem; }
    .success-title { font-family:var(--serif); font-size:1.5rem; color:var(--green); margin-bottom:0.5rem; }
    .success-text { color:var(--mid); font-size:0.9rem; }
    .page-wrap { padding:0 1rem 4rem; }
  `;

  return (
    <>
      <style>{css}</style>
      <div className="hero">
        <div className="hero-eyebrow">🏆 Foto-Wettbewerb</div>
        <h1>Dein Rikscha-Moment</h1>
        <p>Lade dein schönstes Foto von der Fahrt hoch — die Community stimmt ab!</p>
      </div>

      <div className="page-wrap">
        {alleOk ? (
          <div className="card">
            <div className="success-box">
              <div className="success-icon">🎉</div>
              <div className="success-title">Danke fürs Mitmachen!</div>
              <p className="success-text">Dein Foto wird von uns geprüft und dann in der Galerie veröffentlicht. Drück die Daumen — vielleicht gewinnst du!</p>
            </div>
          </div>
        ) : (
          <div className="card">
            <label className="field-label">Dein Name (optional)</label>
            <input
              className="field-input"
              value={gastName}
              onChange={e => setGastName(e.target.value)}
              placeholder="z. B. Maria oder Anonym"
            />

            <div className="btn-row">
              <button className="btn-kamera" onClick={() => kameraRef.current?.click()}>
                📸 Foto aufnehmen
              </button>
              <button className="btn-datei" onClick={() => inputRef.current?.click()}>
                🖼️ Aus Galerie
              </button>
            </div>

            <input ref={kameraRef} type="file" accept="image/*" capture="environment" style={{display:'none'}} onChange={e => dateiHinzufuegen(e.target.files)} />
            <input ref={inputRef}  type="file" accept="image/*" multiple style={{display:'none'}} onChange={e => dateiHinzufuegen(e.target.files)} />

            {dateien.length > 0 && (
              <>
                <div className="liste">
                  {dateien.map((d, i) => (
                    <div key={i} className={`item ${d.status === 'ok' ? 'ok' : d.status === 'err' ? 'err' : ''}`}>
                      <img src={d.vorschau} alt="" className="thumb" />
                      <div>
                        <div className="item-name">{d.datei.name}</div>
                        {d.status !== 'ok' && (
                          <input
                            className="item-input"
                            value={d.name}
                            onChange={e => nameSetzen(i, e.target.value)}
                            placeholder="Was sieht man? (optional)"
                            disabled={d.status === 'laden'}
                          />
                        )}
                        {d.status === 'ok'    && <div className="item-status ok">✓ Eingereicht — wird geprüft</div>}
                        {d.status === 'laden' && <div className="item-status laden">Wird hochgeladen …</div>}
                        {d.status === 'err'   && <div className="item-status err">✗ {d.meldung}</div>}
                      </div>
                      <button className="btn-x" onClick={() => entfernen(i)}>×</button>
                    </div>
                  ))}
                </div>

                <button className="btn-submit" onClick={hochladen} disabled={uploading || anzahlOffen === 0}>
                  {uploading ? 'Wird hochgeladen …' : `${anzahlOffen} Foto${anzahlOffen !== 1 ? 's' : ''} einreichen`}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
