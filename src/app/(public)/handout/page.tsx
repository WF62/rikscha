export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;
import type { Metadata } from 'next';
import PrintButton from './PrintButton';
import { createServiceClient } from '@/lib/supabase';

export const metadata: Metadata = { title: 'Handout – Mertener Rikschakutscher' };

const LOGO = 'https://hcbqmqyxpasojbrewnps.supabase.co/storage/v1/object/public/piloten-dateien/1785078123043-su0txlq3ipq.png';

const SCHLUSSEL = [
  'handout_slogan', 'handout_sub', 'handout_text',
  'handout_foto_vorne',
  'handout_lotte_kurz', 'handout_flitzer_kurz', 'handout_piter_kurz',
  'handout_foto_lotte', 'handout_foto_flitzer', 'handout_foto_piter',
  'handout_r1_name', 'handout_r2_name', 'handout_r3_name',
  'handout_r1_typ', 'handout_r2_typ', 'handout_r3_typ',
];

const DEFAULT: Record<string, string> = {
  handout_slogan:       'Wind im Haar. Herz am rechten Fleck.',
  handout_sub:          'Kostenlose Rikschafahrten in Bornheim-Merten · Ehrenamtlich seit 2018',
  handout_text:         'Ob Seniorenausflug, Familienbesuch oder besonderer Anlass — unsere ehrenamtlichen Kutscher bringen Sie sicher und stilvoll ans Ziel. Alle Fahrten kostenlos und für jeden zugänglich.',
  handout_foto_vorne:   '',
  handout_lotte_kurz:   'Die klassische Rikscha — geräumig, komfortabel, mit Rundumblick. Ideal für Seniorengruppen und Familienausflüge.',
  handout_flitzer_kurz: 'Liegetandem für sehbehinderte oder körperlich eingeschränkte Menschen — wer mag, kann sogar mittreten!',
  handout_piter_kurz:   'Pilot und Gast fahren Seite an Seite — besonders für Menschen mit Demenz. Nähe und Gespräche auf Augenhöhe.',
  handout_foto_lotte:   '',
  handout_foto_flitzer: '',
  handout_foto_piter:   '',
  handout_r1_name:      'Flotte Lotte',
  handout_r2_name:      'Flinker Flitzer',
  handout_r3_name:      'Jruuse Piter',
  handout_r1_typ:       'Rikscha · bis 2 Gäste',
  handout_r2_typ:       'Liegetandem · 1 Gast',
  handout_r3_typ:       'Paralleltandem · 1 Gast',
};

async function ladeInhalte(): Promise<Record<string, string>> {
  try {
    const db = createServiceClient();
    const { data } = await db.from('inhalte').select('schluessel, wert').in('schluessel', SCHLUSSEL);
    const r = { ...DEFAULT };
    for (const { schluessel, wert } of data ?? []) if (schluessel in r) r[schluessel] = wert;
    return r;
  } catch { return DEFAULT; }
}

