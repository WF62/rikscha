export const dynamic = 'force-dynamic';
import type { Metadata } from 'next';
import { createServiceClient } from '@/lib/supabase';
import PrintButton from './PrintButton';

export const metadata: Metadata = {
  title: 'Flyer A4 Z-Fold – Mertener Rikschakutscher',
};

const SCHLUSSEL = [
  'flyer_fahrten_text', 'flyer_lotte_text', 'flyer_flitzer_text', 'flyer_piter_text',
  'flyer_foto_fahrt1', 'flyer_foto_lotte', 'flyer_foto_flitzer', 'flyer_foto_piter',
  'flyer_v3_card1_text', 'flyer_v3_card2_text',
];

const DEFAULT: Record<string, string> = {
  flyer_fahrten_text:   'Ob Seniorenausflug, Familienbesuch oder besonderer Anlass — unsere ehrenamtlichen Piloten bringen Sie sicher und stilvoll ans Ziel. Alle Fahrten sind kostenlos und für jeden zugänglich.',
  flyer_lotte_text:     'Die klassische Rikscha — geräumig, komfortabel, mit Rundumblick. Ob zur Kirche, zum Rhein oder durch die Mertener Heide: Flotte Lotte ermöglicht entspanntes Mitfahren mit großer Wirkung.',
  flyer_flitzer_text:   'Ideal für sehbehinderte oder körperlich eingeschränkte Menschen — wer mag, kann sogar mittreten! Nah am Boden, nah am Leben — eine völlig neue Perspektive.',
  flyer_piter_text:     'Pilot und Gast fahren Seite an Seite — besonders für Menschen mit Demenz. Das Nebeneinander schafft Sicherheit, Nähe und Gespräche auf Augenhöhe.',
  flyer_foto_fahrt1:    '',
  flyer_foto_lotte:     '',
  flyer_foto_flitzer:   '',
  flyer_foto_piter:     '',
  flyer_v3_card1_text:  'Rund elf engagierte Freiwillige aus Bornheim-Merten — unterschiedlichen Alters, verbunden durch die Freude daran, anderen Menschen einen besonderen Moment zu schenken.',
  flyer_v3_card2_text:  'Fahrradbegeistert & hilfsbereit? Wir freuen uns über jede Verstärkung! 📞 02227 9328383',
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
          --green2: #3D8A28;
          --gold:   #C8881A;
          --cream:  #F5F0E7;
          --ink:    #1C1208;
          --mid:    #5C4E38;
          --serif:  Palatino Linotype, Palatino, Book Antiqua, Georgia, serif;
          --sans:   system-ui, -apple-system, Segoe UI, sans-serif;
          /* DIN A4 quer: 297mm × 210mm → 3 gleiche Spalten à 99mm */
          --sheet-w: 297mm;
          --sheet-h: 210mm;
          --col-w:   99mm;
          --pad:     8mm;
          --fold-c:  rgba(0,0,0,0.12);
        }

        body { background: #d0d0d0; font-family: var(--sans); }

        /* ── Druck-Nav ── */
        .print-bar {
          background: #1C4A10; color: #fff;
          display: flex; align-items: center; gap: 1rem;
          padding: 0.6rem 1.5rem; font-size: 0.82rem;
        }
        .print-bar a { color: rgba(255,255,255,0.8); text-decoration: none; font-size: 0.8rem; }
        .print-bar a:hover { color: #fff; }
        .print-bar .sep { color: rgba(255,255,255,0.3); }
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

        /* ── AM Dankeschön-Banner ── */
        .am-banner-print {
          background: #E2001A; color: #fff;
          display: flex; align-items: center; gap: 0.75rem;
          padding: 0.5rem 1.5rem;
          -webkit-print-color-adjust: exact; print-color-adjust: exact;
        }
        .am-banner-print svg { display: block; flex-shrink: 0; }
        .am-banner-print .am-text { font-size: 0.75rem; line-height: 1.4; }
        .am-banner-print .am-text strong { display: block; font-size: 0.82rem; }

        /* ── Blatt ── */
        .side-label {
          text-align: center; font-size: 0.72rem; color: #666;
          letter-spacing: 0.1em; text-transform: uppercase;
          padding: 0.6rem 0 0.3rem; font-family: var(--sans);
        }
        .sheet {
          width: var(--sheet-w);
          height: var(--sheet-h);
          display: grid;
          grid-template-columns: var(--col-w) var(--col-w) var(--col-w);
          overflow: hidden;
          background: #fff;
          position: relative;
          margin: 0 auto 1.5rem;
          box-shadow: 0 4px 24px rgba(0,0,0,0.22);
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        /* Falzlinien */
        .sheet::before, .sheet::after {
          content: '';
          position: absolute;
          top: 0; bottom: 0;
          width: 1px;
          background: var(--fold-c);
          z-index: 10;
          pointer-events: none;
        }
        .sheet::before { left: var(--col-w); }
        .sheet::after  { left: calc(var(--col-w) * 2); }

        /* ── Spalten ── */
        .col {
          width: var(--col-w);
          height: var(--sheet-h);
          overflow: hidden;
          padding: var(--pad);
          display: flex;
          flex-direction: column;
          position: relative;
        }

        /* Vorderseite Spalten */
        /* V-A: Deckblatt (aussen sichtbar beim Z-Fold) */
        .col-va {
          background: linear-gradient(160deg, #3A8A26 0%, #1C4A10 100%);
          color: #fff;
          align-items: center;
          justify-content: center;
          text-align: center;
          gap: 0;
        }
        .col-va .logo-circle {
          width: 42mm; height: 42mm; border-radius: 50%;
          background: rgba(255,255,255,0.15);
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 4mm;
          flex-shrink: 0;
        }
        .col-va .logo-circle img { width: 34mm; height: 34mm; border-radius: 50%; object-fit: cover; }
        .col-va .eyebrow { font-size: 5.5pt; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(255,255,255,0.7); margin-bottom: 2mm; }
        .col-va h1 { font-family: var(--serif); font-size: 15pt; font-weight: normal; line-height: 1.2; margin-bottom: 3mm; color: #fff; text-wrap: balance; }
        .col-va .tagline { font-size: 7pt; color: rgba(255,255,255,0.88); line-height: 1.5; margin-bottom: 5mm; text-wrap: balance; }
        .col-va .contact-box { background: rgba(255,255,255,0.18); border-radius: 4px; padding: 3mm 4mm; font-size: 6.5pt; color: #fff; line-height: 1.7; width: 100%; text-align: center; }
        .col-va .contact-box strong { display: block; font-size: 7pt; margin-bottom: 1mm; }

        /* V-B: Fahrten + Behinderung */
        .col-vb { background: #C8600A; color: #fff; gap: 0; justify-content: space-between; }
        .col-vb .col-eyebrow { font-size: 5pt; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(255,255,255,0.75); margin-bottom: 1.5mm; }
        .col-vb h2 { font-family: var(--serif); font-size: 13pt; font-weight: normal; color: #fff; margin-bottom: 2.5mm; line-height: 1.2; }
        .col-vb p { font-size: 6.5pt; color: rgba(255,255,255,0.92); line-height: 1.55; margin-bottom: 2.5mm; }
        .col-vb .photo-fahrt { border-radius: 4px; overflow: hidden; margin-bottom: 2.5mm; background: rgba(255,255,255,0.15); display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 1mm; color: rgba(255,255,255,0.6); font-size: 6pt; height: 38mm; }
        .col-vb .photo-fahrt img { width: 100%; height: 100%; object-fit: cover; }
        .col-vb .bf-box { background: rgba(255,255,255,0.18); border-left: 3px solid rgba(255,255,255,0.7); border-radius: 3px; padding: 2.5mm 3mm; margin-bottom: 2.5mm; }
        .col-vb .bf-box strong { font-size: 6.5pt; color: #fff; display: block; margin-bottom: 1mm; }
        .col-vb .bf-box span { font-size: 6pt; color: rgba(255,255,255,0.9); line-height: 1.5; }
        .col-vb .tipp-box { background: rgba(255,255,255,0.12); border-radius: 3px; padding: 2.5mm 3mm; }
        .col-vb .tipp-box span { font-size: 6pt; color: rgba(255,255,255,0.88); line-height: 1.5; }
        .col-vb .chips { display: flex; flex-wrap: wrap; gap: 1.5mm; margin-bottom: 2.5mm; }
        .col-vb .chip { font-size: 5.5pt; font-weight: 700; padding: 0.8mm 2mm; border-radius: 99px; background: rgba(255,255,255,0.22); color: #fff; }

        /* V-C: Gutschein */
        .col-vc { background: var(--cream); gap: 0; justify-content: space-between; }
        .col-vc .voucher-tag { display: inline-block; background: var(--gold); color: #fff; font-size: 6pt; font-weight: 700; padding: 1mm 3mm; border-radius: 99px; margin-bottom: 3mm; letter-spacing: 0.05em; }
        .col-vc h2 { font-family: var(--serif); font-size: 14pt; font-weight: normal; color: var(--ink); margin-bottom: 1.5mm; line-height: 1.2; }
        .col-vc .sub { font-size: 6.5pt; color: var(--mid); line-height: 1.5; margin-bottom: 4mm; }
        .col-vc .voucher-body { flex: 1; border: 2px dashed var(--gold); border-radius: 6px; padding: 4mm; display: flex; flex-direction: column; gap: 2.5mm; }
        .col-vc .voucher-body .vl { font-size: 5.5pt; color: var(--mid); }
        .col-vc .voucher-body .vline { border-bottom: 1px solid #ccc; padding-bottom: 4mm; margin-bottom: 1mm; }
        .col-vc .voucher-body .vv { font-family: var(--serif); font-size: 9pt; color: var(--ink); }
        .col-vc .wann-box { background: #fff; border: 1px solid #ddd; border-radius: 4px; padding: 2.5mm 3mm; margin-top: 3mm; }
        .col-vc .wann-box .wl { font-size: 5.5pt; color: var(--mid); margin-bottom: 1mm; }
        .col-vc .wann-box .wv { border-bottom: 1px solid #ccc; padding-bottom: 3mm; font-family: var(--serif); font-size: 8pt; color: var(--ink); }
        .col-vc .voucher-footer { font-size: 5.5pt; color: var(--mid); margin-top: 3mm; line-height: 1.5; text-align: center; }

        /* Rückseite Spalten */
        .col-rv { background: var(--cream); gap: 0; justify-content: space-between; }
        .col-rv .vehicle-badge { font-size: 5.5pt; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; padding: 1mm 2.5mm; border-radius: 99px; margin-bottom: 2mm; display: inline-block; }
        .col-rv .badge-lotte   { background: #dcfce7; color: #15803d; }
        .col-rv .badge-flitzer { background: #dbeafe; color: #1d4ed8; }
        .col-rv .badge-piter   { background: #ffedd5; color: #9c3a07; }
        .col-rv h3 { font-family: var(--serif); font-size: 13pt; font-weight: normal; color: var(--ink); margin-bottom: 2mm; line-height: 1.2; }
        .col-rv .vehicle-sub { font-size: 6pt; color: var(--mid); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 3mm; }
        .col-rv .photo-ph { background: #e0e0e0; border-radius: 4px; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 1mm; color: #888; font-size: 6pt; margin-bottom: 3mm; }
        .col-rv .photo-ph img { width: 100%; height: 100%; object-fit: cover; border-radius: 4px; }
        .col-rv p { font-size: 6.5pt; color: var(--mid); line-height: 1.55; margin-bottom: 2mm; }
        .col-rv .facts { display: flex; flex-direction: column; gap: 1.5mm; margin-top: 2mm; }
        .col-rv .fact { font-size: 6pt; color: var(--mid); display: flex; align-items: flex-start; gap: 1.5mm; line-height: 1.4; }
        .col-rv .fact-icon { flex-shrink: 0; }

        .col-rc { background: #1C4A10; gap: 0; justify-content: space-between; }
        .col-rc h3 { font-family: var(--serif); font-size: 13pt; font-weight: normal; color: #fff; margin-bottom: 2mm; line-height: 1.2; }
        .col-rc .vehicle-sub { font-size: 6pt; color: rgba(255,255,255,0.65); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 3mm; }
        .col-rc .vehicle-badge { font-size: 5.5pt; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; padding: 1mm 2.5mm; border-radius: 99px; margin-bottom: 2mm; display: inline-block; background: #ffedd5; color: #9c3a07; }
        .col-rc .photo-ph { background: rgba(255,255,255,0.1); border-radius: 4px; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 1mm; color: rgba(255,255,255,0.5); font-size: 6pt; margin-bottom: 3mm; }
        .col-rc .photo-ph img { width: 100%; height: 100%; object-fit: cover; border-radius: 4px; }
        .col-rc p { font-size: 6.5pt; color: rgba(255,255,255,0.88); line-height: 1.55; margin-bottom: 3mm; }
        .col-rc .divider { border: none; border-top: 1px solid rgba(255,255,255,0.2); margin: 3mm 0; }
        .col-rc .spenden-label { font-size: 5.5pt; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(255,255,255,0.6); margin-bottom: 1.5mm; }
        .col-rc .iban { font-family: monospace; font-size: 6pt; background: rgba(255,255,255,0.12); padding: 1.5mm 2mm; border-radius: 3px; color: #fff; word-break: break-all; margin-bottom: 2mm; display: block; }
        .col-rc .am-mini { display: flex; align-items: center; gap: 1.5mm; margin-top: 2mm; }
        .col-rc .am-mini span { font-size: 5.5pt; color: rgba(255,255,255,0.8); line-height: 1.4; }

        /* Foto-Platzhalter-Größen */
        .ph-tall   { height: 58mm; }
        .ph-medium { height: 48mm; }
        .ph-short  { height: 38mm; }

        /* ── Print ── */
        @media print {
          .print-bar, .print-hint, .side-label { display: none; }
          body { background: #fff; margin: 0; }
          .sheet { margin: 0; box-shadow: none; page-break-after: always; }
          .sheet:last-of-type { page-break-after: auto; }
          @page { size: A4 landscape; margin: 0; }
        }
      `}</style>

      {/* AM Dankeschön-Banner */}
      <div className="am-banner-print">
        <svg viewBox="0 0 120 42" fill="none" width="90" height="31">
          <rect width="120" height="42" rx="4" fill="#E2001A"/>
          <circle cx="15" cy="9" r="5" fill="#fff"/>
          <path d="M6 18C6 13 10 11 15 14C20 11 24 13 24 18C24 23 15 30 15 30C15 30 6 23 6 18Z" fill="#fff"/>
          <line x1="4" y1="19" x2="9" y2="17" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
          <line x1="26" y1="19" x2="21" y2="17" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
          <text x="32" y="18" fontFamily="Arial Black,Arial,sans-serif" fontWeight="900" fontSize="11" fill="#fff">aktion</text>
          <text x="32" y="31" fontFamily="Arial Black,Arial,sans-serif" fontWeight="900" fontSize="11" fill="#fff">mensch</text>
        </svg>
        <div className="am-text">
          <strong>Herzlichen Dank, Aktion Mensch! 🙏</strong>
          Für die Saison 2027 werden uns 2 neue Rikschas ermöglicht — ab 2027 sind wir mit 5 Fahrzeugen am Start. Rikschafahrten nun auch für Menschen mit Behinderung.
        </div>
      </div>

      {/* Druck-Nav */}
      <div className="print-bar">
        <a href="/">← Startseite</a>
        <span className="sep">·</span>
        <span>Flyer A4 Z-Fold · Vorder- &amp; Rückseite drucken (A4 quer, beidseitig)</span>
        <PrintButton />
      </div>
      <div className="print-hint">
        ℹ️ Drucken Sie beide Seiten auf <strong>ein Blatt</strong> (beidseitig, A4 quer). Dann zweimal falten: erst die linke Spalte nach vorne, dann die rechte nach hinten — so entsteht der Z-Falz.
      </div>

      {/* ═══════════════ VORDERSEITE ═══════════════ */}
      <p className="side-label">Vorderseite (beim Z-Fold: Spalte A aussen, C innen)</p>
      <div className="sheet">

        {/* V-A: Deckblatt */}
        <div className="col col-va">
          <div className="logo-circle">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://hcbqmqyxpasojbrewnps.supabase.co/storage/v1/object/public/piloten-dateien/1789230837654-o3j4ecfxsw.png" alt="Logo"/>
          </div>
          <div className="eyebrow">Bornheim-Merten · seit 2018</div>
          <h1>Mertener Rikscha&shy;kutscher</h1>
          <p className="tagline">Kostenlose Rikschafahrten durch Merten und die Region — mit Herz, Pedalen und elf begeisterten Kutschern.</p>
          <div className="contact-box">
            <strong>📞 Fahrt anfragen</strong>
            02227 9328383<br/>
            GFO Bornheim-Merten<br/>
            rikscha-kutscher.de
          </div>
        </div>

        {/* V-B: Fahrten für alle */}
        <div className="col col-vb">
          <div>
            <div className="col-eyebrow">Kostenlos &amp; herzlich</div>
            <h2>Fahrtwind für alle</h2>
            <div className="photo-fahrt">
              {c.flyer_foto_fahrt1
                ? <img src={c.flyer_foto_fahrt1} alt="Rikschafahrt"/>
                : <><span style={{fontSize:'1.8rem'}}>🛺</span><span>Foto einer Fahrt</span></>
              }
            </div>
            <p>{c.flyer_fahrten_text}</p>
            <div className="chips">
              <span className="chip">Kostenlos</span>
              <span className="chip">Ehrenamtlich</span>
              <span className="chip">Gruppenfahrten</span>
              <span className="chip">🚀 Ab 2027: 5 Rikschas</span>
            </div>
            <div className="bf-box">
              <strong>♿ Neu ab 2027 — dank Aktion Mensch</strong>
              <span>Rikschafahrten jetzt auch offiziell für Menschen mit Behinderung und eingeschränkter Mobilität. Begleitpersonen herzlich willkommen.</span>
            </div>
          </div>
          <div className="tipp-box">
            <span>💡 <strong>Tipp geben:</strong> Kennen Sie jemanden, dem eine Fahrt Freude bereiten würde? Melden Sie sich — gerne auch mit Begleitung.</span>
          </div>
        </div>

        {/* V-C: Gutschein */}
        <div className="col col-vc">
          <span className="voucher-tag">Geschenkgutschein</span>
          <h2>Rikscha&shy;fahrt verschenken</h2>
          <p className="sub">Einfach ausschneiden, ausfüllen und verschenken — kostenlos einzulösen unter 02227 9328383.</p>
          <div className="voucher-body">
            <div>
              <div className="vl">Für</div>
              <div className="vline vv">&nbsp;</div>
            </div>
            <div>
              <div className="vl">Anlass / Wunsch</div>
              <div className="vline vv">&nbsp;</div>
            </div>
            <div>
              <div className="vl">Von</div>
              <div className="vline vv">&nbsp;</div>
            </div>
            <div>
              <div className="vl">Datum</div>
              <div className="vline vv">&nbsp;</div>
            </div>
            <div style={{marginTop:'auto'}}>
              <div className="vl" style={{textAlign:'center',borderTop:'1px dashed #ccc',paddingTop:'2mm'}}>
                🛺 Mertener Rikschakutscher · Bornheim-Merten · kostenlos
              </div>
            </div>
          </div>
          <div className="wann-box">
            <div className="wl">Gewünschter Termin (flexibel)</div>
            <div className="wv">&nbsp;</div>
          </div>
          <div className="voucher-footer">
            Einlösen: 02227 9328383 · GFO Bornheim-Merten<br/>
            Alle Rikschafahrten sind kostenlos — eine Freude zu verschenken!
          </div>
        </div>

      </div>

      {/* ═══════════════ RÜCKSEITE ═══════════════ */}
      <p className="side-label">Rückseite (beim Z-Fold: Spalte D aussen, F innen)</p>
      <div className="sheet">

        {/* R-A: Flotte Lotte */}
        <div className="col col-rv">
          <div>
            <span className="vehicle-badge badge-lotte">Rikscha · max. 2 Gäste</span>
            <h3>Flotte Lotte</h3>
            <p className="vehicle-sub">Klassische Rikscha</p>
            <div className="photo-ph ph-tall">
              {c.flyer_foto_lotte
                ? <img src={c.flyer_foto_lotte} alt="Flotte Lotte"/>
                : <><span style={{fontSize:'1.8rem'}}>📷</span><span>Foto Flotte Lotte</span></>
              }
            </div>
            <p>{c.flyer_lotte_text}</p>
            <div className="facts">
              <div className="fact"><span className="fact-icon">👥</span><span>Bis zu 2 Gäste plus Begleitung</span></div>
              <div className="fact"><span className="fact-icon">🌿</span><span>Ideal für Ausflüge, Familienbesuche, Senioren</span></div>
              <div className="fact"><span className="fact-icon">♿</span><span>Auch für Menschen mit eingeschränkter Mobilität</span></div>
            </div>
          </div>
          <p style={{fontSize:'5.5pt',color:'#aaa',borderTop:'1px solid #e0e0e0',paddingTop:'2mm'}}>
            🏅 Ermöglicht durch Weihnachtslichter des General-Anzeigers (2018)
          </p>
        </div>

        {/* R-B: Flinker Flitzer */}
        <div className="col col-rv">
          <div>
            <span className="vehicle-badge badge-flitzer">Liegetandem · 1 Gast</span>
            <h3>Flinker Flitzer</h3>
            <p className="vehicle-sub">Liegetandem</p>
            <div className="photo-ph ph-tall">
              {c.flyer_foto_flitzer
                ? <img src={c.flyer_foto_flitzer} alt="Flinker Flitzer"/>
                : <><span style={{fontSize:'1.8rem'}}>📷</span><span>Foto Flinker Flitzer</span></>
              }
            </div>
            <p>{c.flyer_flitzer_text}</p>
            <div className="facts">
              <div className="fact"><span className="fact-icon">👁</span><span>Ideal für sehbehinderte Menschen</span></div>
              <div className="fact"><span className="fact-icon">🚴</span><span>Gast kann selbst mittreten — wenn gewünscht</span></div>
              <div className="fact"><span className="fact-icon">🌍</span><span>Nah am Boden, nah am Leben</span></div>
            </div>
          </div>
          <p style={{fontSize:'5.5pt',color:'#aaa',borderTop:'1px solid #e0e0e0',paddingTop:'2mm'}}>
            🏅 Ermöglicht durch Volksbank Merten, Förderverein GFO &amp; Einzelspender
          </p>
        </div>

        {/* R-C: Jruuse Piter + Kontakt + Spenden */}
        <div className="col col-rc">
          <div>
            <span className="vehicle-badge">Paralleltandem · 1 Gast</span>
            <h3>Jruuse Piter</h3>
            <p className="vehicle-sub">Paralleltandem · für Menschen mit Demenz</p>
            <div className="photo-ph ph-medium">
              {c.flyer_foto_piter
                ? <img src={c.flyer_foto_piter} alt="Jruuse Piter"/>
                : <><span style={{fontSize:'1.8rem'}}>📷</span><span>Foto Jruuse Piter</span></>
              }
            </div>
            <p>{c.flyer_piter_text}</p>
            <p style={{fontSize:'6pt',color:'rgba(255,255,255,0.7)',marginTop:'1mm',marginBottom:'3mm',lineHeight:1.4}}>
              👥 Pilot und Gast nebeneinander · 💬 Gespräche auf Augenhöhe · 🧡 Nähe und Sicherheit
            </p>
          </div>
          <div>
            <hr className="divider"/>
            <div className="spenden-label">Kontakt &amp; Buchung</div>
            <p style={{marginBottom:'1.5mm'}}>📞 02227 9328383<br/>GFO Bornheim-Merten<br/>Kloster Merten · 53332 Bornheim</p>
            <p style={{marginBottom:'1.5mm',fontSize:'6pt'}}>🌐 rikscha-kutscher.de</p>
            <hr className="divider"/>
            <div className="spenden-label">Spenden (freiwillig)</div>
            <span className="iban">DE57 3705 0299 0000 4756 46</span>
            <p style={{fontSize:'5.5pt',marginBottom:'2mm'}}>Kreissparkasse Köln · Förderverein Sankt Martin Merten</p>
            <div className="am-mini">
              <svg viewBox="0 0 120 42" fill="none" width="60" height="21">
                <rect width="120" height="42" rx="4" fill="#E2001A"/>
                <circle cx="15" cy="9" r="5" fill="#fff"/>
                <path d="M6 18C6 13 10 11 15 14C20 11 24 13 24 18C24 23 15 30 15 30C15 30 6 23 6 18Z" fill="#fff"/>
                <line x1="4" y1="19" x2="9" y2="17" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                <line x1="26" y1="19" x2="21" y2="17" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                <text x="32" y="18" fontFamily="Arial Black,Arial,sans-serif" fontWeight="900" fontSize="11" fill="#fff">aktion</text>
                <text x="32" y="31" fontFamily="Arial Black,Arial,sans-serif" fontWeight="900" fontSize="11" fill="#fff">mensch</text>
              </svg>
              <span>Jruuse Piter &amp; 2 neue Rikschas 2027 gefördert durch Aktion Mensch</span>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
