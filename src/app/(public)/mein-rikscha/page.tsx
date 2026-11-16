'use client';
import { useState, useEffect } from 'react';

type PateInfo = { id: string; name: string; fahrzeug_id: string; fahrzeugtyp: string };
type Kosten = { id: string; jahr: number; posten: string; betrag: number; beschreibung?: string };

const POSTEN_LABEL: Record<string, string> = {
  inspektion: 'Jahresinspektion',
  reparatur: 'Reparatur',
  versicherung: 'Versicherung',
  verschleiss: 'Verschleißteile',
  ruecklage: 'Rücklage',
  sonstiges: 'Sonstiges',
};

function fahrzeugLabel(id: string) {
  return id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function formatEuro(n: number) {
  return n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}

export default function MeinRikschaPage() {
  const [pate, setPate] = useState<PateInfo | null>(null);
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [fehler, setFehler] = useState('');
  const [laden, setLaden] = useState(false);
  const [kosten, setKosten] = useState<Kosten[]>([]);
  const [kostenLaden, setKostenLaden] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('pate_session');
      if (saved) setPate(JSON.parse(saved));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!pate) return;
    setKostenLaden(true);
    fetch(`/api/fahrzeug-kosten?fahrzeug_id=${pate.fahrzeug_id}`, {
      headers: { 'x-pate-id': pate.id },
    })
      .then(r => r.json())
      .then(d => { setKosten(Array.isArray(d) ? d : []); setKostenLaden(false); })
      .catch(() => setKostenLaden(false));
  }, [pate]);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setFehler('');
    setLaden(true);
    try {
      const res = await fetch('/api/paten-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pw }),
      });
      const data = await res.json();
      if (!res.ok) { setFehler(data.error ?? 'Fehler beim Login.'); return; }
      setPate(data);
      try { localStorage.setItem('pate_session', JSON.stringify(data)); } catch { /* ignore */ }
    } catch {
      setFehler('Verbindungsfehler. Bitte erneut versuchen.');
    } finally {
      setLaden(false);
    }
  };

  const logout = () => {
    setPate(null);
    setKosten([]);
    try { localStorage.removeItem('pate_session'); } catch { /* ignore */ }
  };

  // Kosten nach Jahr gruppieren
  const jahreMap: Record<number, Kosten[]> = {};
  for (const k of kosten) {
    if (!jahreMap[k.jahr]) jahreMap[k.jahr] = [];
    jahreMap[k.jahr].push(k);
  }
  const jahre = Object.keys(jahreMap).map(Number).sort((a, b) => b - a);

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --green: #2D6B1E; --green-soft: #EBF3E7; --green-mid: #3D8A2A;
          --ink: #1C1208; --mid: #5A4B34; --light: #9A8B74;
          --ground: #F5F0E7; --surface: #FDFAF5; --border: #D6CCB8;
          --radius: 8px;
          --sans: system-ui, -apple-system, Segoe UI, sans-serif;
          --serif: Palatino Linotype, Palatino, Book Antiqua, Georgia, serif;
        }
        @media (prefers-color-scheme: dark) {
          :root:not([data-theme="light"]) {
            --green: #5DB84A; --green-soft: #1A2E16; --green-mid: #4EA83C;
            --ink: #F0EBE0; --mid: #A89880; --light: #7A6B54;
            --ground: #141008; --surface: #1C1610; --border: #3A3020;
          }
        }
        :root[data-theme="dark"] {
          --green: #5DB84A; --green-soft: #1A2E16; --green-mid: #4EA83C;
          --ink: #F0EBE0; --mid: #A89880; --light: #7A6B54;
          --ground: #141008; --surface: #1C1610; --border: #3A3020;
        }
        body { font-family: var(--sans); color: var(--ink); background: var(--ground); min-height: 100vh; }

        .login-wrap { max-width: 380px; margin: 5rem auto; padding: 0 1rem; }
        .login-wrap h1 { font-family: var(--serif); font-size: 1.6rem; color: var(--green); margin-bottom: 0.4rem; }
        .login-wrap .sub { font-size: 0.9rem; color: var(--mid); margin-bottom: 1.5rem; }
        .card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius);
                padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
        label { display: block; font-weight: 600; font-size: 0.85rem; margin-bottom: 0.3rem; }
        input[type=email], input[type=password] {
          width: 100%; border: 1.5px solid var(--border); border-radius: 6px;
          padding: 0.55rem 0.75rem; font-size: 1rem; background: var(--ground); color: var(--ink);
        }
        input:focus { outline: none; border-color: var(--green); }
        .btn { background: var(--green); color: #fff; border: none; border-radius: 6px;
               padding: 0.65rem; font-weight: 700; font-size: 1rem; cursor: pointer; }
        .btn:disabled { opacity: 0.6; }
        .error { color: #DC2626; font-size: 0.85rem; }

        .dash-wrap { max-width: 760px; margin: 0 auto; padding: 2rem max(1rem, 4vw); }
        .dash-header { display: flex; align-items: flex-start; justify-content: space-between;
                       gap: 1rem; margin-bottom: 2rem; flex-wrap: wrap; }
        .dash-header h1 { font-family: var(--serif); font-size: 1.8rem; color: var(--ink); }
        .dash-header .fahrzeug { font-size: 0.85rem; color: var(--mid); margin-top: 0.2rem; }
        .logout-btn { background: none; border: 1px solid var(--border); border-radius: 6px;
                      padding: 0.4rem 0.8rem; font-size: 0.85rem; color: var(--mid); cursor: pointer; }
        .logout-btn:hover { border-color: var(--green); color: var(--green); }

        .jahr-block { margin-bottom: 2rem; }
        .jahr-title { font-family: var(--serif); font-size: 1.15rem; color: var(--ink);
                      padding-bottom: 0.4rem; border-bottom: 2px solid var(--green);
                      margin-bottom: 0.75rem; display: flex; justify-content: space-between; align-items: baseline; }
        .jahr-summe { font-size: 0.95rem; font-weight: 700; color: var(--green); font-variant-numeric: tabular-nums; }

        table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
        td { padding: 0.5rem 0.6rem; border-bottom: 1px solid var(--border); }
        td.betrag { text-align: right; font-variant-numeric: tabular-nums; font-weight: 600; }
        td.beschr { font-size: 0.8rem; color: var(--light); }
        .posten-badge { display: inline-block; background: var(--green-soft); color: var(--green-mid);
                        font-size: 0.75rem; font-weight: 600; padding: 0.1rem 0.4rem;
                        border-radius: 4px; margin-right: 0.4rem; }

        .empty { text-align: center; padding: 3rem 1rem; color: var(--light); font-size: 0.95rem; }
      `}</style>

      {!pate ? (
        <div className="login-wrap">
          <h1>Paten-Portal</h1>
          <p className="sub">Melden Sie sich mit Ihren Zugangsdaten an.</p>
          <form className="card" onSubmit={login}>
            <div>
              <label htmlFor="email">E-Mail-Adresse</label>
              <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
            </div>
            <div>
              <label htmlFor="pw">Passwort</label>
              <input id="pw" type="password" value={pw} onChange={e => setPw(e.target.value)} required />
            </div>
            {fehler && <p className="error">{fehler}</p>}
            <button className="btn" type="submit" disabled={laden}>{laden ? 'Anmelden…' : 'Anmelden'}</button>
          </form>
        </div>
      ) : (
        <div className="dash-wrap">
          <div className="dash-header">
            <div>
              <h1>Hallo, {pate.name}</h1>
              <p className="fahrzeug">
                Ihr Fahrzeug: <strong>{fahrzeugLabel(pate.fahrzeug_id)}</strong>
                {' '}({pate.fahrzeugtyp === 'paralleltandem' ? 'Paralleltandem' : 'Rikscha'})
              </p>
            </div>
            <button className="logout-btn" onClick={logout}>Abmelden</button>
          </div>

          {kostenLaden ? (
            <p className="empty">Lade Daten…</p>
          ) : jahre.length === 0 ? (
            <p className="empty">Noch keine Kostendaten eingetragen. Schauen Sie bald wieder rein.</p>
          ) : (
            jahre.map(jahr => {
              const eintraege = jahreMap[jahr];
              const summe = eintraege.reduce((s, e) => s + Number(e.betrag), 0);
              return (
                <div key={jahr} className="jahr-block">
                  <div className="jahr-title">
                    <span>{jahr}</span>
                    <span className="jahr-summe">{formatEuro(summe)}</span>
                  </div>
                  <table>
                    <tbody>
                      {eintraege.map(e => (
                        <tr key={e.id}>
                          <td>
                            <span className="posten-badge">{POSTEN_LABEL[e.posten] ?? e.posten}</span>
                            {e.beschreibung && <span className="beschr">{e.beschreibung}</span>}
                          </td>
                          <td className="betrag">{formatEuro(Number(e.betrag))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })
          )}
        </div>
      )}
    </>
  );
}
