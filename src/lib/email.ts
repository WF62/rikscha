import { Resend } from 'resend';

const FROM = 'Mertener Rikschakutscher <onboarding@resend.dev>';

// Signal-Benachrichtigung via CallMeBot (kostenlos).
//
// Einmalige Einrichtung für Rolf (Einzelnachricht):
//   Signal-Nachricht an +34 609 97 67 42 schicken: "I allow callmebot to send me messages"
//   → API-Key kommt zurück. SCHADEN_SIGNAL_PHONE + SCHADEN_SIGNAL_APIKEY in Vercel eintragen.
//
// Für Gruppen-Nachrichten zusätzlich SIGNAL_GROUP_ID in Vercel:
//   Gruppen-ID einmalig auslesen: Rolf öffnet signal-cli oder fragt CallMeBot-Support.
//   Alternativ: im Admin-Bereich unter /api/signal/gruppen-id abrufbar (nach Einrichtung).
//
// WhatsApp als Fallback (falls Signal nicht eingerichtet):
//   SCHADEN_WHATSAPP_PHONE + SCHADEN_WHATSAPP_APIKEY in Vercel eintragen.

async function callMeBotSignal(phone: string, apiKey: string, text: string, groupId?: string) {
  const url = new URL('https://api.callmebot.com/signal/send.php');
  url.searchParams.set('phone', phone);
  url.searchParams.set('text', text);
  url.searchParams.set('apikey', apiKey);
  if (groupId) url.searchParams.set('group', groupId);
  await fetch(url.toString()).catch(() => {});
}


// Schaden-Benachrichtigung an Rolf (+ Admin) per Signal
export async function sendSchadenSignal(e: {
  kutscher: string; fahrzeug: string; datum: string; beschreibung: string;
}) {
  const text = `⚠️ Schaden/Wartung gemeldet\nFahrzeug: ${e.fahrzeug}\nDatum: ${e.datum}\nKutscher: ${e.kutscher}\n\n${e.beschreibung}`;
  const empfaenger = [
    { phone: process.env.SCHADEN_SIGNAL_PHONE ?? '', apiKey: process.env.SCHADEN_SIGNAL_APIKEY ?? '' },
    { phone: process.env.ADMIN_SIGNAL_PHONE ?? '', apiKey: process.env.ADMIN_SIGNAL_APIKEY ?? '' },
  ].filter(e => e.phone && e.apiKey);
  await Promise.all(empfaenger.map(e => callMeBotSignal(e.phone, e.apiKey, text)));
}

// Ausfall-Benachrichtigung an Signal-Gruppe (alle Kutscher auf einmal)
export async function sendAusfallSignalGruppe(e: {
  fahrzeug: string; beschreibung: string; gesperrt_ab?: string; gesperrt_bis?: string;
}) {
  const phone = process.env.SCHADEN_SIGNAL_PHONE ?? '';
  const apiKey = process.env.SCHADEN_SIGNAL_APIKEY ?? '';
  const groupId = process.env.SIGNAL_GROUP_ID ?? '';
  if (!phone || !apiKey) return;
  const zeitraum = e.gesperrt_ab
    ? `${e.gesperrt_ab}${e.gesperrt_bis ? ` bis ${e.gesperrt_bis}` : ''}`
    : 'Dauer unklar';
  const text = `🚫 Fahrzeugausfall: ${e.fahrzeug} (${zeitraum})\n\n${e.beschreibung}\n\nBitte Fahrten entsprechend planen.`;
  await callMeBotSignal(phone, apiKey, text, groupId || undefined);
}

export async function sendSchadenEmail(e: {
  kutscher: string; fahrzeug: string; datum: string;
  beschreibung: string; bemerkungen?: string; ausfallToken?: string;
}) {
  const resend = getResend();
  const empfaenger = [
    process.env.SCHADEN_EMAIL ?? process.env.NOTIFY_EMAIL ?? '',
    process.env.ADMIN_EMAIL ?? '',
  ].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i);
  if (!resend || !empfaenger.length) return;
  const to = empfaenger;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://rikscha-kutscher.de';
  const bestaetigenUrl = e.ausfallToken ? `${baseUrl}/api/fahrzeugausfall/bestaetigen?token=${e.ausfallToken}` : null;
  await resend.emails.send({
    from: FROM,
    to,
    subject: `⚠️ Schaden/Wartung gemeldet: ${e.fahrzeug} am ${e.datum}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1a1a18;">
        <div style="background:#B45309;color:#fff;padding:1.2rem 1.5rem;border-radius:8px 8px 0 0;">
          <h2 style="margin:0;font-size:1.1rem;">⚠️ Schaden / Wartungsbedarf gemeldet</h2>
        </div>
        <div style="background:#f7f5f0;padding:1.5rem;border-radius:0 0 8px 8px;border:1px solid #ddd9d0;">
          <table style="width:100%;border-collapse:collapse;font-size:0.95rem;">
            <tr><td style="padding:0.4rem 0;color:#5a5a52;width:120px;">Fahrzeug</td><td style="padding:0.4rem 0;font-weight:600;">${e.fahrzeug}</td></tr>
            <tr><td style="padding:0.4rem 0;color:#5a5a52;">Datum</td><td style="padding:0.4rem 0;">${e.datum}</td></tr>
            <tr><td style="padding:0.4rem 0;color:#5a5a52;">Kutscher</td><td style="padding:0.4rem 0;">${e.kutscher}</td></tr>
          </table>
          <div style="margin-top:1rem;padding:1rem;background:#FEF3C7;border:1px solid #F59E0B;border-radius:6px;font-size:0.95rem;line-height:1.6;white-space:pre-wrap;"><strong>Beschreibung:</strong><br>${e.beschreibung}</div>
          ${e.bemerkungen ? `<div style="margin-top:0.75rem;padding:1rem;background:#fff;border-radius:6px;border:1px solid #ddd9d0;font-size:0.9rem;line-height:1.6;"><strong>Bemerkungen:</strong><br>${e.bemerkungen}</div>` : ''}
          ${bestaetigenUrl ? `
          <div style="margin-top:1.5rem;padding:1rem;background:#FEE2E2;border:1px solid #FCA5A5;border-radius:6px;">
            <p style="margin:0 0 0.75rem;font-size:0.95rem;font-weight:600;color:#991B1B;">Fahrzeug ausgefallen?</p>
            <p style="margin:0 0 1rem;font-size:0.88rem;color:#5a5a52;">Falls das Fahrzeug nicht einsatzbereit ist, bestätige den Ausfall. Alle Kutscher und betroffene Termine werden automatisch informiert.</p>
            <a href="${bestaetigenUrl}" style="display:inline-block;background:#991B1B;color:#fff;padding:0.65rem 1.3rem;border-radius:6px;text-decoration:none;font-weight:700;font-size:0.95rem;">🚫 Fahrzeugausfall bestätigen</a>
          </div>` : ''}
        </div>
      </div>
    `,
  });
}

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

