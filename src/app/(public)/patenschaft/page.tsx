import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Rikscha-Patenschaft – Mertener Rikschakutscher',
  description: 'Werden Sie Pate für eine unserer Rikschas — und sorgen Sie dafür, dass wir auch in Zukunft fahren können.',
};

const FAHRZEUGTYPEN = [
  {
    label: 'Rikscha',
    kaufpreis: 15000,
    ruecklage: 675,
    gesamt: 1425,
  },
  {
    label: 'Paralleltandem',
    kaufpreis: 20000,
    ruecklage: 900,
    gesamt: 1650,
  },
];

const MODELLE = [
  { name: 'Vollpate Rikscha', betrag: '1.425 € / Jahr', desc: 'Trägt eine Rikscha vollständig — Wartung, Versicherung und Zukunftsvorsorge.', highlight: true },
  { name: 'Vollpate Paralleltandem', betrag: '1.650 € / Jahr', desc: 'Trägt ein Paralleltandem vollständig — Wartung, Versicherung und Zukunftsvorsorge.', highlight: true },
  { name: 'Betriebspate', betrag: '750 € / Jahr', desc: 'Übernimmt Inspektion und Versicherung — das Fahrzeug bleibt sicher und zugelassen.', highlight: false },
  { name: 'Zukunftspate', betrag: '675–900 € / Jahr', desc: 'Legt vor — damit das nächste Fahrzeug kommen kann, wenn das heutige in Rente geht.', highlight: false },
  { name: 'Förderer', betrag: 'Frei wählbar', desc: 'Einmaliger Beitrag — herzlich willkommen, in jeder Höhe.', highlight: false },
];

