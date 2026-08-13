import type { Metadata } from 'next';
import nextDynamic from 'next/dynamic';
import { createServiceClient } from '@/lib/supabase';
import HamburgerMenu from './HamburgerMenu';

const TourenKarte = nextDynamic(() => import('./TourenKarte'), { ssr: false });
import PilotenFooterLink from './PilotenFooterLink';
import PilotenNavLink from './PilotenNavLink';
import PilotenModal from './PilotenModal';
import Banner from '../(app)/Banner';
import QrSpenden from './QrSpenden';
import AusleihenButton from './AusleihenButton';
import KontaktFormular from './KontaktFormular';
import ThemeToggle from './ThemeToggle';
import EinfacheSpracheToggle from './EinfacheSpracheToggle';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export const metadata: Metadata = {
  title: { absolute: 'Mertener Rikschakutscher – Bornheim-Merten' },
  description: 'Kostenlose Rikschafahrten durch Bornheim-Merten seit 2018. Drei Rikschas, elf Piloten, ein Herz fürs Ehrenamt.',
  openGraph: {
    title: 'Mertener Rikschakutscher',
    description: 'Kostenlose Rikschafahrten durch Bornheim-Merten. Für alle, die Freude an einem Ausflug haben — kostenlos, barrierefrei, mit Herz.',
    url: 'https://rikscha-kutscher.de',
    siteName: 'Mertener Rikschakutscher',
    locale: 'de_DE',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mertener Rikschakutscher',
    description: 'Kostenlose Rikschafahrten durch Bornheim-Merten seit 2018.',
  },
  alternates: { canonical: 'https://rikscha-kutscher.de' },
};

const DEFAULTS: Record<string, string> = {
  hero_eyebrow:      'Bornheim-Merten · Ehrenamt · seit 2018',
  hero_titel:        'Mertener Rikschakutscher',
  hero_sub:          'Fahrtwind im Gesicht, gute Gesellschaft an der Seite — kostenlose Rikschafahrten durch Merten und die Region. Mit Herz, Pedalen und elf begeisterten Piloten.',
  fahrten_h2:        'Drei Rikschas, ein gemeinsames Erlebnis',
  gruppenfahrten_1:  'Unsere Rikschafahrten richten sich besonders an Menschen mit körperlichen oder geistigen Einschränkungen — und an alle, die ihnen nahe sind. Begleitpersonen sind herzlich willkommen.',
  gruppenfahrten_2:  'Bucht alle drei Rikschas auf einmal: jede Kutsche mit eigenem Piloten, alle gemeinsam unterwegs. Ob Geburtstag, Gruppenausflug aus dem Pflegeheim oder ein besonderer Anlass — im Konvoi wird aus einer Fahrt ein echtes gemeinsames Erlebnis.',
  fahrzeuge_h2:      'Drei Rikschas, drei Charaktere',
  fahrzeuge_intro:   'Jedes Fahrzeug hat seinen eigenen Stil — zusammen sind sie unschlagbar.',
  lotte_text:        'Die klassische Rikscha — geräumig, komfortabel, mit Rundumblick. Ob zur Kirche, zum Rhein oder durch die Mertener Heide: Flotte Lotte ermöglicht entspanntes Mitfahren mit großer Wirkung.',
  flitzer_text:      'Ideal für sehbehinderte oder körperlich eingeschränkte Menschen mit geistiger Fitness — wer mag, kann sogar mittreten! Der Flinker Flitzer bietet eine völlig neue Perspektive: nah am Boden, nah am Leben.',
  piter_text:        'Pilot und Gast fahren Seite an Seite — besonders geeignet für Menschen mit Demenz, die körperlich fit sind. Das Nebeneinander schafft Sicherheit, Nähe und echte Gespräche auf Augenhöhe.',
  team_h2:           'Elf Piloten mit Herzblut',
  team_text:         'Alle ehrenamtlich, alle begeisterte Radfahrer — und alle aus der Überzeugung dabei, dass gemeinsame Erlebnisse verbinden. Woche für Woche bringen sie Menschen zusammen.',
  touren_h2:         'Frischer Wind und wunderbare Ausblicke',
  touren_intro:      'Ob zur Mertener Heide, durch Gemüsefelder oder zu Alpakas — unsere Ausflüge sind so vielfältig wie die Wünsche unserer Gäste.',
  tour_1_titel:      'Brühler Schlösserrunde',
  tour_1_text:       'Durch Gemüsefelder nach Walberberg, Eispause in Brühl, durch den Schlosspark Augustusburg (mit Sondergenehmigung!), Biergarten am Schloss Ludwigslust.',
  tour_2_titel:      'Mertener Heide & Natur',
  tour_2_text:       'Vorbei an Pferdekoppeln, Ziegenweiden und Alpakas ins Grüne. Frische Luft, vertraute und neue Lieblingsorte.',
  tour_3_titel:      'Kirche, Rhein & Repair-Café',
  tour_3_text:       'Kurze, gemütliche Fahrten zu vertrauten Orten im Quartier. Ideal für Menschen, die einfach mal raus möchten.',
  tour_4_titel:      'Baggerseen & Gutshöfe',
  tour_4_text:       'Immer mit dem Ziel, schöne Stunden in der Natur zu verbringen und gemeinsam besondere Momente zu erleben.',
  mitmachen_h2:      'So wirst du Rikschakutscher',
  mitmachen_intro:   'Du fährst gerne Fahrrad, magst Menschen und hast Freude daran, anderen etwas Besonderes zu schenken? Dann bist du bei uns genau richtig.',
  schritt_1_titel:   'Fahrradaffin & offen für Menschen',
  schritt_1_text:    'Du solltest sicher und gerne Fahrrad fahren und Freude am Umgang mit Menschen haben.',
  schritt_2_titel:   'Einweisung durch erfahrene Piloten',
  schritt_2_text:    'Du wirst in Theorie und Praxis eingewiesen. Am Ende steht ein Checkbericht.',
  schritt_3_titel:   'Polizeiliches Führungszeugnis',
  schritt_3_text:    'Für den Umgang mit Fahrgästen ist ein polizeiliches Führungszeugnis erforderlich.',
  schritt_4_titel:   'Ehrenamtlicher Vertrag mit der GFO',
  schritt_4_text:    'Als Pilot schließt du einen ehrenamtlichen Vertrag mit der GFO ab.',
  zukunft_h2:        'Was wir noch vorhaben',
  zukunft_intro:     'Wir haben viel vor — und mit eurer Unterstützung wird noch mehr möglich.',
  zukunft_1_titel:   'Mehr Fahrzeuge',
  zukunft_1_text:    'Wir träumen von einer wachsenden Flotte — für mehr Fahrten, mehr Gäste und größere Gruppen.',
  zukunft_2_titel:   'Feste Touren',
  zukunft_2_text:    'Ausgeschilderte Routen durch Merten mit interessanten Stationen.',
  zukunft_3_titel:   'Mehr Piloten',
  zukunft_3_text:    'Je mehr Piloten, desto mehr Fahrten. Wir freuen uns über jeden, der mitmachen möchte.',
  zukunft_4_titel:   'Kooperationen',
  zukunft_4_text:    'Zusammenarbeit mit lokalen Vereinen, Pflegeeinrichtungen und der Stadt.',
  ausleihen_titel:   'Rikscha selbst steuern — für Angehörige',
  ausleihen_text:    'Du bist Angehörige oder Angehöriger eines unserer Gäste und möchtest öfters gemeinsam auf Ausflug gehen — ganz ohne festen Termin und selbst am Lenker? Das könnte möglich sein. Sprich uns an, wir finden gemeinsam einen Weg, der für alle passt.',
  ausleihen_cta:     'Jetzt melden',
  kennzahlen_h2:     'Mertener Kutscher in Zahlen',
  stat_1_zahl:       '11',
  stat_1_label:      'Ehrenamtliche Piloten',
  stat_2_zahl:       '3',
  stat_2_label:      'Rikschas',
  stat_3_zahl:       '2018',
  stat_3_label:      'Gegründet',
  stat_4_zahl:       '500+',
  stat_4_label:      'Fahrten',
  stat_5_zahl:       '6+',
  stat_5_label:      'Jahre Erfahrung',
  stimmen_h2:        'Was Gäste und Piloten sagen',
  stimme_1_text:     'Eine wunderbare Erfahrung — ich hätte nie gedacht, dass eine Rikschafahrt so besonders sein kann. Das Tempo, die Natur, die nette Unterhaltung. Wir kommen gerne wieder!',
  stimme_1_name:     'Familie Meier',
  stimme_1_rolle:    'Gast',
  stimme_2_text:     'Als Pilot erlebe ich jede Fahrt neu. Die Dankbarkeit der Gäste und die frische Luft — das ist besser als jedes Fitnessstudio. Ich würde es jederzeit wieder tun.',
  stimme_2_name:     'Guido',
  stimme_2_rolle:    'Pilot',
  stimme_3_text:     'Meine Mutter hat Demenz und war zunächst skeptisch. Nach der Fahrt mit dem Jruuse Piter war sie strahlend — das hat uns alle bewegt. Vielen herzlichen Dank!',
  stimme_3_name:     'Tochter eines Gastes',
  stimme_3_rolle:    'Gast',
  stimme_4_text:     'Beim Rikschafahren sprechen wir nicht von Win-Win — sondern von vier Mal Win. Die Gäste genießen frische Luft und besondere Momente. Die Piloten erleben Freude und Sinn. Die GFO-Mitarbeiterinnen bekommen gut gelaunte Bewohner zurück. Und die Dorfbewohner freuen sich, wenn wir lachend einen schönen Tag wünschen. Das ist Ehrenamt, das wirklich ankommt.',
  stimme_4_name:     'Walter — Pilot & Mitgründer',
  stimme_4_rolle:    'Pilot',
  stimme_5_text:     '',
  stimme_5_name:     '',
  stimme_5_rolle:    'Gast',
  stimme_6_text:     '',
  stimme_6_name:     '',
  stimme_6_rolle:    'Gast',
  spenden_h2:        'Unsere Fahrten sind kostenlos — aus Freude am Fahren.',
  spenden_text:      'Wer möchte, kann mit einer Spende dazu beitragen, dass unsere Rikschas gepflegt und gewartet werden. Jeder Betrag hilft!',
  kontakt_h2:        'Fahrt anfragen oder Fragen stellen',
  kontakt_text:      'Ob Einzelfahrt, Gruppenausflug oder Interesse als neuer Pilot — wir melden uns schnell bei euch. Oder ruf uns direkt an: 02227 9328383 — gerne auch auf den Anrufbeantworter sprechen, wir rufen zurück.',
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
};

