export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sendKontaktEmail } from '@/lib/email';
import { formularPruefen, begrenzen, ZU_VIELE, NEU_LADEN } from '@/lib/spamschutz';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const pruefung = formularPruefen(body);
  if (pruefung === 'bot') return NextResponse.json({ ok: true }); // still verwerfen
  if (pruefung === 'neu-laden') return NextResponse.json({ error: NEU_LADEN }, { status: 400 });

  const name = String(body.name ?? '').trim();
  const email = String(body.email ?? '').trim();
  const anliegen = String(body.anliegen ?? '').slice(0, 40);
  const nachricht = String(body.nachricht ?? '').trim();
  if (!name || !email || !nachricht) {
    return NextResponse.json({ error: 'Pflichtfelder fehlen.' }, { status: 400 });
  }
  if (name.length > 100 || email.length > 200 || nachricht.length > 5000 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Bitte prüfe Name, E-Mail und Länge der Nachricht.' }, { status: 400 });
  }
  // Viele Links sind typisch für Spam
  if ((nachricht.match(/https?:\/\//gi) ?? []).length > 3) {
    return NextResponse.json({ error: 'Bitte höchstens 3 Links in die Nachricht schreiben.' }, { status: 400 });
  }
  if (!(await begrenzen(req, 'kontakt', [{ max: 3, minuten: 60 }, { max: 10, minuten: 1440 }]))) {
    return NextResponse.json({ error: ZU_VIELE }, { status: 429 });
  }
  try {
    await sendKontaktEmail({ name, email, anliegen, nachricht });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'E-Mail konnte nicht gesendet werden.' }, { status: 500 });
  }
}
