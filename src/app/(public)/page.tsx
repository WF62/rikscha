import type { Metadata } from 'next';
import { createServiceClient } from '@/lib/supabase';
import HamburgerMenu from './HamburgerMenu';
import PilotenFooterLink from './PilotenFooterLink';
import PilotenModal from './PilotenModal';
import Banner from '../(app)/Banner';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Mertener Rikschakutscher – Bornheim-Merten',
  description: 'Kostenlose Rikschafahrten durch Bornheim-Merten seit 2018. Drei Rikschas, elf Piloten, ein Herz fürs Ehrenamt.',
};

const DEFAULTS: Record<string, string> = {
  hero_sub:          'Fahrtwind im Gesicht, gute Gesellschaft an der Seite — kostenlose Rikschafahrten durch Merten und die Region. Mit Herz, Pedalen und elf begeisterten Piloten.',
  gruppenfahrten_1:  'Was 2018 mit ersten Begegnungen und gemeinsamen Ideen begann, ist heute ein fester Bestandteil des sozialen Lebens in Bornheim-Merten.',
  gruppenfahrten_2:  'Bucht alle drei Rikschas auf einmal: jede Kutsche mit eigenem Piloten, alle gemeinsam unterwegs. Ob Geburtstagskorso, Hochzeitsüberraschung oder Vereinsausflug — im Konvoi wird aus einer Fahrt ein echtes Event.',
  lotte_text:        'Die klassische Rikscha — geräumig, komfortabel, mit Rundumblick. Ob zur Kirche, zum Rhein oder durch die Mertener Heide: Flotte Lotte ermöglicht entspanntes Mitfahren mit großer Wirkung.',
  flitzer_text:      'Ideal für sehbehinderte oder körperlich eingeschränkte Menschen mit geistiger Fitness — wer mag, kann sogar mittreten! Der Flinker Flitzer bietet eine völlig neue Perspektive: nah am Boden, nah am Leben.',
  piter_text:        'Pilot und Gast fahren Seite an Seite — besonders geeignet für Menschen mit Demenz, die körperlich fit sind. Das Nebeneinander schafft Sicherheit, Nähe und echte Gespräche auf Augenhöhe.',
  galerie_homepage:  '',
  foto_lotte:        '',
  foto_flitzer:      '',
  foto_piter:        '',
  foto_pilot_doro:        '',
  foto_pilot_guido:       '',
  foto_pilot_hans_heinrich: '',
  foto_pilot_helenah:     '',
  foto_pilot_heribert:    '',
  foto_pilot_holger:      '',
  foto_pilot_lucia:       '',
  foto_pilot_rolf:        '',
  foto_pilot_sabine:      '',
  foto_pilot_walter:      '',
  foto_pilot_werner:      '',
  team_text:         'Alle ehrenamtlich, alle begeisterte Radfahrer — und alle aus der Überzeugung dabei, dass gemeinsame Erlebnisse verbinden. Woche für Woche bringen sie Menschen zusammen.',
  kontakt_text:      'Ob Einzelfahrt, Gruppenausflug oder Interesse als neuer Pilot — wir melden uns schnell bei euch. Oder ruf uns direkt an: 02227 9328383 — gerne auch auf den Anrufbeantworter sprechen, wir rufen zurück.',
  spenden_text:      'Wer möchte, kann mit einer Spende dazu beitragen, dass unsere Rikschas gepflegt und gewartet werden. Jeder Betrag hilft!',
};

async function ladeGalerie(auswahlJson: string): Promise<{ id: string; url: string; beschreibung: string; pilot: string; created_at: string }[]> {
  try {
    let ids: string[] = [];
    try { ids = JSON.parse(auswahlJson); } catch { ids = []; }
    if (!Array.isArray(ids) || ids.length === 0) return [];
    const db = createServiceClient();
    const { data } = await db.from('galerie').select('id,url,beschreibung,pilot,created_at').in('id', ids);
    // Reihenfolge der Auswahl beibehalten
    const map = new Map((data ?? []).map(r => [r.id, r]));
    return ids.map(id => map.get(id)).filter(Boolean) as typeof data;
  } catch {
    return [];
  }
}

async function ladeInhalte(): Promise<Record<string, string>> {
  try {
    const db = createServiceClient();
    const { data } = await db.from('inhalte').select('schluessel, wert');
    const map: Record<string, string> = { ...DEFAULTS };
    (data ?? []).forEach((r: { schluessel: string; wert: string }) => { map[r.schluessel] = r.wert; });
    return map;
  } catch {
    return { ...DEFAULTS };
  }
}