// Sendet Ausfall-Bestätigung an alle Kutscher mit E-Mail
export async function sendAusfallKutscherEmail(e: {
  fahrzeug: string; beschreibung: string; gesperrt_ab?: string; gesperrt_bis?: string;
  kutscher: Array<{ name: string; email: string }>;
}) {
  const resend = getResend();
  if (!resend || !e.kutscher.length) return;
  const zeitraum = e.gesperrt_ab
    ? `${e.gesperrt_ab}${e.gesperrt_bis ? ` bis ${e.gesperrt_bis}` : ' (Dauer unbekannt)'}`
    : 'Dauer noch unklar';
  await Promise.all(e.kutscher.map(k =>
    resend.emails.send({
      from: FROM,
      to: k.email,
      subject: `🚫 Fahrzeug ${e.fahrzeug} ausgefallen`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1a1a18;">
          <div style="background:#991B1B;color:#fff;padding:1.2rem 1.5rem;border-radius:8px 8px 0 0;">
            <h2 style="margin:0;font-size:1.1rem;">🚫 Fahrzeugausfall: ${e.fahrzeug}</h2>
          </div>
          <div style="background:#f7f5f0;padding:1.5rem;border-radius:0 0 8px 8px;border:1px solid #ddd9d0;">
            <p>Hallo ${k.name},</p>
            <p><strong>${e.fahrzeug}</strong> ist vorübergehend ausgefallen (${zeitraum}).</p>
            <div style="margin:1rem 0;padding:1rem;background:#FEE2E2;border:1px solid #FCA5A5;border-radius:6px;font-size:0.95rem;line-height:1.6;">
              <strong>Grund:</strong><br>${e.beschreibung}
            </div>
            <p style="font-size:0.9rem;color:#5a5a52;">Bitte plane deine Fahrten entsprechend um. Bei Rückfragen wende dich an den Fahrzeugverantwortlichen.</p>
          </div>
        </div>`,
    }).catch(() => {})
  ));
}

// Notfall-Signal-Gruppen-Nachricht (SOS vom Kutscher)
export async function sendNotfallSignal(e: {
  kutscher: string; kategorie: string; beschreibung?: string; mapsUrl?: string;
}) {
  const phone = process.env.SCHADEN_SIGNAL_PHONE ?? '';
  const apiKey = process.env.SCHADEN_SIGNAL_APIKEY ?? '';
  const groupId = process.env.SIGNAL_GROUP_ID ?? '';
  if (!phone || !apiKey) return;
  const kategorieLabel: Record<string, string> = {
    rikscha_defekt: '🚲 Rikscha-Defekt',
    personen_problem: '🏥 Personen-Problem',
    sonstiges: '❓ Sonstiges',
  };
  const kat = kategorieLabel[e.kategorie] ?? e.kategorie;
  let text = `🆘 NOTFALL – ${e.kutscher} braucht Hilfe!\n\nKategorie: ${kat}`;
  if (e.beschreibung) text += `\n\n${e.beschreibung}`;
  if (e.mapsUrl) text += `\n\n📍 Standort: ${e.mapsUrl}`;
  text += `\n\nWer kann spontan helfen? Bitte direkt bei ${e.kutscher} melden.`;
  await callMeBotSignal(phone, apiKey, text, groupId || undefined);
}

// WhatsApp-Ausfall-Nachricht an einen Kutscher
export async function sendAusfallWhatsApp(phone: string, apiKey: string, e: {
  fahrzeug: string; beschreibung: string; gesperrt_ab?: string;
}) {
  const zeitraum = e.gesperrt_ab ? ` ab ${e.gesperrt_ab}` : '';
  const text = encodeURIComponent(
    `🚫 Fahrzeugausfall: ${e.fahrzeug}${zeitraum}\n\n${e.beschreibung}\n\nBitte deine Fahrten entsprechend planen.`
  );
  await fetch(`https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${text}&apikey=${apiKey}`)
    .catch(() => {});
}

export async function sendBuchungEmail(b: {
  fahrzeug: string;
  pilot: string;
  datum: string;
  startzeit: string;
  endzeit: string;
  gaeste: string[];
  notiz?: string | null;
}) {
  const resend = getResend();
  const TO = process.env.NOTIFY_EMAIL ?? '';
  if (!resend || !TO) return;
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
  const resend = getResend();
  const TO = process.env.NOTIFY_EMAIL ?? '';
  if (!resend || !TO) return;
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
