export const metadata = {
  title: 'Rikscha-Gutschein – Mertener Rikschakutscher',
  description: 'Gutschein für eine Rikschafahrt durch Merten – ausdrucken und verschenken!',
};

export default function GutscheinPage() {
  return (
    <>
      <style>{`
        .g-body {
          background: #e8e4dc;
          font-family: system-ui, -apple-system, Segoe UI, sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          min-height: calc(100vh - 120px);
          padding: 2rem 1rem 3rem;
          gap: 1rem;
          margin: -1.5rem -1rem;
        }
        .g-controls { display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap; justify-content: center; }
        .g-hint { font-size: 0.82rem; color: #5a5248; text-align: center; max-width: 600px; }
        .g-btn {
          background: #2D6B1E; color: #fff; border: none;
          padding: 0.6rem 1.6rem; font-size: 0.95rem; font-weight: 600;
          border-radius: 3px; cursor: pointer; letter-spacing: 0.03em;
          transition: background 0.15s;
        }
        .g-btn:hover { background: #3A7A28; }

        .voucher-scaler { width: 740px; height: 540px; transform-origin: top left; }

        .voucher {
          width: 740px; height: 540px; background: #F7F2E8;
          position: relative; overflow: hidden;
          box-shadow: 0 8px 40px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.1);
        }
        .voucher::before {
          content: ''; position: absolute; inset: 10px;
          border: 1.5px solid #C8881A; pointer-events: none; z-index: 10;
        }

        .green-panel {
          position: absolute; top: 0; left: 0; width: 52%; height: 100%;
          background: #2D6B1E;
          clip-path: polygon(0 0, 88% 0, 100% 100%, 0 100%);
          display: flex; flex-direction: column; align-items: flex-start;
          justify-content: space-between; padding: 40px 80px 40px 36px;
        }
        .brand-top { display: flex; flex-direction: column; gap: 0.4rem; }
        .brand-icon { width: 58px; height: 58px; }
        .brand-name {
          font-family: Palatino Linotype, Palatino, Book Antiqua, Georgia, serif;
          font-size: 1.1rem; color: #fff; line-height: 1.25;
          font-weight: normal; max-width: 200px;
        }
        .brand-sub { font-size: 0.66rem; color: rgba(255,255,255,0.6); letter-spacing: 0.12em; text-transform: uppercase; }
        .gold-dot { color: #C8881A; }

        .fahrzeug-chips { display: flex; flex-direction: column; gap: 0.4rem; }
        .fahrzeug-chips-label {
          font-size: 0.58rem; letter-spacing: 0.12em; text-transform: uppercase;
          color: rgba(255,255,255,0.5); margin-bottom: 0.2rem;
        }
        .chip {
          display: flex; align-items: center; gap: 0.5rem;
          padding: 0.35rem 0.6rem; border-radius: 20px;
          border: 1.5px solid rgba(255,255,255,0.25);
          cursor: pointer; transition: all 0.15s; user-select: none;
        }
        .chip:hover { border-color: rgba(255,255,255,0.6); }
        .chip.active { background: rgba(255,255,255,0.2); border-color: #C8881A; }
        .chip-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .chip-text { font-size: 0.72rem; color: #fff; font-weight: 500; }
        .chip-sub { font-size: 0.58rem; color: rgba(255,255,255,0.55); margin-left: auto; white-space: nowrap; }

        .brand-bottom { font-size: 0.68rem; color: rgba(255,255,255,0.5); line-height: 1.5; max-width: 190px; }

        .g-content {
          position: absolute; top: 0; right: 0; width: 56%; height: 100%;
          padding: 36px 30px 32px 48px; display: flex; flex-direction: column; justify-content: space-between;
        }
        .gutschein-label {
          font-size: 0.62rem; letter-spacing: 0.18em; text-transform: uppercase;
          color: #C8881A; font-weight: 700; margin-bottom: 0.2rem;
        }
        .gutschein-title {
          font-family: Palatino Linotype, Palatino, Book Antiqua, Georgia, serif;
          font-size: 2.6rem; color: #1A1208; line-height: 0.95;
          font-weight: normal; margin-bottom: 0.2rem;
        }
        .gutschein-for {
          font-family: Palatino Linotype, Palatino, Book Antiqua, Georgia, serif;
          font-size: 0.9rem; color: #4a3f30; font-style: italic; margin-bottom: 1rem;
        }
        .fields { display: flex; flex-direction: column; gap: 0.65rem; flex: 1; }
        .field-row {
          display: flex; align-items: baseline; gap: 0.5rem;
          border-bottom: 1px solid #C8881A; padding-bottom: 2px;
        }
        .field-label {
          font-size: 0.65rem; font-weight: 700; letter-spacing: 0.08em;
          text-transform: uppercase; color: #2D6B1E; white-space: nowrap;
          flex-shrink: 0; min-width: 58px;
        }
        .field-value {
          font-family: Palatino Linotype, Palatino, Book Antiqua, Georgia, serif;
          font-size: 0.92rem; color: #1A1208; flex: 1; min-height: 1.3em;
          outline: none; background: transparent; padding: 0 2px;
        }
        .field-value:focus { background: rgba(200,136,26,0.07); }
        .field-value:empty::before { content: attr(data-placeholder); color: #b0a898; font-style: italic; }
        .fahrzeug-display {
          font-family: Palatino Linotype, Palatino, Book Antiqua, Georgia, serif;
          font-size: 0.92rem; color: #1A1208; flex: 1; min-height: 1.3em; padding: 0 2px;
        }
        .voucher-footer {
          font-size: 0.58rem; color: #7a6a52; line-height: 1.5;
          border-top: 1px solid #e0d8cc; padding-top: 0.4rem; margin-top: 0.3rem;
        }
        .corner { position: absolute; width: 18px; height: 18px; z-index: 11; }
        .corner-tl { top: 16px; left: 16px; border-top: 2px solid #C8881A; border-left: 2px solid #C8881A; }
        .corner-tr { top: 16px; right: 16px; border-top: 2px solid #C8881A; border-right: 2px solid #C8881A; }
        .corner-bl { bottom: 16px; left: 16px; border-bottom: 2px solid #C8881A; border-left: 2px solid #C8881A; }
        .corner-br { bottom: 16px; right: 16px; border-bottom: 2px solid #C8881A; border-right: 2px solid #C8881A; }

        @media print {
          .g-body { background: white; padding: 0; margin: 0; display: block; }
          .g-controls, .g-hint { display: none !important; }
          .voucher-scaler { transform: none !important; width: 210mm !important; height: 148mm !important; }
          .voucher { width: 210mm; height: 148mm; box-shadow: none; }
          .chip { border-color: transparent; }
          .chip.active { background: rgba(255,255,255,0.2); border-color: #C8881A; }
          @page { size: A5 landscape; margin: 0; }
        }
      `}</style>

      <div className="g-body" id="gutschein-root">
        <div className="g-controls">
          <button className="g-btn" onClick={() => window.print()}>🖨 Gutschein drucken</button>
        </div>
        <p className="g-hint">Fahrzeug wählen · Felder ausfüllen · Drucken</p>

        <div className="voucher-scaler" id="voucher-scaler">
          <div className="voucher">
            <div className="corner corner-tl"></div>
            <div className="corner corner-tr"></div>
            <div className="corner corner-bl"></div>
            <div className="corner corner-br"></div>

            <div className="green-panel">
              <div className="brand-top">
                <svg className="brand-icon" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="50" cy="50" r="48" fill="rgba(255,255,255,0.12)"/>
                  <circle cx="28" cy="68" r="13" stroke="white" strokeWidth="3.5" fill="none"/>
                  <circle cx="28" cy="68" r="2.5" fill="white"/>
                  <circle cx="74" cy="68" r="13" stroke="white" strokeWidth="3.5" fill="none"/>
                  <circle cx="74" cy="68" r="2.5" fill="white"/>
                  <line x1="28" y1="55" x2="28" y2="81" stroke="white" strokeWidth="1.2" opacity="0.5"/>
                  <line x1="15" y1="68" x2="41" y2="68" stroke="white" strokeWidth="1.2" opacity="0.5"/>
                  <line x1="74" y1="55" x2="74" y2="81" stroke="white" strokeWidth="1.2" opacity="0.5"/>
                  <line x1="61" y1="68" x2="87" y2="68" stroke="white" strokeWidth="1.2" opacity="0.5"/>
                  <rect x="34" y="32" width="30" height="24" rx="5" stroke="white" strokeWidth="3" fill="rgba(255,255,255,0.15)"/>
                  <path d="M34 37 Q49 28 64 37" stroke="white" strokeWidth="2.5" fill="none"/>
                  <line x1="64" y1="50" x2="74" y2="55" stroke="white" strokeWidth="3"/>
                  <circle cx="76" cy="28" r="6" fill="white" opacity="0.9"/>
                  <line x1="76" y1="34" x2="74" y2="50" stroke="white" strokeWidth="2.5"/>
                  <line x1="68" y1="42" x2="80" y2="42" stroke="white" strokeWidth="2"/>
                  <line x1="74" y1="55" x2="68" y2="62" stroke="white" strokeWidth="2"/>
                  <line x1="74" y1="55" x2="80" y2="62" stroke="white" strokeWidth="2"/>
                  <line x1="34" y1="54" x2="28" y2="55" stroke="white" strokeWidth="3"/>
                </svg>
                <div className="brand-name">Mertener<br/>Rikschakutscher</div>
                <div className="brand-sub">Bornheim-Merten <span className="gold-dot">·</span> seit 2018</div>
              </div>

              <div className="fahrzeug-chips">
                <div className="fahrzeug-chips-label">Fahrzeug wählen</div>
                <div className="chip" data-fz="Flotte Lotte" onClick={(e) => wahlFahrzeug(e.currentTarget)}>
                  <span className="chip-dot" style={{background:'#f59e0b'}}></span>
                  <span className="chip-text">Flotte Lotte</span>
                  <span className="chip-sub">max. 2 Gäste</span>
                </div>
                <div className="chip" data-fz="Flinker Flitzer" onClick={(e) => wahlFahrzeug(e.currentTarget)}>
                  <span className="chip-dot" style={{background:'#06b6d4'}}></span>
                  <span className="chip-text">Flinker Flitzer</span>
                  <span className="chip-sub">Liegetandem · 1 Gast</span>
                </div>
                <div className="chip" data-fz="Jruuse Piter" onClick={(e) => wahlFahrzeug(e.currentTarget)}>
                  <span className="chip-dot" style={{background:'#a78bfa'}}></span>
                  <span className="chip-text">Jruuse Piter</span>
                  <span className="chip-sub">Paralleltandem · 1 Gast</span>
                </div>
                <div className="chip active" data-fz="" onClick={(e) => wahlFahrzeug(e.currentTarget)}>
                  <span className="chip-dot" style={{background:'rgba(255,255,255,0.4)'}}></span>
                  <span className="chip-text" style={{color:'rgba(255,255,255,0.6)'}}>Nach Absprache</span>
                </div>
              </div>

              <div className="brand-bottom">
                Ein ehrenamtliches Projekt der<br/>
                Gesellschaft der Franziskanerinnen<br/>
                zu Olpe <span className="gold-dot">(GFO)</span>
              </div>
            </div>

            <div className="g-content">
              <div>
                <div className="gutschein-label">Geschenk-Gutschein</div>
                <div className="gutschein-title">Gut&shy;schein</div>
                <div className="gutschein-for">für eine Rikschafahrt durch Merten</div>
              </div>

              <div className="fields">
                <div className="field-row">
                  <span className="field-label">Für</span>
                  <div className="field-value" contentEditable suppressContentEditableWarning data-placeholder="Name des Beschenkten"></div>
                </div>
                <div className="field-row">
                  <span className="field-label">Fahrzeug</span>
                  <div className="fahrzeug-display" id="fz-display">Nach Absprache</div>
                </div>
                <div className="field-row">
                  <span className="field-label">Wunschziel</span>
                  <div className="field-value" contentEditable suppressContentEditableWarning data-placeholder="z.B. Mertener Heide, Alpakas …"></div>
                </div>
                <div className="field-row">
                  <span className="field-label">Datum</span>
                  <div className="field-value" contentEditable suppressContentEditableWarning data-placeholder="Wunschdatum oder nach Absprache"></div>
                </div>
                <div className="field-row">
                  <span className="field-label">Von</span>
                  <div className="field-value" contentEditable suppressContentEditableWarning data-placeholder="Dein Name"></div>
                </div>
              </div>

              <div className="voucher-footer">
                Die Fahrt ist kostenlos — eine kleine Spende freut uns sehr &nbsp;·&nbsp;
                Anmeldung &amp; Infos: 02227 9328383
              </div>
            </div>
          </div>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{__html: `
        function wahlFahrzeug(el) {
          document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
          el.classList.add('active');
          var name = el.dataset.fz || 'Nach Absprache';
          document.getElementById('fz-display').textContent = name;
        }
        function scale() {
          var scaler = document.getElementById('voucher-scaler');
          if (!scaler) return;
          var available = Math.min(window.innerWidth - 16, 740);
          var s = available / 740;
          if (s < 1) {
            scaler.style.transform = 'scale(' + s + ')';
            scaler.style.marginBottom = (540 * s - 540) + 'px';
          } else {
            scaler.style.transform = '';
            scaler.style.marginBottom = '';
          }
        }
        scale();
        window.addEventListener('resize', scale);
      `}} />
    </>
  );
}

declare function wahlFahrzeug(el: HTMLElement): void;