export default async function WebsitePage() {
  const t = await ladeInhalte();
  const galerie = await ladeGalerie(t.galerie_homepage ?? '');
  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }

        :root {
          --green:      #2D6B1E;
          --green-mid:  #3D8A2A;
          --green-soft: #EBF3E7;
          --gold:       #C8881A;
          --gold-soft:  #FBF0DC;
          --ink:        #1C1208;
          --mid:        #5A4B34;
          --ground:     #F5F0E7;
          --surface:    #FDFAF5;
          --border:     #D6CCB8;
          --lotte-fg:   #15803d; --lotte-bg:   #dcfce7;
          --flitzer-fg: #1d4ed8; --flitzer-bg: #dbeafe;
          --piter-fg:   #ea580c; --piter-bg:   #ffedd5;
          --radius: 4px;
          --serif: Palatino Linotype, Palatino, Book Antiqua, Georgia, serif;
          --sans:  system-ui, -apple-system, Segoe UI, sans-serif;
        }
        @media (prefers-color-scheme: dark) {
          :root {
            --green: #5DB84A; --green-mid: #4EA33A; --green-soft: #1A2E16;
            --gold: #E8A030; --gold-soft: #2A1E08;
            --ink: #F0EBE0; --mid: #A89880;
            --ground: #141008; --surface: #1C1610; --border: #3A3020;
            --lotte-bg: #052e16; --flitzer-bg: #1e3a5f; --piter-bg: #431407;
          }
        }
        :root[data-theme="dark"] {
          --green: #5DB84A; --green-mid: #4EA33A; --green-soft: #1A2E16;
          --gold: #E8A030; --gold-soft: #2A1E08;
          --ink: #F0EBE0; --mid: #A89880;
          --ground: #141008; --surface: #1C1610; --border: #3A3020;
          --lotte-bg: #052e16; --flitzer-bg: #1e3a5f; --piter-bg: #431407;
        }
        :root[data-theme="light"] {
          --green: #1B4A12; --green-mid: #2E7A1F; --green-soft: #EBF3E7;
          --gold: #C8881A; --gold-soft: #FBF0DC;
          --ink: #1C1208; --mid: #5A4B34;
          --ground: #F5F0E7; --surface: #FDFAF5; --border: #D6CCB8;
          --lotte-bg: #dcfce7; --flitzer-bg: #dbeafe; --piter-bg: #ffedd5;
        }

        body { font-family: var(--sans); background: var(--ground); color: var(--ink); font-size: 17px; line-height: 1.65; }

        nav { position: sticky; top: 0; z-index: 100; background: #1C4A10; color: #fff; display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 1.5rem; min-height: 52px; gap: 1rem; box-shadow: 0 3px 12px rgba(0,0,0,0.35); border-bottom: 2px solid rgba(0,0,0,0.2); flex-wrap: wrap; }
        .nav-logo { font-family: var(--serif); font-size: 1rem; font-weight: bold; white-space: nowrap; color: #fff; text-decoration: none; display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0; }
        .nav-links { display: flex; gap: 0.75rem; list-style: none; flex-wrap: wrap; align-items: center; }
        .nav-links a { color: rgba(255,255,255,0.85); text-decoration: none; font-size: 0.78rem; letter-spacing: 0.02em; transition: color 0.15s; white-space: nowrap; }
        .nav-links a:hover { color: #fff; }
        .nav-btn { background: rgba(255,255,255,0.18); border: 1px solid rgba(255,255,255,0.4); border-radius: 4px; padding: 0.25rem 0.7rem; font-weight: 600; }

        .hero { background: linear-gradient(160deg, #3A8A26 0%, #2D6B1E 100%); color: #fff; padding: 5rem 2rem 4rem; text-align: center; position: relative; overflow: hidden; }
        .hero .container { text-align: center; }
        .hero::after { content: ''; position: absolute; bottom: -2px; left: 0; right: 0; height: 48px; background: #F5F0E7; clip-path: ellipse(55% 100% at 50% 100%); }
        .hero-eyebrow { font-size: 0.8rem; letter-spacing: 0.15em; text-transform: uppercase; color: var(--gold); margin-bottom: 1rem; }
        .hero h1 { font-family: var(--serif); font-size: clamp(2.4rem, 6vw, 4.2rem); font-weight: normal; line-height: 1.15; text-wrap: balance; margin-bottom: 1.25rem; }
        .hero-sub { font-size: 1.1rem; color: rgba(255,255,255,0.92); max-width: 540px; margin: 0 auto 2rem; text-wrap: balance; }
        .vehicle-pills { display: flex; gap: 0.6rem; justify-content: center; flex-wrap: wrap; margin-bottom: 2.5rem; }
        .pill { padding: 0.35rem 1rem; border-radius: 999px; font-size: 0.82rem; font-weight: 600; letter-spacing: 0.02em; border: 2px solid currentColor; text-decoration: none; cursor: pointer; transition: opacity 0.15s; }
        .pill:hover { opacity: 0.75; }
        .pill-lotte { color: #86efac; border-color: #86efac; }
        .pill-flitzer { color: #93c5fd; border-color: #93c5fd; }
        .pill-piter { color: #fdba74; border-color: #fdba74; }

        .btn { display: inline-block; padding: 0.75rem 2rem; border-radius: var(--radius); font-size: 0.95rem; font-weight: 600; text-decoration: none; cursor: pointer; border: none; transition: opacity 0.15s, transform 0.1s; }
        .btn:hover { opacity: 0.88; transform: translateY(-1px); }
        .btn-gold { background: var(--gold); color: #fff; }
        .btn-outline { background: transparent; border: 2px solid rgba(255,255,255,0.6); color: #fff; }
        .btn-green { background: var(--green); color: #fff; }
        .hero-btns { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }

        section { padding: 4.5rem 2rem; }
        .container { max-width: 1080px; margin: 0 auto; }
        .container-wide { max-width: 1080px; margin: 0 auto; }
        .section-rule { border: none; border-top: 1px solid var(--border); margin: 0; }
        .eyebrow { font-size: 0.75rem; letter-spacing: 0.14em; text-transform: uppercase; color: var(--gold); font-weight: 600; margin-bottom: 0.6rem; }
        h2 { font-family: var(--serif); font-size: clamp(1.7rem, 3.5vw, 2.4rem); font-weight: normal; line-height: 1.2; text-wrap: balance; color: var(--ink); margin-bottom: 1rem; }
        h3 { font-family: var(--serif); font-size: 1.3rem; font-weight: normal; color: var(--ink); margin-bottom: 0.5rem; }
        p { color: var(--mid); margin-bottom: 1rem; }
        p:last-child { margin-bottom: 0; }

        .group-section { background: #14380A; color: #fff; position: relative; overflow: hidden; }
        .group-section p { color: rgba(255,255,255,0.92); }
        .group-section h2 { color: #fff; }
        .group-section .eyebrow { color: var(--gold); }
        .big-3 { position: absolute; right: -0.1em; top: 50%; transform: translateY(-50%); font-family: var(--serif); font-size: clamp(12rem, 22vw, 22rem); font-weight: bold; color: rgba(255,255,255,0.06); line-height: 1; pointer-events: none; user-select: none; }
        .group-inner { position: relative; z-index: 1; }
        .anlaesse-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 0.75rem; margin-top: 1.75rem; }
        .anlass { background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.2); border-radius: var(--radius); padding: 0.9rem 1.1rem; font-size: 0.95rem; color: rgba(255,255,255,0.95); }
        .anlass-icon { font-size: 1.4rem; display: block; margin-bottom: 0.3rem; }

        .fahrzeuge-section { background: #F5F0E7; }
        .fahrzeug-list { display: flex; flex-direction: column; gap: 0; margin-top: 2.5rem; }
        .fahrzeug-row { display: grid; grid-template-columns: 260px 1fr; gap: 2.5rem; align-items: start; padding: 2.5rem 0; border-top: 1px solid var(--border); }
        .fahrzeug-row:last-child { border-bottom: 1px solid var(--border); }
        .fahrzeug-foto-wrap { width: 100%; aspect-ratio: 4/3; border-radius: 8px; overflow: hidden; position: relative; }
        .fahrzeug-foto-wrap img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .fahrzeug-placeholder { width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.6rem; font-size: 0.78rem; font-weight: 600; letter-spacing: 0.04em; border-radius: 8px; }
        .fahrzeug-placeholder svg { width: 52px; height: 52px; }
        .placeholder-lotte { background: var(--lotte-bg); color: var(--lotte-fg); }
        .placeholder-flitzer { background: var(--flitzer-bg); color: var(--flitzer-fg); }
        .placeholder-piter { background: var(--piter-bg); color: var(--piter-fg); }
        .foto-hinweis { position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.45); color: rgba(255,255,255,0.85); font-size: 0.68rem; text-align: center; padding: 0.3rem; }
        .badge-lotte { background: var(--lotte-bg); color: var(--lotte-fg); }
        .badge-flitzer { background: var(--flitzer-bg); color: var(--flitzer-fg); }
        .badge-piter { background: var(--piter-bg); color: var(--piter-fg); }
        .fahrzeug-name { font-family: var(--serif); font-size: 1.4rem; color: var(--ink); margin-bottom: 0.25rem; }
        .fahrzeug-typ { font-size: 0.8rem; letter-spacing: 0.08em; text-transform: uppercase; color: var(--mid); margin-bottom: 0.6rem; }
        .fahrzeug-gaeste { display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.85rem; font-weight: 600; padding: 0.2rem 0.7rem; border-radius: 999px; margin-bottom: 0.75rem; }
        .gaeste-lotte { background: var(--lotte-bg); color: var(--lotte-fg); }
        .gaeste-flitzer { background: var(--flitzer-bg); color: var(--flitzer-fg); }
        .gaeste-piter { background: var(--piter-bg); color: var(--piter-fg); }

        .piloten-section { background: #FDFAF5; }
        .piloten-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 1rem; margin-top: 2rem; }
        .pilot-card { background: #F5F0E7; border: 1px solid var(--border); border-radius: 10px; padding: 1.1rem 0.75rem; text-align: center; }
        .pilot-foto-wrap { width: 72px; height: 72px; border-radius: 50%; overflow: hidden; margin: 0 auto 0.6rem; }
        .pilot-foto-wrap img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .pilot-avatar { width: 72px; height: 72px; border-radius: 50%; background: var(--green-soft); color: var(--green); font-family: var(--serif); font-size: 1.5rem; display: flex; align-items: center; justify-content: center; margin: 0 auto 0.6rem; font-weight: bold; border: 2px solid var(--border); }
        .pilot-name { font-size: 0.88rem; font-weight: 600; color: var(--ink); }

        .ausbildung-section { background: #F5F0E7; }
        .steps { display: flex; flex-direction: column; gap: 1.25rem; margin-top: 2rem; }
        .step { display: flex; gap: 1.25rem; align-items: flex-start; }
        .step-dot { width: 36px; height: 36px; border-radius: 50%; background: var(--green-soft); color: var(--green); font-weight: 700; font-size: 0.9rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px; }
        .gfo-badge { display: inline-flex; align-items: center; gap: 0.5rem; background: var(--gold-soft); border: 1px solid var(--gold); color: var(--gold); font-size: 0.82rem; font-weight: 600; padding: 0.4rem 1rem; border-radius: var(--radius); margin-top: 1.5rem; }
        .melde-box { margin-top: 2.5rem; background: var(--green-soft); border-left: 4px solid var(--green); border-radius: 0 var(--radius) var(--radius) 0; padding: 1.5rem 2rem; display: flex; align-items: center; justify-content: space-between; gap: 1.5rem; flex-wrap: wrap; }
        .melde-box h3 { margin-bottom: 0.25rem; }
        .melde-box p { margin: 0; font-size: 0.92rem; }

        .zukunft-section { background: #FDFAF5; }
        .zukunft-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1.25rem; margin-top: 2rem; }
        .zukunft-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 1.5rem; }
        .zukunft-icon { font-size: 1.8rem; margin-bottom: 0.75rem; display: block; }

        .spenden-section { background: var(--gold-soft); }
        .spenden-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1.25rem; margin-top: 2rem; }
        .spenden-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 1.5rem; }
        .spenden-card h3 { margin-bottom: 0.75rem; font-size: 1.05rem; }
        .iban { font-family: monospace; font-size: 0.88rem; background: var(--ground); padding: 0.6rem 0.8rem; border-radius: var(--radius); letter-spacing: 0.04em; word-break: break-all; color: var(--ink); display: block; margin-top: 0.5rem; }
        .btn-paypal { background: #003087; color: #fff; display: inline-flex; align-items: center; gap: 0.5rem; width: 100%; justify-content: center; margin-top: 0.5rem; }

        .kontakt-section { background: #1C4A10; color: #fff; }
        .kontakt-section h2 { color: #fff; }
        .kontakt-section .eyebrow { color: var(--gold); }
        .kontakt-section p { color: rgba(255,255,255,0.92); }
        .kontakt-form { margin-top: 2rem; display: grid; gap: 1rem; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .form-group { display: flex; flex-direction: column; gap: 0.4rem; }
        .form-group label { font-size: 0.82rem; letter-spacing: 0.05em; text-transform: uppercase; color: rgba(255,255,255,0.88); }
        .form-group input, .form-group textarea, .form-group select { background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.35); border-radius: var(--radius); color: #fff; padding: 0.65rem 0.9rem; font-size: 0.95rem; font-family: var(--sans); outline: none; transition: border-color 0.15s; width: 100%; }
        .form-group input::placeholder, .form-group textarea::placeholder { color: rgba(255,255,255,0.55); }
        .form-group input:focus, .form-group textarea:focus, .form-group select:focus { border-color: var(--gold); }
        .form-group select option { background: var(--green); color: #fff; }
        .form-group textarea { resize: vertical; min-height: 100px; }

        footer { background: #1a1208; color: rgba(255,255,255,0.75); text-align: center; padding: 2.5rem 1rem; font-size: 0.88rem; line-height: 1.8; }
        footer a { color: #C8881A; text-decoration: none; transition: color 0.15s; }
        footer a:hover { color: #e0a030; }
        footer .piloten-link { color: rgba(255,255,255,0.5); font-size: 0.78rem; }
        footer .piloten-link:hover { color: rgba(255,255,255,0.8); }

        /* Galerie */
        .galerie-section { background: #F5F0E7; }
        .galerie-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1.25rem; margin-top: 2rem; }
        .galerie-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }
        .galerie-card img { width: 100%; aspect-ratio: 4/3; object-fit: cover; display: block; }
        .galerie-info { padding: 0.75rem 1rem; }
        .galerie-beschreibung { font-size: 0.9rem; color: var(--ink); margin-bottom: 0.25rem; }
        .galerie-meta { font-size: 0.75rem; color: var(--mid); }
        .galerie-empty { text-align: center; color: var(--mid); padding: 3rem; font-size: 0.95rem; }

        /* Upload-Bereich */
        .upload-box { background: var(--green-soft); border: 2px dashed var(--green); border-radius: var(--radius); padding: 1.5rem; margin-top: 1.5rem; }
        .upload-box h3 { color: var(--green); margin-bottom: 1rem; font-size: 1rem; }
        .upload-field { display: flex; flex-direction: column; gap: 0.4rem; margin-bottom: 0.75rem; }
        .upload-field label { font-size: 0.78rem; font-weight: 600; color: var(--green); text-transform: uppercase; letter-spacing: 0.05em; }
        .upload-field input, .upload-field textarea { border: 1px solid var(--border); border-radius: var(--radius); padding: 0.5rem 0.75rem; font-size: 0.9rem; background: var(--surface); color: var(--ink); outline: none; width: 100%; font-family: var(--sans); }
        .upload-field textarea { resize: vertical; min-height: 70px; }
        .btn-upload { background: var(--green); color: #fff; border: none; padding: 0.6rem 1.5rem; border-radius: var(--radius); font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: opacity 0.15s; }
        .btn-upload:hover { opacity: 0.85; }
        .upload-status { font-size: 0.82rem; margin-top: 0.5rem; }

        .hamburger-btn { display: none; }
        @media (max-width: 768px) { .hamburger-btn { display: flex; } }

        @media (max-width: 768px) {
          nav { padding: 0 1rem; }
          .nav-links { display: none; }
          section { padding: 3rem 1.25rem; }
          .hero { padding: 3.5rem 1.25rem 3.5rem; }
          .fahrzeug-row { grid-template-columns: 1fr; }
          .fahrzeug-row { grid-template-columns: 1fr; }
          .fahrzeug-foto-wrap { max-width: 320px; }
          .form-row { grid-template-columns: 1fr; }
          .melde-box { flex-direction: column; }
          .big-3 { font-size: 40vw; opacity: 0.5; }
        }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { transition: none !important; animation: none !important; }
        }
      `}</style>

      {/* Navigation */}
      <nav aria-label="Hauptnavigation">
        <a href="/" className="nav-logo">
          <svg width="28" height="28" viewBox="0 0 100 100" style={{verticalAlign:'middle',marginRight:'0.5rem'}} fill="none">
            <circle cx="50" cy="50" r="48" fill="#3A7A28"/>
            <circle cx="28" cy="68" r="10" stroke="white" strokeWidth="4"/>
            <circle cx="72" cy="68" r="10" stroke="white" strokeWidth="4"/>
            <circle cx="34" cy="28" r="7" stroke="white" strokeWidth="3"/>
            <rect x="38" y="35" width="26" height="22" rx="4" stroke="white" strokeWidth="3"/>
            <line x1="28" y1="58" x2="42" y2="58" stroke="white" strokeWidth="3"/>
            <line x1="64" y1="40" x2="72" y2="58" stroke="white" strokeWidth="3"/>
          </svg>
          Mertener Rikschakutscher
        </a>
        <ul className="nav-links">
          <li><a href="#fahrten">Fahrten</a></li>
          <li><a href="#fahrzeuge">Fahrzeuge</a></li>
          <li><a href="#team">Team</a></li>
          <li><a href="#touren">Touren</a></li>
          <li><a href="#ausbildung">Mitmachen</a></li>
          <li><a href="#spenden">Spenden</a></li>
          <li><a href="/galerie">Galerie</a></li>
          <li><a href="#kontakt">Kontakt</a></li>
          <li><a href="/kalender" className="nav-btn">📅 Termine</a></li>
          <li><a href="/gutschein" className="nav-btn">🎁 Gutschein</a></li>
        </ul>
        <HamburgerMenu />
      </nav>
      <Banner />

      {/* Hero */}
      <section className="hero">
        <div className="container">
          <div className="hero-eyebrow">Bornheim-Merten · Ehrenamt · seit 2018</div>
          <h1>Mertener<br/>Rikschakutscher</h1>
          <p className="hero-sub">{t.hero_sub}</p>
          <div className="vehicle-pills">
            <a href="#fahrzeug-lotte" className="pill pill-lotte">Flotte Lotte</a>
            <a href="#fahrzeug-flitzer" className="pill pill-flitzer">Flinker Flitzer</a>
            <a href="#fahrzeug-piter" className="pill pill-piter">Jruuse Piter</a>
          </div>
          <div className="hero-btns">
            <a href="#kontakt" className="btn btn-gold">Fahrt anfragen</a>
            <a href="#fahrten" className="btn btn-outline">Mehr erfahren</a>
          </div>
        </div>
      </section>

      <hr className="section-rule"/>

      {/* Gruppenfahrten */}
      <section className="group-section" id="fahrten">
        <div className="big-3">3</div>
        <div className="container">
          <div className="group-inner">
            <div className="eyebrow">Das besondere Highlight</div>
            <h2>Drei Rikschas,<br/>ein gemeinsames Erlebnis</h2>
            <p>{t.gruppenfahrten_1}</p>
            <p>{t.gruppenfahrten_2}</p>
            <div className="anlaesse-grid">
              <div className="anlass"><span className="anlass-icon">🎂</span>Geburtstage & Jubiläen</div>
              <div className="anlass"><span className="anlass-icon">💒</span>Hochzeiten & Polterabend</div>
              <div className="anlass"><span className="anlass-icon">🏢</span>Firmen & Teamausflüge</div>
              <div className="anlass"><span className="anlass-icon">👨‍👩‍👧‍👦</span>Familienausflüge</div>
              <div className="anlass"><span className="anlass-icon">🎉</span>Vereinsfeste & Events</div>
              <div className="anlass"><span className="anlass-icon">🌳</span>Einfach so — zum Spaß</div>
            </div>
          </div>
        </div>
      </section>

      <hr className="section-rule"/>

      {/* Fahrzeuge */}
      <section className="fahrzeuge-section" id="fahrzeuge">
        <div className="container">
          <div className="eyebrow">Unsere Flotte</div>
          <h2>Drei Rikschas, drei Charaktere</h2>
          <p>Jedes Fahrzeug hat seinen eigenen Stil — zusammen sind sie unschlagbar.</p>
          <div className="fahrzeug-list">
            <div className="fahrzeug-row" id="fahrzeug-lotte">
              <div className="fahrzeug-foto-wrap">
                {t.foto_lotte
                  ? <img src={t.foto_lotte} alt="Flotte Lotte" />
                  : <div className="fahrzeug-placeholder placeholder-lotte">
                      <svg viewBox="0 0 64 40" fill="none" width="52" height="52"><circle cx="12" cy="32" r="7" stroke="currentColor" strokeWidth="2.5"/><circle cx="52" cy="32" r="7" stroke="currentColor" strokeWidth="2.5"/><rect x="16" y="10" width="28" height="18" rx="3" stroke="currentColor" strokeWidth="2"/><line x1="12" y1="25" x2="30" y2="25" stroke="currentColor" strokeWidth="2"/><line x1="44" y1="14" x2="52" y2="25" stroke="currentColor" strokeWidth="2"/></svg>
                      Rikscha
                      <span style={{fontSize:'0.65rem',opacity:0.6}}>Foto folgt</span>
                    </div>
                }
              </div>
              <div>
                <div className="fahrzeug-name">Flotte Lotte</div>
                <div className="fahrzeug-typ">Rikscha</div>
                <span className="fahrzeug-gaeste gaeste-lotte">👥 bis 2 Gäste</span>
                <p>{t.lotte_text}</p>
              </div>
            </div>
            <div className="fahrzeug-row" id="fahrzeug-flitzer">
              <div className="fahrzeug-foto-wrap">
                {t.foto_flitzer
                  ? <img src={t.foto_flitzer} alt="Flinker Flitzer" />
                  : <div className="fahrzeug-placeholder placeholder-flitzer">
                      <svg viewBox="0 0 64 40" fill="none" width="52" height="52"><circle cx="10" cy="32" r="7" stroke="currentColor" strokeWidth="2.5"/><circle cx="54" cy="32" r="7" stroke="currentColor" strokeWidth="2.5"/><ellipse cx="32" cy="22" rx="20" ry="9" stroke="currentColor" strokeWidth="2"/><line x1="10" y1="25" x2="12" y2="32" stroke="currentColor" strokeWidth="2"/><line x1="52" y1="22" x2="54" y2="25" stroke="currentColor" strokeWidth="2"/></svg>
                      Liegetandem
                      <span style={{fontSize:'0.65rem',opacity:0.6}}>Foto folgt</span>
                    </div>
                }
              </div>
              <div>
                <div className="fahrzeug-name">Flinker Flitzer</div>
                <div className="fahrzeug-typ">Liegetandem</div>
                <span className="fahrzeug-gaeste gaeste-flitzer">👤 1 Gast</span>
                <p>{t.flitzer_text}</p>
              </div>
            </div>
            <div className="fahrzeug-row" id="fahrzeug-piter">
              <div className="fahrzeug-foto-wrap">
                {t.foto_piter
                  ? <img src={t.foto_piter} alt="Jruuse Piter" />
                  : <div className="fahrzeug-placeholder placeholder-piter">
                      <svg viewBox="0 0 64 40" fill="none" width="52" height="52"><circle cx="10" cy="32" r="7" stroke="currentColor" strokeWidth="2.5"/><circle cx="54" cy="32" r="7" stroke="currentColor" strokeWidth="2.5"/><rect x="16" y="14" width="32" height="14" rx="2" stroke="currentColor" strokeWidth="2"/><line x1="10" y1="25" x2="16" y2="25" stroke="currentColor" strokeWidth="2"/><line x1="48" y1="21" x2="54" y2="25" stroke="currentColor" strokeWidth="2"/><line x1="28" y1="14" x2="28" y2="28" stroke="currentColor" strokeWidth="1.5"/></svg>
                      Paralleltandem
                      <span style={{fontSize:'0.65rem',opacity:0.6}}>Foto folgt</span>
                    </div>
                }
              </div>
              <div>
                <div className="fahrzeug-name">Jruuse Piter</div>
                <div className="fahrzeug-typ">Paralleltandem</div>
                <span className="fahrzeug-gaeste gaeste-piter">👤 1 Gast</span>
                <p>{t.piter_text}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <hr className="section-rule"/>

      {/* Team */}
      <section className="piloten-section" id="team">
        <div className="container">
          <div className="eyebrow">Unser Team</div>
          <h2>Elf Piloten mit Herzblut</h2>
          <p>{t.team_text}</p>
          <div className="piloten-grid">
            {['D|Doro','G|Guido','HH|Hans-Heinrich','H|Helenah','H|Heribert','Ho|Holger','L|Lucia','R|Rolf','S|Sabine','W|Walter','We|Werner'].map(p => {
              const [initials, name] = p.split('|');
              const fotoKey = `foto_pilot_${name.toLowerCase().replace(/-/g, '_')}`;
              const fotoUrl = t[fotoKey];
              return (
                <div key={name} className="pilot-card">
                  {fotoUrl
                    ? <div className="pilot-foto-wrap"><img src={fotoUrl} alt={name} /></div>
                    : <div className="pilot-avatar">{initials}</div>
                  }
                  <div className="pilot-name">{name}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <hr className="section-rule"/>

      {/* Touren */}
      <section className="fahrzeuge-section" id="touren">
        <div className="container">
          <div className="eyebrow">Unsere Ausflüge</div>
          <h2>Frischer Wind und wunderbare Ausblicke</h2>
          <p>Ob zur Mertener Heide, durch Gemüsefelder oder zu Alpakas — unsere Ausflüge sind so vielfältig wie die Wünsche unserer Gäste.</p>
          <div className="zukunft-grid" style={{marginTop:'2rem'}}>
            <div className="zukunft-card"><span className="zukunft-icon">🏰</span><h3>Brühler Schlösserrunde</h3><p style={{fontSize:'0.9rem'}}>Durch Gemüsefelder nach Walberberg, Eispause in Brühl, durch den Schlosspark Augustusburg (mit Sondergenehmigung!), Biergarten am Schloss Ludwigslust.</p></div>
            <div className="zukunft-card"><span className="zukunft-icon">🌿</span><h3>Mertener Heide & Natur</h3><p style={{fontSize:'0.9rem'}}>Vorbei an Pferdekoppeln, Ziegenweiden und Alpakas ins Grüne. Frische Luft, vertraute und neue Lieblingsorte.</p></div>
            <div className="zukunft-card"><span className="zukunft-icon">⛪</span><h3>Kirche, Rhein & Repair-Café</h3><p style={{fontSize:'0.9rem'}}>Kurze, gemütliche Fahrten zu vertrauten Orten im Quartier. Ideal für Menschen, die einfach mal raus möchten.</p></div>
            <div className="zukunft-card"><span className="zukunft-icon">🌊</span><h3>Baggerseen & Gutshöfe</h3><p style={{fontSize:'0.9rem'}}>Immer mit dem Ziel, schöne Stunden in der Natur zu verbringen und gemeinsam besondere Momente zu erleben.</p></div>
          </div>
        </div>
      </section>

      <hr className="section-rule"/>

      {/* Mitmachen */}
      <section className="ausbildung-section" id="ausbildung">
        <div className="container">
          <div className="eyebrow">Pilot werden</div>
          <h2>So wirst du Rikschakutscher</h2>
          <p>Du fährst gerne Fahrrad, magst Menschen und hast Freude daran, anderen etwas Besonderes zu schenken? Dann bist du bei uns genau richtig.</p>
          <div className="steps">
            <div className="step"><div className="step-dot">1</div><div><h3>Fahrradaffin & offen für Menschen</h3><p>Du solltest sicher und gerne Fahrrad fahren und Freude am Umgang mit Menschen haben.</p></div></div>
            <div className="step"><div className="step-dot">2</div><div><h3>Einweisung durch erfahrene Piloten</h3><p>Du wirst in Theorie und Praxis eingewiesen. Am Ende steht ein Checkbericht.</p></div></div>
            <div className="step"><div className="step-dot">3</div><div><h3>Polizeiliches Führungszeugnis</h3><p>Für den Umgang mit Fahrgästen ist ein polizeiliches Führungszeugnis erforderlich.</p></div></div>
            <div className="step"><div className="step-dot">4</div><div><h3>Ehrenamtlicher Vertrag mit der GFO</h3><p>Als Pilot schließt du einen ehrenamtlichen Vertrag mit der GFO ab.</p></div></div>
          </div>
          <div className="gfo-badge">✦ Ein Projekt der Gesellschaft der Franziskanerinnen zu Olpe (GFO)</div>
          <div className="melde-box">
            <div><h3>Interesse geweckt?</h3><p>Wir freuen uns über jede Verstärkung — meld dich einfach!</p></div>
            <a href="#kontakt" className="btn btn-green">Jetzt melden</a>
          </div>
        </div>
      </section>

      <hr className="section-rule"/>

      {/* Zukunft */}
      <section className="zukunft-section">
        <div className="container">
          <div className="eyebrow">Ausblick</div>
          <h2>Was wir noch vorhaben</h2>
          <p>Wir haben viel vor — und mit eurer Unterstützung wird noch mehr möglich.</p>
          <div className="zukunft-grid">
            <div className="zukunft-card"><span className="zukunft-icon">🚲</span><h3>Mehr Fahrzeuge</h3><p style={{fontSize:'0.9rem'}}>Wir träumen von einer wachsenden Flotte — für mehr Fahrten, mehr Gäste und größere Gruppen.</p></div>
            <div className="zukunft-card"><span className="zukunft-icon">🗺️</span><h3>Feste Touren</h3><p style={{fontSize:'0.9rem'}}>Ausgeschilderte Routen durch Merten mit interessanten Stationen.</p></div>
            <div className="zukunft-card"><span className="zukunft-icon">🤝</span><h3>Mehr Piloten</h3><p style={{fontSize:'0.9rem'}}>Je mehr Piloten, desto mehr Fahrten. Wir freuen uns über jeden, der mitmachen möchte.</p></div>
            <div className="zukunft-card"><span className="zukunft-icon">🌍</span><h3>Kooperationen</h3><p style={{fontSize:'0.9rem'}}>Zusammenarbeit mit lokalen Vereinen, Pflegeeinrichtungen und der Stadt.</p></div>
          </div>
        </div>
      </section>

      <hr className="section-rule"/>

      {/* Spenden */}
      <section className="spenden-section" id="spenden">
        <div className="container">
          <div className="eyebrow">Unterstützen</div>
          <h2>Unsere Fahrten sind kostenlos —<br/>aus Freude am Fahren.</h2>
          <p>{t.spenden_text}</p>
          <div className="spenden-grid">
            <div className="spenden-card">
              <h3>💳 PayPal</h3>
              <p style={{fontSize:'0.9rem'}}>Schnell und unkompliziert — direkt online spenden.</p>
              <a href="#" className="btn btn-paypal">Jetzt via PayPal spenden</a>
              <p style={{fontSize:'0.8rem',marginTop:'0.5rem',color:'var(--mid)'}}>PayPal-Link folgt</p>
            </div>
            <div className="spenden-card">
              <h3>🏦 Überweisung</h3>
              <p style={{fontSize:'0.9rem'}}>Kontoinhaber:</p>
              <span className="iban">Mertener Rikschakutscher / GFO</span>
              <p style={{fontSize:'0.9rem',marginTop:'0.75rem'}}>IBAN:</p>
              <span className="iban">DE•• •••• •••• •••• •••• ••</span>
              <p style={{fontSize:'0.9rem',marginTop:'0.75rem'}}>Verwendungszweck:</p>
              <span className="iban">Spende Mertener Rikschakutscher</span>
            </div>
            <div className="spenden-card">
              <h3>💵 Bar</h3>
              <p style={{fontSize:'0.9rem'}}>Nach der Fahrt einfach dem Piloten mitgeben — kein Mindestbetrag, keine Quittung nötig.</p>
              <p style={{fontSize:'0.9rem',marginTop:'0.75rem'}}>Jede Münze zählt. Danke von Herzen!</p>
            </div>
          </div>
        </div>
      </section>

      <hr className="section-rule"/>

      {/* Kalender */}
      <section className="fahrzeuge-section" id="kalender">
        <div className="container-wide">
          <div className="eyebrow">Termine</div>
          <h2>Wann sind wir unterwegs?</h2>
          <p>Schaut im Fahrtenkalender nach, wann wir unterwegs sind — oder bucht direkt eine eigene Fahrt.</p>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:'1.5rem',marginTop:'2rem'}}>
            <a href="/kalender" target="_blank" style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'1rem',padding:'2rem 1.5rem',background:'var(--surface)',borderRadius:'14px',border:'1.5px solid var(--border)',textDecoration:'none',color:'inherit'}}>
              <span style={{fontSize:'2.5rem'}}>📅</span>
              <div style={{textAlign:'center'}}><div style={{fontWeight:700,fontSize:'1.05rem',marginBottom:'0.3rem'}}>Fahrtenkalender</div><div style={{fontSize:'0.85rem',color:'var(--mid)'}}>Alle Termine auf einen Blick</div></div>
              <span style={{padding:'0.5rem 1.25rem',background:'#2D6B1E',color:'#fff',borderRadius:'6px',fontSize:'0.85rem',fontWeight:600}}>Kalender öffnen ↗</span>
            </a>
            <a href="/buchen" target="_blank" style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'1rem',padding:'2rem 1.5rem',background:'var(--surface)',borderRadius:'14px',border:'1.5px solid #C8881A',textDecoration:'none',color:'inherit'}}>
              <span style={{fontSize:'2.5rem'}}>🚲</span>
              <div style={{textAlign:'center'}}><div style={{fontWeight:700,fontSize:'1.05rem',marginBottom:'0.3rem'}}>Fahrt anfragen</div><div style={{fontSize:'0.85rem',color:'var(--mid)'}}>Wunschdatum direkt eintragen</div></div>
              <span style={{padding:'0.5rem 1.25rem',background:'#C8881A',color:'#fff',borderRadius:'6px',fontSize:'0.85rem',fontWeight:600}}>Jetzt buchen ↗</span>
            </a>
            <a href="/api/ical" target="_blank" style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'1rem',padding:'2rem 1.5rem',background:'var(--surface)',borderRadius:'14px',border:'1.5px solid var(--border)',textDecoration:'none',color:'inherit'}}>
              <span style={{fontSize:'2.5rem'}}>📆</span>
              <div style={{textAlign:'center'}}><div style={{fontWeight:700,fontSize:'1.05rem',marginBottom:'0.3rem'}}>Kalender abonnieren</div><div style={{fontSize:'0.85rem',color:'var(--mid)'}}>In Outlook, iPhone oder Google</div></div>
              <span style={{padding:'0.5rem 1.25rem',background:'#2D6B1E',color:'#fff',borderRadius:'6px',fontSize:'0.85rem',fontWeight:600}}>iCal herunterladen ↗</span>
            </a>
          </div>
        </div>
      </section>

      <hr className="section-rule"/>

      {/* Galerie */}
      <section className="galerie-section" id="galerie">
        <div className="container">
          <div className="eyebrow">Eindrücke</div>
          <h2>Momente auf der Strecke</h2>
          <p>Fotos von unseren Piloten — echte Augenblicke aus dem Rikscha-Alltag.</p>
          <div className="galerie-grid">
            {galerie.length === 0
              ? <div className="galerie-empty">Noch keine Fotos vorhanden — Piloten können über den Piloten-Bereich Fotos hochladen.</div>
              : galerie.map(f => (
                <div key={f.id} className="galerie-card">
                  <img src={f.url} alt={f.beschreibung || ''} loading="lazy" />
                  <div className="galerie-info">
                    {f.beschreibung && <div className="galerie-beschreibung">{f.beschreibung}</div>}
                    <div className="galerie-meta">{f.pilot} · {new Date(f.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}</div>
                  </div>
                </div>
              ))
            }
          </div>
          {galerie.length > 0 && (
            <div style={{textAlign:'center',marginTop:'1.5rem'}}>
              <a href="/galerie" style={{display:'inline-block',padding:'0.6rem 1.5rem',background:'var(--green)',color:'#fff',borderRadius:'var(--radius)',fontSize:'0.9rem',fontWeight:600,textDecoration:'none'}}>Alle Fotos ansehen ↗</a>
            </div>
          )}
        </div>
      </section>

      <hr className="section-rule"/>

      {/* Kontakt */}
      <section className="kontakt-section" id="kontakt">
        <div className="container">
          <div className="eyebrow">Schreib uns</div>
          <h2>Fahrt anfragen oder Fragen stellen</h2>
          <p>{t.kontakt_text}</p>
          <form className="kontakt-form">
            <div className="form-row">
              <div className="form-group"><label>Name</label><input type="text" placeholder="Dein Name" required/></div>
              <div className="form-group"><label>E-Mail</label><input type="email" placeholder="deine@email.de" required/></div>
            </div>
            <div className="form-group">
              <label>Anliegen</label>
              <select>
                <option value="fahrt">Fahrt anfragen</option>
                <option value="gruppe">Gruppenfahrt mit allen Rikschas</option>
                <option value="pilot">Als Pilot mitmachen</option>
                <option value="frage">Allgemeine Frage</option>
              </select>
            </div>
            <div className="form-group"><label>Nachricht</label><textarea placeholder="Wann, wie viele Personen, besondere Wünsche..."></textarea></div>
            <div><button type="submit" className="btn btn-gold">Nachricht senden</button></div>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <p style={{fontWeight:600,color:'#fff',fontSize:'0.95rem',marginBottom:'0.25rem'}}>Mertener Rikschakutscher</p>
        <p>Ein ehrenamtliches Projekt der <a href="#">Gesellschaft der Franziskanerinnen zu Olpe (GFO)</a></p>
        <p style={{marginTop:'0.25rem'}}>📞 <a href="tel:022279328383">02227 9328383</a></p>
        <p style={{marginTop:'1rem',borderTop:'1px solid rgba(255,255,255,0.1)',paddingTop:'1rem'}}>
          <a href="/impressum">Impressum</a> &nbsp;·&nbsp; <a href="/datenschutz">Datenschutz</a>
          &nbsp;·&nbsp; <PilotenFooterLink />
        </p>
        <p style={{marginTop:'0.5rem',fontSize:'0.75rem',color:'rgba(255,255,255,0.3)'}}>© 2025</p>
      </footer>

      <PilotenModal />
    </>
  );
}
