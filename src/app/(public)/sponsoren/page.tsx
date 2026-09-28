import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Unsere Förderer & Sponsoren – Mertener Rikschakutscher',
  description: 'Ohne großzügige Unterstützer wäre unser Projekt nie möglich gewesen. Hier danken wir allen, die uns auf dem Weg begleitet haben.',
};

export default function SponsorenPage() {
  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --green: #2D6B1E; --green-soft: #EBF3E7;
          --gold: #C8881A; --gold-soft: #FBF0DC;
          --ink: #1C1208; --mid: #6B5C44;
          --ground: #F5F0E7; --surface: #FDFAF5; --border: #D6CCB8;
          --radius: 8px;
          --serif: Palatino Linotype, Palatino, Book Antiqua, Georgia, serif;
          --sans: system-ui, -apple-system, Segoe UI, sans-serif;
        }
        @media (prefers-color-scheme: dark) {
          :root:not([data-theme="light"]) {
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

        body { font-family: var(--sans); background: var(--ground); color: var(--ink); min-height: 100vh; }
        .page-nav { background: #1C4A10; color: #fff; display: flex; align-items: center; gap: 1rem; padding: 0 1.5rem; height: 52px; }
        .page-nav a { color: rgba(255,255,255,0.85); text-decoration: none; font-size: 0.88rem; }
        .page-nav a:hover { color: #fff; }
        .page-nav .sep { color: rgba(255,255,255,0.3); }

        .hero-strip { background: linear-gradient(135deg, #1C4A10 0%, #2D6B1E 100%); color: #fff; padding: 3.5rem 1.5rem 3rem; text-align: center; }
        .hero-strip .eyebrow { font-size: 0.75rem; letter-spacing: 0.14em; text-transform: uppercase; color: #E8C070; margin-bottom: 0.75rem; }
        .hero-strip h1 { font-family: var(--serif); font-size: clamp(1.9rem, 5vw, 3rem); font-weight: normal; line-height: 1.2; text-wrap: balance; margin-bottom: 1rem; }
        .hero-strip p { font-size: 1.05rem; color: rgba(255,255,255,0.88); max-width: 540px; margin: 0 auto; line-height: 1.65; }

        .page-body { max-width: 860px; margin: 0 auto; padding: 3.5rem 1.5rem 6rem; }

        /* Timeline */
        .timeline { position: relative; padding-left: 2.5rem; }
        .timeline::before { content: ''; position: absolute; left: 0.65rem; top: 0.5rem; bottom: 0.5rem; width: 2px; background: var(--border); border-radius: 1px; }
        .tl-item { position: relative; margin-bottom: 3rem; }
        .tl-item:last-child { margin-bottom: 0; }
        .tl-dot { position: absolute; left: -2.5rem; top: 0.2rem; width: 1.3rem; height: 1.3rem; border-radius: 50%; border: 2px solid var(--surface); display: flex; align-items: center; justify-content: center; font-size: 0.65rem; flex-shrink: 0; }
        .tl-dot-gold  { background: var(--gold); }
        .tl-dot-green { background: var(--green); }
        .tl-dot-blue  { background: #2563EB; }
        .tl-dot-red   { background: #E2001A; }

        .tl-year { font-size: 0.72rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--mid); margin-bottom: 0.4rem; }
        .tl-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 1.5rem 1.75rem; }
        .tl-card h2 { font-family: var(--serif); font-size: 1.35rem; font-weight: normal; color: var(--ink); margin-bottom: 0.5rem; line-height: 1.25; }
        .tl-card .rikscha-name { display: inline-block; font-size: 0.78rem; font-weight: 700; letter-spacing: 0.05em; padding: 0.2rem 0.7rem; border-radius: 99px; margin-bottom: 0.85rem; }
        .name-lotte   { background: #dcfce7; color: #15803d; }
        .name-flitzer { background: #dbeafe; color: #1d4ed8; }
        .name-piter   { background: #ffedd5; color: #9c3a07; }
        .name-neu     { background: #fde8e8; color: #9b0012; }
        .tl-card p { color: var(--mid); line-height: 1.7; margin-bottom: 0.75rem; font-size: 0.97rem; }
        .tl-card p:last-child { margin-bottom: 0; }
        .tl-card .sponsor-list { list-style: none; margin: 0.5rem 0 0.75rem; display: flex; flex-direction: column; gap: 0.4rem; }
        .tl-card .sponsor-list li { display: flex; align-items: flex-start; gap: 0.6rem; color: var(--mid); font-size: 0.94rem; line-height: 1.55; }
        .tl-card .sponsor-list li::before { content: '✦'; color: var(--gold); font-size: 0.6rem; margin-top: 0.35rem; flex-shrink: 0; }
        .tl-card strong { color: var(--ink); }

        /* AM Logo SVG inline */
        .am-inline { display: inline-flex; align-items: center; gap: 0.5rem; background: #fde8e8; border: 1px solid #E2001A; border-radius: 6px; padding: 0.4rem 0.75rem; margin-top: 0.75rem; }
        .am-inline svg { display: block; }
        .am-inline span { font-size: 0.82rem; font-weight: 600; color: #9b0012; }

        /* Dankbox */
        .dankbox { margin-top: 3.5rem; background: var(--green-soft); border: 1.5px solid var(--green); border-radius: var(--radius); padding: 1.75rem 2rem; text-align: center; }
        .dankbox h2 { font-family: var(--serif); font-size: 1.5rem; font-weight: normal; color: var(--green); margin-bottom: 0.75rem; }
        .dankbox p { color: var(--mid); max-width: 520px; margin: 0 auto 1.25rem; line-height: 1.65; }
        .btn { display: inline-block; padding: 0.7rem 1.75rem; border-radius: 4px; font-size: 0.92rem; font-weight: 600; text-decoration: none; background: var(--green); color: #fff; }
        .btn:hover { opacity: 0.88; }

        @media (max-width: 600px) {
          .tl-card { padding: 1.1rem 1.25rem; }
          .hero-strip { padding: 2.5rem 1.25rem 2rem; }
        }
      `}</style>

      <nav className="page-nav">
        <a href="/">← Startseite</a>
        <span className="sep">›</span>
        <span style={{color:'#fff',fontSize:'0.88rem'}}>Förderer & Sponsoren</span>
      </nav>

      <div className="hero-strip">
        <div className="eyebrow">Mertener Rikschakutscher · seit 2018</div>
        <h1>Ohne sie wären wir nicht hier</h1>
        <p>Fünf Rikschas, unzählige Fahrten — und dahinter eine Gemeinschaft von Menschen und Organisationen, die geglaubt haben, dass dieses Projekt die Welt ein kleines Stück besser macht.</p>
      </div>

      <div className="page-body">
        <div className="timeline">

          {/* 2018 – Weihnachtslichter / Flotte Lotte */}
          <div className="tl-item">
            <div className="tl-dot tl-dot-gold"></div>
            <div className="tl-year">2018 · Der Anfang</div>
            <div className="tl-card">
              <span className="rikscha-name name-lotte">🟢 Flotte Lotte</span>
              <h2>Weihnachtslichter des General-Anzeigers ermöglichen den Start</h2>
              <p>
                2018 war noch alles Idee. Es fehlte das Geld für die erste Rikscha — und damit für das gesamte Projekt.
                Die Hilfsaktion <strong>Weihnachtslichter</strong> des <strong>General-Anzeigers Bonn</strong> machte es möglich:
                Sie spendete die erste Rikscha vollständig und legte damit den Grundstein für alles, was folgte.
              </p>
              <p>
                <strong>Flotte Lotte</strong> — die klassische, geräumige Rikscha mit Rundumblick — war das erste Fahrzeug
                der Mertener Rikschakutscher. Sie fährt bis heute und hat Hunderte von Menschen durch Merten und die Region
                getragen.
              </p>
              <p style={{fontSize:'0.88rem',fontStyle:'italic'}}>
                „Ohne den General-Anzeiger und die Weihnachtslichter-Aktion hätte es den ersten Pedaltritt nie gegeben."
              </p>
            </div>
          </div>

          {/* Flinker Flitzer – Einzelspender */}
          <div className="tl-item">
            <div className="tl-dot tl-dot-blue"></div>
            <div className="tl-year">Zweites Fahrzeug</div>
            <div className="tl-card">
              <span className="rikscha-name name-flitzer">🔵 Flinker Flitzer</span>
              <h2>Viele Schultern tragen das Liegetandem</h2>
              <p>
                Den <strong>Flinken Flitzer</strong> — das Liegetandem, das nah am Boden, nah am Leben fährt — haben
                zahlreiche Einzelpersonen und Institutionen gemeinsam ermöglicht. Besonders zu nennen sind:
              </p>
              <ul className="sponsor-list">
                <li><strong>Volksbank Merten</strong> (Filiale) — mit einer großzügigen Zuwendung</li>
                <li><strong>Förderverein der GFO</strong> — als verlässlicher Partner aus dem Pflegebereich</li>
                <li>Viele weitere <strong>Einzelspenderinnen und -spender</strong> aus Merten und der Region</li>
              </ul>
              <p>
                Der Flinker Flitzer ist ideal für sehbehinderte oder körperlich eingeschränkte Menschen —
                und wer mag, kann sogar mittreten.
              </p>
            </div>
          </div>

          {/* Jruuse Piter – Aktion Mensch */}
          <div className="tl-item">
            <div className="tl-dot tl-dot-red"></div>
            <div className="tl-year">Drittes Fahrzeug</div>
            <div className="tl-card">
              <span className="rikscha-name name-piter">🟠 Jruuse Piter</span>
              <h2>Aktion Mensch schenkt uns das Paralleltandem</h2>
              <p>
                <strong>Jruuse Piter</strong> ist unser Paralleltandem — Kutscher und Gast fahren Seite an Seite.
                Besonders geeignet für Menschen mit Demenz, die körperlich fit sind: das Nebeneinander schafft
                Sicherheit, Nähe und echte Gespräche auf Augenhöhe.
              </p>
              <p>
                Ermöglicht wurde Jruuse Piter vollständig durch die Förderung der <strong>Aktion Mensch</strong>,
                der Lotterie der Solidarität. Ein Fahrzeug, das Menschen zusammenbringt — finanziert von
                einer Organisation, die genau das als ihre Mission versteht.
              </p>
              <div className="am-inline">
                <svg viewBox="0 0 120 42" fill="none" width="90" height="31">
                  <rect width="120" height="42" rx="4" fill="#E2001A"/>
                  <circle cx="15" cy="9" r="5" fill="#fff"/>
                  <path d="M6 18C6 13 10 11 15 14C20 11 24 13 24 18C24 23 15 30 15 30C15 30 6 23 6 18Z" fill="#fff"/>
                  <line x1="4" y1="19" x2="9" y2="17" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="26" y1="19" x2="21" y2="17" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                  <text x="32" y="18" fontFamily="Arial Black,Arial,sans-serif" fontWeight="900" fontSize="11" fill="#fff">aktion</text>
                  <text x="32" y="31" fontFamily="Arial Black,Arial,sans-serif" fontWeight="900" fontSize="11" fill="#fff">mensch</text>
                </svg>
                <span>Gefördert durch Aktion Mensch</span>
              </div>
            </div>
          </div>

          {/* 2027 – Zwei neue Fahrzeuge */}
          <div className="tl-item">
            <div className="tl-dot tl-dot-red"></div>
            <div className="tl-year">2027 · Wachstum</div>
            <div className="tl-card" style={{borderColor:'#E2001A', borderWidth:'2px'}}>
              <span className="rikscha-name name-neu">❤️ Zwei neue Rikschas</span>
              <h2>Aktion Mensch ermöglicht Fahrten für Menschen mit Behinderung</h2>
              <p>
                Dank erneuter Förderung durch <strong>Aktion Mensch</strong> — beantragt durch den
                kath. Förderverein Sankt Martin Merten — kommen 2027 zwei weitere Fahrzeuge dazu:
                ein Paralleltandem und eine klassische Rikscha. Beide Namen sind noch offen.
              </p>
              <p>
                Mit dieser Erweiterung können wir <strong>Rikschafahrten nun auch offiziell
                Menschen mit Behinderung und eingeschränkter Mobilität</strong> anbieten —
                ein Meilenstein für unser Projekt.
              </p>
              <p style={{fontSize:'0.88rem'}}>
                Die feierliche <strong>Taufe beider Fahrzeuge</strong> findet Anfang der Saison 2027 statt.
                Auf Wunsch informieren wir Sie rechtzeitig — melden Sie sich einfach bei uns.
              </p>
              <div className="am-inline">
                <svg viewBox="0 0 120 42" fill="none" width="90" height="31">
                  <rect width="120" height="42" rx="4" fill="#E2001A"/>
                  <circle cx="15" cy="9" r="5" fill="#fff"/>
                  <path d="M6 18C6 13 10 11 15 14C20 11 24 13 24 18C24 23 15 30 15 30C15 30 6 23 6 18Z" fill="#fff"/>
                  <line x1="4" y1="19" x2="9" y2="17" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="26" y1="19" x2="21" y2="17" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                  <text x="32" y="18" fontFamily="Arial Black,Arial,sans-serif" fontWeight="900" fontSize="11" fill="#fff">aktion</text>
                  <text x="32" y="31" fontFamily="Arial Black,Arial,sans-serif" fontWeight="900" fontSize="11" fill="#fff">mensch</text>
                </svg>
                <span>Gefördert durch Aktion Mensch</span>
              </div>
            </div>
          </div>

        </div>

        {/* Dankbox */}
        <div className="dankbox">
          <h2>Möchten auch Sie Teil dieser Geschichte werden?</h2>
          <p>
            Jede Spende, jede Unterstützung bringt uns einer weiteren Fahrt näher.
            Als Spender, Pate oder Förderer sind Sie herzlich willkommen.
          </p>
          <a href="/#spenden" className="btn">Mehr zum Spenden</a>
        </div>

      </div>
    </>
  );
}
