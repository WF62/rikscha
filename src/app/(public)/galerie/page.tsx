import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Galerie – Mertener Rikschakutscher',
  description: 'Fotos von unseren Rikschafahrten durch Bornheim-Merten.',
};

export default function GaleriePage() {
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
            --gold: #E8A030;
            --ink: #F0EBE0; --mid: #A89880;
            --ground: #141008; --surface: #1C1610; --border: #3A3020;
          }
        }
        body { font-family: var(--sans); background: var(--ground); color: var(--ink); min-height: 100vh; }

        .page-nav {
          background: #2D6B1E; color: #fff;
          display: flex; align-items: center; gap: 1rem;
          padding: 0 2rem; height: 56px;
        }
        .page-nav a { color: rgba(255,255,255,0.8); text-decoration: none; font-size: 0.88rem; }
        .page-nav a:hover { color: #fff; }
        .page-nav .sep { color: rgba(255,255,255,0.3); }
        .page-nav .title { font-family: var(--serif); font-size: 1.05rem; color: #fff; text-decoration: none; }

        .page-body { max-width: 1080px; margin: 0 auto; padding: 3rem 1.5rem 5rem; }

        h1 { font-family: var(--serif); font-size: clamp(1.8rem, 4vw, 2.8rem); font-weight: normal; color: var(--ink); margin-bottom: 0.5rem; }
        .eyebrow { font-size: 0.75rem; letter-spacing: 0.14em; text-transform: uppercase; color: var(--gold); font-weight: 600; margin-bottom: 0.5rem; }
        .lead { color: var(--mid); margin-bottom: 2.5rem; }

        /* Grid */
        .galerie-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.25rem; margin-bottom: 3rem; }
        .galerie-card { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; overflow: hidden; }
        .galerie-card img { width: 100%; aspect-ratio: 4/3; object-fit: cover; display: block; }
        .galerie-info { padding: 0.75rem 1rem; }
        .galerie-beschreibung { font-size: 0.92rem; color: var(--ink); margin-bottom: 0.3rem; line-height: 1.45; }
        .galerie-meta { font-size: 0.75rem; color: var(--mid); }
        .galerie-empty { text-align: center; color: var(--mid); padding: 4rem 2rem; font-size: 0.95rem; grid-column: 1/-1; }

        /* Upload-Formular */
        .upload-section { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 2rem; }
        .upload-section h2 { font-family: var(--serif); font-size: 1.4rem; font-weight: normal; color: var(--ink); margin-bottom: 1.5rem; }
        .upload-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .upload-field { display: flex; flex-direction: column; gap: 0.35rem; }
        .upload-field.full { grid-column: 1/-1; }
        .upload-field label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: var(--green); }
        .upload-field input, .upload-field textarea, .upload-field select {
          border: 1.5px solid var(--border); border-radius: var(--radius);
          padding: 0.6rem 0.8rem; font-size: 0.95rem;
          background: var(--ground); color: var(--ink);
          font-family: var(--sans); outline: none;
          transition: border-color 0.15s; width: 100%;
        }
        .upload-field input:focus, .upload-field textarea:focus { border-color: var(--green); }
        .upload-field textarea { resize: vertical; min-height: 80px; }
        .upload-field input[type="password"] { letter-spacing: 0.1em; }

        .btn-submit { background: var(--green); color: #fff; border: none; padding: 0.7rem 2rem; border-radius: var(--radius); font-size: 0.95rem; font-weight: 600; cursor: pointer; transition: opacity 0.15s; margin-top: 0.5rem; }
        .btn-submit:hover { opacity: 0.85; }
        .btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }
        .upload-msg { font-size: 0.85rem; margin-top: 0.75rem; padding: 0.6rem 0.9rem; border-radius: var(--radius); display: none; }
        .upload-msg.ok { background: var(--green-soft); color: var(--green); display: block; }
        .upload-msg.err { background: #fde8e8; color: #c0392b; display: block; }

        .divider { border: none; border-top: 1px solid var(--border); margin: 2.5rem 0; }

        @media (max-width: 600px) {
          .upload-grid { grid-template-columns: 1fr; }
          .upload-field.full { grid-column: 1; }
          .page-body { padding: 2rem 1rem 4rem; }
        }
      `}</style>

      <nav className="page-nav">
        <a href="/website">← Zurück zur Website</a>
        <span className="sep">·</span>
        <a href="/website" className="title">Mertener Rikschakutscher</a>
      </nav>

      <div className="page-body">
        <div className="eyebrow">Eindrücke</div>
        <h1>Galerie</h1>
        <p className="lead">Fotos von unseren Piloten — echte Augenblicke aus dem Rikscha-Alltag.</p>

        <div className="galerie-grid" id="galerie-grid">
          <div className="galerie-empty" id="galerie-leer">Fotos werden geladen …</div>
        </div>

        <hr className="divider"/>

        <div className="upload-section">
          <h2>📷 Foto hinzufügen</h2>
          <div className="upload-grid">
            <div className="upload-field">
              <label>Dein Name (Pilot)</label>
              <select id="upload-pilot">
                <option value="">— wird geladen … —</option>
              </select>
            </div>
            <div className="upload-field">
              <label>Passwort</label>
              <input type="password" id="upload-pw" placeholder="Dein Passwort"/>
            </div>
            <div className="upload-field full">
              <label>Foto auswählen</label>
              <input type="file" id="upload-datei" accept="image/*"/>
            </div>
            <div className="upload-field full">
              <label>Bildbeschreibung</label>
              <textarea id="upload-beschreibung" placeholder="Was ist auf dem Foto zu sehen? Wo wurde es gemacht?"></textarea>
            </div>
            <div className="upload-field full">
              <button className="btn-submit" id="upload-btn">Foto hochladen</button>
              <div className="upload-msg" id="upload-msg"></div>
            </div>
          </div>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{__html: `
        async function ladeGalerie() {
          try {
            var res = await fetch('/api/galerie');
            var fotos = await res.json();
            var grid = document.getElementById('galerie-grid');
            var leer = document.getElementById('galerie-leer');
            if (!fotos.length) {
              leer.textContent = 'Noch keine Fotos vorhanden — ladet das erste Foto hoch!';
              return;
            }
            leer.remove();
            fotos.forEach(function(f) {
              var card = document.createElement('div');
              card.className = 'galerie-card';
              var datum = new Date(f.created_at).toLocaleDateString('de-DE', {day:'2-digit',month:'2-digit',year:'numeric'});
              card.innerHTML = '<img src="' + f.url + '" alt="' + (f.beschreibung || '') + '" loading="lazy">'
                + '<div class="galerie-info">'
                + (f.beschreibung ? '<div class="galerie-beschreibung">' + f.beschreibung + '</div>' : '')
                + '<div class="galerie-meta">' + f.pilot + ' · ' + datum + '</div>'
                + '</div>';
              grid.appendChild(card);
            });
          } catch(e) {
            document.getElementById('galerie-leer').textContent = 'Galerie konnte nicht geladen werden.';
          }
        }

        async function ladeNamen() {
          try {
            var res = await fetch('/api/piloten');
            var daten = await res.json();
            var sel = document.getElementById('upload-pilot');
            sel.innerHTML = '<option value="">— Name wählen —</option>';
            daten.forEach(function(p) {
              var opt = document.createElement('option');
              opt.value = p.name;
              opt.textContent = p.name + (p.rolle === 'gfo' ? ' (GFO)' : '');
              sel.appendChild(opt);
            });
          } catch(e) {
            document.getElementById('upload-pilot').innerHTML = '<option value="">— Fehler beim Laden —</option>';
          }
        }

        document.getElementById('upload-btn').addEventListener('click', async function() {
          var pilot = document.getElementById('upload-pilot').value;
          var pw = document.getElementById('upload-pw').value;
          var datei = document.getElementById('upload-datei').files[0];
          var beschreibung = document.getElementById('upload-beschreibung').value.trim();
          var msg = document.getElementById('upload-msg');
          var btn = document.getElementById('upload-btn');

          msg.className = 'upload-msg';
          if (!pilot) { msg.className = 'upload-msg err'; msg.textContent = 'Bitte deinen Namen wählen.'; return; }
          if (!pw) { msg.className = 'upload-msg err'; msg.textContent = 'Bitte das Passwort eingeben.'; return; }
          if (!datei) { msg.className = 'upload-msg err'; msg.textContent = 'Bitte ein Foto auswählen.'; return; }

          btn.textContent = 'Wird hochgeladen …'; btn.disabled = true;

          var form = new FormData();
          form.append('pilot', pilot);
          form.append('password', pw);
          form.append('beschreibung', beschreibung);
          form.append('datei', datei);

          try {
            var res = await fetch('/api/galerie', { method: 'POST', body: form });
            var j = await res.json();
            if (res.ok) {
              msg.className = 'upload-msg ok';
              msg.textContent = 'Foto erfolgreich hochgeladen!';
              document.getElementById('upload-datei').value = '';
              document.getElementById('upload-pw').value = '';
              document.getElementById('upload-beschreibung').value = '';
              ladeGalerie();
            } else {
              msg.className = 'upload-msg err';
              msg.textContent = j.error || 'Fehler beim Hochladen.';
            }
          } catch(e) {
            msg.className = 'upload-msg err';
            msg.textContent = 'Verbindungsfehler — bitte nochmal versuchen.';
          }
          btn.textContent = 'Foto hochladen'; btn.disabled = false;
        });

        ladeGalerie();
        ladeNamen();
      `}}/>
    </>
  );
}
