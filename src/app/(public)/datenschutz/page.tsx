import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Datenschutz – Mertener Rikschakutscher',
};

export default function DatenschutzPage() {
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
        p { color: var(--mid); line-height: 1.7; margin-bottom: 0.75rem; }
        a { color: var(--gold); }
        .block { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 1.5rem 2rem; margin-bottom: 1.5rem; }
        .placeholder { background: #fff3cd; border: 1px dashed #C8881A; border-radius: 4px; padding: 0.2rem 0.5rem; font-style: italic; color: #856404; font-size: 0.9rem; }
      `}</style>

      <nav className="page-nav">
        <a href="/">← Zurück zur Website</a>
        <span className="sep">·</span>
        <span style={{color:'rgba(255,255,255,0.6)',fontSize:'0.88rem'}}>Datenschutzerklärung</span>
      </nav>

      <div className="page-body">
        <h1>Datenschutzerklärung</h1>

        <div className="block">
          <h2>1. Verantwortliche Stelle</h2>
          <p>Verantwortlich für die Datenverarbeitung auf dieser Website:</p>
          <p>
            <span className="placeholder">Vorname Nachname</span><br/>
            Mertener Rikschakutscher<br/>
            <span className="placeholder">Straße Hausnummer</span><br/>
            <span className="placeholder">PLZ</span> Bornheim-Merten<br/>
            E-Mail: <a href="mailto:platzhalter@beispiel.de"><span className="placeholder">email@beispiel.de</span></a>
          </p>
        </div>

        <div className="block">
          <h2>2. Erhebung und Speicherung personenbezogener Daten</h2>
          <p>Beim Besuch dieser Website werden automatisch technische Zugriffsdaten gespeichert (Server-Logs). Diese enthalten IP-Adresse, Datum und Uhrzeit des Abrufs, aufgerufene URL sowie den verwendeten Browser. Diese Daten werden ausschließlich zur Sicherstellung des Betriebs der Website verwendet und nach 7 Tagen gelöscht.</p>
        </div>

        <div className="block">
          <h2>3. Kontaktformular</h2>
          <p>Wenn Sie uns über das Kontaktformular eine Nachricht senden, werden Ihre Angaben (Name, E-Mail-Adresse, Nachricht) zur Bearbeitung Ihrer Anfrage gespeichert. Diese Daten werden nicht an Dritte weitergegeben und nach Abschluss der Kommunikation gelöscht.</p>
        </div>

        <div className="block">
          <h2>4. Bildergalerie</h2>
          <p>Fotos, die von Piloten über die Galerie-Funktion hochgeladen werden, werden in unserem Cloud-Speicher (Supabase) gespeichert und öffentlich angezeigt. Durch das Hochladen stimmen Sie der Veröffentlichung zu. Fotos können auf Anfrage jederzeit entfernt werden.</p>
        </div>

        <div className="block">
          <h2>5. Fahrtenbuchungen</h2>
          <p>Bei Buchungen über das System werden Name, Datum und Fahrtdetails gespeichert. Diese Daten dienen ausschließlich der Koordination der Rikschafahrten und werden nicht an Dritte weitergegeben.</p>
        </div>

        <div className="block">
          <h2>6. Hosting</h2>
          <p>Diese Website wird bei Vercel Inc., 340 Pine Street, Suite 900, San Francisco, CA 94104, USA gehostet. Datenbankdienste werden über Supabase bereitgestellt. Beide Dienste verarbeiten Daten auf Basis eines Auftragsverarbeitungsvertrags gemäß Art. 28 DSGVO.</p>
        </div>

        <div className="block">
          <h2>7. Cookies</h2>
          <p>Diese Website verwendet keine Tracking-Cookies. Es werden lediglich technisch notwendige Session-Informationen im Arbeitsspeicher des Browsers gespeichert (sessionStorage), die beim Schließen des Tabs automatisch gelöscht werden.</p>
        </div>

        <div className="block">
          <h2>8. Ihre Rechte</h2>
          <p>Sie haben das Recht auf Auskunft, Berichtigung, Löschung und Einschränkung der Verarbeitung Ihrer personenbezogenen Daten sowie das Recht auf Datenübertragbarkeit. Wenden Sie sich hierfür an: <a href="mailto:platzhalter@beispiel.de"><span className="placeholder">email@beispiel.de</span></a></p>
          <p>Sie haben außerdem das Recht, sich bei der zuständigen Datenschutzbehörde zu beschweren. In NRW: Landesbeauftragte für Datenschutz und Informationsfreiheit NRW, <a href="https://www.ldi.nrw.de" target="_blank">www.ldi.nrw.de</a>.</p>
        </div>

        <p style={{fontSize:'0.8rem',marginTop:'2rem'}}>Stand: Juli 2025</p>
      </div>
    </>
  );
}
