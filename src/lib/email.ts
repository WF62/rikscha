import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = 'Mertener Rikschakutscher <onboarding@resend.dev>';
const TO = process.env.NOTIFY_EMAIL ?? '';

export async function sendBuchungEmail(b: {
  fahrzeug: string;
  pilot: string;
  datum: string;
  startzeit: string;
  endzeit: string;
  gaeste: string[];
  notiz?: string | null;
}) {
  if (!TO || !process.env.RESEND_API_KEY) return;
  const gaesteListe = b.gaeste?.length ? b.gaeste.filter(Boolean).join(', ') : '—';
  await resend.emails.send({
    from: FROM,
    to: TO,
    subject: `📋 Neue Buchung: ${b.datum} ${b.startzeit}–${b.endzeit}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1a1a18;">
        <div style="background:#2D6B1E;color:#fff;padding:1.2rem 1.5rem;border-radius:8px 8px 0 0;">
          <h2 style="margin:0;font-size:1.1rem;">Neue Rikscha-Buchung</h2>
        </div>
        <div style="background:#f7f5f0;padding:1.5rem;border-radius:0 0 8px 8px;border:1px solid #ddd9d0;">
          <table style="width:100%;border-collapse:collapse;font-size:0.95rem;">
            <tr><td style="padding:0.4rem 0;color:#5a5a52;width:120px;">Datum</td><td style="padding:0.4rem 0;font-weight:600;">${b.datum}</td></tr>
            <tr><td style="padding:0.4rem 0;color:#5a5a52;">Uhrzeit</td><td style="padding:0.4rem 0;font-weight:600;">${b.startzeit} – ${b.endzeit} Uhr</td></tr>
            <tr><td style="padding:0.4rem 0;color:#5a5a52;">Fahrzeug</td><td style="padding:0.4rem 0;">${b.fahrzeug || '—'}</td></tr>
            <tr><td style="padding:0.4rem 0;color:#5a5a52;">Pilot</td><td style="padding:0.4rem 0;">${b.pilot || '—'}</td></tr>
            <tr><td style="padding:0.4rem 0;color:#5a5a52;">Gäste</td><td style="padding:0.4rem 0;">${gaesteListe}</td></tr>
            ${b.notiz ? `<tr><td style="padding:0.4rem 0;color:#5a5a52;">Notiz</td><td style="padding:0.4rem 0;">${b.notiz}</td></tr>` : ''}
          </table>
          <a href="https://rikscha-kutscher.de/buchen" style="display:inline-block;margin-top:1.2rem;background:#2D6B1E;color:#fff;padding:0.6rem 1.2rem;border-radius:6px;text-decoration:none;font-weight:600;font-size:0.9rem;">Buchung ansehen</a>
        </div>
      </div>
    `,
  });
}

export async function sendKontaktEmail(k: {
  name: string;
  email: string;
  anliegen: string;
  nachricht: string;
}) {
  if (!TO || !process.env.RESEND_API_KEY) return;
  const anliegenMap: Record<string, string> = {
    fahrt: 'Fahrt anfragen',
    gruppe: 'Gruppenfahrt mit allen Rikschas',
    pilot: 'Als Pilot mitmachen',
    angehoeriger: 'Rikscha selbst steuern – Angehörige',
    frage: 'Allgemeine Frage',
  };
  await resend.emails.send({
    from: FROM,
    to: TO,
    replyTo: k.email,
    subject: `💬 Neue Kontaktanfrage: ${anliegenMap[k.anliegen] ?? k.anliegen}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1a1a18;">
        <div style="background:#2D6B1E;color:#fff;padding:1.2rem 1.5rem;border-radius:8px 8px 0 0;">
          <h2 style="margin:0;font-size:1.1rem;">Neue Kontaktanfrage</h2>
        </div>
        <div style="background:#f7f5f0;padding:1.5rem;border-radius:0 0 8px 8px;border:1px solid #ddd9d0;">
          <table style="width:100%;border-collapse:collapse;font-size:0.95rem;">
            <tr><td style="padding:0.4rem 0;color:#5a5a52;width:120px;">Name</td><td style="padding:0.4rem 0;font-weight:600;">${k.name}</td></tr>
            <tr><td style="padding:0.4rem 0;color:#5a5a52;">E-Mail</td><td style="padding:0.4rem 0;"><a href="mailto:${k.email}" style="color:#2D6B1E;">${k.email}</a></td></tr>
            <tr><td style="padding:0.4rem 0;color:#5a5a52;">Anliegen</td><td style="padding:0.4rem 0;">${anliegenMap[k.anliegen] ?? k.anliegen}</td></tr>
          </table>
          <div style="margin-top:1rem;padding:1rem;background:#fff;border-radius:6px;border:1px solid #ddd9d0;font-size:0.95rem;line-height:1.6;white-space:pre-wrap;">${k.nachricht}</div>
          <a href="mailto:${k.email}" style="display:inline-block;margin-top:1.2rem;background:#2D6B1E;color:#fff;padding:0.6rem 1.2rem;border-radius:6px;text-decoration:none;font-weight:600;font-size:0.9rem;">Antworten</a>
        </div>
      </div>
    `,
  });
}
