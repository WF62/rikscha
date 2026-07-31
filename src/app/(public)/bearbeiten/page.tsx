'use client';
import { useState, useEffect, useRef } from 'react';

/* ── Typen ── */
type FotoFeld  = { schluessel: string; label: string; emoji: string; hinweis: string };
type TextFeld  = { schluessel: string; label: string; hinweis: string; lang?: boolean };
type Gruppe    = { titel: string; emoji: string; fotos?: FotoFeld[]; texte?: TextFeld[] };
type PilotenDatei = { id: string; url: string; name: string; kategorie: string };
type Inhaltsfeld  = { schluessel: string; wert: string; bezeichnung?: string; geaendert_von?: string; geaendert_am?: string };
type Entwurf = { id: string; schluessel: string; wert: string; eingereicht_von: string; eingereicht_am: string; status: string; kommentar?: string };
type Verlaufeintrag = { id: string; schluessel: string; wert: string; geaendert_von: string; geaendert_am: string };

/* ── Website-Felder (Tab 1) ── */
const WEBSITE_BEZEICHNUNGEN: Record<string, string> = {
  hero_eyebrow:      'Hero – Eyebrow (kleine Zeile oben)',
  hero_titel:        'Hero – Haupttitel (h1)',
  hero_sub:          'Hero – Untertitel',
  fahrten_h2:        'Gruppenfahrten – Überschrift',
  gruppenfahrten_1:  'Gruppenfahrten – Absatz 1',
  gruppenfahrten_2:  'Gruppenfahrten – Absatz 2',
  fahrzeuge_h2:      'Fahrzeuge – Überschrift',
  fahrzeuge_intro:   'Fahrzeuge – Einleitung',
  lotte_text:        'Flotte Lotte – Beschreibung',
  flitzer_text:      'Flinker Flitzer – Beschreibung',
  piter_text:        'Jruuse Piter – Beschreibung',
  team_h2:           'Team – Überschrift',
  team_text:         'Team – Beschreibung',
  touren_h2:         'Touren – Überschrift',
  touren_intro:      'Touren – Einleitung',
  tour_1_titel:      'Tour 1 – Titel',
  tour_1_text:       'Tour 1 – Text',
  tour_2_titel:      'Tour 2 – Titel',
  tour_2_text:       'Tour 2 – Text',
  tour_3_titel:      'Tour 3 – Titel',
  tour_3_text:       'Tour 3 – Text',
  tour_4_titel:      'Tour 4 – Titel',
  tour_4_text:       'Tour 4 – Text',
  mitmachen_h2:      'Mitmachen – Überschrift',
  mitmachen_intro:   'Mitmachen – Einleitung',
  schritt_1_titel:   'Schritt 1 – Titel',
  schritt_1_text:    'Schritt 1 – Text',
  schritt_2_titel:   'Schritt 2 – Titel',
  schritt_2_text:    'Schritt 2 – Text',
  schritt_3_titel:   'Schritt 3 – Titel',
  schritt_3_text:    'Schritt 3 – Text',
  schritt_4_titel:   'Schritt 4 – Titel',
  schritt_4_text:    'Schritt 4 – Text',
  zukunft_h2:        'Zukunft – Überschrift',
  zukunft_intro:     'Zukunft – Einleitung',
  zukunft_1_titel:   'Zukunft 1 – Titel',
  zukunft_1_text:    'Zukunft 1 – Text',
  zukunft_2_titel:   'Zukunft 2 – Titel',
  zukunft_2_text:    'Zukunft 2 – Text',
  zukunft_3_titel:   'Zukunft 3 – Titel',
  zukunft_3_text:    'Zukunft 3 – Text',
  zukunft_4_titel:   'Zukunft 4 – Titel',
  zukunft_4_text:    'Zukunft 4 – Text',
  kennzahlen_h2:     'Kennzahlen – Überschrift',
  stat_1_zahl:       'Kennzahl 1 – Zahl',
  stat_1_label:      'Kennzahl 1 – Bezeichnung',
  stat_2_zahl:       'Kennzahl 2 – Zahl',
  stat_2_label:      'Kennzahl 2 – Bezeichnung',
  stat_3_zahl:       'Kennzahl 3 – Zahl',
  stat_3_label:      'Kennzahl 3 – Bezeichnung',
  stat_4_zahl:       'Kennzahl 4 – Zahl',
  stat_4_label:      'Kennzahl 4 – Bezeichnung',
  stat_5_zahl:       'Kennzahl 5 – Zahl',
  stat_5_label:      'Kennzahl 5 – Bezeichnung',
  stimmen_h2:        'Stimmen – Überschrift',
  stimme_1_text:     'Stimme 1 – Zitat',
  stimme_1_name:     'Stimme 1 – Name',
  stimme_1_rolle:    'Stimme 1 – Rolle (Gast / Pilot)',
  stimme_2_text:     'Stimme 2 – Zitat',
  stimme_2_name:     'Stimme 2 – Name',
  stimme_2_rolle:    'Stimme 2 – Rolle (Gast / Pilot)',
  stimme_3_text:     'Stimme 3 – Zitat',
  stimme_3_name:     'Stimme 3 – Name',
  stimme_3_rolle:    'Stimme 3 – Rolle (Gast / Pilot)',
  spenden_h2:        'Spenden – Überschrift',
  spenden_text:      'Spenden – Beschreibung',
  kontakt_h2:        'Kontakt – Überschrift',
  kontakt_text:      'Kontakt – Beschreibung',
};
const WEBSITE_REIHENFOLGE = Object.keys(WEBSITE_BEZEICHNUNGEN);

