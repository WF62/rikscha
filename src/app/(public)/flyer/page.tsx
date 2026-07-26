export const dynamic = 'force-dynamic';
import type { Metadata } from 'next';
import PrintButton from './PrintButton';
import { createServiceClient } from '@/lib/supabase';

export const metadata: Metadata = {
  title: 'Flyer – Mertener Rikschakutscher',
};

const SCHLUSSEL = [
  'flyer_fahrten_text', 'flyer_lotte_text', 'flyer_flitzer_text', 'flyer_piter_text',
  'flyer_foto_fahrt1', 'flyer_foto_fahrt2', 'flyer_foto_lotte', 'flyer_foto_flitzer', 'flyer_foto_piter',
];

const DEFAULT: Record<string, string> = {
  flyer_fahrten_text:  'Ob Seniorenausflug, Familienbesuch oder besonderer Anlass — unsere ehrenamtlichen Piloten bringen Sie sicher und stilvoll ans Ziel. Alle Fahrten sind kostenlos und für jeden zugänglich.',
  flyer_lotte_text:    'Die klassische Rikscha — geräumig, komfortabel, mit Rundumblick. Ob zur Kirche, zum Rhein oder durch die Mertener Heide: Flotte Lotte ermöglicht entspanntes Mitfahren mit großer Wirkung. Ideal für Seniorengruppen und Familienausflüge.',
  flyer_flitzer_text:  'Ideal für sehbehinderte oder körperlich eingeschränkte Menschen — wer mag, kann sogar mittreten! Nah am Boden, nah am Leben — eine völlig neue Perspektive.',
  flyer_piter_text:    'Pilot und Gast fahren Seite an Seite — besonders für Menschen mit Demenz. Das Nebeneinander schafft Sicherheit, Nähe und Gespräche auf Augenhöhe.',
  flyer_foto_fahrt1:   '',
  flyer_foto_fahrt2:   '',
  flyer_foto_lotte:    '',
  flyer_foto_flitzer:  '',
  flyer_foto_piter:    '',
};

async function ladeFlyerInhalte(): Promise<Record<string, string>> {
  try {
    const db = createServiceClient();
    const { data } = await db
      .from('inhalte')
      .select('schluessel, wert')
      .in('schluessel', SCHLUSSEL);
    const result = { ...DEFAULT };
    for (const { schluessel, wert } of data ?? []) {
      if (schluessel in result) result[schluessel] = wert;
    }
    return result;
  } catch {
    return DEFAULT;
  }
}

