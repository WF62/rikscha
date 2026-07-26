'use client';
import { useState, useEffect } from 'react';

const BEZEICHNUNGEN: Record<string, string> = {
  hero_sub:         'Hero – Untertitel',
  gruppenfahrten_1: 'Gruppenfahrten – Absatz 1',
  gruppenfahrten_2: 'Gruppenfahrten – Absatz 2',
  lotte_text:       'Flotte Lotte – Beschreibung',
  flitzer_text:     'Flinker Flitzer – Beschreibung',
  piter_text:       'Jruuse Piter – Beschreibung',
  team_text:        'Team – Beschreibung',
  kontakt_text:     'Kontakt – Beschreibung',
  spenden_text:     'Spenden – Beschreibung',
};

type Feld = { schluessel: string; wert: string; bezeichnung?: string; geaendert_von?: string; geaendert_am?: string };

export default function TextePage() {
  const [pilot, setPilot]       = useState(() => typeof window !== 'undefined' ? localStorage.getItem('pilot_name') ?? '' : '');
  const [password, setPassword] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('pilot_pw') ?? '' : '');
  const [eingeloggt, setEingeloggt] = useState(() => typeof window !== 'undefined' && !!localStorage.getItem('pilot_name'));
  const [piloten, setPiloten]   = useState<{ name: string; rolle: string }[]>([]);
  const [felder, setFelder]     = useState<Feld[]>([]);
  const [fehler, setFehler]     = useState('');
  const [laden, setLaden]       = useState(false);
  const [speicherStatus, setSpeicherStatus] = useState<Record<string, 'ok' | 'err' | ''>>({});

  useEffect(() => {
    if (eingeloggt) {
      ladeFelder();
    } else {
      ladePiloten();
    }
  }, []);

  async function ladePiloten() {
    try {
      const res = await fetch('/api/piloten');
      const daten = await res.json();
      setPiloten(daten);
      if (daten.length > 0) setPilot(daten[0].name);
    } catch {}
  }

  async function ladeFelder() {
    try {
      const res = await fetch('/api/inhalte');
      const daten = await res.json();
      setFelder(daten);
    } catch {}
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
        setFelder(f => f.map(x => x.schluessel === schluessel
          ? { ...x, wert, geaendert_von: pilot, geaendert_am: new Date().toISOString() }
          : x));
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
    .page-nav { background: #2D6B1E; color: #fff; display: flex; align-items: center; gap: 1rem; padding: 0 2rem; height: 56px; }
    .page-nav a { color: rgba(255,255,255,0.8); text-decoration: none; font-size: 0.88rem; }
    .page-nav a:hover { color: #fff; }
    .page-nav .sep { color: rgba(255,255,255,0.3); }
    .page-body { max-width: 780px; margin: 0 auto; padding: 3rem 1.5rem 5rem; }
    h1 { font-family: var(--serif); font-size: 2rem; font-weight: normal; margin-bottom: 0.4rem; }
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
    .editor-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem; }
    .editor-header h2 { font-family: var(--serif); font-size: 1.4rem; font-weight: normal; }
    .btn-abmelden { background: transparent; border: 1.5px solid var(--border); border-radius: var(--radius); padding: 0.4rem 1rem; font-size: 0.82rem; color: var(--mid); cursor: pointer; }
    .text-block { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 1.25rem 1.5rem; margin-bottom: 1rem; }
    .text-block-label { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.09em; color: var(--green); margin-bottom: 0.6rem; }
    .text-block textarea { width: 100%; border: 1.5px solid var(--border); border-radius: var(--radius); padding: 0.65rem 0.8rem; font-size: 0.95rem; font-family: var(--sans); background: var(--ground); color: var(--ink); outline: none; resize: vertical; min-height: 80px; line-height: 1.55; }
    .text-block textarea:focus { border-color: var(--green); }
    .text-block-footer { display: flex; align-items: center; justify-content: space-between; margin-top: 0.6rem; flex-wrap: wrap; gap: 0.5rem; }
    .text-block-meta { font-size: 0.72rem; color: var(--mid); }
    .btn-save { background: var(--green); color: #fff; border: none; padding: 0.4rem 1.1rem; border-radius: var(--radius); font-size: 0.82rem; font-weight: 600; cursor: pointer; }
    .btn-save:disabled { opacity: 0.5; }
    .save-ok { color: var(--green); font-size: 0.78rem; }
    .save-err { color: #c0392b; font-size: 0.78rem; }
    .preview-link { display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.82rem; color: var(--gold); text-decoration: none; border: 1px solid var(--gold); border-radius: var(--radius); padding: 0.35rem 0.8rem; margin-bottom: 1.5rem; }
    .preview-link:hover { background: var(--gold); color: #fff; }
    @media (max-width: 600px) { .page-body { padding: 2rem 1rem 4rem; } }
  `;

  return (
    <>
      <style>{css}</style>
      <nav className="page-nav">
        <a href="/">← Zur Website</a>
        <span className="sep">·</span>
        <span style={{color:'rgba(255,255,255,0.6)',fontSize:'0.88rem'}}>Texte bearbeiten</span>
      </nav>

      <div className="page-body">
        <h1>Texte bearbeiten</h1>
        <p className="lead">Hier können Piloten die Texte der Website anpassen. Änderungen sind sofort auf der Website sichtbar.</p>

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
              <h2>Texte der Website</h2>
              <button className="btn-abmelden" onClick={() => { localStorage.removeItem('pilot_name'); localStorage.removeItem('pilot_pw'); setEingeloggt(false); setFelder([]); }}>
                Abmelden
              </button>
            </div>
            <a href="/" target="_blank" className="preview-link">↗ Website in neuem Tab öffnen</a>
            {felder.length === 0 && <p style={{color:'var(--mid)'}}>Wird geladen …</p>}
            {felder.map(f => {
              const bezeichnung = BEZEICHNUNGEN[f.schluessel] || f.bezeichnung || f.schluessel;
              const meta = f.geaendert_von
                ? `Zuletzt von ${f.geaendert_von} am ${new Date(f.geaendert_am!).toLocaleDateString('de-DE', {day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})}`
                : '';
              const status = speicherStatus[f.schluessel] || '';
              return (
                <div key={f.schluessel} className="text-block">
                  <div className="text-block-label">{bezeichnung}</div>
                  <textarea
                    defaultValue={f.wert}
                    rows={4}
                    onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); speichern(f.schluessel, (e.target as HTMLTextAreaElement).value); } }}
                    id={`ta-${f.schluessel}`}
                  />
                  <div className="text-block-footer">
                    <span className="text-block-meta">{meta}</span>
                    <div style={{display:'flex',alignItems:'center',gap:'0.75rem'}}>
                      {status === 'ok' && <span className="save-ok">Gespeichert ✓</span>}
                      {status === 'err' && <span className="save-err">Fehler</span>}
                      <button className="btn-save" onClick={() => {
                        const ta = document.getElementById(`ta-${f.schluessel}`) as HTMLTextAreaElement;
                        speichern(f.schluessel, ta.value);
                      }}>Speichern</button>
                    </div>
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
