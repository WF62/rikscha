export const dynamic = 'force-dynamic';
import type { Metadata } from 'next';
import { createServiceClient } from '@/lib/supabase';
import PrintButton from './PrintButton';

export const metadata: Metadata = {
  title: 'Flyer A4 Z-Falz – Mertener Rikschakutscher',
};

const SCHLUSSEL = [
  'flyer_fahrten_text', 'flyer_lotte_text', 'flyer_flitzer_text', 'flyer_piter_text',
  'flyer_foto_fahrt1', 'flyer_foto_fahrt2', 'flyer_foto_lotte', 'flyer_foto_flitzer', 'flyer_foto_piter',
];

const DEFAULT: Record<string, string> = {
  flyer_fahrten_text:  'Ob Seniorenausflug, Familienbesuch oder besonderer Anlass — unsere ehrenamtlichen Piloten bringen Sie sicher und stilvoll ans Ziel. Alle Fahrten sind kostenlos und für jeden zugänglich.',
  flyer_lotte_text:    'Die klassische Rikscha — geräumig, komfortabel, mit Rundumblick. Flotte Lotte ermöglicht entspanntes Mitfahren mit großer Wirkung.',
  flyer_flitzer_text:  'Ideal für sehbehinderte oder körperlich eingeschränkte Menschen — wer mag, kann sogar mittreten! Nah am Boden, nah am Leben.',
  flyer_piter_text:    'Pilot und Gast fahren Seite an Seite — besonders für Menschen mit Demenz. Sicherheit, Nähe und Gespräche auf Augenhöhe.',
  flyer_foto_fahrt1:   '',
  flyer_foto_fahrt2:   '',
  flyer_foto_lotte:    '',
  flyer_foto_flitzer:  '',
  flyer_foto_piter:    '',
};

async function ladeInhalte(): Promise<Record<string, string>> {
  try {
    const db = createServiceClient();
    const { data } = await db.from('inhalte').select('schluessel, wert').in('schluessel', SCHLUSSEL);
    const result = { ...DEFAULT };
    for (const { schluessel, wert } of data ?? []) {
      if (schluessel in result) result[schluessel] = wert;
    }
    return result;
  } catch {
    return DEFAULT;
  }
}

