import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Impressum – Mertener Rikschakutscher',
};

export default function ImpressumPage() {
  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --green: #2D6B1E; --gold: #C8881A;
          --ink: #1C1208; --mid: #6B5C44;
          --ground: #F5F0E7; --surface: #FDFAF5; --border: #D6CCB8;
          --serif: Palatino Linotype, Palatino, Book Antiqua, Georgia, serif;
          --sans: system-ui, -apple-system, Segoe UI, sans-serif;
        }
        @media (prefers-color-scheme: dark) {
          :root {
            --ink: #F0EBE0; --mid: #A89880;
            --ground: #141008; --surface: #1C1610; --border: #3A3020;
          }
        }
        body { font-family: var(--sans); background: var(--ground); color: var(--ink); min-height: 100vh; }
        .page-nav { background: #2D6B1E; color: #fff; display: flex; align-items: center; gap: 1rem; padding: 0 2rem; height: 52px; }
        .page-nav a { color: rgba(255,255,255,0.85); text-decoration: none; font-size: 0.88rem; }
        .page-nav a:hover { color: #fff; }
        .page-nav .sep { color: rgba(255,255,255,0.3); }
        .page-body { max-width: 720px; margin: 0 auto; padding: 3rem 1.5rem 5rem; }
        h1 { font-family: var(--serif); font-size: 2rem; font-weight: normal; color: var(--ink); margin-bottom: 2rem; }
        h2 { font-family: var(--serif); font-size: 1.2rem; font-weight: normal; color: var(--green); margin: 2rem 0 0.5rem; }
        p { color: var(--mid); line-height: 1.7; margin-bottom: 0.5rem; }
        a { color: var(--gold); }
        .block { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 1.5rem 2rem; margin-bottom: 1.5rem; }
        .placeholder { background: #fff3cd; border: 1px dashed #C8881A; border-radius: 4px; padding: 0.2rem 0.5rem; font-style: italic; color: #856404; font-size: 0.9rem; }
      `}</style>

      <nav className="page-nav">
        <a href="/">← Zurück zur Website</a>
        <span className="sep">·</span>
        <span style={{color:'rgba(255,255,255,0.6)',fontSize:'0.88rem'}}>Impressum</span>
      </nav>

      <div className="page-body">
        <h1>Impressum</h1>

        <div className="block">
          <h2>Angaben gemäß § 5 TMG</h2>
          <p>Gesellschaft der Franziskanerinnen zu Olpe (GFO)</p>
          <p>Mertener Rikschakutscher</p>
          <p>
            <span className="placeholder">Straße Hausnummer</span><br/>
            <span className="placeholder">PLZ</span> Bornheim-Merten
          </p>
        </div>

        <div className="block">
          <h2>Kontakt</h2>
          <p>Telefon: <a href="tel:022279328383">02227 9328383</a></p>
          <p>E-Mail: <a href="mailto:platzhalter@beispiel.de"><span className="placeholder">email@beispiel.de</span></a></p>
        </div>

        <div className="block">
          <h2>Verantwortlich für den Inhalt (§ 18 Abs. 2 MStV)</h2>
          <p>Gesellschaft der Franziskanerinnen zu Olpe (GFO)</p>
          <p>
            <span className="placeholder">Straße Hausnummer</span><br/>
            <span className="placeholder">PLZ</span> Bornheim-Merten
          </p>
        </div>

        <div className="block">
          <h2>Haftungsausschluss</h2>
          <p>Die Inhalte dieser Website wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte übernehmen wir jedoch keine Gewähr. Als Diensteanbieter sind wir gemäß § 7 Abs. 1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich.</p>
        </div>
      </div>
    </>
  );
}
