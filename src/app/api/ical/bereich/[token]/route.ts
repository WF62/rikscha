export const dynamic = 'force-dynamic';
import { anfrageText } from '@/lib/verschiebung';
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { ladeStammdaten } from '@/lib/stammdaten-server';
import { bereichPfad, bereichHinweise, mitUnterbereichen, type Bereich } from '@/lib/struktur';

/**
 * Kalender-Abo für einen Bereich einer Einrichtung (z. B. eine Etage) – für Outlook oder den Dienstplan.
 * Der Link enthält einen geheimen Schlüssel je Bereich und zeigt alle Rikscha-Fahrten der Fahrgäste
 * dieses Bereichs und seiner Unterbereiche – mit allem, was die Mitarbeitenden wissen müssen.
 */

/** Text für iCal maskieren */
const esc = (t: string) => t.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
/** Zeilen nach 75 Bytes umbrechen (iCal-Regel) – zeichenweise, damit Umlaute und Emojis nicht zerschnitten werden */
function falten(zeile: string): string {
  const zeilen: string[] = [];
  let aktuell = '';
  for (const z of Array.from(zeile)) {
    if (Buffer.byteLength(aktuell + z, 'utf8') > (zeilen.length ? 74 : 75)) { zeilen.push(aktuell); aktuell = ''; }
    aktuell += z;
  }
  zeilen.push(aktuell);
  return zeilen.map((t, i) => (i ? ' ' + t : t)).join('\r\n');
}
const zeit = (datum: string, uhr: string) => `${datum.replace(/-/g, '')}T${uhr.slice(0, 5).replace(':', '')}00`;
/** Minuten vom Vortag 16:00 Uhr bis zum Fahrtbeginn (Erinnerung relativ zum Start, so verlangt es iCal) */
const minutenBisVortag16Uhr = (start: string) => { const [h, m] = start.split(':').map(Number); return 24 * 60 + h * 60 + m - 16 * 60; };

const ZEITZONE = [
  'BEGIN:VTIMEZONE', 'TZID:Europe/Berlin',
  'BEGIN:DAYLIGHT', 'TZOFFSETFROM:+0100', 'TZOFFSETTO:+0200', 'TZNAME:CEST', 'DTSTART:19700329T020000', 'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU', 'END:DAYLIGHT',
  'BEGIN:STANDARD', 'TZOFFSETFROM:+0200', 'TZOFFSETTO:+0100', 'TZNAME:CET', 'DTSTART:19701025T030000', 'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU', 'END:STANDARD',
  'END:VTIMEZONE',
];

