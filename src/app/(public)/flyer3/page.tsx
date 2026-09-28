export const dynamic = 'force-dynamic';
import type { Metadata } from 'next';
import { createServiceClient } from '@/lib/supabase';
import PrintButton from './PrintButton';

export const metadata: Metadata = {
  title: 'Flyer A4 Z-Falz (vollständig) – Mertener Rikschakutscher',
};

const SCHLUSSEL = [
  'flyer_fahrten_text', 'flyer_lotte_text', 'flyer_flitzer_text', 'flyer_piter_text',
  'flyer_foto_fahrt1', 'flyer_foto_fahrt2', 'flyer_foto_lotte', 'flyer_foto_flitzer', 'flyer_foto_piter',
  'flyer_v3_card1_titel', 'flyer_v3_card1_text', 'flyer_v3_card2_titel', 'flyer_v3_card2_text',
  'flyer_gutschein_hinweis',
];

const DEFAULT: Record<string, string> = {
  flyer_fahrten_text:    'Ob Seniorenausflug, Familienbesuch oder besonderer Anlass — unsere ehrenamtlichen Piloten bringen Sie sicher und stilvoll ans Ziel. Alle Fahrten sind kostenlos und für jeden zugänglich.',
  flyer_lotte_text:      'Die klassische Rikscha — geräumig, komfortabel, mit Rundumblick. Ob zur Kirche, zum Rhein oder durch die Mertener Heide: Flotte Lotte ermöglicht entspanntes Mitfahren mit großer Wirkung. Ideal für Seniorengruppen und Familienausflüge.',
  flyer_flitzer_text:    'Ideal für sehbehinderte oder körperlich eingeschränkte Menschen — wer mag, kann sogar mittreten! Nah am Boden, nah am Leben — eine völlig neue Perspektive.',
  flyer_piter_text:      'Pilot und Gast fahren Seite an Seite — besonders für Menschen mit Demenz. Das Nebeneinander schafft Sicherheit, Nähe und Gespräche auf Augenhöhe.',
  flyer_foto_fahrt1:     '',
  flyer_foto_fahrt2:     '',
  flyer_foto_lotte:      '',
  flyer_foto_flitzer:    '',
  flyer_foto_piter:      '',
  flyer_v3_card1_titel:  'Wer sind unsere Kutscher?',
  flyer_v3_card1_text:   'Rund zehn engagierte Freiwillige aus Bornheim-Merten — unterschiedlichen Alters und aus ganz verschiedenen Berufen. Was sie verbindet: die Freude daran, anderen Menschen einen besonderen Moment zu schenken.',
  flyer_v3_card2_titel:  'Mitmachen?',
  flyer_v3_card2_text:   'Fahrradbegeistert & hilfsbereit? Wir freuen uns über jede Verstärkung! 📞 02227 9328383',
  flyer_gutschein_hinweis: 'Telefonisch einlösen · Alle Fahrten kostenlos · GFO Bornheim-Merten',
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

export default async function Flyer3Page() {
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
          --sheet-w: 210mm;
          --sheet-h: 297mm;
          --row-h:   99mm;
          --pad:     6mm;
        }

        body { background: #c8c8c8; font-family: var(--sans); }

        /* ── Nav ── */
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
        .side-label {
          text-align: center; font-size: 0.72rem; color: #555;
          letter-spacing: 0.1em; text-transform: uppercase;
          padding: 0.7rem 0 0.3rem;
        }

        /* ── Blatt ── */
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
        .sheet::before, .sheet::after {
          content: ''; position: absolute; left: 0; right: 0; height: 1px;
          background: rgba(0,0,0,0.18); z-index: 10; pointer-events: none;
        }
        .sheet::before { top: var(--row-h); }
        .sheet::after  { top: calc(var(--row-h) * 2); }

        /* ── Basis-Streifen ── */
        .strip {
          width: var(--sheet-w); height: var(--row-h);
          padding: var(--pad);
          display: flex; flex-direction: row; align-items: stretch;
          overflow: hidden; gap: var(--pad);
          -webkit-print-color-adjust: exact; print-color-adjust: exact;
        }
        .strip-photo {
          flex-shrink: 0; width: 80mm;
          align-self: stretch; border-radius: 6px; overflow: hidden;
          background: rgba(255,255,255,0.15);
          display: flex; align-items: center; justify-content: center;
          flex-direction: column; gap: 2mm; font-size: 2rem;
        }
        .strip-photo img { width: 100%; height: 100%; object-fit: cover; }
        .strip-text {
          flex: 1; display: flex; flex-direction: column;
          justify-content: space-between; gap: 0;
        }

        /* ══ DECKBLATT ══ */
        .strip-cover {
          background: linear-gradient(135deg, #3A8A26 0%, #1C4A10 100%);
          color: #fff; align-items: center;
        }
        .cover-logo-wrap {
          flex-shrink: 0; width: 80px; height: 80px; border-radius: 50%;
          background: rgba(255,255,255,0.15);
          display: flex; align-items: center; justify-content: center;
          margin-right: calc(var(--pad) - 2mm);
        }
        .cover-logo-wrap img { width: 70px; height: 70px; border-radius: 50%; object-fit: cover; }
        .cover-eyebrow { font-size: 10pt; letter-spacing: 0.14em; text-transform: uppercase; color: rgba(255,255,255,0.65); }
        .cover-h1 { font-family: var(--serif); font-size: 28pt; font-weight: normal; color: #fff; line-height: 1.15; }
        .cover-tagline { font-size: 12pt; color: rgba(255,255,255,0.88); line-height: 1.6; }
        .cover-contact { font-size: 11pt; color: rgba(255,255,255,0.95); line-height: 1.75; background: rgba(255,255,255,0.14); border-radius: 5px; padding: 3mm 4mm; }
        .cover-contact strong { font-size: 13pt; display: block; margin-bottom: 1mm; }

        /* ══ FAHRTEN ══ */
        .strip-fahrten { background: var(--orange); color: #fff; }
        .strip-fahrten .strip-photo { background: rgba(255,255,255,0.15); color: rgba(255,255,255,0.6); }
        .fahrten-eyebrow { font-size: 10pt; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(255,255,255,0.7); }
        .fahrten-h2 { font-family: var(--serif); font-size: 26pt; font-weight: normal; color: #fff; line-height: 1.15; }
        .fahrten-p { font-size: 11pt; color: rgba(255,255,255,0.92); line-height: 1.6; }
        .fahrten-chips { display: flex; flex-wrap: wrap; gap: 1.5mm; }
        .fahrten-chip { font-size: 9.5pt; font-weight: 700; padding: 1.5mm 3mm; border-radius: 99px; background: rgba(255,255,255,0.22); color: #fff; }
        .fahrten-extra { font-size: 9.5pt; color: rgba(255,255,255,0.9); line-height: 1.5; background: rgba(255,255,255,0.12); border-left: 3px solid rgba(255,255,255,0.5); padding: 2mm 3mm; border-radius: 3px; }

        /* ══ FAHRZEUGE ══ */
        .strip-vehicles {
          background: var(--cream); color: var(--ink);
          align-items: stretch; gap: 3mm; padding: var(--pad);
        }
        .vehicle-card {
          flex: 1; align-self: stretch; display: flex; flex-direction: column;
          align-items: flex-start; gap: 1.5mm; overflow: hidden;
        }
        .vehicle-photo {
          width: 100%; flex: 1; min-height: 30mm; border-radius: 5px; overflow: hidden;
          background: #ddd; display: flex; align-items: center; justify-content: center; font-size: 1.8rem;
        }
        .vehicle-photo img { width: 100%; height: 100%; object-fit: cover; }
        .vbadge { font-size: 8pt; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; padding: 1mm 2.5mm; border-radius: 99px; display: inline-block; }
        .vbadge-lotte   { background: #dcfce7; color: #15803d; }
        .vbadge-flitzer { background: #dbeafe; color: #1d4ed8; }
        .vbadge-piter   { background: #ffedd5; color: #9c3a07; }
        .vname { font-family: var(--serif); font-size: 16pt; font-weight: normal; color: var(--ink); line-height: 1.1; }
        .vdesc { font-size: 9.5pt; color: var(--mid); line-height: 1.5; }
        .vdivider { width: 1px; background: #ddd; flex-shrink: 0; align-self: stretch; }

        /* ══ KONTAKT+SPENDEN ══ */
        .strip-kontakt { background: #1C4A10; color: #fff; }
        .strip-kontakt .strip-photo { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.5); }
        .kontakt-eyebrow { font-size: 10pt; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(255,255,255,0.6); }
        .kontakt-h2 { font-family: var(--serif); font-size: 26pt; font-weight: normal; color: #fff; line-height: 1.15; }
        .kontakt-p { font-size: 11pt; color: rgba(255,255,255,0.88); line-height: 1.8; }
        .kontakt-iban { font-family: monospace; font-size: 9.5pt; background: rgba(255,255,255,0.12); padding: 1.5mm 2.5mm; border-radius: 3px; color: #fff; display: inline-block; margin: 0.5mm 0; }

        /* ══ GUTSCHEIN + FAHRTGÄSTE ══ */
        .strip-gutschein {
          background: #fffdf7; color: var(--ink);
          flex-direction: row; gap: var(--pad);
        }
        .gutschein-panel {
          flex: 1.1; display: flex; flex-direction: column; gap: 2mm;
          border: 2px dashed var(--gold); border-radius: 6px; padding: 4mm;
          position: relative;
        }
        .gutschein-tag { display: inline-block; background: var(--gold); color: #fff; font-size: 7pt; font-weight: 700; padding: 1mm 3mm; border-radius: 99px; margin-bottom: 1mm; align-self: flex-start; }
        .gutschein-title { font-family: var(--serif); font-size: 15pt; font-weight: normal; color: var(--green); line-height: 1.1; }
        .gutschein-row { display: flex; gap: 3mm; }
        .gutschein-field { flex: 1; display: flex; flex-direction: column; gap: 1mm; }
        .gutschein-label { font-size: 6.5pt; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--gold); }
        .gutschein-line { border-bottom: 1.5px solid #d6ccb8; height: 18px; }
        .gutschein-checks { display: flex; gap: 3mm; flex-wrap: wrap; }
        .gcheck { display: flex; align-items: center; gap: 1.5mm; font-size: 8pt; font-weight: 600; }
        .gcheck .box { width: 11px; height: 11px; border: 1.5px solid currentColor; border-radius: 2px; flex-shrink: 0; }
        .gcheck-lotte   { color: #b45309; }
        .gcheck-flitzer { color: #0369a1; }
        .gcheck-piter   { color: #6d28d9; }
        .gutschein-foot { font-size: 6pt; color: var(--mid); font-style: italic; text-align: center; border-top: 1px dashed #ccc; padding-top: 2mm; margin-top: auto; }
        .scissors { position: absolute; bottom: -8px; left: 8px; font-size: 0.8rem; background: #fffdf7; padding: 0 3px; z-index: 11; }

        .fahrtgaeste-panel {
          flex: 1; display: flex; flex-direction: column; gap: 2.5mm;
          background: #fff7e6; border-radius: 6px; padding: 4mm;
          border: 2px solid #e8c87a;
        }
        .fg-eyebrow { font-size: 7pt; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--gold); }
        .fg-title { font-family: var(--serif); font-size: 14pt; color: var(--ink); line-height: 1.2; }
        .fg-text { font-size: 9.5pt; color: var(--mid); line-height: 1.6; }
        .fg-phone { font-size: 10pt; font-weight: 700; color: var(--green); }

        /* ══ PILOTEN / KUTSCHER ══ */
        .strip-piloten {
          background: #2a5c1a; color: #fff;
          flex-direction: column; justify-content: space-between; gap: 3mm;
        }
        .piloten-h { font-family: var(--serif); font-size: 20pt; font-weight: normal; color: #fff; line-height: 1.2; text-align: center; }
        .piloten-cards { display: flex; gap: 3mm; flex: 1; }
        .piloten-card {
          flex: 1; background: rgba(255,255,255,0.1); border-radius: 6px; padding: 3mm;
          display: flex; flex-direction: column; gap: 1.5mm;
        }
        .piloten-card-title { font-family: var(--serif); font-size: 11pt; color: #fff; line-height: 1.2; }
        .piloten-card-text { font-size: 9pt; color: rgba(255,255,255,0.85); line-height: 1.55; }
        .piloten-am { display: flex; align-items: center; gap: 4mm; background: rgba(255,255,255,0.12); border-radius: 6px; padding: 3mm 5mm; }
        .piloten-am-text { font-size: 11pt; color: #fff; line-height: 1.5; }

        /* ── Print ── */
        @media print {
          .print-bar, .print-hint, .side-label { display: none; }
          body { background: #fff; margin: 0; }
          .sheet { margin: 0; box-shadow: none; page-break-after: always; }
          .sheet:last-of-type { page-break-after: auto; }
          @page { size: A4 portrait; margin: 0; }
        }
      `}</style>

      <div className="print-bar">
        <a href="/">← Startseite</a>
        <span style={{color:'rgba(255,255,255,0.4)',margin:'0 0.5rem'}}>·</span>
        <a href="/flyer">Stufenfalz-Flyer</a>
        <span style={{color:'rgba(255,255,255,0.4)',margin:'0 0.5rem'}}>·</span>
        <a href="/flyer2">Z-Falz einfach</a>
        <span style={{fontSize:'0.78rem',color:'rgba(255,255,255,0.7)',marginLeft:'0.5rem'}}>Flyer A4 Z-Falz · vollständiger Inhalt</span>
        <PrintButton />
      </div>
      <div className="print-hint">
        ℹ️ Beide Seiten auf <strong>ein Blatt A4 hochkant</strong> drucken (beidseitig). Entlang der Falzlinien Z-falten — Deckblatt liegt außen oben.
      </div>

      {/* ═══ VORDERSEITE ═══ */}
      <p className="side-label">Vorderseite — Außenseite</p>
      <div className="sheet">

        {/* Streifen 1: Deckblatt (= V4 Cover) */}
        <div className="strip strip-cover">
          <div className="cover-logo-wrap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://hcbqmqyxpasojbrewnps.supabase.co/storage/v1/object/public/piloten-dateien/1789230837654-o3j4ecfxsw.png" alt="Logo"/>
          </div>
          <div className="strip-text">
            <div className="cover-eyebrow">Bornheim-Merten · seit 2018</div>
            <div className="cover-h1">Mertener Rikscha&shy;kutscher</div>
            <div className="cover-tagline">Kostenlose Rikschafahrten — mit Herz, Pedalen und elf begeisterten Kutschern.</div>
            <div style={{display:'flex',gap:'3mm',alignItems:'stretch'}}>
              <div className="cover-contact" style={{flex:1}}>
                <strong>📞 02227 9328383</strong>
                GFO Bornheim-Merten<br/>
                🌐 rikscha-merten.de<br/>
                <span style={{fontSize:'10pt',color:'rgba(255,255,255,0.8)'}}>📅 Termine online buchbar</span>
              </div>
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'3mm',background:'rgba(255,255,255,0.12)',borderRadius:'5px',padding:'3mm 4mm',flex:1,textAlign:'center'}}>
                <svg viewBox="0 0 120 42" fill="none" width="160" height="56" style={{flexShrink:0}}>
                  <rect width="120" height="42" rx="4" fill="#E2001A"/>
                  <circle cx="15" cy="9" r="5" fill="#fff"/>
                  <path d="M6 18C6 13 10 11 15 14C20 11 24 13 24 18C24 23 15 30 15 30C15 30 6 23 6 18Z" fill="#fff"/>
                  <text x="32" y="18" fontFamily="Arial Black,Arial,sans-serif" fontWeight="900" fontSize="11" fill="#fff">aktion</text>
                  <text x="32" y="31" fontFamily="Arial Black,Arial,sans-serif" fontWeight="900" fontSize="11" fill="#fff">mensch</text>
                </svg>
                <span style={{fontSize:'11pt',color:'rgba(255,255,255,0.9)',lineHeight:'1.6'}}>finanziert<br/><strong style={{fontSize:'13pt'}}>3 Rikschas</strong><br/>für Merten</span>
              </div>
            </div>
          </div>
        </div>

        {/* Streifen 2: Fahrten (= V2) */}
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
              <span className="fahrten-chip">Gutscheine erhältlich</span>
            </div>
            <div className="fahrten-extra">
              💡 <strong>Fahrtgäste herzlich willkommen!</strong> Kennen Sie jemanden?
              Begleitpersonen können selbstverständlich mitfahren. 📞 02227&nbsp;9328383
            </div>
          </div>
        </div>

        {/* Streifen 3: Fahrzeuge (= R1+R2+R3) */}
        <div className="strip strip-vehicles">
          <div className="vehicle-card">
            <div className="vehicle-photo">
              {c.flyer_foto_lotte ? <img src={c.flyer_foto_lotte} alt="Flotte Lotte"/> : <>🛺</>}
            </div>
            <span className="vbadge vbadge-lotte">Rikscha · 2 Gäste</span>
            <div className="vname">Flotte Lotte</div>
            <p className="vdesc">{c.flyer_lotte_text}</p>
          </div>
          <div className="vdivider"/>
          <div className="vehicle-card">
            <div className="vehicle-photo">
              {c.flyer_foto_flitzer ? <img src={c.flyer_foto_flitzer} alt="Flinker Flitzer"/> : <>🚲</>}
            </div>
            <span className="vbadge vbadge-flitzer">Liegetandem · 1 Gast</span>
            <div className="vname">Flinker Flitzer</div>
            <p className="vdesc">{c.flyer_flitzer_text}</p>
          </div>
          <div className="vdivider"/>
          <div className="vehicle-card">
            <div className="vehicle-photo">
              {c.flyer_foto_piter ? <img src={c.flyer_foto_piter} alt="Jruuse Piter"/> : <>🚀</>}
            </div>
            <span className="vbadge vbadge-piter">Paralleltandem · 1 Gast</span>
            <div className="vname">Jruuse Piter</div>
            <p className="vdesc">{c.flyer_piter_text}</p>
          </div>
        </div>

      </div>

      {/* ═══ RÜCKSEITE ═══ */}
      <p className="side-label">Rückseite — Innenseite</p>
      <div className="sheet">

        {/* Streifen 1: Kontakt + Spenden (= R4) */}
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
              🌐 rikscha-merten.de &nbsp;·&nbsp; 📅 Termine online buchbar
            </p>
            <div style={{display:'flex',flexDirection:'column',gap:'1.5mm'}}>
              <div style={{fontSize:'7pt',color:'rgba(255,255,255,0.6)',textTransform:'uppercase',letterSpacing:'0.1em'}}>Spenden — Förderverein „Miteinander Kloster Merten e.V." · Stichwort: Rikscha</div>
              <span className="kontakt-iban">KSK Köln &nbsp; DE79 3705 0299 0049 0050 40</span>
              <span className="kontakt-iban">Volksbank &nbsp; DE14 3806 0186 0410 0560 11</span>
            </div>
          </div>
        </div>

        {/* Streifen 2: Gutschein (= V1) + Fahrtgäste */}
        <div className="strip strip-gutschein">
          <div className="gutschein-panel">
            <span className="gutschein-tag">Geschenkgutschein</span>
            <div className="gutschein-title">Rikschafahrt verschenken</div>
            <div className="gutschein-field">
              <div className="gutschein-label">Für</div>
              <div className="gutschein-line"/>
            </div>
            <div className="gutschein-field">
              <div className="gutschein-label">Fahrzeugwunsch</div>
              <div className="gutschein-checks">
                <span className="gcheck gcheck-lotte"><span className="box"></span>Flotte Lotte</span>
                <span className="gcheck gcheck-flitzer"><span className="box"></span>Flinker Flitzer</span>
                <span className="gcheck gcheck-piter"><span className="box"></span>Jruuse Piter</span>
              </div>
            </div>
            <div className="gutschein-row">
              <div className="gutschein-field">
                <div className="gutschein-label">Wunschdatum</div>
                <div className="gutschein-line"/>
              </div>
              <div className="gutschein-field">
                <div className="gutschein-label">Geschenk von</div>
                <div className="gutschein-line"/>
              </div>
            </div>
            <div className="gutschein-foot">{c.flyer_gutschein_hinweis}</div>
            <span className="scissors">✂</span>
          </div>
          <div className="fahrtgaeste-panel">
            <div className="fg-eyebrow">💡 Kennen Sie jemanden?</div>
            <div className="fg-title">Fahrtgäste herzlich willkommen!</div>
            <p className="fg-text">
              Senioren, Menschen mit eingeschränkter Mobilität oder Demenz-Betroffene —
              melden Sie sich gerne auch für andere.<br/>
              Begleitpersonen können selbstverständlich mitfahren.
            </p>
            <div className="fg-phone">📞 02227 9328383</div>
          </div>
        </div>

        {/* Streifen 3: Piloten / Kutscher (= V3) */}
        <div className="strip strip-piloten">
          <div className="piloten-h">Unsere Kutscher — Menschen, die anpacken</div>
          <div className="piloten-cards">
            <div className="piloten-card">
              <div className="piloten-card-title">{c.flyer_v3_card1_titel}</div>
              <p className="piloten-card-text">{c.flyer_v3_card1_text}</p>
            </div>
            <div className="piloten-card">
              <div className="piloten-card-title">{c.flyer_v3_card2_titel}</div>
              <p className="piloten-card-text">{c.flyer_v3_card2_text}</p>
            </div>
          </div>
          <div className="piloten-am">
            <svg viewBox="0 0 120 42" fill="none" width="130" height="45" style={{flexShrink:0}}>
              <rect width="120" height="42" rx="4" fill="#E2001A"/>
              <circle cx="15" cy="9" r="5" fill="#fff"/>
              <path d="M6 18C6 13 10 11 15 14C20 11 24 13 24 18C24 23 15 30 15 30C15 30 6 23 6 18Z" fill="#fff"/>
              <text x="32" y="18" fontFamily="Arial Black,Arial,sans-serif" fontWeight="900" fontSize="11" fill="#fff">aktion</text>
              <text x="32" y="31" fontFamily="Arial Black,Arial,sans-serif" fontWeight="900" fontSize="11" fill="#fff">mensch</text>
            </svg>
            <span className="piloten-am-text">finanziert <strong>3 Rikschas</strong> für Merten</span>
          </div>
        </div>

      </div>
    </>
  );
}
