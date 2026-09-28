export const dynamic = 'force-dynamic';
import type { Metadata } from 'next';
import { createServiceClient } from '@/lib/supabase';
import PrintButton from './PrintButton';

export const metadata: Metadata = {
  title: 'Flyer A4 Mittelfalz – Mertener Rikschakutscher',
};

const SCHLUSSEL = [
  'flyer_fahrten_text', 'flyer_lotte_text', 'flyer_flitzer_text', 'flyer_piter_text',
  'flyer_foto_fahrt1', 'flyer_foto_fahrt2', 'flyer_foto_lotte', 'flyer_foto_flitzer', 'flyer_foto_piter',
];

const DEFAULT: Record<string, string> = {
  flyer_fahrten_text:  'Ob Seniorenausflug, Familienbesuch oder besonderer Anlass — unsere ehrenamtlichen Piloten bringen Sie sicher und stilvoll ans Ziel. Alle Fahrten sind kostenlos und für jeden zugänglich.',
  flyer_lotte_text:    'Die klassische Rikscha — geräumig, komfortabel, mit Rundumblick. Ob zur Kirche, zum Rhein oder durch die Mertener Heide: Flotte Lotte ermöglicht entspanntes Mitfahren mit großer Wirkung.',
  flyer_flitzer_text:  'Ideal für sehbehinderte oder körperlich eingeschränkte Menschen — wer mag, kann sogar mittreten! Nah am Boden, nah am Leben — eine völlig neue Perspektive.',
  flyer_piter_text:    'Pilot und Gast fahren Seite an Seite — besonders für Menschen mit Demenz. Das Nebeneinander schafft Sicherheit, Nähe und Gespräche auf Augenhöhe.',
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
          /* A4 quer: 297mm × 210mm, Mittelfalz → 2 Panels à 148.5mm × 210mm */
          --sheet-w: 297mm;
          --sheet-h: 210mm;
          --col-w:   148.5mm;
          --pad:     10mm;
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
          grid-template-columns: var(--col-w) var(--col-w);
          overflow: hidden;
          position: relative;
          margin: 0 auto 1.5rem;
          box-shadow: 0 4px 28px rgba(0,0,0,0.25);
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        /* Falzlinie Mitte */
        .sheet::before {
          content: '';
          position: absolute;
          top: 0; bottom: 0;
          left: var(--col-w);
          width: 1px;
          background: rgba(0,0,0,0.15);
          z-index: 10;
          pointer-events: none;
        }

        /* ── Basis-Panel ── */
        .panel {
          width: var(--col-w);
          height: var(--sheet-h);
          padding: var(--pad);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        /* ══ DECKBLATT (Vorderseite rechts) ══ */
        .panel-cover {
          background: linear-gradient(155deg, #3A8A26 0%, #1C4A10 100%);
          color: #fff;
          align-items: center;
          justify-content: space-between;
          text-align: center;
        }
        .cover-logo {
          width: 56mm; height: 56mm; border-radius: 50%;
          background: rgba(255,255,255,0.15);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .cover-logo img { width: 46mm; height: 46mm; border-radius: 50%; object-fit: cover; }
        .cover-eyebrow { font-size: 8pt; letter-spacing: 0.14em; text-transform: uppercase; color: rgba(255,255,255,0.7); margin-bottom: 3mm; }
        .cover-h1 { font-family: var(--serif); font-size: 22pt; font-weight: normal; line-height: 1.2; color: #fff; text-wrap: balance; margin-bottom: 4mm; }
        .cover-tagline { font-size: 10pt; color: rgba(255,255,255,0.88); line-height: 1.6; text-wrap: balance; }
        .cover-contact {
          background: rgba(255,255,255,0.18); border-radius: 6px;
          padding: 5mm 6mm; font-size: 10pt; color: #fff; line-height: 1.85;
          width: 100%; text-align: center;
        }
        .cover-contact strong { display: block; font-size: 10.5pt; margin-bottom: 2mm; }

        /* ══ RÜCKSEITE-PANEL (Vorderseite links) ══ */
        .panel-back {
          background: #1C4A10;
          color: #fff;
          justify-content: space-between;
        }
        .back-top {}
        .back-eyebrow { font-size: 8pt; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(255,255,255,0.65); margin-bottom: 3mm; }
        .back-h2 { font-family: var(--serif); font-size: 18pt; font-weight: normal; color: #fff; margin-bottom: 5mm; line-height: 1.2; }
        .back-photo { flex: 1; border-radius: 6px; overflow: hidden; background: rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 3mm; color: rgba(255,255,255,0.5); font-size: 9pt; margin-bottom: 5mm; min-height: 50mm; }
        .back-photo img { width: 100%; height: 100%; object-fit: cover; }
        .back-contact-box { background: rgba(255,255,255,0.12); border-radius: 5px; padding: 4mm 5mm; }
        .back-contact-box p { font-size: 9pt; color: rgba(255,255,255,0.88); line-height: 1.8; margin-bottom: 0; }
        .back-divider { border: none; border-top: 1px solid rgba(255,255,255,0.2); margin: 3.5mm 0; }
        .back-spenden-label { font-size: 7.5pt; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(255,255,255,0.6); margin-bottom: 2mm; }
        .back-iban { font-family: monospace; font-size: 8.5pt; background: rgba(255,255,255,0.12); padding: 2mm 3mm; border-radius: 3px; color: #fff; display: block; margin-bottom: 2mm; }
        .back-iban-sub { font-size: 7.5pt; color: rgba(255,255,255,0.65); margin-bottom: 3mm; }
        .back-am { display: flex; align-items: center; gap: 2.5mm; }
        .back-am span { font-size: 8pt; color: rgba(255,255,255,0.8); line-height: 1.4; }

        /* ══ INNENSEITE LINKS ══ */
        .panel-inner-l {
          background: var(--orange);
          color: #fff;
          justify-content: space-between;
        }
        .il-eyebrow { font-size: 8pt; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(255,255,255,0.75); margin-bottom: 3mm; }
        .il-h2 { font-family: var(--serif); font-size: 20pt; font-weight: normal; color: #fff; margin-bottom: 4mm; line-height: 1.2; }
        .il-photo { flex: 1; border-radius: 6px; overflow: hidden; background: rgba(255,255,255,0.15); display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 3mm; color: rgba(255,255,255,0.6); font-size: 9pt; margin-bottom: 4mm; min-height: 55mm; }
        .il-photo img { width: 100%; height: 100%; object-fit: cover; }
        .il-text { font-size: 9.5pt; color: rgba(255,255,255,0.92); line-height: 1.65; margin-bottom: 4mm; }
        .il-chips { display: flex; flex-wrap: wrap; gap: 2mm; margin-bottom: 4mm; }
        .il-chip { font-size: 8pt; font-weight: 700; padding: 1.5mm 3mm; border-radius: 99px; background: rgba(255,255,255,0.22); color: #fff; }
        .il-bf { background: rgba(255,255,255,0.18); border-left: 3px solid rgba(255,255,255,0.7); border-radius: 4px; padding: 3.5mm 4mm; margin-bottom: 4mm; }
        .il-bf strong { font-size: 9.5pt; color: #fff; display: block; margin-bottom: 1.5mm; }
        .il-bf span { font-size: 8.5pt; color: rgba(255,255,255,0.9); line-height: 1.55; }
        .il-tipp { background: rgba(255,255,255,0.12); border-radius: 4px; padding: 3.5mm 4mm; }
        .il-tipp span { font-size: 8.5pt; color: rgba(255,255,255,0.88); line-height: 1.55; }

        /* ══ INNENSEITE RECHTS ══ */
        .panel-inner-r {
          background: var(--cream);
          justify-content: space-between;
        }
        .ir-vehicles { display: flex; flex-direction: column; gap: 4mm; flex: 1; }
        .ir-vehicle { display: flex; gap: 3.5mm; align-items: flex-start; }
        .ir-photo { width: 38mm; height: 38mm; border-radius: 5px; overflow: hidden; flex-shrink: 0; background: #ddd; display: flex; align-items: center; justify-content: center; font-size: 1.6rem; }
        .ir-photo img { width: 100%; height: 100%; object-fit: cover; }
        .ir-info {}
        .ir-badge { font-size: 6.5pt; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; padding: 1mm 2.5mm; border-radius: 99px; margin-bottom: 2mm; display: inline-block; }
        .ir-badge-lotte   { background: #dcfce7; color: #15803d; }
        .ir-badge-flitzer { background: #dbeafe; color: #1d4ed8; }
        .ir-badge-piter   { background: #ffedd5; color: #9c3a07; }
        .ir-h3 { font-family: var(--serif); font-size: 12pt; font-weight: normal; color: var(--ink); margin-bottom: 1.5mm; line-height: 1.2; }
        .ir-p { font-size: 8pt; color: var(--mid); line-height: 1.55; }
        .ir-divider { border: none; border-top: 1px solid #ddd; }
        /* Gutschein */
        .ir-voucher { }
        .ir-vtag { display: inline-block; background: var(--gold); color: #fff; font-size: 7.5pt; font-weight: 700; padding: 1.5mm 3.5mm; border-radius: 99px; margin-bottom: 3mm; }
        .ir-vh2 { font-family: var(--serif); font-size: 14pt; font-weight: normal; color: var(--ink); margin-bottom: 2mm; line-height: 1.2; }
        .ir-vsub { font-size: 8pt; color: var(--mid); line-height: 1.5; margin-bottom: 3mm; }
        .ir-vbody { border: 2px dashed var(--gold); border-radius: 6px; padding: 4mm; display: flex; flex-direction: column; gap: 3mm; }
        .ir-vl { font-size: 7pt; color: var(--mid); margin-bottom: 1mm; }
        .ir-vline { border-bottom: 1px solid #ccc; padding-bottom: 5mm; }
        .ir-vfoot { font-size: 7pt; color: var(--mid); margin-top: 3mm; line-height: 1.6; text-align: center; }

        /* ── Print ── */
        @media print {
          .print-bar, .print-hint, .side-label { display: none; }
          body { background: #fff; margin: 0; }
          .sheet { margin: 0; box-shadow: none; page-break-after: always; }
          .sheet:last-of-type { page-break-after: auto; }
          @page { size: A4 landscape; margin: 0; }
        }
      `}</style>

      {/* Druck-Nav */}
      <div className="print-bar">
        <a href="/">← Startseite</a>
        <span style={{color:'rgba(255,255,255,0.4)',margin:'0 0.5rem'}}>·</span>
        <span style={{fontSize:'0.78rem',color:'rgba(255,255,255,0.7)'}}>Flyer A4 Mittelfalz · beidseitig drucken, einmal in der Mitte falten</span>
        <PrintButton />
      </div>
      <div className="print-hint">
        ℹ️ Beide Seiten auf <strong>ein Blatt A4 quer</strong> drucken (beidseitig). Einmal in der Mitte falten — fertig. Deckblatt liegt außen rechts.
      </div>

      {/* ═══ VORDERSEITE ═══ */}
      <p className="side-label">Vorderseite — links: Rückseite des Flyers · rechts: Deckblatt</p>
      <div className="sheet">

        {/* Links = Rückseite des gefalteten Flyers */}
        <div className="panel panel-back">
          <div className="back-top">
            <div className="back-eyebrow">Mertener Rikschakutscher</div>
            <div className="back-h2">Kontakt &amp; Spenden</div>
          </div>
          <div className="back-photo">
            {c.flyer_foto_fahrt2
              ? <img src={c.flyer_foto_fahrt2} alt="Rikschafahrt"/>
              : <><span style={{fontSize:'3rem'}}>📷</span><span>Foto einer Fahrt</span></>
            }
          </div>
          <div>
            <div className="back-contact-box">
              <p>📞 <strong>02227 9328383</strong><br/>
              GFO Bornheim-Merten · Kloster Merten<br/>
              53332 Bornheim-Merten<br/>
              🌐 rikscha-kutscher.de</p>
            </div>
            <hr className="back-divider"/>
            <div className="back-spenden-label">Spenden (freiwillig)</div>
            <span className="back-iban">DE57 3705 0299 0000 4756 46</span>
            <p className="back-iban-sub">Kreissparkasse Köln · Förderverein Sankt Martin Merten</p>
            <div className="back-am">
              <svg viewBox="0 0 120 42" fill="none" width="70" height="24">
                <rect width="120" height="42" rx="4" fill="#E2001A"/>
                <circle cx="15" cy="9" r="5" fill="#fff"/>
                <path d="M6 18C6 13 10 11 15 14C20 11 24 13 24 18C24 23 15 30 15 30C15 30 6 23 6 18Z" fill="#fff"/>
                <line x1="4" y1="19" x2="9" y2="17" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                <line x1="26" y1="19" x2="21" y2="17" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                <text x="32" y="18" fontFamily="Arial Black,Arial,sans-serif" fontWeight="900" fontSize="11" fill="#fff">aktion</text>
                <text x="32" y="31" fontFamily="Arial Black,Arial,sans-serif" fontWeight="900" fontSize="11" fill="#fff">mensch</text>
              </svg>
              <span className="back-am"><span>Gefördert durch Aktion Mensch — Jruuse Piter &amp; 2 neue Rikschas ab 2027</span></span>
            </div>
          </div>
        </div>

        {/* Rechts = Deckblatt */}
        <div className="panel panel-cover">
          <div className="cover-logo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://hcbqmqyxpasojbrewnps.supabase.co/storage/v1/object/public/piloten-dateien/1789230837654-o3j4ecfxsw.png" alt="Logo"/>
          </div>
          <div>
            <div className="cover-eyebrow">Bornheim-Merten · seit 2018</div>
            <div className="cover-h1">Mertener Rikscha&shy;kutscher</div>
            <div className="cover-tagline">Kostenlose Rikschafahrten durch Merten — mit Herz, Pedalen und elf begeisterten Kutschern.</div>
          </div>
          <div className="cover-contact">
            <strong>📞 Fahrt anfragen</strong>
            02227 9328383<br/>
            GFO Bornheim-Merten<br/>
            rikscha-kutscher.de
          </div>
        </div>

      </div>

      {/* ═══ RÜCKSEITE / INNENSEITE ═══ */}
      <p className="side-label">Rückseite — Innenseite des gefalteten Flyers</p>
      <div className="sheet">

        {/* Innenseite links: Fahrten */}
        <div className="panel panel-inner-l">
          <div className="il-eyebrow">Kostenlos &amp; herzlich</div>
          <div className="il-h2">Fahrtwind für alle</div>
          <div className="il-photo">
            {c.flyer_foto_fahrt1
              ? <img src={c.flyer_foto_fahrt1} alt="Rikschafahrt"/>
              : <><span style={{fontSize:'3rem'}}>🛺</span><span>Foto einer Fahrt</span></>
            }
          </div>
          <p className="il-text">{c.flyer_fahrten_text}</p>
          <div className="il-chips">
            <span className="il-chip">Kostenlos</span>
            <span className="il-chip">Ehrenamtlich</span>
            <span className="il-chip">Gruppenfahrten möglich</span>
            <span className="il-chip">🚀 Ab 2027: 5 Rikschas</span>
          </div>
          <div className="il-bf">
            <strong>♿ Neu ab 2027 — dank Aktion Mensch</strong>
            <span>Rikschafahrten jetzt auch offiziell für Menschen mit Behinderung und eingeschränkter Mobilität. Begleitpersonen herzlich willkommen.</span>
          </div>
          <div className="il-tipp">
            <span>💡 <strong>Tipp geben:</strong> Kennen Sie jemanden, dem eine Fahrt Freude bereiten würde? Melden Sie sich — gerne auch mit Begleitung.</span>
          </div>
        </div>

        {/* Innenseite rechts: Fahrzeuge + Gutschein */}
        <div className="panel panel-inner-r">
          <div className="ir-vehicles">
            <div className="ir-vehicle">
              <div className="ir-photo">
                {c.flyer_foto_lotte ? <img src={c.flyer_foto_lotte} alt="Flotte Lotte"/> : <>🛺</>}
              </div>
              <div className="ir-info">
                <span className="ir-badge ir-badge-lotte">Rikscha · 2 Gäste</span>
                <div className="ir-h3">Flotte Lotte</div>
                <p className="ir-p">{c.flyer_lotte_text}</p>
              </div>
            </div>
            <hr className="ir-divider"/>
            <div className="ir-vehicle">
              <div className="ir-photo">
                {c.flyer_foto_flitzer ? <img src={c.flyer_foto_flitzer} alt="Flinker Flitzer"/> : <>🚲</>}
              </div>
              <div className="ir-info">
                <span className="ir-badge ir-badge-flitzer">Liegetandem · 1 Gast</span>
                <div className="ir-h3">Flinker Flitzer</div>
                <p className="ir-p">{c.flyer_flitzer_text}</p>
              </div>
            </div>
            <hr className="ir-divider"/>
            <div className="ir-vehicle">
              <div className="ir-photo">
                {c.flyer_foto_piter ? <img src={c.flyer_foto_piter} alt="Jruuse Piter"/> : <>🚀</>}
              </div>
              <div className="ir-info">
                <span className="ir-badge ir-badge-piter">Paralleltandem · 1 Gast</span>
                <div className="ir-h3">Jruuse Piter</div>
                <p className="ir-p">{c.flyer_piter_text}</p>
              </div>
            </div>
          </div>
          <hr className="ir-divider" style={{marginTop:'4mm',marginBottom:'4mm'}}/>
          <div className="ir-voucher">
            <span className="ir-vtag">Geschenkgutschein</span>
            <div className="ir-vh2">Rikschafahrt verschenken</div>
            <p className="ir-vsub">Ausschneiden, ausfüllen &amp; verschenken — kostenlos einlösen unter 02227 9328383.</p>
            <div className="ir-vbody">
              <div><div className="ir-vl">Für</div><div className="ir-vline">&nbsp;</div></div>
              <div><div className="ir-vl">Von</div><div className="ir-vline">&nbsp;</div></div>
              <div style={{marginTop:'1mm',textAlign:'center',borderTop:'1px dashed #ccc',paddingTop:'2mm'}}>
                <span style={{fontSize:'7pt',color:'#888'}}>🛺 Mertener Rikschakutscher · kostenlos · 02227 9328383</span>
              </div>
            </div>
            <div className="ir-vfoot">Alle Fahrten sind kostenlos — GFO Bornheim-Merten</div>
          </div>
        </div>

      </div>
    </>
  );
}