async function ladeGalerie(): Promise<{ id: string; url: string; beschreibung: string; pilot: string; created_at: string; stimmen: number }[]> {
  try {
    const db = createServiceClient();
    const { data } = await db
      .from('galerie')
      .select('id,url,beschreibung,pilot,created_at,stimmen')
      .eq('sichtbar', true)
      .order('stimmen', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(6);
    return data ?? [];
  } catch {
    return [];
  }
}

type Aktuell = { id: string; datum: string; titel: string; text: string; erstellt_von: string };

async function ladeAktuelles(): Promise<Aktuell[]> {
  try {
    const db = createServiceClient();
    const { data } = await db
      .from('aktuelles')
      .select('id, datum, titel, text, erstellt_von')
      .eq('aktiv', true)
      .order('datum', { ascending: false })
      .limit(5);
    return data ?? [];
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
  const galerie = await ladeGalerie();
  const aktuelles = await ladeAktuelles();
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
          --piter-fg:   #9c3a07; --piter-bg:   #ffedd5;
          --radius: 4px;
          --serif: Palatino Linotype, Palatino, Book Antiqua, Georgia, serif;
          --sans:  system-ui, -apple-system, Segoe UI, sans-serif;
        }
        @media (prefers-color-scheme: dark) {
          :root:not([data-theme="light"]) {
            --green: #5DB84A; --green-mid: #4EA33A; --green-soft: #1A2E16;
            --gold: #E8A030; --gold-soft: #2A1E08;
            --ink: #F0EBE0; --mid: #A89880;
            --ground: #141008; --surface: #1C1610; --border: #3A3020;
            --lotte-fg: #4ade80; --lotte-bg: #064e27;
            --flitzer-fg: #93c5fd; --flitzer-bg: #1e3a5f;
            --piter-fg: #fb923c; --piter-bg: #431407;
          }
        }
        :root[data-theme="dark"] {
          --green: #5DB84A; --green-mid: #4EA33A; --green-soft: #1A2E16;
          --gold: #E8A030; --gold-soft: #2A1E08;
          --ink: #F0EBE0; --mid: #A89880;
          --ground: #141008; --surface: #1C1610; --border: #3A3020;
          --lotte-fg: #4ade80; --lotte-bg: #064e27;
          --flitzer-fg: #93c5fd; --flitzer-bg: #1e3a5f;
          --piter-fg: #fb923c; --piter-bg: #431407;
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
        .nav-piloten { opacity: 0.75; cursor: pointer; }
        .nav-piloten:hover { opacity: 1; }

        .hero { background: linear-gradient(160deg, #3A8A26 0%, #2D6B1E 100%); color: #fff; padding: 5rem 2rem 4rem; text-align: center; position: relative; overflow: hidden; }
        .hero .container { text-align: center; }
        .hero::after { content: ''; position: absolute; bottom: -2px; left: 0; right: 0; height: 48px; background: #C8600A; clip-path: ellipse(55% 100% at 50% 100%); }
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
        .btn-gold { background: var(--gold); color: #1a1208; }
        .btn-outline { background: transparent; border: 2px solid rgba(255,255,255,0.6); color: #fff; }
        .btn-green { background: var(--green); color: #fff; }
        .hero-btns { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }

        section { padding: 4.5rem 2rem; background: var(--ground); }
        .container { max-width: 1080px; margin: 0 auto; }
        .container-wide { max-width: 1080px; margin: 0 auto; }
        .section-rule { border: none; border-top: 1px solid var(--border); margin: 0; }
        .eyebrow { font-size: 0.75rem; letter-spacing: 0.14em; text-transform: uppercase; color: #8B5C0D; font-weight: 600; margin-bottom: 0.6rem; }
        h2 { font-family: var(--serif); font-size: clamp(1.7rem, 3.5vw, 2.4rem); font-weight: normal; line-height: 1.2; text-wrap: balance; color: var(--ink); margin-bottom: 1rem; }
        h3 { font-family: var(--serif); font-size: 1.3rem; font-weight: normal; color: var(--ink); margin-bottom: 0.5rem; }
        p { color: var(--mid); margin-bottom: 1rem; }
        p:last-child { margin-bottom: 0; }

        .group-section { background: #B05208; color: #fff; position: relative; overflow: hidden; }
        .group-section p { color: #fff; }
        .group-section h2 { color: #fff; }
        .group-section .eyebrow { color: #fff; }
        .big-3 { display: none; }
        .group-inner { position: relative; z-index: 1; text-align: center; }
        .group-inner h2 { margin: 0 auto; }
        .group-inner p { margin-left: auto; margin-right: auto; }
        .anlaesse-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 0.75rem; margin-top: 1.75rem; }
        @media (max-width: 700px) { .anlaesse-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 400px) { .anlaesse-grid { grid-template-columns: repeat(2, 1fr); } }
        .anlass { background: #fff; border-radius: var(--radius); padding: 1rem 0.5rem 0.85rem; display: flex; flex-direction: column; align-items: center; gap: 0.4rem; box-shadow: 0 2px 10px rgba(0,0,0,0.12); color: var(--ink); }
        .anlass-icon { font-size: 1.9rem; display: block; }
        .anlass-label { font-size: 0.72rem; font-weight: 600; text-align: center; line-height: 1.3; color: var(--ink); }

        .fahrzeuge-section { background: #F5F0E7; }
        .fahrzeug-list { display: flex; flex-direction: column; gap: 0; margin-top: 2.5rem; }
        .fahrzeug-row { display: grid; grid-template-columns: 260px 1fr; gap: 2.5rem; align-items: start; padding: 2.5rem 0; border-top: 1px solid var(--border); }
        .fahrzeug-row:last-child { border-bottom: 1px solid var(--border); }
        .fahrzeug-foto-wrap { width: 100%; aspect-ratio: 4/3; border-radius: 8px; overflow: hidden; position: relative; }
        .fahrzeug-foto-wrap img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; display: block; }
        .fahrzeug-placeholder { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.6rem; font-size: 0.78rem; font-weight: 600; letter-spacing: 0.04em; border-radius: 8px; }
        .fahrzeug-placeholder svg { width: 52px; height: 52px; }
        .placeholder-lotte { background: var(--lotte-bg); color: var(--lotte-fg); }
        .placeholder-flitzer { background: var(--flitzer-bg); color: var(--flitzer-fg); }
        .placeholder-piter { background: var(--piter-bg); color: var(--piter-fg); }
        .foto-folgt { font-size: 0.65rem; color: #6B5A3A; }
        @media (prefers-color-scheme: dark) {
          :root:not([data-theme="light"]) .foto-folgt { color: rgba(255,255,255,0.7); }
        }
        :root[data-theme="dark"] .foto-folgt { color: rgba(255,255,255,0.7); }
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

        .ausleihen-section { background: #fff; }
        .ausleihen-box { display: flex; align-items: flex-start; gap: 1.75rem; background: #F5E5D8; border-left: 5px solid #C8600A; border-radius: var(--radius); padding: 1.75rem 2rem; }
        .ausleihen-icon { font-size: 2.5rem; flex-shrink: 0; margin-top: 0.1rem; }
        .ausleihen-text h3 { font-family: var(--serif); font-size: 1.2rem; font-weight: normal; color: var(--ink); margin-bottom: 0.5rem; }
        .ausleihen-text p { color: var(--mid); font-size: 0.95rem; margin-bottom: 1rem; }
        .btn-outline-dark { display: inline-block; border: 2px solid var(--ink); color: var(--ink); border-radius: var(--radius); padding: 0.45rem 1.2rem; font-size: 0.9rem; font-weight: 600; text-decoration: none; transition: background 0.15s; }
        .btn-outline-dark:hover { background: var(--ink); color: #fff; }
        @media (max-width: 500px) { .ausleihen-box { flex-direction: column; gap: 1rem; } }
        .piloten-section { background: #F5E5D8; }
        .piloten-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 1rem; margin-top: 2rem; }
        .pilot-card { background: #fff; border: 1px solid #E0C9B8; border-radius: 10px; padding: 1.1rem 0.75rem; text-align: center; }
        .pilot-foto-wrap { width: 72px; height: 72px; border-radius: 50%; overflow: hidden; margin: 0 auto 0.6rem; }
        .pilot-foto-wrap img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .pilot-avatar { width: 72px; height: 72px; border-radius: 50%; background: var(--green-soft); color: var(--green); font-family: var(--serif); font-size: 1.5rem; display: flex; align-items: center; justify-content: center; margin: 0 auto 0.6rem; font-weight: bold; border: 2px solid var(--border); }
        .pilot-name { font-size: 0.88rem; font-weight: 600; color: var(--ink); }

        .ausbildung-section { background: #F5F0E7; }
        .steps { display: flex; flex-direction: column; gap: 1.25rem; margin-top: 2rem; }
        .step { display: flex; gap: 1.25rem; align-items: flex-start; }
        .step-dot { width: 36px; height: 36px; border-radius: 50%; background: var(--green-soft); color: var(--green); font-weight: 700; font-size: 0.9rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px; }
        .gfo-badge { display: inline-flex; align-items: center; gap: 0.5rem; background: var(--gold-soft); border: 1px solid var(--gold); color: #6B4009; font-size: 0.82rem; font-weight: 600; padding: 0.4rem 1rem; border-radius: var(--radius); margin-top: 1.5rem; }
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
        .kontakt-section .eyebrow { color: #E8C070; }
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

        footer { background: #1a1208; color: rgba(255,255,255,0.75); text-align: center; padding: 1.25rem 1rem; font-size: 0.88rem; line-height: 1.8; }
        footer a { color: #C8881A; text-decoration: underline; transition: color 0.15s; }
        footer a:hover { color: #e0a030; }
        footer .piloten-link { color: rgba(255,255,255,0.5); font-size: 0.78rem; }
        footer .piloten-link:hover { color: rgba(255,255,255,0.8); }

        /* Galerie */
        .galerie-section { background: #F5F0E7; }
        .galerie-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1.25rem; margin-top: 2rem; }
        .galerie-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; display: flex; flex-direction: column; }
        .galerie-card img { width: 100%; aspect-ratio: 4/3; object-fit: cover; display: block; }
        .galerie-info { padding: 0.75rem 1rem 0.5rem; flex: 1; display: flex; flex-direction: column; gap: 0.2rem; }
        .galerie-fotograf { font-size: 0.92rem; font-weight: 700; color: var(--ink); }
        .galerie-titel { font-size: 0.82rem; color: var(--mid); font-style: italic; }
        .galerie-meta { font-size: 0.72rem; color: var(--mid); margin-top: 0.15rem; }
        .galerie-vote { padding: 0.4rem 1rem 0.65rem; font-size: 0.85rem; font-weight: 700; color: #b45309; }
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

        /* Kennzahlen */
        .kennzahlen-section { background: #A63228; color: #fff; padding: 2.5rem 1.5rem; }
        .kennzahlen-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 0.75rem; max-width: 900px; margin: 0 auto; }
        .kenn-kachel { background: #F5E5D8; border-radius: 10px; text-align: center; padding: 1.5rem 0.75rem; }
        .kenn-zahl { font-family: var(--serif); font-size: clamp(2rem, 4.5vw, 3rem); font-weight: bold; color: #A63228; line-height: 1; margin-bottom: 0.4rem; }
        .kenn-label { font-size: 0.7rem; letter-spacing: 0.09em; text-transform: uppercase; color: var(--mid); font-weight: 600; }

        /* Stimmen */
        .stimmen-section { background: #A63228; color: #fff; }
        .stimmen-section .eyebrow { color: rgba(255,255,255,0.9); }
        .stimmen-section h2 { color: #fff; }
        .stimmen-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1.25rem; margin-top: 2rem; }
        .stimme-card { background: #F5E5D8; border: 1px solid rgba(166,50,40,0.15); border-radius: var(--radius); padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; color: #1C1208; }
        .stimme-quote { font-size: 0.97rem; color: var(--mid); line-height: 1.65; font-style: italic; position: relative; padding-left: 1.25rem; }
        .stimme-quote::before { content: '„'; position: absolute; left: 0; top: -0.15rem; font-size: 2rem; color: var(--gold); line-height: 1; font-family: var(--serif); font-style: normal; }
        .stimme-meta { display: flex; align-items: center; gap: 0.6rem; margin-top: auto; }
        .stimme-avatar { width: 36px; height: 36px; border-radius: 50%; background: #A63228; color: #fff; font-family: var(--serif); font-size: 1rem; font-weight: bold; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .stimme-name { font-size: 0.88rem; font-weight: 700; color: var(--ink); }
        .stimme-rolle { font-size: 0.75rem; color: var(--mid); }
        .stimme-badge { display: inline-block; padding: 0.1rem 0.55rem; border-radius: 999px; font-size: 0.7rem; font-weight: 700; }
        .stimme-badge-gast { background: #fff; color: #A63228; border: 1px solid rgba(166,50,40,0.2); }
        .stimme-badge-pilot { background: #2D6B1E; color: #fff; }

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
          .big-3 { display: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { transition: none !important; animation: none !important; }
        }

        /* Barrierefreiheit */
        .skip-link { position: absolute; top: -48px; left: 0; background: var(--green); color: #fff; padding: 0.6rem 1.2rem; z-index: 10001; border-radius: 0 0 6px 0; font-weight: 600; text-decoration: none; transition: top 0.15s; }
        .skip-link:focus { top: 0; }
        :focus-visible { outline: 3px solid var(--gold); outline-offset: 3px; border-radius: 2px; }
        a:focus-visible, button:focus-visible { outline: 3px solid var(--gold); outline-offset: 3px; }
        input:focus-visible, textarea:focus-visible, select:focus-visible { outline: 3px solid var(--gold); outline-offset: 2px; border-color: var(--gold); }

        /* Dark-Mode Overrides für hardcodierte Farben */
        @media (prefers-color-scheme: dark) {
          :root:not([data-theme="light"]) .eyebrow { color: var(--gold); }
          :root:not([data-theme="light"]) .group-section .eyebrow { color: #fff; }
          :root:not([data-theme="light"]) .galerie-section { background: var(--ground); }
          :root:not([data-theme="light"]) .fahrzeuge-section { background: var(--ground); }
          :root:not([data-theme="light"]) .piloten-section { background: var(--surface); }
          :root:not([data-theme="light"]) .ausbildung-section { background: var(--ground); }
          :root:not([data-theme="light"]) .zukunft-section { background: var(--surface); }
          :root:not([data-theme="light"]) .ausleihen-section { background: var(--ground); }
          :root:not([data-theme="light"]) .ausleihen-box { background: rgba(200,96,10,0.15); }
          :root:not([data-theme="light"]) .gfo-badge { color: var(--gold); }
          :root:not([data-theme="light"]) .wettbewerb-banner { background: #1C4A10 !important; }
          :root:not([data-theme="light"]) .wettbewerb-link { color: #1C4A10 !important; }
          :root:not([data-theme="light"]) .galerie-alle-link { background: #1C4A10 !important; }
          :root:not([data-theme="light"]) .wettbewerb-banner a[href$="hochladen"] { color: #fff !important; }
          :root:not([data-theme="light"]) .btn-green { color: #1C1208; }
          :root:not([data-theme="light"]) .stimmen-section .eyebrow { color: rgba(255,255,255,0.9); }
          :root:not([data-theme="light"]) .kennzahlen-section .eyebrow { color: rgba(255,255,255,0.9); }
          :root:not([data-theme="light"]) .group-section .eyebrow { color: #fff; }
          :root:not([data-theme="light"]) .anlass { background: var(--surface); }
          :root:not([data-theme="light"]) .kenn-kachel { background: var(--surface); }
          :root:not([data-theme="light"]) .kenn-zahl { color: #E07060; }
          :root:not([data-theme="light"]) .stimme-card { background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.12); color: #F0EBE0; }
          :root:not([data-theme="light"]) .stimme-quote { color: #F0EBE0; }
          :root:not([data-theme="light"]) .pilot-card { background: var(--surface); border-color: var(--border); }
          :root:not([data-theme="light"]) .pilot-card h3 { color: var(--ink); }
          :root:not([data-theme="light"]) .pilot-card p { color: var(--mid); }
        }
        :root[data-theme="dark"] .eyebrow { color: var(--gold); }
        :root[data-theme="dark"] .group-section .eyebrow { color: #fff; }
        :root[data-theme="dark"] .galerie-section { background: var(--ground); }
        :root[data-theme="dark"] .fahrzeuge-section { background: var(--ground); }
        :root[data-theme="dark"] .piloten-section { background: var(--surface); }
        :root[data-theme="dark"] .ausbildung-section { background: var(--ground); }
        :root[data-theme="dark"] .zukunft-section { background: var(--surface); }
        :root[data-theme="dark"] .ausleihen-section { background: var(--ground); }
        :root[data-theme="dark"] .ausleihen-box { background: rgba(200,96,10,0.15); }
        :root[data-theme="dark"] .gfo-badge { color: var(--gold); }
        :root[data-theme="dark"] .wettbewerb-banner { background: #1C4A10 !important; }
        :root[data-theme="dark"] .wettbewerb-link { color: #1C4A10 !important; }
        :root[data-theme="dark"] .galerie-alle-link { background: #1C4A10 !important; }
        :root[data-theme="dark"] .wettbewerb-banner a[href$="hochladen"] { color: #fff !important; }
        :root[data-theme="dark"] .btn-green { color: #1C1208; }
        :root[data-theme="dark"] .stimmen-section .eyebrow { color: rgba(255,255,255,0.9); }
        :root[data-theme="dark"] .kennzahlen-section .eyebrow { color: rgba(255,255,255,0.9); }
        :root[data-theme="dark"] .group-section .eyebrow { color: #fff; }
        :root[data-theme="dark"] .anlass { background: var(--surface); }
        :root[data-theme="dark"] .kenn-kachel { background: var(--surface); }
        :root[data-theme="dark"] .kenn-zahl { color: #E07060; }
        :root[data-theme="dark"] .stimme-card { background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.12); color: #F0EBE0; }
        :root[data-theme="dark"] .stimme-quote { color: #F0EBE0; }
        :root[data-theme="dark"] .pilot-card { background: var(--surface); border-color: var(--border); }
        :root[data-theme="dark"] .pilot-card h3 { color: var(--ink); }
        :root[data-theme="dark"] .pilot-card p { color: var(--mid); }

        /* Einfache Sprache */
        .einfach-alt { display: inline; }
        .einfach-neu { display: none; }
        html.einfache-sprache .einfach-alt { display: none; }
        html.einfache-sprache .einfach-neu { display: inline; }
        .einfach-alt-block { display: block; }
        .einfach-neu-block { display: none; }
        html.einfache-sprache .einfach-alt-block { display: none; }
        html.einfache-sprache .einfach-neu-block { display: block; }
      `}</style>

      <a href="#main-content" className="skip-link">Zum Hauptinhalt springen</a>

      {/* Navigation */}
      <nav aria-label="Hauptnavigation">
        <a href="/" className="nav-logo" aria-label="Mertener Rikschakutscher – Startseite">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="https://hcbqmqyxpasojbrewnps.supabase.co/storage/v1/object/public/piloten-dateien/1785078123043-su0txlq3ipq.png" alt="" aria-hidden="true" width={40} height={40} style={{borderRadius:'50%',objectFit:'cover',flexShrink:0}} />
          Mertener Rikschakutscher
        </a>
        <ul className="nav-links">
          <li><a href="#fahrten">Fahrten</a></li>
          <li><a href="#touren">Touren</a></li>
          <li><a href="#kalender">Kalender</a></li>
          <li><a href="#fahrzeuge">Fahrzeuge</a></li>
          <li><a href="#stimmen">Stimmen</a></li>
          <li><a href="#aktuelles">Aktuelles</a></li>
          <li><a href="#kontakt">Kontakt</a></li>
          <li><a href="#team">Team</a></li>
          <li><a href="#ausbildung">Mitmachen</a></li>
          <li><a href="#spenden">Spenden</a></li>
          <li><a href="/galerie">Galerie</a></li>
          <li><a href="/buchen" className="nav-btn">Fahrt buchen</a></li>
          <li><a href="/gutschein" className="nav-btn">Gutschein</a></li>
          <li><PilotenNavLink /></li>
          <li style={{display:'flex',gap:'0.4rem',alignItems:'center'}}><EinfacheSpracheToggle /><ThemeToggle /></li>
        </ul>
        <HamburgerMenu />
      </nav>
      <Banner />

      <main id="main-content" tabIndex={-1}>

      {/* Hero */}
      <section className="hero">
        <div className="container">
          <div className="hero-eyebrow">{t.hero_eyebrow}</div>
          <h1>{t.hero_titel}</h1>
          <p className="hero-sub">
            <span className="einfach-alt-block">{t.hero_sub}</span>
            <span className="einfach-neu-block">Wir fahren Menschen durch Merten. Mit einem Fahrrad-Taxi. Das nennt man Rikscha. Die Fahrten kosten nichts. Alle sind willkommen.</span>
          </p>
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
        <div className="container">
          <div className="group-inner">
            <div className="eyebrow">Das besondere Highlight</div>
            <h2>
              <span className="einfach-alt-block">{t.fahrten_h2}</span>
              <span className="einfach-neu-block">Drei Rikschas fahren zusammen. Das ist besonders schön.</span>
            </h2>
            <p>
              <span className="einfach-alt-block">{t.gruppenfahrten_1}</span>
              <span className="einfach-neu-block">Wir fahren gerne Menschen mit, die nicht gut laufen können. Auch Begleitpersonen dürfen mitfahren.</span>
            </p>
            <p>
              <span className="einfach-alt-block">{t.gruppenfahrten_2}</span>
              <span className="einfach-neu-block">Ihr könnt alle drei Rikschas auf einmal buchen. Dann fahren alle zusammen. Das ist toll für Geburtstage oder Ausflüge aus dem Pflegeheim.</span>
            </p>
            <div className="anlaesse-grid">
              <div className="anlass"><span className="anlass-icon" aria-hidden="true">🎂</span><span className="anlass-label">Geburtstage & Jubiläen</span></div>
              <div className="anlass"><span className="anlass-icon" aria-hidden="true">💒</span><span className="anlass-label">Hochzeiten & Polterabend</span></div>
              <div className="anlass"><span className="anlass-icon" aria-hidden="true">👨‍👩‍👧‍👦</span><span className="anlass-label">Familienausflüge</span></div>
              <div className="anlass"><span className="anlass-icon" aria-hidden="true">🎉</span><span className="anlass-label">Vereinsfeste & Events</span></div>
              <div className="anlass"><span className="anlass-icon" aria-hidden="true">🌳</span><span className="anlass-label">Einfach so — zum Spaß</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* Kennzahlen */}
      <section className="kennzahlen-section" aria-label="Kennzahlen">
        <div className="container" style={{textAlign:'center',paddingBottom:'1.5rem'}}>
          <h2 style={{fontFamily:'var(--serif)',fontWeight:'normal',fontSize:'clamp(1.4rem,3vw,2rem)',color:'#fff',marginBottom:'0.25rem'}}>{t.kennzahlen_h2}</h2>
        </div>
        <div className="kennzahlen-grid">
          {([
            [t.stat_1_zahl, t.stat_1_label],
            [t.stat_2_zahl, t.stat_2_label],
            [t.stat_3_zahl, t.stat_3_label],
            [t.stat_4_zahl, t.stat_4_label],
            [t.stat_5_zahl, t.stat_5_label],
          ] as [string,string][]).map(([zahl, label]) => (
            <div key={label} className="kenn-kachel">
              <div className="kenn-zahl">{zahl}</div>
              <div className="kenn-label">{label}</div>
            </div>
          ))}
        </div>
      </section>



      <hr className="section-rule"/>

      {/* Touren */}
      <section className="fahrzeuge-section" id="touren">
        <div className="container">
          <div className="eyebrow">Unsere Ausflüge</div>
          <h2>
            <span className="einfach-alt-block">{t.touren_h2}</span>
            <span className="einfach-neu-block">Schöne Orte in der Natur</span>
          </h2>
          <p>
            <span className="einfach-alt-block">{t.touren_intro}</span>
            <span className="einfach-neu-block">Wir fahren zu vielen schönen Orten. Zum Beispiel in die Heide, zu Tieren oder an den Rhein.</span>
          </p>
          <div className="zukunft-grid" style={{marginTop:'2rem'}}>
            <div className="zukunft-card"><span className="zukunft-icon">🏰</span><h3>{t.tour_1_titel}</h3><p style={{fontSize:'0.9rem'}}>{t.tour_1_text}</p></div>
            <div className="zukunft-card"><span className="zukunft-icon">🌿</span><h3>{t.tour_2_titel}</h3><p style={{fontSize:'0.9rem'}}>{t.tour_2_text}</p></div>
            <div className="zukunft-card"><span className="zukunft-icon">⛪</span><h3>{t.tour_3_titel}</h3><p style={{fontSize:'0.9rem'}}>{t.tour_3_text}</p></div>
            <div className="zukunft-card"><span className="zukunft-icon">🌊</span><h3>{t.tour_4_titel}</h3><p style={{fontSize:'0.9rem'}}>{t.tour_4_text}</p></div>
          </div>

          <div style={{marginTop:'2.5rem'}}>
            <h3 style={{fontFamily:'var(--serif)',fontWeight:'normal',fontSize:'clamp(1.1rem,2vw,1.4rem)',marginBottom:'1rem',color:'var(--ink)'}}>
              Alle Touren auf der Karte
            </h3>
            <TourenKarte />
          </div>
        </div>
      </section>      <hr className="section-rule"/>

      {/* Kalender */}
      <section className="fahrzeuge-section" id="kalender">
        <div className="container-wide">
          <div className="eyebrow">Termine</div>
          <h2>
            <span className="einfach-alt-block">Wann sind wir unterwegs?</span>
            <span className="einfach-neu-block">Wann fahren wir?</span>
          </h2>
          <p>
            <span className="einfach-alt-block">Schaut im Fahrtenkalender nach, wann wir unterwegs sind — oder bucht direkt eine eigene Fahrt.</span>
            <span className="einfach-neu-block">Im Kalender seht ihr, wann wir fahren. Ihr könnt auch eine eigene Fahrt buchen.</span>
          </p>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:'1.5rem',marginTop:'2rem'}}>
            <a href="/kalender" target="_blank" style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'1rem',padding:'2rem 1.5rem',background:'var(--surface)',borderRadius:'14px',border:'1.5px solid var(--border)',textDecoration:'none',color:'inherit'}}>
              <span style={{fontSize:'2.5rem'}}>📅</span>
              <div style={{textAlign:'center'}}><div style={{fontWeight:700,fontSize:'1.05rem',marginBottom:'0.3rem'}}>Fahrtenkalender</div><div style={{fontSize:'0.85rem',color:'var(--mid)'}}>Alle Termine auf einen Blick</div></div>
              <span style={{padding:'0.5rem 1.25rem',background:'#2D6B1E',color:'#fff',borderRadius:'6px',fontSize:'0.85rem',fontWeight:600}}>Kalender öffnen ↗</span>
            </a>
            <a href="/buchen" target="_blank" style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'1rem',padding:'2rem 1.5rem',background:'var(--surface)',borderRadius:'14px',border:'1.5px solid #C8881A',textDecoration:'none',color:'inherit'}}>
              <span style={{fontSize:'2.5rem'}}>🚲</span>
              <div style={{textAlign:'center'}}><div style={{fontWeight:700,fontSize:'1.05rem',marginBottom:'0.3rem'}}>Fahrt anfragen</div><div style={{fontSize:'0.85rem',color:'var(--mid)'}}>Wunschdatum direkt eintragen</div></div>
              <span style={{padding:'0.5rem 1.25rem',background:'#7A4F0B',color:'#fff',borderRadius:'6px',fontSize:'0.85rem',fontWeight:600}}>Jetzt buchen ↗</span>
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

      {/* Fahrzeuge */}
      <section className="fahrzeuge-section" id="fahrzeuge">
        <div className="container">
          <div className="eyebrow">Unsere Flotte</div>
          <h2>
            <span className="einfach-alt-block">{t.fahrzeuge_h2}</span>
            <span className="einfach-neu-block">Drei Rikschas — jede ist anders.</span>
          </h2>
          <p>
            <span className="einfach-alt-block">{t.fahrzeuge_intro}</span>
            <span className="einfach-neu-block">Jede Rikscha sieht anders aus und ist für andere Menschen gut geeignet.</span>
          </p>
          <div className="fahrzeug-list">
            <div className="fahrzeug-row" id="fahrzeug-lotte">
              <div className="fahrzeug-foto-wrap">
                {t.foto_lotte
                  ? <img src={t.foto_lotte} alt="Flotte Lotte" />
                  : <div className="fahrzeug-placeholder placeholder-lotte">
                      <svg viewBox="0 0 64 40" fill="none" width="52" height="52"><circle cx="12" cy="32" r="7" stroke="currentColor" strokeWidth="2.5"/><circle cx="52" cy="32" r="7" stroke="currentColor" strokeWidth="2.5"/><rect x="16" y="10" width="28" height="18" rx="3" stroke="currentColor" strokeWidth="2"/><line x1="12" y1="25" x2="30" y2="25" stroke="currentColor" strokeWidth="2"/><line x1="44" y1="14" x2="52" y2="25" stroke="currentColor" strokeWidth="2"/></svg>
                      Rikscha
                      <span className="foto-folgt">Foto folgt</span>
                    </div>
                }
              </div>
              <div>
                <div className="fahrzeug-name">Flotte Lotte</div>
                <div className="fahrzeug-typ">Rikscha</div>
                <span className="fahrzeug-gaeste gaeste-lotte"><span aria-hidden="true">👥</span> bis 2 Gäste</span>
                <p>
                  <span className="einfach-alt-block">{t.lotte_text}</span>
                  <span className="einfach-neu-block">Flotte Lotte ist unsere größte Rikscha. Es passen 2 Personen hinten rein. Die Fahrt ist bequem. Der Blick nach draußen ist schön.</span>
                </p>
              </div>
            </div>
            <div className="fahrzeug-row" id="fahrzeug-flitzer">
              <div className="fahrzeug-foto-wrap">
                {t.foto_flitzer
                  ? <img src={t.foto_flitzer} alt="Flinker Flitzer" />
                  : <div className="fahrzeug-placeholder placeholder-flitzer">
                      <svg viewBox="0 0 64 40" fill="none" width="52" height="52"><circle cx="10" cy="32" r="7" stroke="currentColor" strokeWidth="2.5"/><circle cx="54" cy="32" r="7" stroke="currentColor" strokeWidth="2.5"/><ellipse cx="32" cy="22" rx="20" ry="9" stroke="currentColor" strokeWidth="2"/><line x1="10" y1="25" x2="12" y2="32" stroke="currentColor" strokeWidth="2"/><line x1="52" y1="22" x2="54" y2="25" stroke="currentColor" strokeWidth="2"/></svg>
                      Liegetandem
                      <span className="foto-folgt">Foto folgt</span>
                    </div>
                }
              </div>
              <div>
                <div className="fahrzeug-name">Flinker Flitzer</div>
                <div className="fahrzeug-typ">Liegetandem</div>
                <span className="fahrzeug-gaeste gaeste-flitzer"><span aria-hidden="true">👤</span> 1 Gast</span>
                <p>
                  <span className="einfach-alt-block">{t.flitzer_text}</span>
                  <span className="einfach-neu-block">Der Flinke Flitzer ist ein Liegetandem. Die Person vorne liegt fast flach. Das ist anders als ein normaler Stuhl. Man kann von unten die Welt sehen. Man kann auch mittreten, wenn man möchte.</span>
                </p>
              </div>
            </div>
            <div className="fahrzeug-row" id="fahrzeug-piter">
              <div className="fahrzeug-foto-wrap">
                {t.foto_piter
                  ? <img src={t.foto_piter} alt="Jruuse Piter" />
                  : <div className="fahrzeug-placeholder placeholder-piter">
                      <svg viewBox="0 0 64 40" fill="none" width="52" height="52"><circle cx="10" cy="32" r="7" stroke="currentColor" strokeWidth="2.5"/><circle cx="54" cy="32" r="7" stroke="currentColor" strokeWidth="2.5"/><rect x="16" y="14" width="32" height="14" rx="2" stroke="currentColor" strokeWidth="2"/><line x1="10" y1="25" x2="16" y2="25" stroke="currentColor" strokeWidth="2"/><line x1="48" y1="21" x2="54" y2="25" stroke="currentColor" strokeWidth="2"/><line x1="28" y1="14" x2="28" y2="28" stroke="currentColor" strokeWidth="1.5"/></svg>
                      Paralleltandem
                      <span className="foto-folgt">Foto folgt</span>
                    </div>
                }
              </div>
              <div>
                <div className="fahrzeug-name">Jruuse Piter</div>
                <div className="fahrzeug-typ">Paralleltandem</div>
                <span className="fahrzeug-gaeste gaeste-piter"><span aria-hidden="true">👤</span> 1 Gast</span>
                <p>
                  <span className="einfach-alt-block">{t.piter_text}</span>
                  <span className="einfach-neu-block">Jruuse Piter ist ein Tandem. Gast und Pilot sitzen nebeneinander. Man fährt zusammen. Das macht das Gespräch leicht.</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="piloten-section" id="team">
        <div className="container">
          <div className="eyebrow">Unser Team</div>
          <h2>
            <span className="einfach-alt-block">{t.team_h2}</span>
            <span className="einfach-neu-block">Elf Personen fahren freiwillig Rikscha.</span>
          </h2>
          <p>
            <span className="einfach-alt-block">{t.team_text}</span>
            <span className="einfach-neu-block">Alle machen das freiwillig und ohne Bezahlung. Sie fahren gerne Fahrrad und haben Freude daran, Menschen zu helfen.</span>
          </p>
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

      {/* Rikscha ausleihen */}
      <section className="ausleihen-section">
        <div className="container">
          <div className="ausleihen-box">
            <div className="ausleihen-icon">🚲</div>
            <div className="ausleihen-text">
              <h3>
                <span className="einfach-alt-block">{t.ausleihen_titel}</span>
                <span className="einfach-neu-block">Rikscha selbst fahren — für Familien-Mitglieder</span>
              </h3>
              <p>
                <span className="einfach-alt-block">{t.ausleihen_text}</span>
                <span className="einfach-neu-block">Bist du ein Familien-Mitglied von einem unserer Gäste? Möchtest du öfter mit der Rikscha fahren? Dann melde dich bei uns. Wir erklären dir, wie das geht.</span>
              </p>
              <AusleihenButton label={t.ausleihen_cta} />
            </div>
          </div>
        </div>
      </section>

      <hr className="section-rule"/>

      {/* Stimmen */}
      <section className="stimmen-section" id="stimmen">
        <div className="container">
          <div className="eyebrow">Erfahrungen</div>
          <h2>{t.stimmen_h2}</h2>
          <div className="stimmen-grid">
            {([
              [t.stimme_1_text, t.stimme_1_name, t.stimme_1_rolle],
              [t.stimme_2_text, t.stimme_2_name, t.stimme_2_rolle],
              [t.stimme_3_text, t.stimme_3_name, t.stimme_3_rolle],
              [t.stimme_4_text, t.stimme_4_name, t.stimme_4_rolle],
              [t.stimme_5_text, t.stimme_5_name, t.stimme_5_rolle],
              [t.stimme_6_text, t.stimme_6_name, t.stimme_6_rolle],
            ] as [string,string,string][]).filter(([text]) => text).map(([text, name, rolle]) => (
              <div key={name} className="stimme-card">
                <p className="stimme-quote">{text}"</p>
                <div className="stimme-meta">
                  <div className="stimme-avatar">{name.charAt(0)}</div>
                  <div>
                    <div className="stimme-name">{name}</div>
                    <span className={`stimme-badge ${rolle?.toLowerCase() === 'pilot' ? 'stimme-badge-pilot' : 'stimme-badge-gast'}`}>{rolle}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <hr className="section-rule"/>

      {/* Aktuelles */}
      {aktuelles.length > 0 && (
      <section className="fahrzeuge-section" id="aktuelles">
        <div className="container">
          <div className="eyebrow">Neuigkeiten</div>
          <h2>Aktuelles &amp; Erlebtes</h2>
          <div style={{display:'flex',flexDirection:'column',gap:'1.25rem',marginTop:'1.5rem'}}>
            {aktuelles.map(a => (
              <div key={a.id} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:'1.25rem 1.5rem',display:'grid',gridTemplateColumns:'auto 1fr',gap:'1rem 1.25rem',alignItems:'start'}}>
                <div style={{textAlign:'center',minWidth:'3rem'}}>
                  <div style={{fontWeight:700,fontSize:'1.1rem',color:'var(--green)',lineHeight:1}}>
                    {new Date(a.datum).toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit'})}
                  </div>
                  <div style={{fontSize:'0.75rem',color:'var(--mid)',marginTop:'0.15rem'}}>
                    {new Date(a.datum).getFullYear()}
                  </div>
                </div>
                <div>
                  <h3 style={{fontFamily:'var(--serif)',fontWeight:'normal',fontSize:'clamp(1rem,2vw,1.2rem)',color:'var(--ink)',marginBottom:'0.4rem'}}>{a.titel}</h3>
                  <p style={{fontSize:'0.9rem',color:'var(--mid)',lineHeight:1.55}}>{a.text}</p>
                  {a.erstellt_von && <div style={{fontSize:'0.75rem',color:'var(--border)',marginTop:'0.5rem'}}>— {a.erstellt_von}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      )}

      <hr className="section-rule"/>

      {/* Kontakt */}
      <section className="kontakt-section" id="kontakt">
        <div className="container">
          <div className="eyebrow">Schreib uns</div>
          <h2>{t.kontakt_h2}</h2>
          <p>
            <span className="einfach-alt-block">{t.kontakt_text}</span>
            <span className="einfach-neu-block">Schreib uns eine Nachricht. Wir antworten dir bald. Du kannst auch anrufen: <a href="tel:022279328383">02227 9328383</a></span>
          </p>
          <KontaktFormular />
        </div>
      </section>

      <hr className="section-rule"/>

      {/* Mitmachen */}
      <section className="ausbildung-section" id="ausbildung">
        <div className="container">
          <div className="eyebrow">Pilot werden</div>
          <h2>
            <span className="einfach-alt-block">{t.mitmachen_h2}</span>
            <span className="einfach-neu-block">So kannst du Rikscha-Pilot werden</span>
          </h2>
          <p>
            <span className="einfach-alt-block">{t.mitmachen_intro}</span>
            <span className="einfach-neu-block">Du fährst gerne Fahrrad? Du magst Menschen? Dann komm zu uns!</span>
          </p>
          <div className="steps">
            <div className="step"><div className="step-dot">1</div><div><h3>{t.schritt_1_titel}</h3><p>{t.schritt_1_text}</p></div></div>
            <div className="step"><div className="step-dot">2</div><div><h3>{t.schritt_2_titel}</h3><p>{t.schritt_2_text}</p></div></div>
            <div className="step"><div className="step-dot">3</div><div><h3>{t.schritt_3_titel}</h3><p>{t.schritt_3_text}</p></div></div>
            <div className="step"><div className="step-dot">4</div><div><h3>{t.schritt_4_titel}</h3><p>{t.schritt_4_text}</p></div></div>
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
          <h2>
            <span className="einfach-alt-block">{t.zukunft_h2}</span>
            <span className="einfach-neu-block">Was wir noch planen</span>
          </h2>
          <p>
            <span className="einfach-alt-block">{t.zukunft_intro}</span>
            <span className="einfach-neu-block">Wir möchten noch mehr machen. Mit eurer Hilfe geht das leichter.</span>
          </p>
          <div className="zukunft-grid">
            <div className="zukunft-card"><span className="zukunft-icon">🚲</span><h3>{t.zukunft_1_titel}</h3><p style={{fontSize:'0.9rem'}}>{t.zukunft_1_text}</p></div>
            <div className="zukunft-card"><span className="zukunft-icon">🗺️</span><h3>{t.zukunft_2_titel}</h3><p style={{fontSize:'0.9rem'}}>{t.zukunft_2_text}</p></div>
            <div className="zukunft-card"><span className="zukunft-icon">🤝</span><h3>{t.zukunft_3_titel}</h3><p style={{fontSize:'0.9rem'}}>{t.zukunft_3_text}</p></div>
            <div className="zukunft-card"><span className="zukunft-icon">🌍</span><h3>{t.zukunft_4_titel}</h3><p style={{fontSize:'0.9rem'}}>{t.zukunft_4_text}</p></div>
          </div>
        </div>
      </section>

      <hr className="section-rule"/>

      {/* Spenden */}
      <section className="spenden-section" id="spenden">
        <div className="container">
          <div className="eyebrow">Unterstützen</div>
          <h2>
            <span className="einfach-alt-block">{t.spenden_h2}</span>
            <span className="einfach-neu-block">Unsere Fahrten kosten nichts. Spenden sind willkommen.</span>
          </h2>
          <p>
            <span className="einfach-alt-block">{t.spenden_text}</span>
            <span className="einfach-neu-block">Wer möchte, kann uns Geld geben. Das Geld hilft uns, die Rikschas zu pflegen. Aber es ist freiwillig.</span>
          </p>
          <div className="spenden-grid">
            <div className="spenden-card">
              <h3>🏦 Kreissparkasse Köln</h3>
              <p style={{fontSize:'0.8rem',color:'var(--mid)',marginBottom:'0.75rem'}}>QR-Code scannen — Daten werden automatisch eingetragen</p>
              <canvas id="qr-ksk" role="img" aria-label="QR-Code für Spende an Kreissparkasse Köln — scannt automatisch IBAN DE79 3705 0299 0049 0050 40" width="160" height="160" style={{display:'block',margin:'0 auto 1rem',border:'1px solid var(--border)',borderRadius:4}}/>
              <p style={{fontSize:'0.82rem',marginBottom:'0.25rem'}}>Kontoinhaber:</p>
              <span className="iban">Förderverein „Miteinander Kloster Merten e. V."</span>
              <p style={{fontSize:'0.82rem',marginTop:'0.6rem',marginBottom:'0.25rem'}}>IBAN:</p>
              <span className="iban">DE79 3705 0299 0049 0050 40</span>
              <p style={{fontSize:'0.82rem',marginTop:'0.6rem',marginBottom:'0.25rem'}}>BIC:</p>
              <span className="iban">COKSDE33XXX</span>
              <p style={{fontSize:'0.82rem',marginTop:'0.6rem',marginBottom:'0.25rem'}}>Stichwort:</p>
              <span className="iban">Rikscha</span>
            </div>
            <div className="spenden-card">
              <h3>🏦 Volksbank Bonn Rhein-Sieg</h3>
              <p style={{fontSize:'0.8rem',color:'var(--mid)',marginBottom:'0.75rem'}}>QR-Code scannen — Daten werden automatisch eingetragen</p>
              <canvas id="qr-vb" role="img" aria-label="QR-Code für Spende an Volksbank Bonn Rhein-Sieg — scannt automatisch IBAN DE14 3806 0186 0410 0560 11" width="160" height="160" style={{display:'block',margin:'0 auto 1rem',border:'1px solid var(--border)',borderRadius:4}}/>
              <p style={{fontSize:'0.82rem',marginBottom:'0.25rem'}}>Kontoinhaber:</p>
              <span className="iban">Förderverein „Miteinander Kloster Merten e. V."</span>
              <p style={{fontSize:'0.82rem',marginTop:'0.6rem',marginBottom:'0.25rem'}}>IBAN:</p>
              <span className="iban">DE14 3806 0186 0410 0560 11</span>
              <p style={{fontSize:'0.82rem',marginTop:'0.6rem',marginBottom:'0.25rem'}}>BIC:</p>
              <span className="iban">GENODED1BRS</span>
              <p style={{fontSize:'0.82rem',marginTop:'0.6rem',marginBottom:'0.25rem'}}>Stichwort:</p>
              <span className="iban">Rikscha</span>
            </div>
            <div className="spenden-card">
              <h3>💵 Bar</h3>
              <p style={{fontSize:'0.9rem'}}>Nach der Fahrt einfach dem Piloten mitgeben — kein Mindestbetrag, keine Quittung nötig.</p>
              <p style={{fontSize:'0.9rem',marginTop:'0.75rem'}}>Jede Münze zählt. Danke von Herzen!</p>
            </div>
          </div>
          <QrSpenden/>
        </div>
      </section>

      <hr className="section-rule"/>

      {/* Galerie */}
      <section className="galerie-section" id="galerie">
        <div className="container">
          <div className="eyebrow">Eindrücke</div>
          <h2>Momente auf der Strecke</h2>
          <p>Fotos von unseren Piloten — echte Augenblicke aus dem Rikscha-Alltag.</p>

          {/* Wettbewerbs-Banner */}
          <div className="wettbewerb-banner" style={{background:'var(--green)',borderRadius:'var(--radius)',padding:'1rem 1.25rem',marginBottom:'1.5rem',display:'flex',alignItems:'center',justifyContent:'space-between',gap:'1rem',flexWrap:'wrap'}}>
            <div style={{color:'#fff'}}>
              <div style={{fontWeight:700,fontSize:'1rem'}}>🏆 Foto-Wettbewerb läuft!</div>
              <div style={{fontSize:'0.85rem',opacity:0.85,marginTop:'0.2rem'}}>Stimme für dein Lieblingsfoto — oder lade dein eigenes hoch!</div>
            </div>
            <div style={{display:'flex',gap:'0.6rem',flexWrap:'wrap'}}>
              <a href="/galerie" className="wettbewerb-link" style={{display:'inline-block',padding:'0.55rem 1rem',background:'#fff',color:'var(--green)',borderRadius:'var(--radius)',fontSize:'0.85rem',fontWeight:700,textDecoration:'none',whiteSpace:'nowrap'}}>👍 Jetzt abstimmen →</a>
              <a href="/galerie/hochladen" style={{display:'inline-block',padding:'0.55rem 1rem',background:'rgba(255,255,255,0.2)',color:'#000',border:'1px solid rgba(255,255,255,0.4)',borderRadius:'var(--radius)',fontSize:'0.85rem',fontWeight:700,textDecoration:'none',whiteSpace:'nowrap'}}>📸 Foto einreichen</a>
            </div>
          </div>

          <div className="galerie-grid">
            {galerie.length === 0
              ? <div className="galerie-empty">Noch keine Fotos vorhanden.</div>
              : galerie.map(f => (
                <a key={f.id} className="galerie-card" href="/galerie" style={{textDecoration:'none',color:'inherit'}}>
                  <img src={f.url} alt={f.beschreibung || ''} loading="lazy" />
                  <div className="galerie-info">
                    <div className="galerie-fotograf">📷 {f.pilot || 'Unbekannt'}</div>
                    {f.beschreibung && <div className="galerie-titel">„{f.beschreibung}"</div>}
                    <div className="galerie-meta">{new Date(f.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}</div>
                  </div>
                  {(f.stimmen ?? 0) > 0 && <div className="galerie-vote">👍 {f.stimmen} Stimme{f.stimmen !== 1 ? 'n' : ''}</div>}
                </a>
              ))
            }
          </div>
          {galerie.length > 0 && (
            <div style={{textAlign:'center',marginTop:'1.5rem'}}>
              <a href="/galerie" className="galerie-alle-link" style={{display:'inline-block',padding:'0.6rem 1.5rem',background:'var(--green)',color:'#fff',borderRadius:'var(--radius)',fontSize:'0.9rem',fontWeight:600,textDecoration:'none'}}>Alle Fotos ansehen &amp; abstimmen ↗</a>
            </div>
          )}
        </div>
      </section>

      </main>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'LocalBusiness',
          name: 'Mertener Rikschakutscher',
          description: 'Kostenlose Rikschafahrten durch Bornheim-Merten. Ehrenamtliches Projekt der GFO seit 2018.',
          url: 'https://rikscha-kutscher.de',
          telephone: '+4922279328383',
          address: {
            '@type': 'PostalAddress',
            streetAddress: 'Merten',
            addressLocality: 'Bornheim',
            postalCode: '53332',
            addressCountry: 'DE',
          },
          geo: {
            '@type': 'GeoCoordinates',
            latitude: 50.753,
            longitude: 6.977,
          },
          foundingDate: '2018',
          nonprofit: true,
          priceRange: 'Kostenlos',
          openingHours: 'Mo-Su 09:00-18:00',
          sameAs: [],
        })}}
      />

      {/* Footer */}
      <footer>
        <p style={{color:'rgba(255,255,255,0.6)',fontSize:'0.82rem'}}>
          <strong style={{color:'#fff'}}>Mertener Rikschakutscher</strong>
          {' · '}Ehrenamtliches Projekt der <a href="#">GFO</a>
          {' · '}📞 <a href="tel:022279328383">02227 9328383</a>
        </p>
        <p style={{marginTop:'0.6rem',fontSize:'0.78rem',color:'rgba(255,255,255,0.65)'}}>
          <a href="/impressum">Impressum</a> &nbsp;·&nbsp;
          <a href="/datenschutz">Datenschutz</a> &nbsp;·&nbsp;
          <PilotenFooterLink /> &nbsp;·&nbsp; © 2025
        </p>
      </footer>

      <PilotenModal />
    </>
  );
}
