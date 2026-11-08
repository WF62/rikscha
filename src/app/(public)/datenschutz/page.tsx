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
            Gesellschaft der Franziskanerinnen zu Olpe (GFO)<br/>
            Mertener Rikschakutscher<br/>
            <span className="placeholder">Straße Hausnummer</span><br/>
            <span className="placeholder">PLZ</span> Bornheim-Merten<br/>
            E-Mail: <a href="mailto:platzhalter@beispiel.de"><span className="placeholder">email@beispiel.de</span></a>
          </p>
        </div>

        <div className="block">
          <h2>2. Besuch der Website</h2>
          <p>Beim Besuch dieser Website werden automatisch technische Zugriffsdaten gespeichert (Server-Logs): IP-Adresse, Datum und Uhrzeit des Abrufs, aufgerufene Adresse und verwendeter Browser. Diese Daten dienen nur dem sicheren Betrieb der Website und werden nach 7 Tagen gelöscht (Art. 6 Abs. 1 lit. f DSGVO).</p>
        </div>

        <div className="block">
          <h2>3. Schutz vor Missbrauch (Spam-Schutz)</h2>
          <p>Damit Formulare nicht massenhaft missbraucht werden, zählen wir Anfragen pro Gerät (Buchen, Kontakt, Foto-Upload, Abstimmen, Anmeldeversuche). Dafür speichern wir keine IP-Adresse, sondern nur einen daraus berechneten, gekürzten Code, aus dem sich die IP-Adresse nicht zurückrechnen lässt. Diese Einträge werden nach spätestens 2 Tagen gelöscht (Art. 6 Abs. 1 lit. f DSGVO).</p>
        </div>

        <div className="block">
          <h2>4. Kontaktformular und E-Mails</h2>
          <p>Wenn Sie uns über das Kontaktformular schreiben, verarbeiten wir Name, E-Mail-Adresse und Nachricht, um Ihre Anfrage zu beantworten. Die Nachricht wird per E-Mail an unser Team weitergeleitet und nach Abschluss der Kommunikation gelöscht.</p>
          <p>Für den Versand dieser E-Mails und von Buchungs-Benachrichtigungen an unser Team nutzen wir den Dienst Resend (Resend, Inc., USA). Benachrichtigungen über vermittelte Fahrten enthalten keine Namen, Adressen oder Telefonnummern der Fahrgäste.</p>
        </div>

        <div className="block">
          <h2>5. Fahrten buchen</h2>
          <p>Bei einer Buchung speichern wir Datum, Uhrzeit, Fahrzeug, Kutscher, die Namen der Mitfahrenden sowie freiwillige Angaben wie Notiz, Abholort und Wunschfahrt. Diese Daten dienen nur der Organisation der Rikschafahrten.</p>
          <p>Im öffentlich sichtbaren Kalender erscheinen Mitfahrende nur als „Gast“. Namen und Notizen sehen ausschließlich angemeldete Kutscherinnen und Kutscher (Art. 6 Abs. 1 lit. b DSGVO).</p>
        </div>

        <div className="block">
          <h2>6. Vermittelte Fahrten und Gruppenfahrten</h2>
          <p>Einrichtungen und Stellen im Quartier (zum Beispiel das Seniorenheim, das Pfarrzentrum oder das Betreute Wohnen) können Fahrten für ihre Bewohnerinnen, Bewohner und Gäste vermitteln, auch als Gruppenfahrt. Dafür speichern sie nur das Nötigste:</p>
          <p>Name, Wohnbereich oder Adresse, auf Wunsch eine Telefonnummer, ob ein Rollstuhl benötigt wird, sowie einen kurzen Hinweis (zum Beispiel „braucht eine Decke“). Diagnosen oder Geburtsdaten werden nicht gespeichert. Die Angabe zum Rollstuhl dient nur dazu, ein passendes Fahrzeug zu wählen.</p>
          <p><strong>Wer sieht was?</strong> Jede vermittelnde Stelle sieht nur die eigenen Fahrgäste. Adresse und Telefonnummer sieht außerdem nur die Kutscherin oder der Kutscher, die bzw. der die Fahrt übernommen hat, sowie die Verwaltung. Andere Kutscher sehen nur Name, Rollstuhlbedarf und Hinweis. Für Rückfragen sehen angemeldete Kutscher außerdem die dienstlichen Kontaktdaten der vermittelnden Stelle (Ansprechperson, Telefon, E-Mail).</p>
          <p><strong>Wann wird gelöscht?</strong> Telefonnummer und Adresse werden automatisch 12 Monate nach dem letzten Kontakt gelöscht. Jede neue Fahrt oder Änderung beginnt diese Frist neu. Abholorte vergangener Fahrten werden nach derselben Frist gelöscht. Auf Wunsch löscht die vermittelnde Stelle einen Fahrgast jederzeit vollständig; dabei wird der Name auch aus vergangenen Fahrten entfernt.</p>
          <p>Rechtsgrundlage ist die Einwilligung der Fahrgäste bzw. ihrer Vertretung, die die vermittelnde Stelle einholt (Art. 6 Abs. 1 lit. a und, für die Rollstuhl-Angabe, Art. 9 Abs. 2 lit. a DSGVO). Die Einwilligung kann jederzeit widerrufen werden.</p>
        </div>

        <div className="block">
          <h2>7. Bildergalerie und Foto-Wettbewerb</h2>
          <p>Fotos, die Kutscher oder Gäste hochladen, werden in unserem Cloud-Speicher (Supabase) gespeichert. Gäste-Fotos werden erst nach Prüfung veröffentlicht; dabei wird der angegebene Name gezeigt. Durch das Hochladen stimmen Sie der Veröffentlichung zu. Fotos entfernen wir auf Anfrage jederzeit. Beim Abstimmen zählen wir eine Stimme pro Gerät und Tag (siehe Abschnitt 3).</p>
        </div>

        <div className="block">
          <h2>8. Anmeldung für Kutscher und vermittelnde Stellen</h2>
          <p>Für die Anmeldung speichern wir Name und Rolle. Passwörter werden nur verschlüsselt (als nicht umkehrbarer Hash) gespeichert. Nach der Anmeldung legt der Browser einen Anmelde-Schlüssel im lokalen Speicher (localStorage) ab, damit Sie angemeldet bleiben. Er gilt höchstens 90 Tage, wird beim Abmelden entfernt und wird ungültig, sobald das Passwort geändert wird.</p>
        </div>

        <div className="block">
          <h2>9. Tourenkarte</h2>
          <p>Wenn Sie die Tourenkarte öffnen, lädt Ihr Browser Kartenbilder von OpenStreetMap (OpenStreetMap Foundation, Großbritannien), Streckenberechnungen von project-osrm.org und Höhendaten von opentopodata.org. Dabei wird technisch bedingt Ihre IP-Adresse an diese Dienste übertragen. Weitere Daten geben wir nicht weiter (Art. 6 Abs. 1 lit. f DSGVO).</p>
        </div>

        <div className="block">
          <h2>10. Hosting und Datenbank</h2>
          <p>Diese Website wird bei Vercel Inc., 340 Pine Street, Suite 900, San Francisco, CA 94104, USA gehostet. Die Datenbank und der Dateispeicher werden von Supabase bereitgestellt; die Daten liegen in einem Rechenzentrum in der EU (Irland). Beide Dienste verarbeiten Daten in unserem Auftrag auf Grundlage eines Auftragsverarbeitungsvertrags nach Art. 28 DSGVO.</p>
        </div>

        <div className="block">
          <h2>11. Cookies und lokaler Speicher</h2>
          <p>Diese Website verwendet keine Tracking- oder Werbe-Cookies. Für den Verwaltungsbereich wird ein technisch notwendiges Sitzungs-Cookie gesetzt (8 Stunden gültig). Im lokalen Speicher des Browsers liegen nur technisch notwendige Angaben, zum Beispiel der Anmelde-Schlüssel (siehe Abschnitt 8) oder Ihre bereits abgegebenen Stimmen in der Galerie.</p>
        </div>

        <div className="block">
          <h2>12. Ihre Rechte</h2>
          <p>Sie haben das Recht auf Auskunft, Berichtigung, Löschung und Einschränkung der Verarbeitung Ihrer personenbezogenen Daten, auf Datenübertragbarkeit sowie auf Widerspruch und auf Widerruf einer Einwilligung. Wenden Sie sich hierfür an: <a href="mailto:platzhalter@beispiel.de"><span className="placeholder">email@beispiel.de</span></a></p>
          <p>Sie haben außerdem das Recht, sich bei der zuständigen Datenschutzbehörde zu beschweren. In NRW: Landesbeauftragte für Datenschutz und Informationsfreiheit NRW, <a href="https://www.ldi.nrw.de" target="_blank" rel="noopener noreferrer">www.ldi.nrw.de</a>.</p>
        </div>

        <p style={{fontSize:'0.8rem',marginTop:'2rem'}}>Stand: November 2026</p>
      </div>
    </>
  );
}
