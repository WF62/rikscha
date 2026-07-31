import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'GFO-Admin-Anleitung – Mertener Rikschakutscher',
  description: 'Anleitung für GFO-Admins: Pilotenverwaltung, Entwürfe freigeben, Versionsverlauf, Ordner und Banner.',
};

export default function AnleitungGfoPage() {
  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --green: #2D6B1E; --green-soft: #EBF3E7; --green-mid: #3D8A2A;
          --gold: #C8881A; --gold-soft: #FBF0DC;
          --red: #C0392B; --red-soft: #FDECEA;
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
            --red: #E55A4A; --red-soft: #2D0A08;
            --ink: #F0EBE0; --mid: #A89880;
            --ground: #141008; --surface: #1C1610; --border: #3A3020;
          }
        }
        :root[data-theme="dark"] {
          --green: #5DB84A; --green-soft: #1A2E16;
          --gold: #E8A030; --gold-soft: #2A1E08;
          --red: #E55A4A; --red-soft: #2D0A08;
          --ink: #F0EBE0; --mid: #A89880;
          --ground: #141008; --surface: #1C1610; --border: #3A3020;
        }
        :root[data-theme="light"] {
          --green: #1B4A12; --green-soft: #EBF3E7;
          --gold: #C8881A; --gold-soft: #FBF0DC;
          --red: #C0392B; --red-soft: #FDECEA;
          --ink: #1C1208; --mid: #5A4B34;
          --ground: #F5F0E7; --surface: #FDFAF5; --border: #D6CCB8;
        }
        body { font-family: var(--sans); background: var(--ground); color: var(--ink); font-size: 16px; line-height: 1.7; }
        header { background: #1C4A10; color: #fff; padding: 1rem 1.5rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
        .header-logo { font-family: var(--serif); font-size: 1rem; font-weight: bold; color: #fff; text-decoration: none; }
        .header-back { color: rgba(255,255,255,0.8); text-decoration: none; font-size: 0.88rem; }
        .header-back:hover { color: #fff; }

        .hero-band { background: #1C4A10; color: #fff; padding: 2.5rem 2rem 2rem; text-align: center; }
        .hero-band .eyebrow { font-size: 0.75rem; letter-spacing: 0.14em; text-transform: uppercase; color: var(--gold); margin-bottom: 0.5rem; }
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
        .warn-box strong { color: #7a4e0a; }
        .danger-box { background: var(--red-soft); border-left: 4px solid var(--red); border-radius: 0 var(--radius) var(--radius) 0; padding: 1rem 1.25rem; margin: 1.25rem 0; font-size: 0.9rem; color: var(--ink); }
        .danger-box strong { color: var(--red); }

        .table { width: 100%; border-collapse: collapse; font-size: 0.9rem; margin: 1rem 0; }
        .table th { background: var(--green); color: #fff; padding: 0.5rem 0.75rem; text-align: left; font-weight: 600; }
        .table td { padding: 0.5rem 0.75rem; border-bottom: 1px solid var(--border); color: var(--mid); vertical-align: top; }
        .table tr:last-child td { border-bottom: none; }
        .table tr:nth-child(even) td { background: var(--surface); }

        .badge { display: inline-block; padding: 0.15rem 0.6rem; border-radius: 999px; font-size: 0.78rem; font-weight: 700; }
        .badge-green { background: var(--green-soft); color: var(--green); }
        .badge-gold { background: var(--gold-soft); color: #7a4e0a; }
        .badge-red { background: var(--red-soft); color: var(--red); }

        .card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1rem; margin-top: 1rem; }
        .card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 1.1rem 1.25rem; }
        .card .card-icon { font-size: 1.4rem; margin-bottom: 0.4rem; display: block; }
        .card h3 { font-size: 0.95rem; font-weight: 700; color: var(--ink); margin-bottom: 0.3rem; }
        .card p { font-size: 0.85rem; color: var(--mid); margin: 0; }

        @media (max-width: 600px) { .page { padding: 1.5rem 1rem 3rem; } .hero-band { padding: 2rem 1rem 1.75rem; } .table { font-size: 0.82rem; } }
      `}</style>

      <header>
        <a href="/" className="header-logo">🚲 Mertener Rikschakutscher</a>
        <a href="/admin" className="header-back">← Zur Verwaltung</a>
      </header>

      <div className="hero-band">
        <div className="eyebrow">Nur für Admins · GFO</div>
        <h1>GFO- &amp; Admin-Anleitung</h1>
        <p>Piloten verwalten, Entwürfe freigeben, Versionsverlauf nutzen und Ordner pflegen.</p>
      </div>

      <div className="page">
        <nav className="toc">
          <h2>📋 Inhalt</h2>
          <ol>
            <li><a href="#rollen">Rollen &amp; Zugänge</a></li>
            <li><a href="#pilot-anlegen">Neuen Piloten anlegen</a></li>
            <li><a href="#pilot-deaktivieren">Piloten deaktivieren</a></li>
            <li><a href="#entwuerfe">Entwürfe freigeben oder ablehnen</a></li>
            <li><a href="#verlauf">Versionsverlauf &amp; Rollback</a></li>
            <li><a href="#ordner">Piloten-Ordner verwalten</a></li>
            <li><a href="#banner">Banner verwalten</a></li>
            <li><a href="#direkt">Texte direkt speichern (ohne Freigabe)</a></li>
          </ol>
        </nav>

        {/* 1. Rollen */}
        <section className="section" id="rollen">
          <div className="section-head">
            <span className="section-icon">🛡️</span>
            <h2>1. Rollen &amp; Zugänge</h2>
          </div>
          <p style={{color:'var(--mid)',marginBottom:'1rem'}}>Es gibt drei verschiedene Rollen mit unterschiedlichen Berechtigungen:</p>
          <div style={{overflowX:'auto'}}>
            <table className="table">
              <thead>
                <tr><th>Rolle</th><th>Wer</th><th>Kann</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td><span className="badge badge-green">pilot</span></td>
                  <td>Alle aktiven Piloten</td>
                  <td>Kalender, Buchung, Fotos, eigener Ordner, Textentwürfe einreichen</td>
                </tr>
                <tr>
                  <td><span className="badge badge-gold">gfo</span></td>
                  <td>GFO-Verantwortliche (z. B. Walter, Heribert)</td>
                  <td>Alles wie Pilot + Entwürfe freigeben, Verlauf/Rollback, Piloten-Ordner, Texte direkt speichern</td>
                </tr>
                <tr>
                  <td><span className="badge badge-red">admin</span></td>
                  <td>Technischer Admin (Env-Variable)</td>
                  <td>Alle Rechte wie GFO + Piloten anlegen/deaktivieren</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="info-box">
            <strong>Zweiter GFO-Admin:</strong> Ein zweiter Admin wird als normaler Pilot-Zugang in der Datenbank angelegt — aber mit der Rolle <code>gfo</code> statt <code>pilot</code>. Dazu in der Supabase-Tabelle <code>piloten_zugang</code> den <code>rolle</code>-Wert auf <code>gfo</code> setzen.
          </div>
        </section>

        {/* 2. Pilot anlegen */}
        <section className="section" id="pilot-anlegen">
          <div className="section-head">
            <span className="section-icon">➕</span>
            <h2>2. Neuen Piloten anlegen</h2>
          </div>
          <div className="steps">
            <div className="step">
              <div className="step-num">1</div>
              <div className="step-body">
                <h3>Verwaltungsseite öffnen</h3>
                <p>Im Piloten-Menü auf <strong>⚙️ Verwaltung</strong> klicken und mit Admin-Passwort anmelden.</p>
              </div>
            </div>
            <div className="step">
              <div className="step-num">2</div>
              <div className="step-body">
                <h3>„Neuer Pilot" ausfüllen</h3>
                <p>Name, Passwort und Rolle (<code>pilot</code> oder <code>gfo</code>) eingeben. Das Passwort sollte dem neuen Piloten persönlich mitgeteilt werden.</p>
              </div>
            </div>
            <div className="step">
              <div className="step-num">3</div>
              <div className="step-body">
                <h3>Anlegen bestätigen</h3>
                <p>Der neue Pilot erscheint sofort in der Pilotenliste und kann sich direkt anmelden.</p>
              </div>
            </div>
            <div className="step">
              <div className="step-num">4</div>
              <div className="step-body">
                <h3>Ordner für neuen Piloten vorbereiten (optional)</h3>
                <p>In der Pilotenliste auf <strong>🗂️ Ordner</strong> klicken und erste Dokumente (z. B. Einweisungsprotokoll) hochladen.</p>
              </div>
            </div>
          </div>
          <div className="warn-box">
            <strong>Passwort:</strong> Aktuell kein automatischer E-Mail-Versand. Das Passwort muss dem neuen Piloten persönlich oder telefonisch mitgeteilt werden.
          </div>
        </section>

        {/* 3. Pilot deaktivieren */}
        <section className="section" id="pilot-deaktivieren">
          <div className="section-head">
            <span className="section-icon">🔒</span>
            <h2>3. Piloten deaktivieren</h2>
          </div>
          <div className="steps">
            <div className="step">
              <div className="step-num">1</div>
              <div className="step-body">
                <h3>Verwaltungsseite öffnen</h3>
                <p>In der Pilotenliste den betreffenden Piloten suchen.</p>
              </div>
            </div>
            <div className="step">
              <div className="step-num">2</div>
              <div className="step-body">
                <h3>„Deaktivieren" klicken</h3>
                <p>Der Pilot wird sofort gesperrt und kann sich nicht mehr anmelden. Der Datensatz bleibt erhalten (kein Datenverlust).</p>
              </div>
            </div>
            <div className="step">
              <div className="step-num">3</div>
              <div className="step-body">
                <h3>Reaktivieren bei Bedarf</h3>
                <p>Deaktivierte Piloten können jederzeit wieder aktiviert werden — einfach erneut auf den Schalter klicken.</p>
              </div>
            </div>
          </div>
          <div className="info-box">
            <strong>Ordner bleiben erhalten:</strong> Auch nach Deaktivierung bleiben alle Dateien im Piloten-Ordner gespeichert und sind für Admins weiterhin abrufbar.
          </div>
        </section>

        {/* 4. Entwürfe */}
        <section className="section" id="entwuerfe">
          <div className="section-head">
            <span className="section-icon">📋</span>
            <h2>4. Entwürfe freigeben oder ablehnen</h2>
          </div>
          <p style={{color:'var(--mid)',marginBottom:'1rem'}}>Wenn ein Pilot einen Text ändert, landet dieser als Entwurf in der Warteschlange. Als Admin entscheidest du, ob die Änderung live geht.</p>
          <div className="steps">
            <div className="step">
              <div className="step-num">1</div>
              <div className="step-body">
                <h3>„Inhalte bearbeiten" öffnen</h3>
                <p>Im Piloten-Menü auf <strong>✏️ Inhalte bearbeiten</strong> klicken (als GFO/Admin angemeldet sein).</p>
              </div>
            </div>
            <div className="step">
              <div className="step-num">2</div>
              <div className="step-body">
                <h3>Tab „📋 Entwürfe" öffnen</h3>
                <p>Alle offenen Entwürfe werden mit Feld-Name, neuem Inhalt, Einreicher und Datum angezeigt.</p>
              </div>
            </div>
            <div className="step">
              <div className="step-num">3</div>
              <div className="step-body">
                <h3>Entwurf prüfen</h3>
                <p>Den vorgeschlagenen Text lesen und mit dem aktuellen Inhalt vergleichen.</p>
              </div>
            </div>
            <div className="step">
              <div className="step-num">4</div>
              <div className="step-body">
                <h3>Freigeben oder Ablehnen</h3>
                <p><strong>✅ Freigeben:</strong> Ändert den Text sofort live auf der Website. Der alte Text wird automatisch in den Versionsverlauf gesichert.<br/>
                <strong>❌ Ablehnen:</strong> Optional einen Kommentar (Grund) eingeben. Der Entwurf wird abgelehnt, der bisherige Text bleibt.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Verlauf */}
        <section className="section" id="verlauf">
          <div className="section-head">
            <span className="section-icon">🕐</span>
            <h2>5. Versionsverlauf &amp; Rollback</h2>
          </div>
          <p style={{color:'var(--mid)',marginBottom:'1rem'}}>Jede Textänderung wird automatisch gesichert. Du kannst jeden Text auf eine frühere Version zurücksetzen.</p>
          <div className="steps">
            <div className="step">
              <div className="step-num">1</div>
              <div className="step-body">
                <h3>Tab „🕐 Verlauf" öffnen</h3>
                <p>Im Bearbeiten-Bereich oben den Tab <strong>🕐 Verlauf</strong> auswählen.</p>
              </div>
            </div>
            <div className="step">
              <div className="step-num">2</div>
              <div className="step-body">
                <h3>Feld auswählen</h3>
                <p>Aus der Dropdown-Liste das Textfeld auswählen, dessen Verlauf du sehen möchtest.</p>
              </div>
            </div>
            <div className="step">
              <div className="step-num">3</div>
              <div className="step-body">
                <h3>Versionen ansehen</h3>
                <p>Die letzten 20 Versionen werden mit Datum, Uhrzeit und Bearbeiter angezeigt.</p>
              </div>
            </div>
            <div className="step">
              <div className="step-num">4</div>
              <div className="step-body">
                <h3>Rollback durchführen</h3>
                <p>Auf <strong>„Wiederherstellen"</strong> klicken, um eine alte Version live zu schalten. Der aktuelle Text wird dabei automatisch in den Verlauf gesichert — nichts geht verloren.</p>
              </div>
            </div>
          </div>
          <div className="info-box">
            <strong>Lückenloser Verlauf:</strong> Jeder Rollback wird selbst als Verlaufseintrag gespeichert — du kannst also auch einen Rollback rückgängig machen.
          </div>
        </section>

        {/* 6. Ordner */}
        <section className="section" id="ordner">
          <div className="section-head">
            <span className="section-icon">🗂️</span>
            <h2>6. Piloten-Ordner verwalten</h2>
          </div>
          <p style={{color:'var(--mid)',marginBottom:'1rem'}}>Jeder Pilot hat einen persönlichen Ordner für Pflichtdokumente. Als Admin kannst du Dokumente für alle Piloten hochladen und einsehen.</p>
          <div className="steps">
            <div className="step">
              <div className="step-num">1</div>
              <div className="step-body">
                <h3>Verwaltungsseite öffnen</h3>
                <p>Im Piloten-Menü auf <strong>⚙️ Verwaltung</strong> klicken.</p>
              </div>
            </div>
            <div className="step">
              <div className="step-num">2</div>
              <div className="step-body">
                <h3>„🗂️ Ordner" beim Piloten klicken</h3>
                <p>In der Pilotenliste rechts neben dem Namen auf den Ordner-Button klicken. Ein Panel öffnet sich darunter.</p>
              </div>
            </div>
            <div className="step">
              <div className="step-num">3</div>
              <div className="step-body">
                <h3>Dokument hochladen</h3>
                <p>Kategorie auswählen (<em>Polizeiliches Führungszeugnis, Einweisungsprotokoll, Ehrenamtsvertrag, Sonstiges</em>), Datei auswählen und hochladen.</p>
              </div>
            </div>
            <div className="step">
              <div className="step-num">4</div>
              <div className="step-body">
                <h3>Dokumente einsehen oder löschen</h3>
                <p>Vorhandene Dateien erscheinen im Panel — zum Download anklicken oder mit dem Löschen-Button entfernen.</p>
              </div>
            </div>
          </div>
          <div className="warn-box">
            <strong>Datenschutz:</strong> Piloten sehen nur ihren eigenen Ordner. Admins sehen alle Ordner. Niemals personenbezogene Dokumente öffentlich zugänglich machen.
          </div>
          <p style={{marginTop:'1rem',color:'var(--mid)',fontSize:'0.9rem'}}>Alternativ kann jeder Pilot auch seinen eigenen Ordner über das Piloten-Menü → <strong>🗂️ Mein Ordner</strong> einsehen und selbst Dateien hochladen.</p>
        </section>

        {/* 7. Banner */}
        <section className="section" id="banner">
          <div className="section-head">
            <span className="section-icon">📢</span>
            <h2>7. Banner verwalten</h2>
          </div>
          <p style={{color:'var(--mid)',marginBottom:'1rem'}}>Der Banner erscheint prominent oben auf der Website — ideal für aktuelle Hinweise, Veranstaltungen oder Aufrufe.</p>
          <div className="steps">
            <div className="step">
              <div className="step-num">1</div>
              <div className="step-body">
                <h3>Bearbeiten-Bereich öffnen</h3>
                <p>Im Piloten-Menü auf <strong>✏️ Inhalte bearbeiten</strong> klicken, dann Tab <strong>📢 Banner</strong> auswählen.</p>
              </div>
            </div>
            <div className="step">
              <div className="step-num">2</div>
              <div className="step-body">
                <h3>Banner-Text und Link eingeben</h3>
                <p>Text für die Banner-Nachricht eingeben (z. B. „Ausflug am 15. Juli — jetzt anmelden!"). Optional: Link-URL und Link-Text hinzufügen.</p>
              </div>
            </div>
            <div className="step">
              <div className="step-num">3</div>
              <div className="step-body">
                <h3>Speichern</h3>
                <p>Als Admin wird der Banner sofort live geschaltet. Piloten müssten einen Entwurf einreichen.</p>
              </div>
            </div>
            <div className="step">
              <div className="step-num">4</div>
              <div className="step-body">
                <h3>Banner ausblenden</h3>
                <p>Banner-Text leeren und speichern — der Banner verschwindet komplett von der Website.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 8. Direkt speichern */}
        <section className="section" id="direkt">
          <div className="section-head">
            <span className="section-icon">⚡</span>
            <h2>8. Texte direkt speichern (ohne Freigabe)</h2>
          </div>
          <p style={{color:'var(--mid)',marginBottom:'1rem'}}>Als GFO-Admin kannst du Texte sofort live schalten — kein Entwurfs-Prozess nötig.</p>
          <div className="steps">
            <div className="step">
              <div className="step-num">1</div>
              <div className="step-body">
                <h3>Als GFO/Admin angemeldet sein</h3>
                <p>Das System erkennt deine Rolle automatisch anhand deines Passworts. Als Admin erscheint der Button <strong>„Speichern"</strong> statt „Entwurf einreichen".</p>
              </div>
            </div>
            <div className="step">
              <div className="step-num">2</div>
              <div className="step-body">
                <h3>Text bearbeiten und speichern</h3>
                <p>Feld auswählen, Text ändern, auf <strong>„Speichern"</strong> klicken. Der alte Text wird automatisch in den Versionsverlauf gesichert.</p>
              </div>
            </div>
          </div>
          <div className="danger-box">
            <strong>Vorsicht:</strong> Direkt gespeicherte Texte gehen sofort live auf der öffentlichen Website. Bitte vor dem Speichern auf Rechtschreibung und Inhalt prüfen. Bei Fehlern: Versionsverlauf → Rollback.
          </div>
        </section>

        <p style={{textAlign:'center',fontSize:'0.82rem',color:'var(--mid)',marginTop:'3rem',paddingTop:'1.5rem',borderTop:'1px solid var(--border)'}}>
          Technische Fragen: walter.fischbach.wf@googlemail.com
        </p>
      </div>
    </>
  );
}