export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  const token = String(params.token ?? '').replace(/\.ics$/, '');
  const anmeldeLink = `${new URL(req.url).origin}/pflege/schnell`;
  if (!/^[a-f0-9]{32,80}$/.test(token)) return new NextResponse('Nicht gefunden', { status: 404 });
  const sb = createServiceClient();
  const { data: bereich } = await sb.from('rikscha_bereiche').select('*').eq('kalender_token', token).maybeSingle();
  if (!bereich) return new NextResponse('Nicht gefunden', { status: 404 });

  const [{ data: bereiche }, { data: org }, { data: leute }] = await Promise.all([
    sb.from('rikscha_bereiche').select('*').eq('organisation_id', bereich.organisation_id),
    sb.from('rikscha_organisationen').select('*').eq('id', bereich.organisation_id).maybeSingle(),
    sb.from('rikscha_bewohner').select('*').eq('organisation_id', bereich.organisation_id),
  ]);
  const alle = (bereiche ?? []) as Bereich[];
  const ids = mitUnterbereichen(alle, bereich.id);
  const fahrgaeste = (leute ?? []).filter((p) => p.bereich_id && ids.has(p.bereich_id));
  const fgIds = fahrgaeste.map((p) => p.id);

  // Fahrten der letzten 30 Tage bis 6 Monate voraus (auch abgesagte – damit sie im Kalender als abgesagt erscheinen)
  const von = new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);
  const bis = new Date(Date.now() + 183 * 86_400_000).toISOString().slice(0, 10);
  const { data: fahrten } = fgIds.length
    ? await sb.from('rikscha_buchungen').select('*').gte('datum', von).lte('datum', bis)
        .or(`bewohner_id.in.(${fgIds.join(',')}),bewohner2_id.in.(${fgIds.join(',')})`).order('datum')
    : { data: [] as Record<string, never>[] };
  // Gruppenfahrten: weitere Fahrzeuge derselben Gruppe gehören dazu (nur Fahrgäste dieses Bereichs werden genannt)
  const { fahrzeuge } = await ladeStammdaten(true);
  const fzName = (id: string) => fahrzeuge.find((f) => f.id === id)?.name ?? (id || 'Fahrzeug folgt');
  const gruppenIds = Array.from(new Set((fahrten ?? []).map((b) => b.gruppe_id).filter(Boolean)));
  const { data: gruppen } = gruppenIds.length ? await sb.from('rikscha_gruppen').select('id, titel').in('id', gruppenIds) : { data: [] as { id: string; titel: string }[] };

  const kontakt = org ? [org.name, org.ansprechperson, org.telefon, org.email].filter(Boolean).join(' · ') : '';
  const stempel = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const events = (fahrten ?? []).map((b) => {
    const hier = fahrgaeste.filter((p) => p.id === b.bewohner_id || p.id === b.bewohner2_id);
    const gruppe = (gruppen ?? []).find((g) => g.id === b.gruppe_id);
    const namen = hier.map((p) => p.name).join(' & ');
    const zeilen: string[] = [];
    if (gruppe) zeilen.push(`Gruppenfahrt: ${gruppe.titel}`);
    zeilen.push('Wer fährt mit:');
    for (const p of hier) {
      zeilen.push(`• ${p.name} – ${bereichPfad(alle, p.bereich_id)}${p.rollstuhl ? ' – ♿ Rollstuhl' : ''}`);
      if (p.hinweis) zeilen.push(`   Hinweis: ${p.hinweis}`);
    }
    const weitere = (b.gaeste ?? []).filter((g: string) => !hier.some((p) => p.name === g));
    if (weitere.length) zeilen.push(`• außerdem: ${weitere.join(', ')}`);
    zeilen.push('');
    zeilen.push(`Abholort: ${b.abholort ?? 'nach Absprache'}`);
    if (b.wunschfahrt) zeilen.push(`Wunschfahrt: ${b.wunschfahrt}`);
    zeilen.push(`Kutscher: ${b.pilot || 'noch offen – wird gesucht'} · Fahrzeug: ${fzName(b.fahrzeug)}`);
    if (b.notiz) zeilen.push(`Notiz: ${b.notiz}`);
    if (b.verschiebung_start) zeilen.push(`🔄 Verschiebung angefragt ${anfrageText(b)} – noch nicht bestätigt`);
    const hinweise = Array.from(new Set(hier.flatMap((p) => bereichHinweise(alle, p.bereich_id))));
    zeilen.push('');
    zeilen.push('Vorbereitung:');
    zeilen.push('☐ Am Vortag: Fahrgast an die Fahrt erinnern');
    zeilen.push('☐ Wettergerechte Kleidung, Decke, Kopfbedeckung bzw. Sonnenschutz');
    zeilen.push('☐ Vorher zur Toilette, ggf. Getränk mitgeben');
    if (hier.some((p) => p.rollstuhl)) zeilen.push('☐ Rollstuhl bzw. Gehhilfe bereitstellen');
    zeilen.push(`☐ 10 Minuten vorher am Abholort bereit: ${b.abholort ?? 'nach Absprache'}`);
    if (hinweise.length) {
      zeilen.push('');
      zeilen.push('Hinweise des Bereichs:');
      zeilen.push(...hinweise.map((h) => `• ${h}`));
    }
    if (b.storniert) zeilen.unshift('⚠ Diese Fahrt wurde ABGESAGT.', '');
    if (kontakt) { zeilen.push(''); zeilen.push(`Rückfragen: ${kontakt}`); }
    zeilen.push('', `Weitere Rikscha-Fahrt anmelden: ${anmeldeLink}?bereich=${bereich.id}`);

    const titel = `${b.storniert ? 'ABGESAGT: ' : ''}🚲 Rikscha: ${namen || 'Fahrgast'}${b.pilot ? '' : ' (Kutscher offen)'}`;
    return [
      'BEGIN:VEVENT',
      `UID:rikscha-${b.id}-${bereich.id}@kutscher.vercel.app`,
      `DTSTAMP:${stempel}`,
      `DTSTART;TZID=Europe/Berlin:${zeit(b.datum, b.startzeit)}`,
      `DTEND;TZID=Europe/Berlin:${zeit(b.datum, b.endzeit)}`,
      `SUMMARY:${esc(titel)}`,
      `LOCATION:${esc(b.abholort ?? '')}`,
      `DESCRIPTION:${esc(zeilen.join('\n'))}`,
      `STATUS:${b.storniert ? 'CANCELLED' : b.pilot ? 'CONFIRMED' : 'TENTATIVE'}`,
      // Erinnerungen für die Mitarbeitenden (nicht bei abgesagten Fahrten)
      ...(b.storniert ? [] : [
        'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${esc(`Morgen Rikscha-Fahrt: ${namen || 'Fahrgast'} erinnern`)}`,
        `TRIGGER:-PT${minutenBisVortag16Uhr(b.startzeit)}M`, 'END:VALARM',
        'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${esc(`Gleich Rikscha: ${namen || 'Fahrgast'} bereitmachen – ${b.abholort ?? ''}`)}`,
        'TRIGGER:-PT45M', 'END:VALARM',
      ]),
      'END:VEVENT',
    ].map(falten).join('\r\n');
  });

  const name = `Rikscha – ${bereichPfad(alle, bereich.id)}`;
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Mertener Rikschakutscher//Bereich//DE', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    falten(`X-WR-CALNAME:${esc(name)}`), 'X-WR-TIMEZONE:Europe/Berlin', 'REFRESH-INTERVAL;VALUE=DURATION:PT1H', 'X-PUBLISHED-TTL:PT1H',
    ...ZEITZONE, ...events, 'END:VCALENDAR',
  ].join('\r\n');
  return new NextResponse(ics, {
    headers: { 'Content-Type': 'text/calendar; charset=utf-8', 'Content-Disposition': 'inline; filename="rikscha-bereich.ics"', 'Cache-Control': 'no-store' },
  });
}
