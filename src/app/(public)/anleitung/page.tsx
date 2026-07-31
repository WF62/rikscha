import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Piloten-Anleitung – Mertener Rikschakutscher',
  description: 'Schritt-für-Schritt-Anleitung für Piloten: Kalender, Buchung, Fotos, Ordner und Inhalte bearbeiten.',
};

export default function AnleitungPage() {
  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --green: #2D6B1E; --green-soft: #EBF3E7; --green-mid: #3D8A2A;
          --gold: #C8881A; --gold-soft: #FBF0DC;
          --ink: #1C1208; --mid: #5A4B34;
          --ground: #F5F0E7; --surface: #FDFAF5; --border: #D6CCB8;
          --radius: 6px;
          --serif: Palatino Linotype, Palatino, Book Antiqua, Georgia, serif;
          --sans: system-ui, -apple-system, Segoe UI, sans-serif;
        }
        @media (prefers-color-scheme: dark) {
          :root {
            --green: #5DB84A; --green-soft: #1A2E16;
            --gold: #E8A030; --gold-soft: #2A1E08;
            --ink: #F0EBE0; --mid: #A89880;
            --ground: #141008; --surface: #1C1610; --border: #3A3020;
          }
        }
        :root[data-theme="dark"] {
          --green: #5DB84A; --green-soft: #1A2E16;
          --gold: #E8A030; --gold-soft: #2A1E08;
          --ink: #F0EBE0; --mid: #A89880;
          --ground: #141008; --surface: #1C1610; --border: #3A3020;
        }
        :root[data-theme="light"] {
          --green: #1B4A12; --green-soft: #EBF3E7;
          --gold: #C8881A; --gold-soft: #FBF0DC;
          --ink: #1C1208; --mid: #5A4B34;
          --ground: #F5F0E7; --surface: #FDFAF5; --border: #D6CCB8;
        }
        body { font-family: var(--sans); background: var(--ground); color: var(--ink); font-size: 16px; line-height: 1.7; }
        header { background: #1C4A10; color: #fff; padding: 1rem 1.5rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
        .header-logo { font-family: var(--serif); font-size: 1rem; font-weight: bold; color: #fff; text-decoration: none; }
        .header-back { color: rgba(255,255,255,0.8); text-decoration: none; font-size: 0.88rem; }
        .header-back:hover { color: #fff; }

        .hero-band { background: var(--green); color: #fff; padding: 2.5rem 2rem 2rem; text-align: center; }
        .hero-band .eyebrow { font-size: 0.75rem; letter-spacing: 0.14em; text-transform: uppercase; color: rgba(255,255,255,0.7); margin-bottom: 0.5rem; }
        .hero-band h1 { font-family: var(--serif); font-size: clamp(1.8rem, 4vw, 2.6rem); font-weight: normal; margin-bottom: 0.75rem; }
        .hero-band p { font-size: 1rem; color: rgba(255,255,255,0.88); max-width: 560px; margin: 0 auto; }

        .page { max-width: 820px; margin: 0 auto; padding: 2.5rem 1.5rem 4rem; }

        .toc { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 1.25rem 1.5rem; margin-bottom: 2.5rem; }
        .toc h2 { font-family: var(--serif); font-size: 1.1rem; font-weight: normal; color: var(--ink); margin-bottom: 0.75rem; }
        .toc ol { padding-left: 1.25rem; }
        .toc li { margin-bottom: 0.3rem; }
        .toc a { color: var(--green); text-decoration: none; font-size: 0.95rem; }
        .toc a:hover { text-decoration: underline; }

        .section { margin-bottom: 3rem; scroll-margin-top: 1.5rem; }
        .section-head { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.25rem; padding-bottom: 0.75rem; border-bottom: 2px solid var(--green-soft); }
        .section-icon { font-size: 1.6rem; flex-shrink: 0; }
        .section-head h2 { font-family: var(--serif); font-size: 1.4rem; font-weight: normal; color: var(--ink); }

        .steps { display: flex; flex-direction: column; gap: 1rem; }
        .step { display: flex; gap: 1rem; align-items: flex-start; }
        .step-num { width: 28px; height: 28px; border-radius: 50%; background: var(--green); color: #fff; font-weight: 700; font-size: 0.85rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px; }
        .step-body h3 { font-size: 0.95rem; font-weight: 700; color: var(--ink); margin-bottom: 0.2rem; }
        .step-body p { font-size: 0.9rem; color: var(--mid); margin: 0; }

        .info-box { background: var(--green-soft); border-left: 4px solid var(--green); border-radius: 0 var(--radius) var(--radius) 0; padding: 1rem 1.25rem; margin: 1.25rem 0; font-size: 0.9rem; color: var(--ink); }
        .info-box strong { color: var(--green); }
        .warn-box { background: var(--gold-soft); border-left: 4px solid var(--gold); border-radius: 0 var(--radius) var(--radius) 0; padding: 1rem 1.25rem; margin: 1.25rem 0; font-size: 0.9rem; color: var(--ink); }
        .warn-box strong { color: var(--gold); }

        .pill-row { display: flex; flex-wrap: wrap; gap: 0.5rem; margin: 0.75rem 0; }
        .pill { display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.3rem 0.85rem; border-radius: 999px; font-size: 0.82rem; font-weight: 600; background: var(--green-soft); color: var(--green); border: 1px solid var(--green); }

        .card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1rem; margin-top: 1rem; }
        .card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 1.1rem 1.25rem; }
        .card .card-icon { font-size: 1.4rem; margin-bottom: 0.4rem; display: block; }
        .card h3 { font-size: 0.95rem; font-weight: 700; color: var(--ink); margin-bottom: 0.3rem; }
        .card p { font-size: 0.85rem; color: var(--mid); margin: 0; }

        footer-note { display: block; text-align: center; font-size: 0.82rem; color: var(--mid); margin-top: 3rem; padding-top: 1.5rem; border-top: 1px solid var(--border); }
        @media (max-width: 600px) { .page { padding: 1.5rem 1rem 3rem; } .hero-band { padding: 2rem 1rem 1.75rem; } }
      `}</style>

      <header>
        <a href="/" className="header-logo">🚲 Mertener Rikschakutscher</a>
        <a href="/" className="header-back">← Zurück zur Website</a>
      </header>

      <div className="hero-band">
        <div className="eyebrow">Interne Dokumentation</div>
        <h1>Piloten-Anleitung</h1>
        <p>Alles, was du als Pilot wissen musst — von der ersten Anmeldung bis zum Foto-Upload.</p>
      </div>

      <div className="page">
        <nav className="toc">
          <h2>📋 Inhalt</h2>
          <ol>
            <li><a href="#anmeldung">Anmeldung im Piloten-Bereich</a></li>
            <li><a href="#kalender">Fahrtenkalender</a></li>
            <li><a href="#buchen">Neue Fahrt buchen</a></li>
            <li><a href="#inhalte">Website-Texte bearbeiten</a></li>
            <li><a href="#fotos">Fotos hochladen</a></li>
            <li><a href="#ordner">Mein Ordner (Dokumente)</a></li>
          </ol>
        </nav>

        {/* 1. Anmeldung */}
        <section className="section" id="anmeldung">
          <div className="section-head">
            <span className="section-icon">🔑</span>
            <h2>1. Anmeldung im Piloten-Bereich</h2>
          </div>
          <div className="steps">
            <div className="step">
              <div className="step-num">1</div>
              <div className="step-body">
                <h3>Piloten-Link aufrufen</h3>
                <p>Auf der Website ganz unten auf <strong>„Piloten-Bereich"</strong> klicken (kleiner Link im Footer).</p>
              </div>
            </div>
            <div className="step">
              <div className="step-num">2</div>
              <div className="step-body">
                <h3>Name und Passwort eingeben</h3>
                <p>Deinen Piloten-Namen (Vorname) und dein persönliches Passwort eingeben. Beides erhältst du beim Einrichten deines Accounts vom GFO-Admin.</p>
              </div>
            </div>
            <div className="step">
              <div className="step-num">3</div>
              <div className="step-body">
                <h3>Piloten-Menü öffnet sich</h3>
                <p>Nach erfolgreicher Anmeldung erscheint das Piloten-Menü mit allen verfügbaren Funktionen. Die Anmeldung bleibt im Browser gespeichert.</p>
              </div>
            </div>
          </div>
          <div className="info-box">
            <strong>Tipp:</strong> Falls du dein Passwort vergessen hast oder noch keines hast, wende dich an den GFO-Admin (Walter oder Heribert).
          </div>
        </section>

        {/* 2. Kalender */}
        <section className="section" id="kalender">
          <div className="section-head">
            <span className="section-icon">📅</span>
            <h2>2. Fahrtenkalender</h2>
          </div>
          <p style={{color:'var(--mid)',marginBottom:'1rem'}}>Im Fahrtenkalender siehst du alle gebuchten und geplanten Fahrten des Teams.</p>
          <div className="steps">
            <div className="step">
              <div className="step-num">1</div>
              <div className="step-body">
                <h3>Kalender öffnen</h3>
                <p>Im Piloten-Menü auf <strong>📅 Fahrtenkalender</strong> klicken. Der Kalender öffnet sich in einer neuen Seite.</p>
              </div>
            </div>
            <div className="step">
              <div className="step-num">2</div>
              <div className="step-body">
                <h3>Termine ansehen</h3>
                <p>Alle eingetragenen Fahrten werden nach Monat sortiert angezeigt — mit Datum, Uhrzeit, Ort und eingetragenem Piloten.</p>
              </div>
            </div>
            <div className="step">
              <div className="step-num">3</div>
              <div className="step-body">
                <h3>Eigene Fahrten abmelden</h3>
                <p>Eigene Einträge können direkt im Kalender wieder gelöscht werden.</p>
              </div>
            </div>
          </div>
          <div className="card-grid" style={{marginTop:'1.25rem'}}>
            <div className="card">
              <span className="card-icon">📆</span>
              <h3>Kalender abonnieren</h3>
              <p>Über <strong>iCal herunterladen</strong> lässt sich der Kalender in Outlook, iPhone oder Google Calendar einbinden.</p>
            </div>
            <div className="card">
              <span className="card-icon">🔔</span>
              <h3>Immer aktuell</h3>
              <p>Der Kalender wird in Echtzeit aus der Datenbank geladen — immer auf dem neuesten Stand.</p>
            </div>
          </div>
        </section>

        {/* 3. Buchen */}
        <section className="section" id="buchen">
          <div className="section-head">
            <span className="section-icon">➕</span>
            <h2>3. Neue Fahrt buchen</h2>
          </div>
          <p style={{color:'var(--mid)',marginBottom:'1rem'}}>Als Pilot kannst du neue Fahrten direkt eintragen — für Gäste oder als eigene Tour.</p>
          <div className="steps">
            <div className="step">
              <div className="step-num">1</div>
              <div className="step-body">
                <h3>„Als Pilot buchen" öffnen</h3>
                <p>Im Piloten-Menü auf <strong>➕ Als Pilot buchen</strong> klicken.</p>
              </div>
            </div>
            <div className="step">
              <div className="step-num">2</div>
              <div className="step-body">
                <h3>Formular ausfüllen</h3>
                <p>Datum, Uhrzeit, Ort und Kontaktdaten des Gastes eingeben. Fahrzeug auswählen (Lotte, Flitzer oder Piter).</p>
              </div>
            </div>
            <div className="step">
              <div className="step-num">3</div>
              <div className="step-body">
                <h3>Speichern</h3>
                <p>Nach dem Speichern erscheint die Fahrt sofort im Fahrtenkalender und ist für alle Piloten sichtbar.</p>
              </div>
            </div>
          </div>
          <div className="warn-box">
            <strong>Wichtig:</strong> Bitte nur Fahrten eintragen, die wirklich stattfinden. Falsche Einträge verwirren das Team.
          </div>
        </section>

        {/* 4. Inhalte */}
        <section className="section" id="inhalte">
          <div className="section-head">
            <span className="section-icon">✏️</span>
            <h2>4. Website-Texte bearbeiten</h2>
          </div>
          <p style={{color:'var(--mid)',marginBottom:'1rem'}}>Piloten können Texte auf der Website, dem Flyer und dem Handout vorschlagen. Ein Admin muss die Änderung zuerst freigeben, bevor sie live geht.</p>
          <div className="steps">
            <div className="step">
              <div className="step-num">1</div>
              <div className="step-body">
                <h3>„Inhalte bearbeiten" öffnen</h3>
                <p>Im Piloten-Menü auf <strong>✏️ Inhalte bearbeiten</strong> klicken.</p>
              </div>
            </div>
            <div className="step">
              <div className="step-num">2</div>
              <div className="step-body">
                <h3>Tab auswählen</h3>
                <p>Oben die Kategorie wählen: <strong>Website</strong>, <strong>Flyer</strong>, <strong>Handout</strong> oder <strong>Banner</strong>.</p>
              </div>
            </div>
            <div className="step">
              <div className="step-num">3</div>
              <div className="step-body">
                <h3>Text ändern und einreichen</h3>
                <p>Den gewünschten Text im Feld bearbeiten und auf <strong>„Entwurf einreichen"</strong> klicken.</p>
              </div>
            </div>
            <div className="step">
              <div className="step-num">4</div>
              <div className="step-body">
                <h3>Admin genehmigt den Entwurf</h3>
                <p>Der Admin prüft deinen Vorschlag und gibt ihn frei oder lehnt ihn ab. Du siehst nach der Freigabe die Änderung live auf der Website.</p>
              </div>
            </div>
          </div>
          <div className="info-box">
            <strong>Hinweis:</strong> Fotos (Fahrzeugfotos, Piloten-Fotos, Galerie) können Piloten direkt hochladen — ohne Freigabe.
          </div>
        </section>

        {/* 5. Fotos */}
        <section className="section" id="fotos">
          <div className="section-head">
            <span className="section-icon">🖼️</span>
            <h2>5. Fotos hochladen</h2>
          </div>
          <p style={{color:'var(--mid)',marginBottom:'1rem'}}>Piloten können Fotos für die Galerie, Fahrzeugfotos und ihr eigenes Piloten-Foto hochladen.</p>
          <div className="card-grid">
            <div className="card">
              <span className="card-icon">📸</span>
              <h3>Galerie-Foto einreichen</h3>
              <p>Unter <a href="/galerie/hochladen" style={{color:'var(--green)'}}>galerie/hochladen</a> ein Foto mit Titel einreichen. Es erscheint in der öffentlichen Galerie.</p>
            </div>
            <div className="card">
              <span className="card-icon">🚲</span>
              <h3>Fahrzeug-Foto</h3>
              <p>Im Bearbeiten-Bereich unter <strong>Fotos &amp; Galerie</strong> ein Bild für Lotte, Flitzer oder Piter hochladen.</p>
            </div>
            <div className="card">
              <span className="card-icon">👤</span>
              <h3>Mein Piloten-Foto</h3>
              <p>Eigenes Foto hochladen, das auf der Website im Team-Bereich erscheint.</p>
            </div>
          </div>
          <div className="info-box" style={{marginTop:'1.25rem'}}>
            <strong>Format:</strong> JPG oder PNG, möglichst unter 5 MB. Quadratische Fotos für Piloten-Fotos empfohlen.
          </div>
        </section>

        {/* 6. Ordner */}
        <section className="section" id="ordner">
          <div className="section-head">
            <span className="section-icon">🗂️</span>
            <h2>6. Mein Ordner (Dokumente)</h2>
          </div>
          <p style={{color:'var(--mid)',marginBottom:'1rem'}}>Jeder Pilot hat einen persönlichen Ordner für wichtige Dokumente, auf den nur du und der Admin zugreifen können.</p>
          <div className="steps">
            <div className="step">
              <div className="step-num">1</div>
              <div className="step-body">
                <h3>„Mein Ordner" öffnen</h3>
                <p>Im Piloten-Menü auf <strong>🗂️ Mein Ordner</strong> klicken.</p>
              </div>
            </div>
            <div className="step">
              <div className="step-num">2</div>
              <div className="step-body">
                <h3>Kategorie auswählen</h3>
                <p>Dokumente sind in vier feste Kategorien aufgeteilt:</p>
              </div>
            </div>
          </div>
          <div className="pill-row" style={{marginLeft:'2.5rem'}}>
            <span className="pill">📋 Polizeiliches Führungszeugnis</span>
            <span className="pill">📝 Einweisungsprotokoll</span>
            <span className="pill">🤝 Ehrenamtsvertrag</span>
            <span className="pill">📂 Sonstiges</span>
          </div>
          <div className="steps" style={{marginTop:'1rem'}}>
            <div className="step">
              <div className="step-num">3</div>
              <div className="step-body">
                <h3>Dokument hochladen oder herunterladen</h3>
                <p>Über den Upload-Button Dateien hinzufügen. Vorhandene Dateien können heruntergeladen oder gelöscht werden.</p>
              </div>
            </div>
          </div>
          <div className="info-box">
            <strong>Datenschutz:</strong> Nur du selbst und GFO-Admins können deinen Ordner einsehen. Andere Piloten haben keinen Zugriff.
          </div>
        </section>

        <p style={{textAlign:'center',fontSize:'0.82rem',color:'var(--mid)',marginTop:'3rem',paddingTop:'1.5rem',borderTop:'1px solid var(--border)'}}>
          Bei Fragen: Walter oder Heribert ansprechen · 📞 02227 9328383
        </p>
      </div>
    </>
  );
}