export default async function HandoutPage() {
  const c = await ladeInhalte();

  /* Wiederholter Streifen — Vorder- und Rückseite je 3× */
  const vorderStreifen = (
    <div className="strip">
      {/* Vollbild-Foto */}
      <div className="bg-foto" style={c.handout_foto_vorne ? {
        backgroundImage: `url(${c.handout_foto_vorne})`,
      } : undefined}/>
      {/* Dunkler Gradient von unten */}
      <div className="bg-gradient"/>

      {/* Logo-Leiste oben */}
      <div className="brand-bar">
        <img src={LOGO} alt="Logo" className="logo"/>
        <div className="brand-name">Mertener<br/>Rikschakutscher</div>
        <div className="brand-contact">
          <span>📞 02227 9328383</span>
          <span>🌐 rikscha-merten.de</span>
        </div>
      </div>

      {/* Text unten */}
      <div className="strip-front-inner">
        <div className="slogan">{c.handout_slogan}</div>
        <p className="strip-body">{c.handout_text}</p>
        <div className="chip-row">
          <span className="chip chip-green">Kostenlos</span>
          <span className="chip chip-green">Ehrenamtlich</span>
          <span className="chip chip-gold">Gutscheine</span>
          <span className="chip chip-gold">Gruppenfahrten</span>
        </div>
        <div className="strip-address">GFO Bornheim-Merten · Kloster Merten · 53332 Bornheim</div>
      </div>
    </div>
  );

  const rueckStreifen = (
    <div className="strip strip-back">
      <div className="strip-inner">

        {/* Fahrzeug-Karten */}
        {([
          { name: c.handout_r1_name, typ: c.handout_r1_typ, text: c.handout_lotte_kurz,   foto: c.handout_foto_lotte,   farbe: '#FEF3C7', akzent: '#92400e', badge: '#F59E0B' },
          { name: c.handout_r2_name, typ: c.handout_r2_typ, text: c.handout_flitzer_kurz, foto: c.handout_foto_flitzer, farbe: '#E0F2FE', akzent: '#075985', badge: '#0EA5E9' },
          { name: c.handout_r3_name, typ: c.handout_r3_typ, text: c.handout_piter_kurz,   foto: c.handout_foto_piter,  farbe: '#EDE9FE', akzent: '#4c1d95', badge: '#8B5CF6' },
        ] as const).map((f, i) => (
          <div key={i} className="fz-card" style={{background:f.farbe}}>
            {f.foto
              ? <img src={f.foto} alt={f.name} className="fz-foto"/>
              : <div className="fz-foto-ph" style={{background:f.badge+'33'}}><span>📷</span></div>
            }
            <div className="fz-typ" style={{color:f.akzent}}>{f.typ}</div>
            <div className="fz-name" style={{color:f.akzent}}>{f.name}</div>
            <p className="fz-text" style={{color:f.akzent}}>{f.text}</p>
          </div>
        ))}

        {/* Spenden-Block */}
        <div className="spenden-col">
          <div className="sp-eye">Spenden</div>
          <div className="sp-title">Helfen Sie uns, weiterzufahren</div>
          <div className="sp-sub">Förderverein „Miteinander Kloster Merten e. V." · Stichwort: Rikscha</div>
          <div className="sp-konto">
            <span className="sp-label">KSK Köln</span>
            <span className="sp-val">DE79 3705 0299 0049 0050 40</span>
          </div>
          <div className="sp-konto">
            <span className="sp-label">Volksbank</span>
            <span className="sp-val">DE14 3806 0186 0410 0560 11</span>
          </div>
        </div>

      </div>
    </div>
  );

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --green: #2D6B1E; --gold: #C8881A; --cream: #F5F0E7;
          --ink: #1C1208; --mid: #5C4E38;
          --serif: Palatino Linotype, Palatino, Book Antiqua, Georgia, serif;
          --sans: system-ui, -apple-system, Segoe UI, sans-serif;
          --w: 560px;
          --strip-h: 332px;
          --gap: 26px;
        }
        body { font-family: var(--sans); background: #B8B0A4; color: var(--ink); }

        /* ── Druckleiste ── */
        .print-bar {
          background: #2D6B1E; color: #fff;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 2rem; height: 52px; gap: 1rem;
        }
        .print-bar a { color: rgba(255,255,255,0.8); text-decoration: none; font-size: 0.88rem; }
        .print-bar a:hover { color: #fff; }

        /* ── Seite ── */
        .wrap { padding: 1.5rem 1rem 4rem; }
        .page-title { text-align:center; font-family:var(--serif); font-size:1rem; color:#3a3028; margin-bottom:.2rem; font-weight:normal; }
        .page-hint  { text-align:center; font-size:.68rem; color:#6a5e50; margin-bottom:2.5rem; }
        .side-label { font-size:.72rem; letter-spacing:.12em; text-transform:uppercase; color:#5c4e38; margin-bottom:.5rem; font-weight:600; width:var(--w); margin-left:auto; margin-right:auto; }

        /* ── Bogen ── */
        .sheet { width:var(--w); margin:0 auto 3.5rem; box-shadow:0 4px 32px rgba(0,0,0,.28); display:flex; flex-direction:column; gap:0; }

        /* ── Streifen ── */
        .strip {
          width: var(--w); height: var(--strip-h);
          position: relative; overflow: hidden;
        }

        /* ── Schnittgasse ── */
        .gap {
          width: var(--w); height: var(--gap);
          position: relative; overflow: visible;
          background: #1a2e14;
        }
        /* Schnittmarke links */
        .gap::before {
          content: '';
          position: absolute; top: 50%; transform: translateY(-50%);
          right: calc(100% + 6px);
          width: 26px; height: 1px;
          background: rgba(0,0,0,.65);
          box-shadow: 0 0 0 .4px rgba(255,255,255,.4);
        }
        /* Schnittmarke rechts */
        .gap::after {
          content: '';
          position: absolute; top: 50%; transform: translateY(-50%);
          left: calc(100% + 6px);
          width: 26px; height: 1px;
          background: rgba(0,0,0,.65);
          box-shadow: 0 0 0 .4px rgba(255,255,255,.4);
        }
        .gap-label { font-size:.42rem; letter-spacing:.08em; text-transform:uppercase; color:rgba(255,255,255,.4); font-family:var(--sans); font-weight:700; position:absolute; right:-58px; top:50%; transform:translateY(-50%); }

        /* Vorderseite — Option C: Gradient von unten */
        .bg-foto { position:absolute; inset:0; background-image:url(''); background-size:cover; background-position:center top; background-color:#2a3a22; }
        .bg-gradient { position:absolute; inset:0; background:linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 28%, rgba(10,30,8,.58) 60%, rgba(10,30,8,.92) 100%); }
        .brand-bar { position:absolute; top:0; left:0; right:0; display:flex; align-items:center; gap:.6rem; padding:.75rem 1rem; background:linear-gradient(to bottom, rgba(20,60,10,.97) 0%, rgba(30,70,15,.85) 55%, transparent 100%); z-index:2; }
        .logo { width:44px; height:44px; border-radius:50%; object-fit:cover; flex-shrink:0; border:2px solid var(--gold); box-shadow:0 0 0 3px rgba(200,136,26,.3); filter:sepia(.25) saturate(1.6) hue-rotate(-8deg) brightness(1.05); }
        .brand-name { font-family:var(--serif); color:#fff; font-size:.82rem; line-height:1.3; text-shadow:0 1px 4px rgba(0,0,0,.5); }
        .brand-contact { margin-left:auto; display:flex; flex-direction:column; gap:.1rem; text-align:right; }
        .brand-contact span { font-size:.6rem; color:rgba(255,255,255,.85); }
        .strip-inner { display:flex; height:100%; }
        .strip-front-inner { position:relative; z-index:1; display:flex; flex-direction:column; justify-content:flex-end; height:100%; padding:1rem 1.2rem 1rem 1.1rem; gap:.45rem; }
        .slogan { font-family:var(--serif); font-size:1.15rem; font-weight:bold; color:#fff; line-height:1.25; text-wrap:balance; text-shadow:0 1px 8px rgba(0,0,0,.4); }
        .strip-body { font-size:.69rem; color:rgba(255,255,255,.88); line-height:1.6; }
        .chip-row { display:flex; gap:.3rem; flex-wrap:wrap; }
        .chip { font-size:.58rem; font-weight:700; padding:.1rem .45rem; border-radius:999px; }
        .chip-green { background:rgba(209,250,229,.9); color:#065f46; }
        .chip-gold  { background:rgba(254,243,199,.9); color:#92400e; }
        .strip-address { font-size:.57rem; color:rgba(255,255,255,.55); font-style:italic; }

        /* Rückseite */
        .strip-back .strip-inner { background:var(--cream); }
        .fz-card { flex:1; padding:.7rem .65rem; display:flex; flex-direction:column; gap:.25rem; border-right:1px solid rgba(0,0,0,.07); }
        .fz-card:last-child { border-right:none; }
        .fz-foto { width:100%; height:90px; object-fit:cover; border-radius:4px; display:block; }
        .fz-foto-ph { width:100%; height:90px; border-radius:4px; display:flex; align-items:center; justify-content:center; font-size:1.5rem; opacity:.35; }
        .fz-typ  { font-size:.56rem; text-transform:uppercase; letter-spacing:.08em; font-weight:700; margin-top:.15rem; }
        .fz-name { font-family:var(--serif); font-size:.82rem; font-weight:bold; }
        .fz-text { font-size:.63rem; line-height:1.5; }
        .spenden-col { width:148px; flex-shrink:0; background:linear-gradient(135deg,#1a4a0e,#2D6B1E); padding:.7rem .75rem; display:flex; flex-direction:column; gap:.22rem; }
        .sp-eye   { font-size:.52rem; text-transform:uppercase; letter-spacing:.14em; color:var(--gold); font-weight:700; }
        .sp-title { font-family:var(--serif); font-size:.74rem; color:#fff; line-height:1.3; }
        .sp-sub   { font-size:.52rem; color:rgba(255,255,255,.6); line-height:1.4; margin-top:.05rem; }
        .sp-konto { display:flex; flex-direction:column; gap:.05rem; margin-top:.15rem; }
        .sp-label { color:rgba(255,255,255,.5); font-size:.5rem; }
        .sp-val   { color:#fff; font-weight:700; font-family:monospace; font-size:.57rem; letter-spacing:.02em; }

        /* ── PRINT ── */
        html { -webkit-print-color-adjust:exact; color-adjust:exact; print-color-adjust:exact; }
        * { -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; }
        @media print {
          @page { size: 148mm 210mm; margin: 0; }
          @page :first { margin-top: 3mm; }
          html, body { background:#fff !important; padding:0 !important; margin:0 !important; width:148mm !important; }
          .print-bar, .wrap > .page-title, .wrap > .page-hint, .side-label { display:none !important; }
          .wrap { padding:0 !important; margin:0 !important; }
          .sheet { width:148mm !important; margin:0 auto !important; box-shadow:none !important; border-radius:0 !important; }
          .strip { width:148mm !important; height:65mm !important; }
          .gap { width:148mm !important; height:7mm !important; overflow:visible !important; background:#1a2e14 !important; }
          .gap-label { display:none !important; }
          /* Schnittmarken 8mm breit, 3mm Abstand vom Bogen */
          .gap::before { right:calc(100% + 3mm) !important; width:8mm !important; height:0.3mm !important; background:#000 !important; box-shadow:none !important; }
          .gap::after  { left:calc(100% + 3mm) !important;  width:8mm !important; height:0.3mm !important; background:#000 !important; box-shadow:none !important; }
          /* Vorderseite: letzter Streifen braucht keinen Schnittrand unten */
          .sheet > .strip:last-child { height:72mm !important; }
          /* Hintergrundbilder erzwingen */
          .bg-foto { -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; }
          .bg-gradient { -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; }
          .brand-bar { -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; }
          .spenden-col { -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; }
          .strip-back .strip-inner { background:#F5F0E7 !important; }
          .back-sheet { page-break-before:always; break-before:page; margin-top:3mm !important; }
          /* Schrift etwas größer im Druck */
          .slogan { font-size:1rem !important; }
          .strip-body { font-size:.65rem !important; }
          .chip { font-size:.56rem !important; padding:.12rem .5rem !important; }
          .fz-text { font-size:.62rem !important; line-height:1.45 !important; }
        }
      `}</style>

      {/* Druckleiste */}
      <nav className="print-bar">
        <a href="/">← Zurück zur Website</a>
        <span style={{fontSize:'.75rem',color:'rgba(255,255,255,.65)',marginLeft:'1.5rem'}}>💡 Doppelseitig · Lange Kante · Randlos · 3 Handouts pro A4</span>
        <a href="/bearbeiten" style={{marginLeft:'auto',marginRight:'1rem'}}>✏️ Inhalte bearbeiten</a>
        <PrintButton/>
      </nav>

      <div className="wrap">
        <h1 className="page-title">Mertener Rikschakutscher · Handout · 3 × DIN A4 quer auf A4 hochkant</h1>
        <p className="page-hint">Druck: doppelseitig · lange Kante spiegeln · kein Rand · dann 2 × schneiden</p>

        {/* VORDERSEITE */}
        <p className="side-label">Vorderseite</p>
        <div className="sheet">
          {vorderStreifen}
          <div className="gap"><span className="gap-label">Schnitt 1</span></div>
          {vorderStreifen}
          <div className="gap"><span className="gap-label">Schnitt 2</span></div>
          {vorderStreifen}
        </div>

        {/* RÜCKSEITE */}
        <p className="side-label">Rückseite (beim Drucken an langer Kante spiegeln)</p>
        <div className="sheet back-sheet">
          {rueckStreifen}
          <div className="gap"><span className="gap-label">Schnitt 1</span></div>
          {rueckStreifen}
          <div className="gap"><span className="gap-label">Schnitt 2</span></div>
          {rueckStreifen}
        </div>
      </div>
    </>
  );
}