export default async function FlyerPage() {
  const c = await ladeFlyerInhalte();
  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --green:      #2D6B1E;
          --green2:     #3D8A28;
          --gold:       #C8881A;
          --cream:      #F5F0E7;
          --ink:        #1C1208;
          --mid:        #5C4E38;
          --lotte:      #F59E0B;
          --lotte-bg:   #FEF3C7;
          --flitzer:    #0EA5E9;
          --flitzer-bg: #E0F2FE;
          --piter:      #8B5CF6;
          --piter-bg:   #EDE9FE;
          --serif: Palatino Linotype, Palatino, Book Antiqua, Georgia, serif;
          --sans:  system-ui, -apple-system, Segoe UI, sans-serif;
          --w: 560px;
          --h1: 237px;
          --h2: 211px;
          --h3: 184px;
          --h4: 157px;
          --tab: 27px;
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
        .print-btn {
          background: #C8881A; color: #fff; border: none; cursor: pointer;
          font-size: 0.88rem; font-weight: 700; padding: 0.45rem 1.2rem;
          border-radius: 6px; display: flex; align-items: center; gap: 0.4rem;
        }
        .print-btn:hover { background: #a06a10; }

        /* ── Seite ── */
        .flyer-wrap { padding: 1.5rem 1rem 4rem; min-height: calc(100vh - 52px); }

        h1.page-title {
          text-align: center; font-family: var(--serif);
          font-size: 1rem; color: #3a3028; margin-bottom: 0.25rem; font-weight: normal;
        }
        .page-hint { text-align: center; font-size: 0.68rem; color: #6a5e50; margin-bottom: 2.5rem; }

        .side-label {
          font-size: 0.72rem; letter-spacing: 0.12em; text-transform: uppercase;
          color: #5c4e38; margin-bottom: 0.5rem; font-weight: 600;
          width: var(--w); margin-left: auto; margin-right: auto;
        }
        .sheet {
          width: var(--w); margin: 0 auto 3.5rem;
          box-shadow: 0 4px 32px rgba(0,0,0,0.28);
          position: relative; overflow: visible;
        }
        .panel { width: var(--w); position: relative; overflow: hidden; }
        .panel:not(:last-child)::after {
          content: '';
          position: absolute; bottom: -4px; left: 0; right: 0; height: 8px;
          background:
            repeating-linear-gradient(90deg, rgba(0,0,0,0.4) 0 7px, transparent 7px 12px)
              center / 100% 1.5px no-repeat,
            linear-gradient(to right, rgba(0,0,0,0.55) 2px, transparent 2px)
              left / 14px 100% no-repeat,
            linear-gradient(to left, rgba(0,0,0,0.55) 2px, transparent 2px)
              right / 14px 100% no-repeat;
          z-index: 20; pointer-events: none;
        }
        .panel:not(:last-child)::before {
          content: 'Knickkante';
          position: absolute; bottom: -9px; right: -62px;
          font-size: 0.42rem; font-weight: 700; letter-spacing: 0.07em;
          color: rgba(60,40,10,0.45); text-transform: uppercase;
          z-index: 20; white-space: nowrap; font-family: var(--sans);
        }
        .p1 { height: var(--h1); }
        .p2 { height: var(--h2); }
        .p3 { height: var(--h3); }
        .p4 { height: var(--h4); }
        /* .back-sheet screen rotation removed — shows right-side up */

        /* ── Titelstreifen ── */
        .panel-title-top, .panel-title-bottom {
          position: absolute; left: 0; right: 0; height: var(--tab);
          display: flex; align-items: center; padding: 0 12px; gap: 7px; z-index: 8;
        }
        .panel-title-top { top: 0; } .panel-title-bottom { bottom: 0; }
        .pt-icon { font-size: 0.95rem; line-height: 1; flex-shrink: 0; }
        .pt-label { font-size: 0.7rem; font-weight: 700; letter-spacing: 0.04em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .pt-gold    { background: var(--gold); }    .pt-gold    .pt-label { color: #fff; }
        .pt-green   { background: var(--green); }   .pt-green   .pt-label { color: rgba(255,255,255,0.95); }
        .pt-dark    { background: #3a2e1e; }         .pt-dark    .pt-label { color: rgba(255,255,255,0.9); }
        .pt-lotte   { background: var(--lotte); }   .pt-lotte   .pt-label { color: #fff; }
        .pt-flitzer { background: var(--flitzer); } .pt-flitzer .pt-label { color: #fff; }
        .pt-piter   { background: var(--piter); }   .pt-piter   .pt-label { color: #fff; }
        .pt-cream   { background: var(--cream); border-top: 2px solid var(--gold); } .pt-cream .pt-label { color: var(--green); }

        /* ── Platzhalter ── */
        .photo-ph { border-radius: 6px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.3rem; font-size: 0.57rem; font-weight: 700; text-align: center; line-height: 1.3; flex-shrink: 0; }
        .photo-ph .ph-icon { font-size: 1.4rem; opacity: 0.38; line-height: 1; }
        .photo-ph .ph-label { opacity: 0.42; }
        .ph-dark  { background: rgba(0,0,0,0.06); border: 2px dashed rgba(0,0,0,0.18); color: rgba(0,0,0,0.38); }
        .logo-ph { width: 52px; height: 52px; border: 2px dashed rgba(255,255,255,0.45); border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.15rem; font-size: 0.5rem; font-weight: 700; color: rgba(255,255,255,0.5); text-align: center; }
        .logo-ph .ph-icon { font-size: 1.3rem; opacity: 0.4; line-height: 1; }

        /* ── Vorschau ── */
        .preview-wrap { width: var(--w); margin: 0 auto 2.5rem; display: flex; gap: 2rem; align-items: flex-start; }
        .preview-label { font-size: 0.68rem; letter-spacing: 0.1em; text-transform: uppercase; color: #5c4e38; margin-bottom: 0.5rem; font-weight: 600; }
        .folded { display: flex; flex-direction: column; width: 180px; box-shadow: 3px 3px 14px rgba(0,0,0,0.3); }
        .fold-strip { display: flex; align-items: center; font-size: 0.65rem; font-weight: 700; overflow: hidden; }
        .fold-inner { flex: 1; display: flex; align-items: center; padding: 0 10px; gap: 6px; overflow: hidden; }
        .fs1 { height: 53px; background: #fffdf7; border: 1.5px dashed var(--gold); border-bottom: none; } .fs1 .fold-inner { color: #92400e; }
        .fs2 { height: 53px; background: #fff; border-bottom: 1px solid #e8e0d0; } .fs2 .fold-inner { color: var(--green); }
        .fs3 { height: 61px; background: var(--cream); border-bottom: 1px solid #d6ccb8; } .fs3 .fold-inner { color: #3a2e1e; }
        .fs4 { height: 22px; background: var(--green); } .fs4 .fold-inner { color: #fff; }
        .preview-explain { font-size: 0.68rem; color: #5c4e38; line-height: 1.75; max-width: 250px; padding-top: 0.5rem; }

        /* ── V1 Gutschein ── */
        .v1 { background: #fffdf7; border: 2.5px dashed var(--gold); display: flex; flex-direction: column; padding: calc(var(--tab) + 0.8rem) 1.5rem 0.9rem 1.5rem; gap: 0.55rem; }
        .v1::after { background: repeating-linear-gradient(90deg, var(--gold) 0 5px, transparent 5px 9px) !important; }
        .voucher-scissors { position: absolute; bottom: -9px; left: 10px; font-size: 0.85rem; background: #fffdf7; padding: 0 3px; z-index: 11; line-height: 1; }
        .voucher-head { display: flex; align-items: center; gap: 0.7rem; }
        .voucher-tag { font-size: 0.55rem; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: #fff; background: var(--gold); padding: 0.15rem 0.6rem; border-radius: 3px; flex-shrink: 0; }
        .voucher-title { font-family: var(--serif); font-size: 1.4rem; font-weight: normal; color: var(--green); line-height: 1; }
        .voucher-sub { font-size: 0.7rem; color: var(--mid); }
        .voucher-body { display: flex; gap: 1.2rem; flex: 1; min-height: 0; }
        .voucher-fields { flex: 1; display: flex; flex-direction: column; gap: 0.5rem; min-width: 0; }
        .fill-field { display: flex; flex-direction: column; gap: 0.06rem; }
        .fill-field label { font-size: 0.56rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--gold); }
        .fill-line { border: none; border-bottom: 1.5px solid #d6ccb8; background: transparent; height: 20px; width: 100%; font-size: 0.8rem; color: var(--ink); outline: none; font-family: var(--sans); }
        .fill-row { display: flex; gap: 0.8rem; }
        .fill-row .fill-field { flex: 1; }
        .fz-checks { display: flex; gap: 0.5rem; flex-wrap: wrap; padding-top: 0.12rem; }
        .fz-check { display: flex; align-items: center; gap: 0.22rem; font-size: 0.65rem; font-weight: 600; }
        .fz-check .box { width: 12px; height: 12px; border: 1.5px solid currentColor; border-radius: 2px; flex-shrink: 0; }
        .lotte-c { color: #b45309; } .flitzer-c { color: #0369a1; } .piter-c { color: #6d28d9; }
        .voucher-side { display: flex; flex-direction: column; gap: 0.45rem; flex-shrink: 0; width: 145px; }
        .voucher-brand { font-size: 0.62rem; color: var(--green); font-weight: 700; font-family: var(--serif); line-height: 1.4; }
        .voucher-brand small { display: block; font-family: var(--sans); font-size: 0.54rem; font-weight: 400; color: var(--mid); }
        .sig-block { display: flex; flex-direction: column; gap: 0.15rem; margin-top: auto; }
        .sig-line { border-bottom: 1.5px solid #d6ccb8; height: 20px; }
        .sig-label { font-size: 0.52rem; color: #a89070; letter-spacing: 0.06em; }
        .voucher-validity { font-size: 0.57rem; color: #a89070; font-style: italic; }
        .voucher-note { font-size: 0.59rem; color: var(--mid); font-style: italic; border-top: 1px solid #e8dcc8; padding-top: 0.35rem; }

        /* ── V2 Fahrten ── */
        .v2 { background: #fff; display: flex; align-items: stretch; }
        .v2-stripe { width: 6px; background: linear-gradient(to bottom, var(--green), var(--green2)); flex-shrink: 0; }
        .v2-body { flex: 1; padding: calc(var(--tab) + 0.5rem) 0.7rem 0.5rem 0.8rem; display: flex; flex-direction: column; justify-content: center; min-width: 0; }
        .v2-body .eyebrow { font-size: 0.58rem; letter-spacing: 0.14em; text-transform: uppercase; color: var(--gold); font-weight: 700; margin-bottom: 0.15rem; }
        .v2-body h3 { font-family: var(--serif); font-size: 1rem; font-weight: normal; color: var(--ink); margin-bottom: 0.35rem; }
        .v2-body p { font-size: 0.72rem; color: var(--mid); line-height: 1.52; margin-bottom: 0.4rem; }
        .pill-row { display: flex; gap: 0.3rem; flex-wrap: wrap; }
        .chip { font-size: 0.6rem; font-weight: 700; padding: 0.1rem 0.5rem; border-radius: 999px; }
        .chip-green { background: #d1fae5; color: #065f46; }
        .chip-gold  { background: #fef3c7; color: #92400e; }
        .v2-photos { display: flex; flex-direction: column; gap: 0.4rem; padding: calc(var(--tab) + 0.4rem) 0.8rem 0.4rem 0; flex-shrink: 0; width: 155px; align-self: stretch; box-sizing: border-box; }
        .v2-photos img { flex: 1; min-height: 0; width: 100%; object-fit: cover; border-radius: 6px; display: block; }
        .v2-photos .photo-ph { flex: 1; min-height: 0; width: 100%; }

        /* ── V3 Fahrzeuge ── */
        .v3 { background: var(--cream); padding: calc(var(--tab) + 0.8rem) 1.6rem 0.8rem; display: flex; flex-direction: column; justify-content: center; }
        .v3 .eyebrow { font-size: 0.58rem; letter-spacing: 0.14em; text-transform: uppercase; color: var(--gold); font-weight: 700; margin-bottom: 0.1rem; }
        .v3 h3 { font-family: var(--serif); font-size: 0.95rem; font-weight: normal; color: var(--ink); margin-bottom: 0.55rem; }
        .fz-row { display: flex; gap: 0.55rem; }
        .fz-card { flex: 1; border-radius: 6px; padding: 0.55rem 0.65rem; display: flex; flex-direction: column; gap: 0.12rem; }
        .fz-card .fz-name { font-family: var(--serif); font-size: 0.8rem; font-weight: bold; }
        .fz-card .fz-typ  { font-size: 0.56rem; text-transform: uppercase; letter-spacing: 0.08em; opacity: 0.7; }
        .fz-card .fz-gaeste { font-size: 0.65rem; font-weight: 700; margin-top: 0.2rem; }
        .fz-lotte   { background: var(--lotte-bg);   color: #78350f; }
        .fz-flitzer { background: var(--flitzer-bg); color: #075985; }
        .fz-piter   { background: var(--piter-bg);   color: #4c1d95; }

        /* ── V4 Cover ── */
        .v4 { background: var(--green); display: flex; flex-direction: column; padding: 1rem 1.5rem; gap: 0.4rem; position: relative; overflow: hidden; }
        .v4::before { content: ''; position: absolute; right: -20px; top: -50px; width: 160px; height: 160px; border-radius: 50%; border: 22px solid rgba(255,255,255,0.06); }
        .cover-row { display: flex; align-items: center; gap: 1rem; }
        .cover-title { font-family: var(--serif); font-size: 1.25rem; font-weight: normal; color: #fff; }
        .cover-meta { font-size: 0.62rem; color: rgba(255,255,255,0.62); margin-top: 0.15rem; }
        .cover-info { display: flex; gap: 1.2rem; font-size: 0.64rem; color: rgba(255,255,255,0.72); padding-left: 0.1rem; }
        .cover-badge { margin-left: auto; align-self: flex-start; background: var(--gold); color: #fff; font-size: 0.54rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; padding: 0.2rem 0.65rem; border-radius: 999px; white-space: nowrap; flex-shrink: 0; }

        /* ── Rückseite ── */
        .fz-panel { display: flex; align-items: stretch; }
        .fz-accent { width: 8px; flex-shrink: 0; }
        .fz-panel-body { flex: 1; padding: calc(var(--tab) + 0.5rem) 0.7rem 0.5rem 0.8rem; display: flex; flex-direction: column; justify-content: center; min-width: 0; }
        .fz-panel-body .fz-label { font-size: 0.57rem; text-transform: uppercase; letter-spacing: 0.14em; font-weight: 700; margin-bottom: 0.08rem; }
        .fz-panel-body h3 { font-family: var(--serif); font-size: 1rem; font-weight: bold; margin-bottom: 0.3rem; }
        .fz-panel-body p { font-size: 0.71rem; line-height: 1.5; }
        .fz-panel-body .fz-badge { align-self: flex-start; margin-top: 0.35rem; font-size: 0.63rem; font-weight: 700; color: #fff; border-radius: 999px; padding: 0.1rem 0.52rem; }
        .fz-panel-photo { display: flex; flex-direction: column; padding: calc(var(--tab) + 0.4rem) 0 0.4rem 0; flex: 1; align-self: stretch; box-sizing: border-box; }
        .fz-panel-photo img, .fz-panel-photo .photo-ph { margin-right: 0.6rem; }
        .fz-panel-photo img { flex: 1; min-height: 0; width: 100%; object-fit: cover; border-radius: 6px; display: block; }
        .fz-panel-photo .photo-ph { flex: 1; min-height: 0; width: 100%; }
        .r1 { background: var(--lotte-bg); } .r1 .fz-accent { background: var(--lotte); } .r1 .fz-label { color: #92400e; } .r1 h3 { color: #78350f; } .r1 p { color: #92400e; } .r1 .fz-badge { background: var(--lotte); }
        .r2 { background: var(--flitzer-bg); } .r2 .fz-accent { background: var(--flitzer); } .r2 .fz-label { color: #075985; } .r2 h3 { color: #0c4a6e; } .r2 p { color: #075985; } .r2 .fz-badge { background: var(--flitzer); }
        .r2 .fz-panel-photo { flex: 2; }

        .r3 { background: var(--piter-bg); } .r3 .fz-accent { background: var(--piter); } .r3 .fz-label { color: #4c1d95; } .r3 h3 { color: #3b0764; } .r3 p { color: #4c1d95; } .r3 .fz-badge { background: var(--piter); }

        .spenden-block { background: linear-gradient(135deg, #1a4a0e 0%, var(--green) 100%); border-radius: 7px; padding: 0.7rem 0.9rem; display: flex; flex-direction: column; gap: 0.35rem; color: #fff; flex: 1; }
        .spenden-block .sp-eye { font-size: 0.55rem; letter-spacing: 0.16em; text-transform: uppercase; color: var(--gold); font-weight: 700; }
        .spenden-block .sp-title { font-family: var(--serif); font-size: 0.88rem; line-height: 1.25; }
        .konto-table { display: flex; flex-direction: column; gap: 0.1rem; margin-top: 0.15rem; }
        .konto-row { display: flex; gap: 0.35rem; }
        .konto-label { color: rgba(255,255,255,0.55); font-size: 0.55rem; min-width: 38px; }
        .konto-val   { color: #fff; font-weight: 600; font-family: monospace; font-size: 0.62rem; letter-spacing: 0.02em; }
        .konto-ph    { color: var(--gold); font-style: italic; font-weight: normal; font-family: var(--sans); }

        .r4 { background: var(--cream); display: flex; align-items: stretch; padding: 0.9rem 1.4rem; gap: 1.2rem; border-top: 2px solid var(--gold); }
        .r4-text { font-size: 0.62rem; color: var(--mid); line-height: 1.5; display: flex; flex-direction: column; justify-content: center; gap: 0.3rem; }
        .r4-text strong { color: var(--green); font-family: var(--serif); font-size: 0.82rem; }
        .r4-side { margin-left: auto; display: flex; flex-direction: column; align-items: flex-end; justify-content: center; gap: 0.3rem; flex-shrink: 0; }
        .qr-ph { width: 58px; height: 58px; border: 1.5px solid #d6ccb8; border-radius: 4px; display: flex; align-items: center; justify-content: center; background: #fafaf8; font-size: 1.4rem; opacity: 0.32; }
        .r4-url { font-size: 0.58rem; color: var(--green); font-weight: 700; }

        /* ── PRINT ── */
        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        @media print {
          /* 10mm Rand oben+unten → bedruckbare Fläche = 277mm.
             zoom 1.42: Inhalt bei 148mm (560px-Layout) → skaliert auf 210mm Breite.
             Panel-Höhen so berechnet, dass 4 Panels × zoom = 277mm exakt. */
          @page { size: A4 portrait; margin: 10mm 0; }
          html, body { background: #fff !important; padding: 0 !important; margin: 0 !important; min-height: 0 !important; height: auto !important; }
          .print-bar, .flyer-wrap > h1, .flyer-wrap > p.page-hint, .side-label, .preview-wrap { display: none !important; }
          .flyer-wrap { padding: 0 !important; }
          .sheet { width: 148mm; height: 195mm; box-shadow: none; margin: 0; overflow: hidden; zoom: 1.42; }
          .panel { width: 148mm; overflow: hidden; }
          .panel::before { display: none; }
          .p1 { height: 72mm; }
          .p2 { height: 50mm; }
          .p3 { height: 43mm; }
          .p4 { height: 30mm; }
          .back-sheet { page-break-before: always; break-before: page; transform: none; }
          /* Rückseiten-Panels für beidseitigen Druck um 180° drehen */
          .back-sheet .panel { transform: rotate(180deg); transform-origin: center center; }
          /* r3: Titelleiste unten statt oben */
          .back-sheet .r2 .panel-title-top { top: auto; bottom: 0; }
          :root { --tab: 6mm; }
          /* Gutschein-Panel kompakter im Druck */
          .v1 { gap: 0.3rem; padding-top: calc(var(--tab) + 0.4rem); padding-bottom: 0.5rem; }
          .voucher-sub { display: none; }
          .fill-field label { font-size: 0.48rem; }
          .fill-line { height: 16px; }
          .fz-check { font-size: 0.55rem; }
          .fz-checks { flex-wrap: nowrap; gap: 0.2rem; }
          .voucher-brand { font-size: 0.56rem; }
          .sig-block { margin-top: 0.3rem; }
          .voucher-note { padding-top: 0.2rem; font-size: 0.52rem; }
        }
      `}</style>

      {/* Druckleiste */}
      <nav className="print-bar">
        <a href="/">← Zurück zur Website</a>
        <span style={{fontSize:'0.75rem',color:'#888',marginLeft:'1.5rem'}}>💡 Im Druckdialog: Kopf-/Fußzeilen deaktivieren</span>
        <a href="/flyer/bearbeiten" style={{marginLeft:'auto',marginRight:'1rem'}}>✏️ Fotos &amp; Texte bearbeiten</a>
        <PrintButton />
      </nav>

      <div className="flyer-wrap">
        <h1 className="page-title">Mertener Rikschakutscher · Stufenfalz DIN A4 · 105 / 85 / 65 / 42 mm</h1>
        <p className="page-hint">Druck: doppelseitig · lange Kante spiegeln · kein Rand · Rückseite 180° gedreht</p>

        {/* Vorschau */}
        <div className="preview-wrap">
          <div>
            <div className="preview-label">Zusammengeklappt – Vorderseite</div>
            <div className="folded">
              <div className="fold-strip fs1">
                <div className="fold-inner">🎁 <strong>Geschenkgutschein · Rikschafahrt</strong></div>
              </div>
              <div className="fold-strip fs2">
                <div className="fold-inner">🚲 <strong style={{color:'var(--green)'}}>Fahrtwind für alle</strong></div>
              </div>
              <div className="fold-strip fs3">
                <div className="fold-inner">🛺 <strong>Drei Rikschas</strong></div>
              </div>
              <div className="fold-strip fs4">
                <div className="fold-inner">🌿 <strong>Mertener Rikschakutscher</strong></div>
              </div>
            </div>
          </div>
          <div className="preview-explain">
            <strong style={{color:'var(--ink)'}}>Stufenfalz-Effekt:</strong><br/>
            Im gefalteten Zustand schaut oben<br/>
            an jedem Panel ein 10mm-Titelstreifen heraus.<br/><br/>
            <span style={{color:'var(--gold)'}}>█</span> V1 Gutschein (105 mm) – Titel oben<br/>
            <span style={{color:'var(--green)'}}>█</span> V2 Fahrten (85 mm)<br/>
            <span style={{color:'#3a2e1e'}}>█</span> V3 Fahrzeuge (65 mm) – Titel oben<br/>
            <span style={{color:'var(--green)'}}>█</span> V4 Cover (42 mm)<br/><br/>
            Rückseite (180° gedreht):<br/>
            H1–H3 Fahrzeugprofile · H4 Spenden + Kontakt
          </div>
        </div>

        {/* VORDERSEITE */}
        <p className="side-label">Vorderseite</p>
        <div className="sheet">

          {/* V1: Gutschein */}
          <div className="panel p1 v1">
            <div className="panel-title-top pt-gold">
              <span className="pt-icon">🎁</span>
              <span className="pt-label">Geschenkgutschein · Rikschafahrt · Mertener Rikschakutscher</span>
            </div>
            <div className="voucher-head">
              <span className="voucher-tag">Geschenkgutschein</span>
              <span className="voucher-title">Rikschafahrt</span>
            </div>
            <div className="voucher-sub">für eine kostenlose Rikschafahrt in Bornheim-Merten</div>
            <div className="voucher-body">
              <div className="voucher-fields">
                <div className="fill-field">
                  <label>Für</label>
                  <input className="fill-line" type="text" readOnly/>
                </div>
                <div className="fill-field">
                  <label>Fahrzeugwunsch</label>
                  <div className="fz-checks">
                    <span className="fz-check lotte-c"><span className="box"></span>Flotte Lotte</span>
                    <span className="fz-check flitzer-c"><span className="box"></span>Flinker Flitzer</span>
                    <span className="fz-check piter-c"><span className="box"></span>Jruuse Piter</span>
                    <span className="fz-check" style={{color:'var(--mid)'}}><span className="box"></span>Nach Absprache</span>
                  </div>
                </div>
                <div className="fill-row">
                  <div className="fill-field">
                    <label>Wunschdatum</label>
                    <input className="fill-line" type="text" readOnly/>
                  </div>
                  <div className="fill-field">
                    <label>Geschenk von</label>
                    <input className="fill-line" type="text" readOnly/>
                  </div>
                </div>
                <div className="fill-field">
                  <label>Sonderwunsch</label>
                  <input className="fill-line" type="text" readOnly/>
                </div>
              </div>
              <div className="voucher-side">
                <img src="https://hcbqmqyxpasojbrewnps.supabase.co/storage/v1/object/public/piloten-dateien/1785078123043-su0txlq3ipq.png" alt="Logo" style={{width:52,height:52,borderRadius:'50%',objectFit:'cover',alignSelf:'center',marginBottom:'0.3rem'}}/>
                <div className="voucher-brand">
                  Mertener<br/>Rikschakutscher
                  <small>Bornheim-Merten · seit 2018</small>
                  <small>02227 9328383</small>
                </div>
                <div className="sig-block">
                  <div className="sig-line"></div>
                  <div className="sig-label">Unterschrift / Stempel</div>
                </div>
                <div className="voucher-validity">gültig bis: ___________</div>
              </div>
            </div>
            <div className="voucher-note">Telefonisch einlösen · Alle Fahrten kostenlos · GFO Bornheim-Merten</div>
            <div className="voucher-scissors">✂</div>
          </div>

          {/* V2: Fahrten */}
          <div className="panel p2 v2">
            <div className="panel-title-top pt-green">
              <span className="pt-icon">🚲</span>
              <span className="pt-label">Fahrtwind für alle · kostenlose Rikschafahrten in Bornheim-Merten</span>
            </div>
            <div className="v2-stripe"></div>
            <div className="v2-body">
              <div className="eyebrow">Kostenlos &amp; Herzlich</div>
              <h3>Fahrtwind für alle</h3>
              <p>{c.flyer_fahrten_text}</p>
              <div className="pill-row">
                <span className="chip chip-green">Kostenlos</span>
                <span className="chip chip-green">Ehrenamtlich</span>
                <span className="chip chip-gold">Gruppenfahrten</span>
                <span className="chip chip-gold">Gutscheine</span>
              </div>
            </div>
            <div className="v2-photos">
              {c.flyer_foto_fahrt1
                ? <img src={c.flyer_foto_fahrt1} alt="Fahrt 1"/>
                : <div className="photo-ph ph-dark"><div className="ph-icon">📷</div><div className="ph-label">Foto Fahrt 1</div></div>
              }
              {c.flyer_foto_fahrt2
                ? <img src={c.flyer_foto_fahrt2} alt="Fahrt 2"/>
                : <div className="photo-ph ph-dark"><div className="ph-icon">📷</div><div className="ph-label">Foto Fahrt 2</div></div>
              }
            </div>
          </div>

          {/* V3: Fahrzeuge */}
          <div className="panel p3 v3">
            <div className="panel-title-top pt-dark">
              <span className="pt-icon">🛺</span>
              <span className="pt-label">Drei Rikschas · Flotte Lotte · Flinker Flitzer · Jruuse Piter</span>
            </div>
            <div className="eyebrow">Drei Rikschas · Drei Charaktere</div>
            <h3>Für jeden das richtige Fahrzeug</h3>
            <div className="fz-row">
              <div className="fz-card fz-lotte">
                <div className="fz-name">Flotte Lotte</div>
                <div className="fz-typ">Rikscha</div>
                <div className="fz-gaeste">👥 bis 2 Gäste</div>
              </div>
              <div className="fz-card fz-flitzer">
                <div className="fz-name">Flinker Flitzer</div>
                <div className="fz-typ">Liegetandem</div>
                <div className="fz-gaeste">👤 1 Gast</div>
              </div>
              <div className="fz-card fz-piter">
                <div className="fz-name">Jruuse Piter</div>
                <div className="fz-typ">Paralleltandem</div>
                <div className="fz-gaeste">👤 1 Gast</div>
              </div>
            </div>
          </div>

          {/* V4: Cover */}
          <div className="panel p4 v4">
            <div className="cover-row">
              <img src="https://hcbqmqyxpasojbrewnps.supabase.co/storage/v1/object/public/piloten-dateien/1785078123043-su0txlq3ipq.png" alt="Mertener Rikschakutscher Logo" style={{width:52,height:52,borderRadius:'50%',objectFit:'cover',flexShrink:0}}/>
              <div>
                <div style={{fontSize:'0.54rem',letterSpacing:'0.18em',textTransform:'uppercase',color:'rgba(255,255,255,0.48)',marginBottom:'0.18rem'}}>Bornheim-Merten · seit 2018</div>
                <div className="cover-title">Mertener Rikschakutscher</div>
                <div className="cover-meta">11 ehrenamtliche Piloten · kostenlose Rikschafahrten</div>
              </div>
              <div className="cover-badge">11 Piloten</div>
            </div>
            <div className="cover-info">
              <span>📞 02227 9328383</span>
              <span>🌐 rikscha-merten.de</span>
              <span>🎁 Gutscheine erhältlich</span>
            </div>
          </div>

        </div>

        {/* RÜCKSEITE */}
        <p className="side-label">Rückseite (beim Drucken an langer Kante spiegeln)</p>
        <div className="sheet back-sheet">

          {/* Orange oben → p1 (89mm) */}
          <div className="panel p1 r1 fz-panel">
            <div className="panel-title-top pt-lotte">
              <span className="pt-icon">🟡</span>
              <span className="pt-label">Flotte Lotte · Rikscha · bis 2 Gäste</span>
            </div>
            <div className="fz-accent"></div>
            <div className="fz-panel-body">
              <div className="fz-label">Rikscha · max. 2 Gäste</div>
              <h3>Flotte Lotte</h3>
              <p>{c.flyer_lotte_text}</p>
              <span className="fz-badge">👥 bis 2 Gäste</span>
            </div>
            <div className="fz-panel-photo">
              {c.flyer_foto_lotte
                ? <img src={c.flyer_foto_lotte} alt="Flotte Lotte"/>
                : <div className="photo-ph ph-dark"><div className="ph-icon">📷</div><div className="ph-label">Foto<br/>Flotte Lotte</div></div>
              }
            </div>
          </div>

          {/* Blau → p2 (79mm) */}
          <div className="panel p2 r2 fz-panel">
            <div className="panel-title-top pt-flitzer">
              <span className="pt-icon">🔵</span>
              <span className="pt-label">Flinker Flitzer · Liegetandem · 1 Gast</span>
            </div>
            <div className="fz-accent"></div>
            <div className="fz-panel-body">
              <div className="fz-label">Liegetandem · 1 Gast</div>
              <h3>Flinker Flitzer</h3>
              <p>{c.flyer_flitzer_text}</p>
              <span className="fz-badge">👤 1 Gast</span>
            </div>
            <div className="fz-panel-photo">
              {c.flyer_foto_flitzer
                ? <img src={c.flyer_foto_flitzer} alt="Flinker Flitzer"/>
                : <div className="photo-ph ph-dark"><div className="ph-icon">📷</div><div className="ph-label">Foto<br/>Flinker Flitzer</div></div>
              }
            </div>
          </div>

          {/* Lila → p3 (69mm) */}
          <div className="panel p3 r3 fz-panel">
            <div className="panel-title-top pt-piter">
              <span className="pt-icon">🟣</span>
              <span className="pt-label">Jruuse Piter · Paralleltandem · 1 Gast</span>
            </div>
            <div className="fz-accent"></div>
            <div className="fz-panel-body">
              <div className="fz-label">Paralleltandem · 1 Gast</div>
              <h3>Jruuse Piter</h3>
              <p>{c.flyer_piter_text}</p>
              <span className="fz-badge">👤 1 Gast</span>
            </div>
            <div className="fz-panel-photo">
              {c.flyer_foto_piter
                ? <img src={c.flyer_foto_piter} alt="Jruuse Piter"/>
                : <div className="photo-ph ph-dark"><div className="ph-icon">📷</div><div className="ph-label">Foto<br/>Jruuse Piter</div></div>
              }
            </div>
          </div>

          {/* Grün unten → p4 (59mm) */}
          <div className="panel p4 r4">
            <div className="panel-title-top pt-cream">
              <span className="pt-icon">💚</span>
              <span className="pt-label">Spenden · IBAN · Kontakt · rikscha-merten.de</span>
            </div>
            <div className="spenden-block">
              <div className="sp-eye">Spenden</div>
              <div className="sp-title">Helfen Sie uns, weiterzufahren</div>
              <div className="konto-table">
                <div className="konto-row">
                  <span className="konto-label">Empfänger</span>
                  <span className="konto-val"><span className="konto-ph">Mertener Rikschakutscher</span></span>
                </div>
                <div className="konto-row">
                  <span className="konto-label">IBAN</span>
                  <span className="konto-val"><span className="konto-ph">DE__ ____ ____ ____ ____ __</span></span>
                </div>
                <div className="konto-row">
                  <span className="konto-label">BIC</span>
                  <span className="konto-val"><span className="konto-ph">XXXXDEXX</span></span>
                </div>
                <div className="konto-row">
                  <span className="konto-label">Zweck</span>
                  <span className="konto-val">Rikscha Bornheim-Merten</span>
                </div>
              </div>
            </div>
            <div className="r4-side">
              <div className="r4-text" style={{textAlign:'right'}}>
                <strong>Mertener Rikschakutscher</strong>
                <span>GFO Bornheim-Merten</span>
                <span style={{color:'var(--green)',fontWeight:700}}>📞 02227 9328383</span>
                <span style={{fontSize:'0.55rem',fontStyle:'italic',color:'#9a8a72'}}>AB — wir rufen zurück</span>
              </div>
              <div className="qr-ph">▣</div>
              <div className="r4-url">rikscha-merten.de</div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
