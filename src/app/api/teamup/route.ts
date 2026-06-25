import { NextRequest, NextResponse } from 'next/server';

export type TeamUpEvent = {
  uid: string;
  summary: string;
  start: string;
  end: string;
  allDay: boolean;
  description?: string;
  categories?: string;
};

function parseIcalDate(val: string): { date: string; time: string; allDay: boolean } {
  // DATE-only: 20260624
  if (/^\d{8}$/.test(val)) {
    const d = val;
    return {
      date: `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`,
      time: '00:00',
      allDay: true,
    };
  }
  // DATETIME: 20260624T140000 or 20260624T140000Z
  const m = val.match(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})/);
  if (m) {
    return {
      date: `${m[1]}-${m[2]}-${m[3]}`,
      time: `${m[4]}:${m[5]}`,
      allDay: false,
    };
  }
  return { date: val, time: '00:00', allDay: false };
}

function parseIcal(text: string): TeamUpEvent[] {
  const events: TeamUpEvent[] = [];
  const lines = text.replace(/\r\n /g, '').replace(/\r\n\t/g, '').split(/\r\n|\n/);

  let inEvent = false;
  let current: Partial<TeamUpEvent> & { startRaw?: string; endRaw?: string } = {};

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') {
      inEvent = true;
      current = {};
      continue;
    }
    if (line === 'END:VEVENT') {
      inEvent = false;
      if (current.uid && current.startRaw) {
        const s = parseIcalDate(current.startRaw);
        const e = current.endRaw ? parseIcalDate(current.endRaw) : s;
        events.push({
          uid: current.uid,
          summary: current.summary ?? '(kein Titel)',
          start: `${s.date}T${s.time}`,
          end: `${e.date}T${e.time}`,
          allDay: s.allDay,
          description: current.description,
          categories: current.categories,
        });
      }
      continue;
    }
    if (!inEvent) continue;

    const colon = line.indexOf(':');
    if (colon < 0) continue;
    const key = line.slice(0, colon).split(';')[0].toUpperCase();
    const val = line.slice(colon + 1).trim();

    if (key === 'UID') current.uid = val;
    else if (key === 'SUMMARY') current.summary = val;
    else if (key === 'DTSTART') current.startRaw = val;
    else if (key === 'DTEND') current.endRaw = val;
    else if (key === 'DESCRIPTION') current.description = val.replace(/\\n/g, ' ').replace(/\\,/g, ',');
    else if (key === 'CATEGORIES') current.categories = val;
  }
  return events;
}

export async function GET(req: NextRequest) {
  const url = process.env.TEAMUP_ICAL_URL;
  if (!url) {
    return NextResponse.json({ error: 'TEAMUP_ICAL_URL not configured' }, { status: 503 });
  }

  const { searchParams } = new URL(req.url);
  const von = searchParams.get('von');
  const bis = searchParams.get('bis');

  try {
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) throw new Error(`TeamUp returned ${res.status}`);
    const text = await res.text();
    let events = parseIcal(text);

    if (von) events = events.filter((e) => e.start.slice(0, 10) >= von);
    if (bis) events = events.filter((e) => e.start.slice(0, 10) <= bis);

    return NextResponse.json(events);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