/* ── Handout-Gruppen (Tab 3) ── */
const HANDOUT_GRUPPEN: Gruppe[] = [
  {
    titel: 'Vorderseite', emoji: '🟢',
    fotos: [
      { schluessel: 'handout_foto_vorne', emoji: '📸', label: 'Hintergrundfoto (Vorderseite)', hinweis: 'Fahrtfoto als Hintergrund – wird groß und dunkel überblendet hinterlegt' },
    ],
    texte: [
      { schluessel: 'handout_slogan', label: 'Slogan / Hauptzeile', hinweis: 'z. B. „Wind im Haar. Herz am rechten Fleck."' },
      { schluessel: 'handout_sub',    label: 'Tagline / Unterzeile', hinweis: 'z. B. „Kostenlose Rikschafahrten in Bornheim-Merten · Ehrenamtlich seit 2018"' },
      { schluessel: 'handout_text',   label: 'Beschreibungstext',    hinweis: 'Kurzer Text in der Mitte des Handouts', lang: true },
    ],
  },
  {
    titel: 'Rückseite · Flotte Lotte', emoji: '🟡',
    fotos: [
      { schluessel: 'handout_foto_lotte', emoji: '🟡', label: 'Foto Flotte Lotte', hinweis: 'Fahrzeugfoto auf der Rückseite' },
    ],
    texte: [
      { schluessel: 'handout_r1_name',    label: 'Name',        hinweis: 'z. B. „Flotte Lotte"' },
      { schluessel: 'handout_r1_typ',     label: 'Typ-Zeile',   hinweis: 'z. B. „Rikscha · bis 2 Gäste"' },
      { schluessel: 'handout_lotte_kurz', label: 'Kurztext',    hinweis: 'Kurzbeschreibung (2–3 Sätze)', lang: true },
    ],
  },
  {
    titel: 'Rückseite · Flinker Flitzer', emoji: '🔵',
    fotos: [
      { schluessel: 'handout_foto_flitzer', emoji: '🔵', label: 'Foto Flinker Flitzer', hinweis: 'Fahrzeugfoto auf der Rückseite' },
    ],
    texte: [
      { schluessel: 'handout_r2_name',      label: 'Name',      hinweis: 'z. B. „Flinker Flitzer"' },
      { schluessel: 'handout_r2_typ',       label: 'Typ-Zeile', hinweis: 'z. B. „Liegetandem · 1 Gast"' },
      { schluessel: 'handout_flitzer_kurz', label: 'Kurztext',  hinweis: 'Kurzbeschreibung (2–3 Sätze)', lang: true },
    ],
  },
  {
    titel: 'Rückseite · Jruuse Piter', emoji: '🟣',
    fotos: [
      { schluessel: 'handout_foto_piter', emoji: '🟣', label: 'Foto Jruuse Piter', hinweis: 'Fahrzeugfoto auf der Rückseite' },
    ],
    texte: [
      { schluessel: 'handout_r3_name',   label: 'Name',      hinweis: 'z. B. „Jruuse Piter"' },
      { schluessel: 'handout_r3_typ',    label: 'Typ-Zeile', hinweis: 'z. B. „Paralleltandem · 1 Gast"' },
      { schluessel: 'handout_piter_kurz', label: 'Kurztext', hinweis: 'Kurzbeschreibung (2–3 Sätze)', lang: true },
    ],
  },
];

/* ── Flyer-Gruppen (Tab 2) ── */
const FLYER_GRUPPEN: Gruppe[] = [
  {
    titel: 'V1 · Gutschein', emoji: '🎁',
    texte: [
      { schluessel: 'flyer_gutschein_hinweis', label: 'Hinweiszeile', hinweis: 'Zeile am unteren Rand des Gutscheins' },
    ],
  },
  {
    titel: 'V2 · Fahrten', emoji: '🚲',
    fotos: [
      { schluessel: 'flyer_foto_fahrt1', emoji: '📸', label: 'Fahrtfoto 1', hinweis: 'Vorderseite „Fahrtwind für alle" · linkes Foto' },
      { schluessel: 'flyer_foto_fahrt2', emoji: '📸', label: 'Fahrtfoto 2', hinweis: 'Vorderseite „Fahrtwind für alle" · rechtes Foto' },
    ],
    texte: [
      { schluessel: 'flyer_v2_eyebrow',   label: 'Augenbraue',       hinweis: 'Kleine Zeile über der Überschrift' },
      { schluessel: 'flyer_v2_h3',        label: 'Überschrift',      hinweis: 'Hauptüberschrift des Panels' },
      { schluessel: 'flyer_fahrten_text', label: 'Beschreibungstext', hinweis: 'Haupttext im grünen Fahrten-Abschnitt', lang: true },
    ],
  },
  {
    titel: 'V3 · Kutscher', emoji: '🚴',
    texte: [
      { schluessel: 'flyer_v3_eyebrow',     label: 'Augenbraue',       hinweis: 'z. B. „Rund 10 ehrenamtliche Kutscher"' },
      { schluessel: 'flyer_v3_h3',          label: 'Überschrift',      hinweis: 'Hauptüberschrift des Panels' },
      { schluessel: 'flyer_v3_card1_titel', label: 'Karte 1 – Titel',  hinweis: 'z. B. „Wer sind unsere Kutscher?"' },
      { schluessel: 'flyer_v3_card1_text',  label: 'Karte 1 – Text',   hinweis: 'Beschreibung der Kutscher', lang: true },
      { schluessel: 'flyer_v3_card2_titel', label: 'Karte 2 – Titel',  hinweis: 'z. B. „Mitmachen?"' },
      { schluessel: 'flyer_v3_card2_text',  label: 'Karte 2 – Text',   hinweis: 'Mitmach-Aufruf mit Telefonnummer', lang: true },
    ],
  },
  {
    titel: 'V4 · Cover', emoji: '🌿',
    texte: [
      { schluessel: 'flyer_v4_meta',  label: 'Unterzeile',         hinweis: 'z. B. „11 ehrenamtliche Piloten · kostenlose Rikschafahrten"' },
      { schluessel: 'flyer_v4_badge', label: 'Badge (Pilotenzahl)', hinweis: 'z. B. „11 Piloten"' },
    ],
  },
  {
    titel: 'H1 · Flotte Lotte', emoji: '🟡',
    fotos: [{ schluessel: 'flyer_foto_lotte', emoji: '🟡', label: 'Foto Flotte Lotte', hinweis: 'Rückseite oben (oranges Panel)' }],
    texte: [
      { schluessel: 'flyer_r1_label',   label: 'Typ-Zeile',          hinweis: 'z. B. „Rikscha · max. 2 Gäste"' },
      { schluessel: 'flyer_r1_h3',      label: 'Name / Überschrift',  hinweis: 'z. B. „Flotte Lotte"' },
      { schluessel: 'flyer_lotte_text', label: 'Beschreibungstext',   hinweis: 'Beschreibung auf der Rückseite', lang: true },
    ],
  },
  {
    titel: 'H2 · Flinker Flitzer', emoji: '🔵',
    fotos: [{ schluessel: 'flyer_foto_flitzer', emoji: '🔵', label: 'Foto Flinker Flitzer', hinweis: 'Rückseite Mitte (blaues Panel)' }],
    texte: [
      { schluessel: 'flyer_r2_label',     label: 'Typ-Zeile',          hinweis: 'z. B. „Liegetandem · 1 Gast"' },
      { schluessel: 'flyer_r2_h3',        label: 'Name / Überschrift',  hinweis: 'z. B. „Flinker Flitzer"' },
      { schluessel: 'flyer_flitzer_text', label: 'Beschreibungstext',   hinweis: 'Beschreibung auf der Rückseite', lang: true },
    ],
  },
  {
    titel: 'H3 · Jruuse Piter', emoji: '🟣',
    fotos: [{ schluessel: 'flyer_foto_piter', emoji: '🟣', label: 'Foto Jruuse Piter', hinweis: 'Rückseite unten (lila Panel)' }],
    texte: [
      { schluessel: 'flyer_r3_label',   label: 'Typ-Zeile',          hinweis: 'z. B. „Paralleltandem · 1 Gast"' },
      { schluessel: 'flyer_r3_h3',      label: 'Name / Überschrift',  hinweis: 'z. B. „Jruuse Piter"' },
      { schluessel: 'flyer_piter_text', label: 'Beschreibungstext',   hinweis: 'Beschreibung auf der Rückseite', lang: true },
    ],
  },
];