export default function PatenschaftPage() {
  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --green: #2D6B1E; --green-mid: #3D8A2A; --green-soft: #EBF3E7;
          --amber: #C8881A; --amber-soft: #FBF0DC;
          --ink: #1C1208; --mid: #5A4B34; --light: #9A8B74;
          --ground: #F5F0E7; --surface: #FDFAF5; --border: #D6CCB8;
          --radius: 6px;
          --serif: Palatino Linotype, Palatino, Book Antiqua, Georgia, serif;
          --sans: system-ui, -apple-system, Segoe UI, sans-serif;
        }
        @media (prefers-color-scheme: dark) {
          :root:not([data-theme="light"]) {
            --green: #5DB84A; --green-mid: #4EA83C; --green-soft: #1A2E16;
            --amber: #E8A030; --amber-soft: #2A1E08;
            --ink: #F0EBE0; --mid: #A89880; --light: #7A6B54;
            --ground: #141008; --surface: #1C1610; --border: #3A3020;
          }
        }
        :root[data-theme="dark"] {
          --green: #5DB84A; --green-mid: #4EA83C; --green-soft: #1A2E16;
          --amber: #E8A030; --amber-soft: #2A1E08;
          --ink: #F0EBE0; --mid: #A89880; --light: #7A6B54;
          --ground: #141008; --surface: #1C1610; --border: #3A3020;
        }
        body { font-family: var(--sans); color: var(--ink); background: var(--ground); }
        .wrap { max-width: 760px; margin: 0 auto; padding: 2.5rem max(1rem, 4vw); }
        .eyebrow { font-size: 0.75rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--green); margin-bottom: 0.6rem; }
        h1 { font-family: var(--serif); font-size: clamp(1.8rem, 4vw, 2.6rem); line-height: 1.2; color: var(--ink); margin-bottom: 1.2rem; text-wrap: balance; }
        .lead { font-size: 1.05rem; line-height: 1.7; color: var(--mid); max-width: 60ch; margin-bottom: 2.5rem; padding-bottom: 2rem; border-bottom: 1px solid var(--border); }
        h2 { font-family: var(--serif); font-size: 1.3rem; font-style: italic; color: var(--ink); margin-bottom: 0.8rem; }
        p { font-size: 0.95rem; line-height: 1.65; color: var(--mid); margin-bottom: 0.8rem; max-width: 60ch; }
        section { margin-bottom: 2.5rem; }

        .kosten-wrap { overflow-x: auto; margin: 0.75rem 0 0.5rem; }
        table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
        th { text-align: left; font-size: 0.75rem; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase;
             color: var(--light); padding: 0.4rem 0.6rem; border-bottom: 1px solid var(--border); }
        th:not(:first-child) { text-align: right; }
        td { padding: 0.5rem 0.6rem; border-bottom: 1px solid var(--border); font-variant-numeric: tabular-nums; }
        td:not(:first-child) { text-align: right; }
        tr.total td { font-weight: 700; color: var(--green); border-bottom: 2px solid var(--green); }
        .kosten-note { font-size: 0.78rem; color: var(--light); font-style: italic; margin-top: 0.4rem; }

        .ruecklage-box { background: var(--amber-soft); border: 1px solid var(--amber); border-radius: var(--radius);
                         padding: 1rem 1.1rem; margin: 0.75rem 0 1rem; }
        .ruecklage-box p { color: var(--mid); }
        .ruecklage-box strong { color: var(--amber); }

        .modelle { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-top: 0.75rem; }
        @media (max-width: 500px) { .modelle { grid-template-columns: 1fr; } }
        .modell { border: 1.5px solid var(--border); border-radius: var(--radius); padding: 0.9rem 1rem; background: var(--surface); }
        .modell.highlight { border-color: var(--green); background: var(--green-soft); }
        .modell-name { font-weight: 700; font-size: 0.9rem; margin-bottom: 0.2rem; }
        .modell-betrag { font-size: 1.1rem; font-weight: 700; color: var(--green); font-variant-numeric: tabular-nums; margin-bottom: 0.3rem; }
        .modell-desc { font-size: 0.8rem; color: var(--mid); line-height: 1.4; max-width: none; margin: 0; }

        .portal-box { background: var(--green-soft); border-radius: var(--radius); padding: 1.1rem 1.2rem; margin: 0.75rem 0; }
        .portal-box p { color: var(--mid); }

        .kontakt-box { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius);
                       padding: 1.1rem 1.2rem; margin-top: 1rem; }
        .kontakt-box p { color: var(--mid); }

        .back { font-size: 0.85rem; color: var(--mid); margin-bottom: 2rem; }
        .back a { color: var(--green); text-decoration: none; }
        .back a:hover { text-decoration: underline; }
      `}</style>

      <div className="wrap">
        <p className="back"><Link href="/">← Zurück zur Startseite</Link></p>

        <p className="eyebrow">Mitmachen</p>
        <h1>Werden Sie Rikscha-Pate</h1>
        <p className="lead">
          Was vor einigen Jahren mit einer Rikscha begann, ist heute ein kleiner Fuhrpark: Flinker Flitzer,
          Flotte Lotte, Flotte Lotte 2, Hase und Jruuse Piter tragen Seniorinnen und Senioren durch Merten —
          kostenlos, mit viel Herzblut. Wir sind keine Organisation mit Kassenprüfer und Jahreshauptversammlung.
          Wir sind Menschen, die Rikschas pflegen und fahren — und die wissen, dass das auf Dauer Geld kostet.
        </p>

        <section>
          <h2>Was auf uns zukommt</h2>
          <p>Die laufenden Kosten unterscheiden sich je nach Fahrzeugtyp:</p>
          <div className="kosten-wrap">
            <table>
              <thead>
                <tr>
                  <th>Posten</th>
                  {FAHRZEUGTYPEN.map(f => <th key={f.label}>{f.label}</th>)}
                </tr>
              </thead>
              <tbody>
                <tr><td>Jahresinspektion &amp; Wartung</td><td>300 €</td><td>300 €</td></tr>
                <tr><td>Verschleißteile (Reifen, Bremsen, Kette …)</td><td>150 €</td><td>150 €</td></tr>
                <tr><td>Versicherung</td><td>300 €</td><td>300 €</td></tr>
                <tr><td>Rücklage Neuanschaffung (20 Jahre, 10 % Restwert)</td>
                  {FAHRZEUGTYPEN.map(f => <td key={f.label}>{f.ruecklage.toLocaleString('de-DE')} €</td>)}
                </tr>
                <tr className="total">
                  <td>Gesamt pro Fahrzeug / Jahr</td>
                  {FAHRZEUGTYPEN.map(f => <td key={f.label}>{f.gesamt.toLocaleString('de-DE')} €</td>)}
                </tr>
              </tbody>
            </table>
          </div>
          <p className="kosten-note">Alle Beträge sind Richtwerte auf Basis unserer bisherigen Erfahrung.</p>
        </section>

        <section>
          <h2>Warum die Rücklage so wichtig ist</h2>
          <div className="ruecklage-box">
            <p>
              Eine Rikscha kostet ca. <strong>15.000 Euro</strong>, ein Paralleltandem bis zu <strong>20.000 Euro</strong>.
              Wir rechnen mit einer Nutzungsdauer von 20 Jahren und einem Restverkaufswert von rund 10 % —
              das heißt, wir legen jährlich <strong>675 bzw. 900 Euro</strong> beiseite, damit wir das Fahrzeug
              eines Tages ersetzen können. Die Rücklage ist kein Luxus, sondern Planung.
            </p>
          </div>
          <p>
            Eine Patenschaft denkt deshalb nicht nur heute, sondern voraus: für die Seniorinnen und Senioren,
            die in zehn Jahren mitfahren wollen.
          </p>
        </section>

        <section>
          <h2>Wie Sie sich beteiligen können</h2>
          <p>Wir machen es einfach — und flexibel:</p>
          <div className="modelle">
            {MODELLE.map(m => (
              <div key={m.name} className={`modell${m.highlight ? ' highlight' : ''}`}>
                <div className="modell-name">{m.name}</div>
                <div className="modell-betrag">{m.betrag}</div>
                <p className="modell-desc">{m.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2>Ihr persönliches Paten-Portal</h2>
          <div className="portal-box">
            <p>
              Als Pate erhalten Sie einen eigenen Login-Zugang. Dort sehen Sie jederzeit, was mit Ihrem
              Fahrzeug passiert ist: welche Inspektion durchgeführt wurde, welche Reparaturen angefallen sind,
              wie sich die Kosten über die Jahre entwickeln — und wie viel Ihrer Patenschaft bereits in die
              Rücklage geflossen ist.
            </p>
            <p style={{ marginTop: '0.5rem' }}>
              Kein Jahresbericht, der in der Schublade landet. Echte Zahlen, jederzeit abrufbar.{' '}
              <Link href="/mein-rikscha" style={{ color: 'var(--green)', fontWeight: 600 }}>Zum Paten-Login →</Link>
            </p>
          </div>
        </section>

        <section>
          <h2>Melden Sie sich</h2>
          <p>
            Wenn Sie Interesse an einer Patenschaft haben — als Einzelperson, Unternehmen oder einfach als
            jemand, dem diese Rikschas am Herzen liegen — sprechen Sie uns einfach an. Wir erzählen Ihnen gerne mehr.
          </p>
          <div className="kontakt-box">
            <p>
              Für Anfragen zur Patenschaft wenden Sie sich einfach direkt an uns —
              per E-Mail, Telefon oder nach einer Rikscha-Fahrt.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
