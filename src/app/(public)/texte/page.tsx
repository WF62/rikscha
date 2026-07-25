import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Texte bearbeiten – Mertener Rikschakutscher',
};

export default function TextePage() {
  return (
    <>
      <style>{`
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
          :root {
            --green: #5DB84A; --green-soft: #1A2E16;
            --ink: #F0EBE0; --mid: #A89880;
            --ground: #141008; --surface: #1C1610; --border: #3A3020;
          }
        }
        body { font-family: var(--sans); background: var(--ground); color: var(--ink); min-height: 100vh; }

        .page-nav { background: #2D6B1E; color: #fff; display: flex; align-items: center; gap: 1rem; padding: 0 2rem; height: 56px; }
        .page-nav a { color: rgba(255,255,255,0.8); text-decoration: none; font-size: 0.88rem; }
        .page-nav a:hover { color: #fff; }
        .page-nav .sep { color: rgba(255,255,255,0.3); }

        .page-body { max-width: 780px; margin: 0 auto; padding: 3rem 1.5rem 5rem; }
        h1 { font-family: var(--serif); font-size: 2rem; font-weight: normal; margin-bottom: 0.4rem; }
        .lead { color: var(--mid); margin-bottom: 2rem; font-size: 0.95rem; }

        /* Login */
        #login-box { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 2rem; max-width: 420px; }
        #login-box h2 { font-family: var(--serif); font-size: 1.3rem; font-weight: normal; margin-bottom: 1.25rem; }
        .field { display: flex; flex-direction: column; gap: 0.35rem; margin-bottom: 0.85rem; }
        .field label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: var(--green); }
        .field input, .field select { border: 1.5px solid var(--border); border-radius: var(--radius); padding: 0.6rem 0.8rem; font-size: 0.95rem; background: var(--ground); color: var(--ink); font-family: var(--sans); outline: none; transition: border-color 0.15s; width: 100%; }
        .field input:focus, .field select:focus { border-color: var(--green); }

        .btn-primary { background: var(--green); color: #fff; border: none; padding: 0.65rem 1.75rem; border-radius: var(--radius); font-size: 0.95rem; font-weight: 600; cursor: pointer; transition: opacity 0.15s; }
        .btn-primary:hover { opacity: 0.85; }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .err-msg { color: #c0392b; font-size: 0.82rem; margin-top: 0.5rem; }

        /* Editor */
        #editor-box { display: none; }
        .editor-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem; }
        .editor-header h2 { font-family: var(--serif); font-size: 1.4rem; font-weight: normal; }
        .btn-abmelden { background: transparent; border: 1.5px solid var(--border); border-radius: var(--radius); padding: 0.4rem 1rem; font-size: 0.82rem; color: var(--mid); cursor: pointer; }

        .text-block { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 1.25rem 1.5rem; margin-bottom: 1rem; }
        .text-block-label { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.09em; color: var(--green); margin-bottom: 0.6rem; }
        .text-block textarea { width: 100%; border: 1.5px solid var(--border); border-radius: var(--radius); padding: 0.65rem 0.8rem; font-size: 0.95rem; font-family: var(--sans); background: var(--ground); color: var(--ink); outline: none; resize: vertical; min-height: 80px; transition: border-color 0.15s; line-height: 1.55; }
        .text-block textarea:focus { border-color: var(--green); }
        .text-block-footer { display: flex; align-items: center; justify-content: space-between; margin-top: 0.6rem; flex-wrap: wrap; gap: 0.5rem; }
        .text-block-meta { font-size: 0.72rem; color: var(--mid); }
        .btn-save { background: var(--green); color: #fff; border: none; padding: 0.4rem 1.1rem; border-radius: var(--radius); font-size: 0.82rem; font-weight: 600; cursor: pointer; transition: opacity 0.15s; }
        .btn-save:hover { opacity: 0.85; }
        .btn-save:disabled { opacity: 0.5; }
        .save-ok { color: var(--green); font-size: 0.78rem; }
        .save-err { color: #c0392b; font-size: 0.78rem; }

        .preview-link { display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.82rem; color: var(--gold); text-decoration: none; border: 1px solid var(--gold); border-radius: var(--radius); padding: 0.35rem 0.8rem; margin-bottom: 1.5rem; }
        .preview-link:hover { background: var(--gold); color: #fff; }

        @media (max-width: 600px) {
          .page-body { padding: 2rem 1rem 4rem; }
        }
      `}</style>

      <nav className="page-nav">
        <a href="/website">← Zur Website</a>
        <span className="sep">·</span>
        <span style={{color:'rgba(255,255,255,0.6)',fontSize:'0.88rem'}}>Texte bearbeiten</span>
      </nav>

      <div className="page-body">
        <h1>Texte bearbeiten</h1>
        <p className="lead">Hier können Piloten die Texte der Website anpassen. Änderungen sind sofort auf der Website sichtbar.</p>

        {/* Login */}
        <div id="login-box">
          <h2>Anmelden</h2>
          <div className="field">
            <label>Dein Name</label>
            <select id="login-pilot"><option value="">— wird geladen … —</option></select>
          </div>
          <div className="field">
            <label>Passwort</label>
            <input type="password" id="login-pw" placeholder="Dein Passwort"/>
          </div>
          <button className="btn-primary" id="login-btn">Anmelden</button>
          <div className="err-msg" id="login-err"></div>
        </div>

        {/* Editor */}
        <div id="editor-box">
          <div className="editor-header">
            <h2>Texte der Website</h2>
            <button className="btn-abmelden" id="abmelden-btn">Abmelden</button>
          </div>
          <a href="/website" target="_blank" className="preview-link">↗ Website in neuem Tab öffnen</a>
          <div id="felder-container"></div>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{__html: `
        var _pilot = null, _pw = null;

        var BEZEICHNUNGEN = {
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

        async function ladeNamen() {
          try {
            var res = await fetch('/api/piloten');
            var daten = await res.json();
            var sel = document.getElementById('login-pilot');
            sel.innerHTML = '<option value="">— Name wählen —</option>';
            daten.forEach(function(p) {
              var opt = document.createElement('option');
              opt.value = p.name;
              opt.textContent = p.name + (p.rolle === 'gfo' ? ' (GFO)' : '');
              sel.appendChild(opt);
            });
          } catch(e) {}
        }

        document.getElementById('login-pw').addEventListener('keydown', function(e) {
          if (e.key === 'Enter') login();
        });

        document.getElementById('login-btn').addEventListener('click', login);

        async function login() {
          var pilot = document.getElementById('login-pilot').value;
          var pw = document.getElementById('login-pw').value;
          var err = document.getElementById('login-err');
          var btn = document.getElementById('login-btn');
          err.textContent = '';
          if (!pilot) { err.textContent = 'Bitte Namen wählen.'; return; }
          if (!pw) { err.textContent = 'Bitte Passwort eingeben.'; return; }
          btn.textContent = '…'; btn.disabled = true;
          try {
            var res = await fetch('/api/pilot-login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ pilot: pilot, password: pw })
            });
            if (!res.ok) {
              var j = await res.json();
              err.textContent = j.error || 'Falscher Name oder Passwort.';
            } else {
              _pilot = pilot; _pw = pw;
              document.getElementById('login-box').style.display = 'none';
              document.getElementById('editor-box').style.display = 'block';
              ladeFelder();
            }
          } catch(e) {
            err.textContent = 'Verbindungsfehler.';
          }
          btn.textContent = 'Anmelden'; btn.disabled = false;
        }

        document.getElementById('abmelden-btn').addEventListener('click', function() {
          _pilot = null; _pw = null;
          document.getElementById('login-box').style.display = 'block';
          document.getElementById('editor-box').style.display = 'none';
          document.getElementById('felder-container').innerHTML = '';
        });

        async function ladeFelder() {
          var container = document.getElementById('felder-container');
          container.innerHTML = '<p style="color:var(--mid)">Wird geladen …</p>';
          try {
            var res = await fetch('/api/inhalte');
            var daten = await res.json();
            container.innerHTML = '';
            daten.forEach(function(item) {
              var bezeichnung = BEZEICHNUNGEN[item.schluessel] || item.bezeichnung || item.schluessel;
              var meta = '';
              if (item.geaendert_von) {
                var d = new Date(item.geaendert_am).toLocaleDateString('de-DE', {day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
                meta = 'Zuletzt von ' + item.geaendert_von + ' am ' + d;
              }
              var block = document.createElement('div');
              block.className = 'text-block';
              block.dataset.schluessel = item.schluessel;
              block.innerHTML =
                '<div class="text-block-label">' + bezeichnung + '</div>'
                + '<textarea rows="4">' + item.wert.replace(/</g,'&lt;') + '</textarea>'
                + '<div class="text-block-footer">'
                + '<span class="text-block-meta">' + meta + '</span>'
                + '<div style="display:flex;align-items:center;gap:0.75rem;">'
                + '<span class="save-status"></span>'
                + '<button class="btn-save">Speichern</button>'
                + '</div></div>';
              block.querySelector('.btn-save').addEventListener('click', function() {
                speichern(block);
              });
              block.querySelector('textarea').addEventListener('keydown', function(e) {
                if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); speichern(block); }
              });
              container.appendChild(block);
            });
          } catch(e) {
            container.innerHTML = '<p style="color:#c0392b">Fehler beim Laden der Texte.</p>';
          }
        }

        async function speichern(block) {
          var schluessel = block.dataset.schluessel;
          var wert = block.querySelector('textarea').value;
          var btn = block.querySelector('.btn-save');
          var status = block.querySelector('.save-status');
          btn.disabled = true; btn.textContent = '…'; status.textContent = '';
          try {
            var res = await fetch('/api/inhalte', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ pilot: _pilot, password: _pw, schluessel: schluessel, wert: wert })
            });
            if (res.ok) {
              status.className = 'save-ok';
              status.textContent = 'Gespeichert ✓';
              var meta = block.querySelector('.text-block-meta');
              var jetzt = new Date().toLocaleDateString('de-DE', {day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
              meta.textContent = 'Zuletzt von ' + _pilot + ' am ' + jetzt;
            } else {
              var j = await res.json();
              status.className = 'save-err';
              status.textContent = j.error || 'Fehler';
            }
          } catch(e) {
            status.className = 'save-err';
            status.textContent = 'Verbindungsfehler';
          }
          btn.disabled = false; btn.textContent = 'Speichern';
          setTimeout(function() { status.textContent = ''; }, 4000);
        }

        ladeNamen();
      `}}/>
    </>
  );
}