/* ── Hauptkomponente ── */
export default function BearbeitenPage() {
  const [pilot, setPilot]     = useState(() => typeof window !== 'undefined' ? localStorage.getItem('pilot_name') ?? '' : '');
  const [password, setPassword] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('pilot_pw') ?? '' : '');
  const [eingeloggt, setEingeloggt] = useState(() => typeof window !== 'undefined' && !!localStorage.getItem('pilot_name'));
  const [piloten, setPiloten] = useState<{ name: string; rolle: string }[]>([]);
  const [felder, setFelder]   = useState<Inhaltsfeld[]>([]);
  const [fehler, setFehler]   = useState('');
  const [laden, setLaden]     = useState(false);
  const [pilotRolle, setPilotRolle] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('pilot_rolle') ?? 'pilot' : 'pilot');
  const istAdminUser = pilotRolle === 'gfo' || pilotRolle === 'admin';
  const [tab, setTab]         = useState<'website' | 'flyer' | 'handout' | 'banner' | 'entwuerfe' | 'verlauf'>('website');
  const [entwuerfe, setEntwuerfe] = useState<Entwurf[]>([]);
  const [entwurfLaden, setEntwurfLaden] = useState(false);
  const [entwurfAktion, setEntwurfAktion] = useState<Record<string, 'loading'|'ok'|'err'>>({});
  const [verlaufFelder, setVerlaufFelder] = useState<Verlaufeintrag[]>([]);
  const [verlaufSchluessel, setVerlaufSchluessel] = useState('');
  const [verlaufLaden, setVerlaufLaden] = useState(false);
  const [rollbackStatus, setRollbackStatus] = useState<Record<string, 'loading'|'ok'>>({});
  const [bannerTexte, setBannerTexte] = useState<string[]>(['']);
  const [bannerSaving, setBannerSaving] = useState(false);
  const [uploadStatus, setUploadStatus]   = useState<Record<string, 'uploading' | 'ok' | 'err' | ''>>({});
  const [speicherStatus, setSpeicherStatus] = useState<Record<string, 'ok' | 'err' | ''>>({});
  const [pilotenDateien, setPilotenDateien] = useState<PilotenDatei[]>([]);
  const [pickerFeld, setPickerFeld] = useState<string | null>(null);
  const [sammelStatus, setSammelStatus] = useState<''|'saving'|'ok'|'err'>('');
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    if (eingeloggt) { ladeFelder(); ladePickerDateien(); }
    else ladePiloten();
  }, []);

  async function ladePiloten() {
    try { const r = await fetch('/api/piloten'); setPiloten(await r.json()); } catch {}
  }
  async function ladeFelder() {
    try { const r = await fetch('/api/inhalte'); setFelder(await r.json()); } catch {}
  }
  async function ladeBanner() {
    try { const r = await fetch('/api/banner'); const t: string[] = await r.json(); setBannerTexte(t.length ? t : ['']); } catch { setBannerTexte(['']); }
  }
  async function bannerSpeichern() {
    setBannerSaving(true);
    await fetch('/api/banner', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pilot, password, texte: bannerTexte }) });
    setBannerSaving(false);
  }
  async function ladePickerDateien() {
    try { const r = await fetch('/api/piloten-dateien'); setPilotenDateien(await r.json()); } catch {}
  }

  function feldWert(schluessel: string) {
    return felder.find(f => f.schluessel === schluessel)?.wert ?? '';
  }
  function setFeldWert(schluessel: string, wert: string) {
    setFelder(f => {
      const ex = f.find(x => x.schluessel === schluessel);
      if (ex) return f.map(x => x.schluessel === schluessel ? { ...x, wert } : x);
      return [...f, { schluessel, wert }];
    });
  }

  async function anmelden(e: React.FormEvent) {
    e.preventDefault(); setFehler(''); setLaden(true);
    try {
      const r = await fetch('/api/pilot-login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pilot, password }) });
      if (r.ok) {
        localStorage.setItem('pilot_name', pilot);
        localStorage.setItem('pilot_pw', password);
        const j = await r.json();
        const rolle = j.rolle ?? 'pilot';
        localStorage.setItem('pilot_rolle', rolle);
        setPilotRolle(rolle);
        setEingeloggt(true);
        await ladeFelder();
        await ladePickerDateien();
      } else { setFehler((await r.json()).error || 'Falscher Name oder Passwort.'); }
    } catch { setFehler('Verbindungsfehler.'); }
    setLaden(false);
  }

  function abmelden() {
    localStorage.removeItem('pilot_name'); localStorage.removeItem('pilot_pw');
    setEingeloggt(false); setFelder([]);
  }

  async function speichern(schluessel: string, wert: string) {
    setSpeicherStatus(s => ({ ...s, [schluessel]: '' }));
    try {
      const r = await fetch('/api/inhalte', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pilot, password, schluessel, wert }) });
      if (r.ok) {
        setSpeicherStatus(s => ({ ...s, [schluessel]: 'ok' }));
        setFeldWert(schluessel, wert);
        setTimeout(() => setSpeicherStatus(s => ({ ...s, [schluessel]: '' })), 3500);
      } else { setSpeicherStatus(s => ({ ...s, [schluessel]: 'err' })); }
    } catch { setSpeicherStatus(s => ({ ...s, [schluessel]: 'err' })); }
  }

  async function ladeEntwuerfe() {
    setEntwurfLaden(true);
    try { const r = await fetch(`/api/inhalte-entwurf?pilot=${encodeURIComponent(pilot)}&password=${encodeURIComponent(password)}`); setEntwuerfe(r.ok ? await r.json() : []); } catch { setEntwuerfe([]); }
    setEntwurfLaden(false);
  }

  async function entwurfBearbeiten(id: string, aktion: 'freigeben' | 'ablehnen') {
    setEntwurfAktion(s => ({ ...s, [id]: 'loading' }));
    try {
      const r = await fetch('/api/inhalte-entwurf', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pilot, password, id, aktion }) });
      if (r.ok) {
        setEntwurfAktion(s => ({ ...s, [id]: 'ok' }));
        setEntwuerfe(e => e.filter(x => x.id !== id));
        if (aktion === 'freigeben') ladeFelder();
      } else { setEntwurfAktion(s => ({ ...s, [id]: 'err' })); }
    } catch { setEntwurfAktion(s => ({ ...s, [id]: 'err' })); }
  }

  async function ladeVerlauf(schluessel: string) {
    setVerlaufSchluessel(schluessel);
    setVerlaufLaden(true);
    try { const r = await fetch(`/api/inhalte-entwurf?pilot=${encodeURIComponent(pilot)}&password=${encodeURIComponent(password)}&verlauf=${encodeURIComponent(schluessel)}`); setVerlaufFelder(r.ok ? await r.json() : []); } catch { setVerlaufFelder([]); }
    setVerlaufLaden(false);
  }

  async function rollback(eintrag: Verlaufeintrag) {
    if (!confirm(`Auf Stand vom ${new Date(eintrag.geaendert_am).toLocaleString('de-DE')} zurücksetzen?`)) return;
    setRollbackStatus(s => ({ ...s, [eintrag.id]: 'loading' }));
    await fetch('/api/inhalte-entwurf', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pilot, password, verlaufId: eintrag.id, schluessel: eintrag.schluessel, wert: eintrag.wert }) });
    setRollbackStatus(s => ({ ...s, [eintrag.id]: 'ok' }));
    ladeFelder();
    setTimeout(() => ladeVerlauf(eintrag.schluessel), 500);
  }

  async function bildKomprimieren(datei: File, maxPx = 1400, q = 0.85): Promise<File> {
    return new Promise(resolve => {
      const img = new Image(); const url = URL.createObjectURL(datei);
      img.onload = () => {
        URL.revokeObjectURL(url);
        let { width, height } = img;
        if (width > maxPx || height > maxPx) {
          if (width > height) { height = Math.round(height * maxPx / width); width = maxPx; }
          else { width = Math.round(width * maxPx / height); height = maxPx; }
        }
        const c = document.createElement('canvas'); c.width = width; c.height = height;
        c.getContext('2d')!.drawImage(img, 0, 0, width, height);
        c.toBlob(b => resolve(b ? new File([b], datei.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' }) : datei), 'image/jpeg', q);
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(datei); };
      img.src = url;
    });
  }

  async function fotoHochladen(schluessel: string, datei: File) {
    setUploadStatus(s => ({ ...s, [schluessel]: 'uploading' }));
    try {
      const form = new FormData();
      form.append('pilot', pilot); form.append('password', password);
      form.append('schluessel', schluessel);
      form.append('datei', await bildKomprimieren(datei));
      const r = await fetch('/api/flyer-foto', { method: 'POST', body: form });
      if (r.ok) {
        const { url } = await r.json();
        setFeldWert(schluessel, url);
        setUploadStatus(s => ({ ...s, [schluessel]: 'ok' }));
        setTimeout(() => setUploadStatus(s => ({ ...s, [schluessel]: '' })), 3500);
        await ladePickerDateien();
      } else { setUploadStatus(s => ({ ...s, [schluessel]: 'err' })); }
    } catch { setUploadStatus(s => ({ ...s, [schluessel]: 'err' })); }
  }

  async function fotoAusPickerWaehlen(schluessel: string, url: string) {
    setPickerFeld(null);
    setSpeicherStatus(s => ({ ...s, [schluessel]: '' }));
    try {
      const r = await fetch('/api/inhalte', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pilot, password, schluessel, wert: url }) });
      if (r.ok) {
        setFeldWert(schluessel, url);
        setSpeicherStatus(s => ({ ...s, [schluessel]: 'ok' }));
        setTimeout(() => setSpeicherStatus(s => ({ ...s, [schluessel]: '' })), 3500);
      } else { setSpeicherStatus(s => ({ ...s, [schluessel]: 'err' })); }
    } catch { setSpeicherStatus(s => ({ ...s, [schluessel]: 'err' })); }
  }

  /* ── CSS ── */
  const css = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --green:#2D6B1E; --gold:#C8881A;
      --ink:#1C1208; --mid:#6B5C44;
      --ground:#F5F0E7; --surface:#FDFAF5; --border:#D6CCB8;
      --r:4px;
      --sans:system-ui,-apple-system,Segoe UI,sans-serif;
      --serif:Palatino Linotype,Palatino,Book Antiqua,Georgia,serif;
    }
    @media(prefers-color-scheme:dark){
      :root{--green:#5DB84A;--ink:#F0EBE0;--mid:#A89880;--ground:#141008;--surface:#1C1610;--border:#3A3020;}
    }
    body{font-family:var(--sans);background:var(--ground);color:var(--ink);min-height:100vh;}
    .nav{background:#2D6B1E;color:#fff;display:flex;align-items:center;gap:.75rem;padding:0 2rem;height:56px;flex-wrap:wrap;}
    .nav a{color:rgba(255,255,255,.8);text-decoration:none;font-size:.88rem;}
    .nav a:hover{color:#fff;}
    .nav .sep{color:rgba(255,255,255,.3);}
    .body{max-width:860px;margin:0 auto;padding:2.5rem 1.5rem 5rem;}
    h1{font-family:var(--serif);font-size:1.9rem;font-weight:normal;margin-bottom:.35rem;}
    .lead{color:var(--mid);margin-bottom:2rem;font-size:.9rem;}
    /* login */
    .login-box{background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:2rem;max-width:420px;}
    .login-box h2{font-family:var(--serif);font-size:1.3rem;font-weight:normal;margin-bottom:1.25rem;}
    .field{display:flex;flex-direction:column;gap:.35rem;margin-bottom:.85rem;}
    .field label{font-size:.75rem;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--green);}
    .field input,.field select{border:1.5px solid var(--border);border-radius:var(--r);padding:.6rem .8rem;font-size:.95rem;background:var(--ground);color:var(--ink);font-family:var(--sans);outline:none;width:100%;}
    .field input:focus,.field select:focus{border-color:var(--green);}
    .btn-primary{background:var(--green);color:#fff;border:none;padding:.65rem 1.75rem;border-radius:var(--r);font-size:.95rem;font-weight:600;cursor:pointer;}
    .btn-primary:disabled{opacity:.5;cursor:not-allowed;}
    .err-msg{color:#c0392b;font-size:.82rem;margin-top:.5rem;}
    /* header */
    .editor-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem;flex-wrap:wrap;gap:1rem;}
    .editor-header h2{font-family:var(--serif);font-size:1.4rem;font-weight:normal;}
    .btn-ghost{background:transparent;border:1.5px solid var(--border);border-radius:var(--r);padding:.4rem 1rem;font-size:.82rem;color:var(--mid);cursor:pointer;}
    .preview-link{display:inline-flex;align-items:center;gap:.4rem;font-size:.82rem;color:var(--gold);text-decoration:none;border:1px solid var(--gold);border-radius:var(--r);padding:.35rem .8rem;margin-right:.6rem;}
    .preview-link:hover{background:var(--gold);color:#fff;}
    /* tabs */
    .tabs{display:flex;border-bottom:2px solid var(--border);margin-bottom:2rem;gap:.25rem;}
    .tab{padding:.6rem 1.4rem;font-size:.88rem;font-weight:600;cursor:pointer;background:none;border:none;border-bottom:2.5px solid transparent;color:var(--mid);margin-bottom:-2px;}
    .tab.active{border-bottom-color:var(--green);color:var(--green);}
    /* gruppe */
    .gruppe-head{font-size:.72rem;font-weight:800;text-transform:uppercase;letter-spacing:.12em;color:var(--green);margin:2.2rem 0 .8rem;padding-bottom:.4rem;border-bottom:2px solid var(--green);display:flex;align-items:center;gap:.5rem;}
    /* foto-grid */
    .foto-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:1rem;margin-bottom:.75rem;}
    .foto-card{background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:1.1rem;display:flex;flex-direction:column;gap:.7rem;}
    .foto-card-label{font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.09em;color:var(--green);}
    .foto-card-hinweis{font-size:.72rem;color:var(--mid);}
    .foto-preview{width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:4px;display:block;}
    .foto-placeholder{width:100%;aspect-ratio:16/9;background:var(--ground);border:2px dashed var(--border);border-radius:4px;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:.4rem;color:var(--mid);font-size:.78rem;}
    .foto-placeholder span:first-child{font-size:2rem;opacity:.35;}
    .foto-actions{display:flex;align-items:center;gap:.5rem;flex-wrap:wrap;}
    .btn-upload{background:var(--green);color:#fff;border:none;padding:.4rem .9rem;border-radius:var(--r);font-size:.8rem;font-weight:600;cursor:pointer;}
    .btn-upload:disabled{opacity:.5;cursor:not-allowed;}
    .btn-picker{background:transparent;border:1.5px solid var(--green);color:var(--green);padding:.4rem .9rem;border-radius:var(--r);font-size:.8rem;font-weight:600;cursor:pointer;}
    .btn-picker:hover{background:var(--green);color:#fff;}
    .status-ok{color:var(--green);font-size:.78rem;}
    .status-err{color:#c0392b;font-size:.78rem;}
    /* text block */
    .text-block{background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:1.1rem 1.4rem;margin-bottom:.75rem;}
    .text-block-label{font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.09em;color:var(--green);margin-bottom:.2rem;}
    .text-block-hinweis{font-size:.72rem;color:var(--mid);margin-bottom:.6rem;}
    .text-block textarea{width:100%;border:1.5px solid var(--border);border-radius:var(--r);padding:.6rem .75rem;font-size:.93rem;font-family:var(--sans);background:var(--ground);color:var(--ink);outline:none;resize:vertical;min-height:72px;line-height:1.6;}
    .text-block textarea:focus{border-color:var(--green);}
    .text-block input[type=text]{width:100%;border:1.5px solid var(--border);border-radius:var(--r);padding:.55rem .75rem;font-size:.93rem;font-family:var(--sans);background:var(--ground);color:var(--ink);outline:none;}
    .text-block input[type=text]:focus{border-color:var(--green);}
    .text-block-footer{display:flex;align-items:center;justify-content:flex-end;gap:.7rem;margin-top:.55rem;flex-wrap:wrap;}
    .text-block-meta{font-size:.7rem;color:var(--mid);margin-right:auto;}
    .btn-save{background:var(--green);color:#fff;border:none;padding:.38rem 1rem;border-radius:var(--r);font-size:.82rem;font-weight:600;cursor:pointer;}
    /* photo picker modal */
    .picker-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:100;display:flex;align-items:center;justify-content:center;padding:1rem;}
    .picker-modal{background:var(--surface);border-radius:10px;width:100%;max-width:720px;max-height:85vh;display:flex;flex-direction:column;box-shadow:0 8px 40px rgba(0,0,0,.35);}
    .picker-head{display:flex;align-items:center;justify-content:space-between;padding:1rem 1.4rem;border-bottom:1px solid var(--border);}
    .picker-head h3{font-family:var(--serif);font-size:1.15rem;font-weight:normal;}
    .picker-close{background:none;border:none;font-size:1.4rem;cursor:pointer;color:var(--mid);line-height:1;}
    .picker-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:.75rem;padding:1.2rem 1.4rem;overflow-y:auto;}
    .picker-item{cursor:pointer;border-radius:6px;overflow:hidden;border:2.5px solid transparent;transition:border-color .15s;}
    .picker-item:hover{border-color:var(--green);}
    .picker-item img{width:100%;aspect-ratio:4/3;object-fit:cover;display:block;}
    .picker-item-name{font-size:.65rem;padding:.25rem .4rem;color:var(--mid);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;background:var(--surface);}
    .picker-empty{padding:2rem;color:var(--mid);font-size:.88rem;text-align:center;}
    @media(max-width:600px){.body{padding:2rem 1rem 4rem;}.foto-grid{grid-template-columns:1fr;}.tabs{gap:0;}.tab{padding:.55rem .9rem;font-size:.82rem;}}
  `;

  /* ── Website-Felder: alle aus WEBSITE_BEZEICHNUNGEN anzeigen, auch wenn noch nicht in DB ── */
  const websiteAusDB = felder.filter(f => !f.schluessel.startsWith('flyer_') && !f.schluessel.startsWith('handout_'));
  const dbMap = Object.fromEntries(websiteAusDB.map(f => [f.schluessel, f]));
  const sortedWebsite: Inhaltsfeld[] = WEBSITE_REIHENFOLGE.map(k => dbMap[k] ?? { schluessel: k, wert: '', bezeichnung: k });

  const pickerBilder = pilotenDateien.filter(d => d.url && /\.(jpg|jpeg|png|webp|gif)/i.test(d.name));

  return (
    <>
      <style>{css}</style>
      <nav className="nav">
        <a href="/">← Zur Website</a>
        <span className="sep">·</span>
        <span style={{color:'rgba(255,255,255,.6)',fontSize:'.88rem'}}>Bearbeiten</span>
      </nav>

      <div className="body">
        <h1>Inhalte bearbeiten</h1>
        <p className="lead">{eingeloggt && !istAdminUser ? 'Änderungen werden als Entwurf eingereicht — ein Admin gibt sie frei.' : 'Website-Texte und Flyer gemeinsam pflegen — Änderungen sind sofort sichtbar.'}</p>

        {!eingeloggt && (
          <div className="login-box">
            <h2>Anmelden</h2>
            <form onSubmit={anmelden}>
              <div className="field">
                <label>Dein Name</label>
                {piloten.length > 0
                  ? <select value={pilot} onChange={e => setPilot(e.target.value)}>
                      <option value="">— Name wählen —</option>
                      {piloten.map(p => <option key={p.name} value={p.name}>{p.name}{p.rolle === 'gfo' ? ' (GFO)' : ''}</option>)}
                    </select>
                  : <input type="text" value={pilot} onChange={e => setPilot(e.target.value)} placeholder="Deinen Namen eingeben"/>
                }
              </div>
              <div className="field">
                <label>Passwort</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Dein Passwort"/>
              </div>
              {fehler && <div className="err-msg">{fehler}</div>}
              <button type="submit" className="btn-primary" disabled={laden} style={{marginTop:'1rem'}}>{laden ? '…' : 'Anmelden'}</button>
            </form>
          </div>
        )}

        {eingeloggt && (
          <>
            <div className="editor-header">
              <h2>Eingeloggt als {pilot}</h2>
              <button className="btn-ghost" onClick={abmelden}>Abmelden</button>
            </div>

            <div style={{marginBottom:'1.5rem'}}>
              <a href="/" target="_blank" className="preview-link">↗ Website öffnen</a>
              <a href="/flyer" target="_blank" className="preview-link">↗ Flyer öffnen</a>
              <a href="/handout" target="_blank" className="preview-link">↗ Handout öffnen</a>
            </div>

            {/* Tabs */}
            <div className="tabs">
              <button className={`tab${tab==='website'?' active':''}`} onClick={() => setTab('website')}>🌐 Website-Texte</button>
              <button className={`tab${tab==='flyer'?' active':''}`} onClick={() => setTab('flyer')}>📄 Flyer</button>
              <button className={`tab${tab==='handout'?' active':''}`} onClick={() => setTab('handout')}>📋 Handout</button>
              <button className={`tab${tab==='banner'?' active':''}`} onClick={() => { setTab('banner'); ladeBanner(); }}>📢 Banner</button>
              {istAdminUser && <button className={`tab${tab==='entwuerfe'?' active':''}`} onClick={() => { setTab('entwuerfe'); ladeEntwuerfe(); }}>📋 Entwürfe{entwuerfe.length > 0 ? ` (${entwuerfe.length})` : ''}</button>}
              {istAdminUser && <button className={`tab${tab==='verlauf'?' active':''}`} onClick={() => setTab('verlauf')}>🕐 Verlauf</button>}
            </div>

            {/* ── Tab: Website ── */}
            {tab === 'website' && (
              <>
                {sortedWebsite.length === 0 && <p style={{color:'var(--mid)'}}>Wird geladen …</p>}
                {sortedWebsite.map(f => {
                  const bezeichnung = WEBSITE_BEZEICHNUNGEN[f.schluessel] || f.bezeichnung || f.schluessel;
                  const meta = f.geaendert_von
                    ? `Zuletzt von ${f.geaendert_von} am ${new Date(f.geaendert_am!).toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})}`
                    : '';
                  const st = speicherStatus[f.schluessel] || '';
                  return (
                    <div key={f.schluessel} className="text-block">
                      <div className="text-block-label">{bezeichnung}</div>
                      <textarea
                        id={`ta-${f.schluessel}`}
                        defaultValue={f.wert}
                        rows={3}
                        onKeyDown={e => { if ((e.ctrlKey||e.metaKey)&&e.key==='s'){e.preventDefault();speichern(f.schluessel,(e.target as HTMLTextAreaElement).value);}}}
                      />
                      <div className="text-block-footer">
                        <span className="text-block-meta">{meta}</span>
                        {st==='ok' && <span className="status-ok">{istAdminUser ? 'Gespeichert ✓' : 'Entwurf eingereicht ✓'}</span>}
                        {st==='err' && <span className="status-err">Fehler</span>}
                        <button className="btn-save" onClick={() => {
                          const ta = document.getElementById(`ta-${f.schluessel}`) as HTMLTextAreaElement;
                          speichern(f.schluessel, ta.value);
                        }}>{istAdminUser ? 'Speichern' : 'Entwurf einreichen'}</button>
                      </div>
                    </div>
                  );
                })}
              </>
            )}

            {/* ── Tab: Handout ── */}
            {tab === 'handout' && (
              <div style={{display:'flex',justifyContent:'flex-end',gap:'.75rem',marginBottom:'1rem'}}>
                <button className="btn-ghost" style={{fontSize:'.95rem',padding:'.55rem 1.2rem'}} onClick={() => window.history.back()}>← Zurück</button>
                <button className="btn-save" disabled={sammelStatus==='saving'} style={{fontSize:'.95rem',padding:'.55rem 1.6rem',minWidth:'260px'}} onClick={async () => {
                  setSammelStatus('saving');
                  const felder = HANDOUT_GRUPPEN.flatMap(g => g.texte ?? []);
                  try {
                    await Promise.all(felder.map(({ schluessel }) => {
                      const el = document.getElementById(`ta-${schluessel}`) as HTMLInputElement | HTMLTextAreaElement | null;
                      return el ? speichern(schluessel, el.value) : Promise.resolve();
                    }));
                    setSammelStatus('ok');
                    setTimeout(() => setSammelStatus(''), 3000);
                  } catch {
                    setSammelStatus('err');
                    setTimeout(() => setSammelStatus(''), 3000);
                  }
                }}>
                  {sammelStatus === 'saving' ? '⏳ Wird gespeichert …' : sammelStatus === 'ok' ? '✓ Alle gespeichert' : sammelStatus === 'err' ? '✗ Fehler' : '💾 Alle Handout-Felder speichern'}
                </button>
              </div>
            )}
            {tab === 'handout' && HANDOUT_GRUPPEN.map(g => (
              <div key={g.titel}>
                <div className="gruppe-head">{g.emoji} {g.titel}</div>
                {g.fotos && g.fotos.length > 0 && (
                  <div className="foto-grid">
                    {g.fotos.map(({ schluessel, emoji, label, hinweis }) => {
                      const url = feldWert(schluessel);
                      const st  = uploadStatus[schluessel] || '';
                      const sp  = speicherStatus[schluessel] || '';
                      return (
                        <div key={schluessel} className="foto-card">
                          <div className="foto-card-label">{emoji} {label}</div>
                          <div className="foto-card-hinweis">{hinweis}</div>
                          {url ? <img src={url} alt={label} className="foto-preview"/> : <div className="foto-placeholder"><span>📷</span><span>Noch kein Foto</span></div>}
                          <div className="foto-actions">
                            <button className="btn-upload" disabled={st==='uploading'} onClick={() => fileRefs.current[schluessel]?.click()}>{st==='uploading'?'Lädt …':'Hochladen'}</button>
                            <button className="btn-picker" onClick={() => setPickerFeld(schluessel)}>Aus Piloten-Bereich</button>
                            <input type="file" accept="image/*" style={{display:'none'}} ref={el => { fileRefs.current[schluessel] = el; }} onChange={e => { const f = e.target.files?.[0]; if (f) fotoHochladen(schluessel, f); e.target.value=''; }}/>
                          </div>
                          {(st==='ok'||sp==='ok') && <span className="status-ok">Gespeichert ✓</span>}
                          {(st==='err'||sp==='err') && <span className="status-err">Fehler</span>}
                        </div>
                      );
                    })}
                  </div>
                )}
                {g.texte && g.texte.map(({ schluessel, label, hinweis, lang }) => {
                  const wert = feldWert(schluessel);
                  const st   = speicherStatus[schluessel] || '';
                  return (
                    <div key={schluessel} className="text-block">
                      <div className="text-block-label">{label}</div>
                      <div className="text-block-hinweis">{hinweis}</div>
                      {lang
                        ? <textarea id={`ta-${schluessel}`} defaultValue={wert} rows={3} onKeyDown={e => { if ((e.ctrlKey||e.metaKey)&&e.key==='s'){e.preventDefault();speichern(schluessel,(e.target as HTMLTextAreaElement).value);}}}/>
                        : <input type="text" id={`ta-${schluessel}`} defaultValue={wert} onKeyDown={e => { if ((e.ctrlKey||e.metaKey)&&e.key==='s'){e.preventDefault();speichern(schluessel,(e.target as HTMLInputElement).value);}}}/>
                      }
                      <div className="text-block-footer">
                        {st==='ok' && <span className="status-ok">Gespeichert ✓</span>}
                        {st==='err' && <span className="status-err">Fehler</span>}
                        <button className="btn-save" onClick={() => { const el = document.getElementById(`ta-${schluessel}`) as HTMLInputElement; speichern(schluessel, el.value); }}>Speichern</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}

            {/* ── Tab: Banner ── */}
            {tab === 'banner' && (
              <div style={{maxWidth:560}}>
                <div className="gruppe-head">📢 Banner-Texte</div>
                <p style={{fontSize:'.82rem',color:'var(--mid)',marginBottom:'1.25rem',lineHeight:1.6}}>
                  Bis zu 5 Texte rotieren im Banner oben auf der Website alle 5 Sekunden. Leere Felder werden ignoriert.
                </p>
                {bannerTexte.map((t, i) => (
                  <div key={i} style={{display:'flex',gap:'.5rem',marginBottom:'.6rem',alignItems:'center'}}>
                    <input
                      type="text"
                      value={t}
                      onChange={e => setBannerTexte(bt => bt.map((x, j) => j === i ? e.target.value : x))}
                      placeholder={`Banner-Text ${i + 1}`}
                      style={{flex:1,border:'1.5px solid var(--border)',borderRadius:'var(--r)',padding:'.55rem .75rem',fontSize:'.93rem',fontFamily:'var(--sans)',background:'var(--ground)',color:'var(--ink)',outline:'none'}}
                    />
                    <button onClick={() => setBannerTexte(bt => bt.filter((_, j) => j !== i))}
                      style={{background:'#FEE2E2',color:'#991b1b',border:'none',borderRadius:'var(--r)',padding:'.4rem .65rem',cursor:'pointer',fontWeight:700,fontSize:'.9rem'}}>✕</button>
                  </div>
                ))}
                {bannerTexte.length < 5 && (
                  <button onClick={() => setBannerTexte(bt => [...bt, ''])}
                    style={{background:'var(--surface)',border:'1.5px dashed var(--border)',borderRadius:'var(--r)',padding:'.45rem 1rem',fontSize:'.82rem',cursor:'pointer',color:'var(--mid)',width:'100%',marginBottom:'1rem'}}>
                    + Weiteren Text hinzufügen
                  </button>
                )}
                <div style={{display:'flex',justifyContent:'flex-end',marginTop:'1rem'}}>
                  <button className="btn-save" disabled={bannerSaving} onClick={bannerSpeichern} style={{fontSize:'.95rem',padding:'.5rem 1.6rem'}}>
                    {bannerSaving ? '⏳ Speichern…' : '💾 Banner speichern'}
                  </button>
                </div>
              </div>
            )}

            {/* ── Tab: Entwürfe (Admin) ── */}
            {tab === 'entwuerfe' && istAdminUser && (
              <div style={{maxWidth:700}}>
                <div className="gruppe-head">📋 Offene Entwürfe</div>
                {entwurfLaden && <p style={{color:'var(--mid)',fontSize:'.88rem'}}>Wird geladen …</p>}
                {!entwurfLaden && entwuerfe.length === 0 && <p style={{color:'var(--mid)',fontSize:'.88rem',padding:'1.5rem 0'}}>Keine offenen Entwürfe — alles freigegeben.</p>}
                {entwuerfe.map(e => {
                  const akt = entwurfAktion[e.id];
                  const bez = WEBSITE_BEZEICHNUNGEN[e.schluessel] || e.schluessel;
                  return (
                    <div key={e.id} className="text-block" style={{marginBottom:'1rem'}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:'.5rem',marginBottom:'.5rem'}}>
                        <div>
                          <div className="text-block-label">{bez}</div>
                          <div style={{fontSize:'.72rem',color:'var(--mid)'}}>von {e.eingereicht_von} · {new Date(e.eingereicht_am).toLocaleString('de-DE',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})}</div>
                        </div>
                        <div style={{display:'flex',gap:'.5rem'}}>
                          <button disabled={akt==='loading'} onClick={() => entwurfBearbeiten(e.id,'freigeben')}
                            style={{background:'#15803d',color:'#fff',border:'none',borderRadius:'var(--r)',padding:'.35rem .9rem',fontSize:'.8rem',fontWeight:700,cursor:'pointer'}}>
                            {akt==='loading' ? '…' : '✓ Freigeben'}
                          </button>
                          <button disabled={akt==='loading'} onClick={() => entwurfBearbeiten(e.id,'ablehnen')}
                            style={{background:'#FEE2E2',color:'#991b1b',border:'none',borderRadius:'var(--r)',padding:'.35rem .9rem',fontSize:'.8rem',fontWeight:700,cursor:'pointer'}}>
                            ✕ Ablehnen
                          </button>
                        </div>
                      </div>
                      <div style={{background:'var(--ground)',borderRadius:'var(--r)',padding:'.6rem .8rem',fontSize:'.88rem',lineHeight:1.6,border:'1px solid var(--border)',whiteSpace:'pre-wrap'}}>
                        {e.wert || <span style={{color:'var(--mid)',fontStyle:'italic'}}>(leer)</span>}
                      </div>
                      {/* Aktueller Wert zum Vergleich */}
                      {felder.find(f => f.schluessel === e.schluessel) && (
                        <div style={{fontSize:'.72rem',color:'var(--mid)',marginTop:'.4rem'}}>
                          Aktuell live: <em>{felder.find(f => f.schluessel === e.schluessel)?.wert || '(leer)'}</em>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Tab: Verlauf / Rollback (Admin) ── */}
            {tab === 'verlauf' && istAdminUser && (
              <div style={{maxWidth:700}}>
                <div className="gruppe-head">🕐 Versionsverlauf & Rollback</div>
                <div className="field" style={{marginBottom:'1.25rem'}}>
                  <label>Feld auswählen</label>
                  <select value={verlaufSchluessel} onChange={e => { if (e.target.value) ladeVerlauf(e.target.value); else setVerlaufSchluessel(''); }}
                    style={{border:'1.5px solid var(--border)',borderRadius:'var(--r)',padding:'.6rem .8rem',fontSize:'.88rem',background:'var(--ground)',color:'var(--ink)',outline:'none',width:'100%'}}>
                    <option value="">— Feld wählen —</option>
                    {WEBSITE_REIHENFOLGE.map(k => <option key={k} value={k}>{WEBSITE_BEZEICHNUNGEN[k] || k}</option>)}
                  </select>
                </div>
                {verlaufLaden && <p style={{color:'var(--mid)',fontSize:'.88rem'}}>Wird geladen …</p>}
                {!verlaufLaden && verlaufSchluessel && verlaufFelder.length === 0 && <p style={{color:'var(--mid)',fontSize:'.88rem'}}>Kein Verlauf vorhanden — dieses Feld wurde noch nie zurückgesetzt oder überschrieben.</p>}
                {verlaufFelder.map(v => (
                  <div key={v.id} className="text-block" style={{marginBottom:'.75rem'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'.5rem',marginBottom:'.4rem'}}>
                      <div style={{fontSize:'.72rem',color:'var(--mid)'}}>
                        {new Date(v.geaendert_am).toLocaleString('de-DE',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})} · {v.geaendert_von}
                      </div>
                      <button onClick={() => rollback(v)} disabled={rollbackStatus[v.id]==='loading'}
                        style={{background:'var(--gold)',color:'#fff',border:'none',borderRadius:'var(--r)',padding:'.3rem .85rem',fontSize:'.78rem',fontWeight:700,cursor:'pointer'}}>
                        {rollbackStatus[v.id]==='loading' ? '…' : rollbackStatus[v.id]==='ok' ? '✓ Wiederhergestellt' : '↩ Wiederherstellen'}
                      </button>
                    </div>
                    <div style={{background:'var(--ground)',borderRadius:'var(--r)',padding:'.5rem .75rem',fontSize:'.85rem',lineHeight:1.6,border:'1px solid var(--border)',whiteSpace:'pre-wrap',maxHeight:120,overflowY:'auto'}}>
                      {v.wert || <span style={{color:'var(--mid)',fontStyle:'italic'}}>(leer)</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Tab: Flyer ── */}
            {tab === 'flyer' && FLYER_GRUPPEN.map(g => (
              <div key={g.titel}>
                <div className="gruppe-head">{g.emoji} {g.titel}</div>

                {g.fotos && g.fotos.length > 0 && (
                  <div className="foto-grid">
                    {g.fotos.map(({ schluessel, emoji, label, hinweis }) => {
                      const url = feldWert(schluessel);
                      const st  = uploadStatus[schluessel] || '';
                      const sp  = speicherStatus[schluessel] || '';
                      return (
                        <div key={schluessel} className="foto-card">
                          <div className="foto-card-label">{emoji} {label}</div>
                          <div className="foto-card-hinweis">{hinweis}</div>
                          {url
                            ? <img src={url} alt={label} className="foto-preview"/>
                            : <div className="foto-placeholder"><span>📷</span><span>Noch kein Foto</span></div>
                          }
                          <div className="foto-actions">
                            <button className="btn-upload" disabled={st==='uploading'} onClick={() => fileRefs.current[schluessel]?.click()}>
                              {st==='uploading' ? 'Lädt …' : 'Hochladen'}
                            </button>
                            <button className="btn-picker" onClick={() => setPickerFeld(schluessel)}>
                              Aus Piloten-Bereich
                            </button>
                            <input type="file" accept="image/*" style={{display:'none'}}
                              ref={el => { fileRefs.current[schluessel] = el; }}
                              onChange={e => { const f = e.target.files?.[0]; if (f) fotoHochladen(schluessel, f); e.target.value=''; }}
                            />
                          </div>
                          {(st==='ok'||sp==='ok') && <span className="status-ok">Gespeichert ✓</span>}
                          {(st==='err'||sp==='err') && <span className="status-err">Fehler</span>}
                        </div>
                      );
                    })}
                  </div>
                )}

                {g.texte && g.texte.map(({ schluessel, label, hinweis, lang }) => {
                  const wert = feldWert(schluessel);
                  const st   = speicherStatus[schluessel] || '';
                  return (
                    <div key={schluessel} className="text-block">
                      <div className="text-block-label">{label}</div>
                      <div className="text-block-hinweis">{hinweis}</div>
                      {lang
                        ? <textarea id={`ta-${schluessel}`} defaultValue={wert} rows={3}
                            onKeyDown={e => { if ((e.ctrlKey||e.metaKey)&&e.key==='s'){e.preventDefault();speichern(schluessel,(e.target as HTMLTextAreaElement).value);}}}
                          />
                        : <input type="text" id={`ta-${schluessel}`} defaultValue={wert}
                            onKeyDown={e => { if ((e.ctrlKey||e.metaKey)&&e.key==='s'){e.preventDefault();speichern(schluessel,(e.target as HTMLInputElement).value);}}}
                          />
                      }
                      <div className="text-block-footer">
                        {st==='ok' && <span className="status-ok">Gespeichert ✓</span>}
                        {st==='err' && <span className="status-err">Fehler</span>}
                        <button className="btn-save" onClick={() => {
                          const el = document.getElementById(`ta-${schluessel}`) as HTMLInputElement;
                          speichern(schluessel, el.value);
                        }}>Speichern</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </>
        )}
      </div>

      {/* ── Foto-Picker Modal ── */}
      {pickerFeld && (
        <div className="picker-backdrop" onClick={e => { if (e.target===e.currentTarget) setPickerFeld(null); }}>
          <div className="picker-modal">
            <div className="picker-head">
              <h3>Foto aus Piloten-Bereich wählen</h3>
              <button className="picker-close" onClick={() => setPickerFeld(null)}>✕</button>
            </div>
            {pickerBilder.length === 0
              ? <div className="picker-empty">Noch keine Fotos im Piloten-Bereich hochgeladen.</div>
              : <div className="picker-grid">
                  {pickerBilder.map(d => (
                    <div key={d.id} className="picker-item" onClick={() => fotoAusPickerWaehlen(pickerFeld, d.url)}>
                      <img src={d.url} alt={d.name}/>
                      <div className="picker-item-name">{d.name}</div>
                    </div>
                  ))}
                </div>
            }
          </div>
        </div>
      )}
    </>
  );
}