export default async function Flyer2Page() {
  const c = await ladeInhalte();

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --green:  #2D6B1E;
          --green2: #3A8A26;
          --gold:   #C8881A;
          --orange: #C8600A;
          --cream:  #F5F0E7;
          --ink:    #1C1208;
          --mid:    #5C4E38;
          --serif:  Palatino Linotype, Palatino, Book Antiqua, Georgia, serif;
          --sans:   system-ui, -apple-system, Segoe UI, sans-serif;
          /* A4 hochkant: 210mm × 297mm, Z-Falz → 3 Streifen à 210mm × 99mm */
          --sheet-w: 210mm;
          --sheet-h: 297mm;
          --row-h:   99mm;
          --pad:     8mm;
        }

        body { background: #c8c8c8; font-family: var(--sans); }

        /* ── Druck-Nav ── */
        .print-bar {
          background: #1C4A10; color: #fff;
          display: flex; align-items: center; gap: 1rem;
          padding: 0.6rem 1.5rem; font-size: 0.82rem;
        }
        .print-bar a { color: rgba(255,255,255,0.8); text-decoration: none; }
        .print-bar a:hover { color: #fff; }
        .print-bar button {
          background: var(--gold); color: #1a1208;
          border: none; border-radius: 4px;
          padding: 0.4rem 1rem; font-size: 0.82rem; font-weight: 700; cursor: pointer;
          margin-left: auto;
        }
        .print-hint {
          background: #fff8e1; border-bottom: 1px solid #e0c040;
          padding: 0.5rem 1.5rem; font-size: 0.78rem; color: #5c4a00;
        }

        /* ── Blatt ── */
        .side-label {
          text-align: center; font-size: 0.72rem; color: #555;
          letter-spacing: 0.1em; text-transform: uppercase;
          padding: 0.7rem 0 0.3rem;
        }
        .sheet {
          width: var(--sheet-w);
          height: var(--sheet-h);
          display: grid;
          grid-template-rows: var(--row-h) var(--row-h) var(--row-h);
          overflow: hidden;
          position: relative;
          margin: 0 auto 1.5rem;
          box-shadow: 0 4px 28px rgba(0,0,0,0.25);
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        /* Zwei Falzlinien (horizontal) */
        .sheet::before, .sheet::after {
          content: '';
          position: absolute;
          left: 0; right: 0;
          height: 1px;
          background: rgba(0,0,0,0.18);
          z-index: 10;
          pointer-events: none;
        }
        .sheet::before { top: var(--row-h); }
        .sheet::after  { top: calc(var(--row-h) * 2); }

        /* ── Basis-Streifen ── */
        .strip {
          width: var(--sheet-w);
          height: var(--row-h);
          padding: var(--pad);
          display: flex;
          flex-direction: row;
          align-items: stretch;
          overflow: hidden;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          gap: var(--pad);
        }
        /* Foto-Bereich im Streifen */
        .strip-photo {
          flex-shrink: 0;
          width: 72mm;
          height: calc(var(--row-h) - var(--pad) * 2);
          border-radius: 6px;
          overflow: hidden;
          background: rgba(255,255,255,0.15);
          display: flex; align-items: center; justify-content: center;
          flex-direction: column; gap: 2mm;
          font-size: 2rem;
        }
        .strip-photo img { width: 100%; height: 100%; object-fit: cover; }
        /* Text-Bereich im Streifen */
        .strip-text {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 2.5mm;
        }

        /* ══ DECKBLATT-STREIFEN ══ */
        .strip-cover {
          background: linear-gradient(135deg, #3A8A26 0%, #1C4A10 100%);
          color: #fff;
          align-items: center;
          justify-content: flex-start;
        }
        .cover-logo-wrap {
          flex-shrink: 0;
          width: 64px; height: 64px;
          border-radius: 50%;
          background: rgba(255,255,255,0.15);
          display: flex; align-items: center; justify-content: center;
          margin-right: calc(var(--pad) - 2mm);
        }
        .cover-logo-wrap img { width: 54px; height: 54px; border-radius: 50%; object-fit: cover; }
        .cover-eyebrow { font-size: 7pt; letter-spacing: 0.14em; text-transform: uppercase; color: rgba(255,255,255,0.65); }
        .cover-h1 { font-family: var(--serif); font-size: 17pt; font-weight: normal; color: #fff; line-height: 1.15; }
        .cover-tagline { font-size: 8.5pt; color: rgba(255,255,255,0.88); line-height: 1.55; }
        .cover-contact { font-size: 8.5pt; color: rgba(255,255,255,0.95); line-height: 1.7; background: rgba(255,255,255,0.14); border-radius: 5px; padding: 2.5mm 3.5mm; }
        .cover-contact strong { font-size: 9pt; display: block; margin-bottom: 1mm; }

        /* ══ FAHRTEN-STREIFEN ══ */
        .strip-fahrten {
          background: var(--orange);
          color: #fff;
        }
        .strip-fahrten .strip-photo { background: rgba(255,255,255,0.15); color: rgba(255,255,255,0.6); }
        .fahrten-eyebrow { font-size: 7pt; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(255,255,255,0.7); }
        .fahrten-h2 { font-family: var(--serif); font-size: 16pt; font-weight: normal; color: #fff; line-height: 1.15; }
        .fahrten-p { font-size: 8.5pt; color: rgba(255,255,255,0.92); line-height: 1.55; }
        .fahrten-chips { display: flex; flex-wrap: wrap; gap: 1.5mm; }
        .fahrten-chip { font-size: 7.5pt; font-weight: 700; padding: 1mm 2.5mm; border-radius: 99px; background: rgba(255,255,255,0.22); color: #fff; }

        /* ══ FAHRZEUGE-STREIFEN ══ */
        .strip-vehicles {
          background: var(--cream);
          color: var(--ink);
          align-items: flex-start;
          gap: 3mm;
          padding: calc(var(--pad) - 1mm) var(--pad);
        }
        .vehicle-card {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 1.5mm;
          overflow: hidden;
        }
        .vehicle-photo {
          width: 100%;
          height: 36mm;
          border-radius: 5px;
          overflow: hidden;
          background: #ddd;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.8rem;
          flex-shrink: 0;
        }
        .vehicle-photo img { width: 100%; height: 100%; object-fit: cover; }
        .vbadge { font-size: 6pt; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; padding: 0.8mm 2mm; border-radius: 99px; display: inline-block; }
        .vbadge-lotte   { background: #dcfce7; color: #15803d; }
        .vbadge-flitzer { background: #dbeafe; color: #1d4ed8; }
        .vbadge-piter   { background: #ffedd5; color: #9c3a07; }
        .vname { font-family: var(--serif); font-size: 11pt; font-weight: normal; color: var(--ink); line-height: 1.1; }
        .vdesc { font-size: 7pt; color: var(--mid); line-height: 1.45; }
        .vdivider { width: 1px; height: auto; background: #ddd; flex-shrink: 0; align-self: stretch; }

        /* ══ KONTAKT-STREIFEN (Rückseite) ══ */
        .strip-kontakt {
          background: #1C4A10;
          color: #fff;
        }
        .strip-kontakt .strip-photo { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.5); }
        .kontakt-eyebrow { font-size: 7pt; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(255,255,255,0.6); }
        .kontakt-h2 { font-family: var(--serif); font-size: 16pt; font-weight: normal; color: #fff; line-height: 1.15; }
        .kontakt-p { font-size: 8.5pt; color: rgba(255,255,255,0.88); line-height: 1.7; }
        .kontakt-iban { font-family: monospace; font-size: 8pt; background: rgba(255,255,255,0.12); padding: 1.5mm 2.5mm; border-radius: 3px; color: #fff; display: inline-block; margin: 1mm 0; }
        .kontakt-am { display: flex; align-items: center; gap: 2mm; margin-top: 2mm; }
        .kontakt-am span { font-size: 7.5pt; color: rgba(255,255,255,0.8); line-height: 1.4; }

        /* ══ INNENSEITE RÜCKSEITE — 2 Streifen ══ */
        .strip-inner-a {
          background: var(--cream);
          color: var(--ink);
          flex-direction: column;
          justify-content: center;
          padding: var(--pad);
        }
        .strip-inner-a .strip-row { display: flex; gap: var(--pad); align-items: center; }
        .gutschein-wrap { flex: 1; }
        .gutschein-tag { display: inline-block; background: var(--gold); color: #fff; font-size: 7pt; font-weight: 700; padding: 1mm 3mm; border-radius: 99px; margin-bottom: 2.5mm; }
        .gutschein-h2 { font-family: var(--serif); font-size: 14pt; font-weight: normal; color: var(--ink); margin-bottom: 1.5mm; }
        .gutschein-sub { font-size: 8pt; color: var(--mid); line-height: 1.5; margin-bottom: 3mm; }
        .gutschein-body { border: 2px dashed var(--gold); border-radius: 6px; padding: 3.5mm; display: flex; flex-direction: column; gap: 2.5mm; }
        .gutschein-label { font-size: 7pt; color: var(--mid); margin-bottom: 0.5mm; }
        .gutschein-line { border-bottom: 1px solid #ccc; padding-bottom: 4mm; }
        .gutschein-foot { font-size: 6.5pt; color: var(--mid); text-align: center; padding-top: 2mm; border-top: 1px dashed #ccc; }

        .strip-inner-b {
          background: #2a5c1a;
          color: #fff;
          flex-direction: column;
          justify-content: center;
          padding: var(--pad);
          text-align: center;
          gap: 3mm;
        }
        .inner-b-h { font-family: var(--serif); font-size: 18pt; font-weight: normal; color: #fff; }
        .inner-b-sub { font-size: 9pt; color: rgba(255,255,255,0.85); line-height: 1.6; }
        .inner-b-chip { display: inline-block; background: rgba(255,255,255,0.18); color: #fff; font-size: 8pt; padding: 2mm 4mm; border-radius: 99px; margin: 1mm; }

        /* ── Print ── */
        @media print {
          .print-bar, .print-hint, .side-label { display: none; }
          body { background: #fff; margin: 0; }
          .sheet { margin: 0; box-shadow: none; page-break-after: always; }
          .sheet:last-of-type { page-break-after: auto; }
          @page { size: A4 portrait; margin: 0; }
        }
      `}</style>

      {/* Druck-Nav */}
      <div className="print-bar">
        <a href="/">← Startseite</a>
        <span style={{color:'rgba(255,255,255,0.4)',margin:'0 0.5rem'}}>·</span>
        <span style={{fontSize:'0.78rem',color:'rgba(255,255,255,0.7)'}}>Flyer A4 hochkant · beidseitig drucken, horizontal Z-falzen</span>
        <PrintButton />
      </div>
      <div className="print-hint">
        ℹ️ Beide Seiten auf <strong>ein Blatt A4 hochkant</strong> drucken (beidseitig). Entlang der Falzlinien Z-falten — Deckblatt liegt außen oben.
      </div>

      {/* ═══ VORDERSEITE ═══ */}
      <p className="side-label">Vorderseite — Außenseite</p>
      <div className="sheet">

        {/* Streifen 1: Deckblatt */}
        <div className="strip strip-cover">
          <div className="cover-logo-wrap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://hcbqmqyxpasojbrewnps.supabase.co/storage/v1/object/public/piloten-dateien/1789230837654-o3j4ecfxsw.png" alt="Logo"/>
          </div>
          <div className="strip-text">
            <div className="cover-eyebrow">Bornheim-Merten · seit 2018</div>
            <div className="cover-h1">Mertener Rikscha&shy;kutscher</div>
            <div className="cover-tagline">Kostenlose Rikschafahrten durch Merten — mit Herz, Pedalen und elf begeisterten Kutschern.</div>
            <div className="cover-contact">
              <strong>📞 02227 9328383</strong>
              GFO Bornheim-Merten · rikscha-kutscher.de
            </div>
          </div>
        </div>

        {/* Streifen 2: Fahrten */}
        <div className="strip strip-fahrten">
          <div className="strip-photo">
            {c.flyer_foto_fahrt1
              ? <img src={c.flyer_foto_fahrt1} alt="Rikschafahrt"/>
              : <><span>🛺</span><span style={{fontSize:'7pt',color:'rgba(255,255,255,0.5)'}}>Foto</span></>
            }
          </div>
          <div className="strip-text">
            <div className="fahrten-eyebrow">Kostenlos &amp; herzlich</div>
            <div className="fahrten-h2">Fahrtwind für alle</div>
            <p className="fahrten-p">{c.flyer_fahrten_text}</p>
            <div className="fahrten-chips">
              <span className="fahrten-chip">Kostenlos</span>
              <span className="fahrten-chip">Ehrenamtlich</span>
              <span className="fahrten-chip">Gruppen möglich</span>
              <span className="fahrten-chip">🚀 Ab 2027: 5 Rikschas</span>
            </div>
          </div>
        </div>

        {/* Streifen 3: Fahrzeuge */}
        <div className="strip strip-vehicles">
          <div className="vehicle-card">
            <div className="vehicle-photo">
              {c.flyer_foto_lotte ? <img src={c.flyer_foto_lotte} alt="Flotte Lotte"/> : <>🛺</>}
            </div>
            <span className="vbadge vbadge-lotte">2 Gäste</span>
            <div className="vname">Flotte Lotte</div>
            <p className="vdesc">{c.flyer_lotte_text}</p>
          </div>
          <div className="vdivider"/>
          <div className="vehicle-card">
            <div className="vehicle-photo">
              {c.flyer_foto_flitzer ? <img src={c.flyer_foto_flitzer} alt="Flinker Flitzer"/> : <>🚲</>}
            </div>
            <span className="vbadge vbadge-flitzer">Liegetandem</span>
            <div className="vname">Flinker Flitzer</div>
            <p className="vdesc">{c.flyer_flitzer_text}</p>
          </div>
          <div className="vdivider"/>
          <div className="vehicle-card">
            <div className="vehicle-photo">
              {c.flyer_foto_piter ? <img src={c.flyer_foto_piter} alt="Jruuse Piter"/> : <>🚀</>}
            </div>
            <span className="vbadge vbadge-piter">Parallel</span>
            <div className="vname">Jruuse Piter</div>
            <p className="vdesc">{c.flyer_piter_text}</p>
          </div>
        </div>

      </div>

      {/* ═══ RÜCKSEITE ═══ */}
      <p className="side-label">Rückseite — Innenseite</p>
      <div className="sheet">

        {/* Rückseite Streifen 1: Kontakt */}
        <div className="strip strip-kontakt">
          <div className="strip-photo">
            {c.flyer_foto_fahrt2
              ? <img src={c.flyer_foto_fahrt2} alt="Rikschafahrt"/>
              : <><span>📷</span><span style={{fontSize:'7pt',color:'rgba(255,255,255,0.4)'}}>Foto</span></>
            }
          </div>
          <div className="strip-text">
            <div className="kontakt-eyebrow">Kontakt &amp; Spenden</div>
            <div className="kontakt-h2">Wir freuen uns auf Sie</div>
            <p className="kontakt-p">
              📞 <strong>02227 9328383</strong><br/>
              GFO Bornheim-Merten · Kloster Merten<br/>
              53332 Bornheim-Merten<br/>
              🌐 rikscha-kutscher.de
            </p>
            <div>
              <div style={{fontSize:'7pt',color:'rgba(255,255,255,0.6)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:'1.5mm'}}>Spenden (freiwillig)</div>
              <span className="kontakt-iban">DE57 3705 0299 0000 4756 46</span>
              <div style={{fontSize:'7pt',color:'rgba(255,255,255,0.55)'}}>Kreissparkasse Köln · Förderverein Sankt Martin Merten</div>
            </div>
            <div className="kontakt-am">
              <svg viewBox="0 0 120 42" fill="none" width="60" height="21">
                <rect width="120" height="42" rx="4" fill="#E2001A"/>
                <circle cx="15" cy="9" r="5" fill="#fff"/>
                <path d="M6 18C6 13 10 11 15 14C20 11 24 13 24 18C24 23 15 30 15 30C15 30 6 23 6 18Z" fill="#fff"/>
                <text x="32" y="18" fontFamily="Arial Black,Arial,sans-serif" fontWeight="900" fontSize="11" fill="#fff">aktion</text>
                <text x="32" y="31" fontFamily="Arial Black,Arial,sans-serif" fontWeight="900" fontSize="11" fill="#fff">mensch</text>
              </svg>
              <span className="kontakt-am"><span>Gefördert durch Aktion Mensch — Jruuse Piter &amp; 2 neue Rikschas ab 2027</span></span>
            </div>
          </div>
        </div>

        {/* Rückseite Streifen 2: Gutschein */}
        <div className="strip strip-inner-a">
          <div className="strip-row" style={{width:'100%',gap:'8mm',alignItems:'flex-start'}}>
            <div className="gutschein-wrap" style={{flex:1}}>
              <span className="gutschein-tag">Geschenkgutschein</span>
              <div className="gutschein-h2">Rikschafahrt verschenken</div>
              <p className="gutschein-sub">Ausschneiden, ausfüllen &amp; verschenken — kostenlos einlösen unter 02227 9328383.</p>
              <div className="gutschein-body">
                <div><div className="gutschein-label">Für</div><div className="gutschein-line">&nbsp;</div></div>
                <div><div className="gutschein-label">Von</div><div className="gutschein-line">&nbsp;</div></div>
                <div className="gutschein-foot">🛺 Mertener Rikschakutscher · kostenlos · 02227 9328383</div>
              </div>
            </div>
            <div style={{flex:1,paddingTop:'1mm'}}>
              <div style={{fontSize:'7pt',textTransform:'uppercase',letterSpacing:'0.1em',color:'var(--mid)',marginBottom:'2mm'}}>♿ Neu ab 2027</div>
              <div style={{fontFamily:'var(--serif)',fontSize:'12pt',color:'var(--ink)',marginBottom:'2mm',lineHeight:'1.2'}}>Barrierefreie Fahrten</div>
              <p style={{fontSize:'8pt',color:'var(--mid)',lineHeight:'1.55'}}>Dank Förderung durch Aktion Mensch erweitern wir unser Angebot — Rikschafahrten für Menschen mit Behinderung und eingeschränkter Mobilität.</p>
            </div>
          </div>
        </div>

        {/* Rückseite Streifen 3: Einladung */}
        <div className="strip strip-inner-b">
          <div className="inner-b-h">Kommen Sie mit auf Tour!</div>
          <div className="inner-b-sub">Elf ehrenamtliche Piloten freuen sich auf Ihre Anfrage.<br/>Ob alleine oder mit Begleitung — alle sind willkommen.</div>
          <div>
            <span className="inner-b-chip">📞 02227 9328383</span>
            <span className="inner-b-chip">🌐 rikscha-kutscher.de</span>
            <span className="inner-b-chip">Mertener Heide · Bornheim</span>
          </div>
        </div>

      </div>
    </>
  );
}
