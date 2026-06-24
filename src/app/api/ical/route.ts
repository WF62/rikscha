import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import type { Buchung } from '@/lib/supabase';
import { FAHRZEUGE } from '@/lib/constants';

function fahrzeugName(id: string) {
  return FAHRZEUGE.find((f) => f.id === id)?.name ?? id;
}

function toIcsDate(iso: string) {
  return iso.replace(/[-:]/g, '').replace(/\.\d+/, '').replace('Z', 'Z');
}

function buchungZuVEvent(b: Buchung): string {
  const start = `${b.datum.replace(/-/g, '')}T${b.startzeit.replace(/:/g, '')}00`;
  const end = `${b.datum.replace(/-/g, '')}T${b.endzeit.replace(/:/g, '')}00`;
  const dtstamp = toIcsDate(b.erstellt_am);
  const gaeste = b.gaeste.length > 0 ? ` Gaeste: ${b.gaeste.join(', ')}` : '';
  const status = b.storniert ? '[STORNIERT] ' : '';
  return [
    'BEGIN:VEVENT',
    `UID:rikscha-${b.id}@rikscha.vercel.app`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART;TZID=Europe/Berlin:${start}`,
    `DTEND;TZID=Europe/Berlin:${end}`,
    `SUMMARY:${status}${fahrzeugName(b.fahrzeug)} - ${b.pilot}${gaeste}`,
    `DESCRIPTION:Pilot: ${b.pilot}${gaeste}${b.notiz ? '\\n' + b.notiz : ''}`,
    `STATUS:${b.storniert ? 'CANCELLED' : 'CONFIRMED'}`,
    'END:VEVENT',
  ].join('\r\n');
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const pilotFilter = searchParams.get('pilot');
  const fahrzeugFilter = searchParams.get('fahrzeug');

  const sb = createServiceClient();
  let q = sb.from('rikscha_buchungen').select('*').order('datum').order('startzeit');
  if (pilotFilter) q = q.eq('pilot', pilotFilter);
  if (fahrzeugFilter) q = q.eq('fahrzeug', fahrzeugFilter);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const buchungen: Buchung[] = data ?? [];
  let calName = 'Rikscha-Team Fahrten';
  if (pilotFilter) calName = `Rikscha - ${pilotFilter}`;
  if (fahrzeugFilter) calName = `Rikscha - ${fahrzeugName(fahrzeugFilter)}`;

  const cal = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Rikscha-Team//Fahrtenkalender//DE',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${calName}`,
    'X-WR-TIMEZONE:Europe/Berlin',
    'BEGIN:VTIMEZONE',
    'TZID:Europe/Berlin',
    'BEGIN:STANDARD',
    'DTSTART:19701025T030000',
    'RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=10',
    'TZOFFSETFROM:+0200',
    'TZOFFSETTO:+0100',
    'TZNAME:CET',
    'END:STANDARD',
    'BEGIN:DAYLIGHT',
    'DTSTART:19700329T020000',
    'RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=3',
    'TZOFFSETFROM:+0100',
    'TZOFFSETTO:+0200',
    'TZNAME:CEST',
    'END:DAYLIGHT',
    'END:VTIMEZONE',
    ...buchungen.map(buchungZuVEvent),
    'END:VCALENDAR',
  ].join('\r\n');

  return new NextResponse(cal, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="rikscha.ics"',
      'Cache-Control': 'no-cache',
    },
  });
}
