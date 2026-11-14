'use client';
import { useEffect, useState } from 'react';
import OffenHinweis from '../OffenHinweis';

/**
 * Startseite: Wer schon angemeldet ist (Kutscher, Büro/GFO, Vermittlung), sieht oben
 * direkt die Schnellangabe – ohne Umweg über das Menü. Für Gäste unsichtbar.
 */
type Kachel = { href: string; icon: string; titel: string; sub: string; haupt?: boolean };

function kachelnFuer(rolle: string): Kachel[] {
  const eintragen: Kachel = { href: '/fahrt-eintragen', icon: '⚡', titel: 'Fahrt schnell eintragen', sub: 'Freie Zeit oder Fahrt mit Gast', haupt: true };
  const anmelden: Kachel = { href: '/pflege/schnell', icon: '🚲', titel: 'Rikscha anmelden', sub: 'Wer? Wann? Wohin?', haupt: true };
  const kalender: Kachel = { href: '/kalender', icon: '📅', titel: 'Kalender', sub: 'Alle Fahrten' };
  const vermitteln: Kachel = { href: '/pflege', icon: '🏠', titel: 'Fahrten vermitteln', sub: 'Gäste, Etagen, Gruppen' };
  const touren: Kachel = { href: '/touren', icon: '🗺️', titel: 'Touren verwalten', sub: 'GPX hochladen & benennen' };
  const fahrtenbuch: Kachel = { href: '/fahrtenbuch', icon: '📒', titel: 'Fahrtenbuch', sub: 'km, Spenden & Berichte' };
  const kassenbuch: Kachel = { href: '/kassenbuch', icon: '💶', titel: 'Kassenbuch', sub: 'Einnahmen & Ausgaben' };
  const notfall: Kachel = { href: '/notfall', icon: '🆘', titel: 'Notfall', sub: 'Signal an alle Kutscher senden' };
  if (rolle === 'kutscher' || rolle === 'pilot') return [eintragen, kalender, touren, notfall];
  if (rolle === 'kutscher-admin') return [eintragen, kalender, touren, fahrtenbuch, kassenbuch, notfall];
  if (rolle === 'pflege') return [anmelden, vermitteln];
  if (rolle === 'gfo' || rolle === 'admin') return [eintragen, { ...anmelden, haupt: false }, kalender, vermitteln, fahrtenbuch, kassenbuch];
  return [];
}

export default function SchnellStart() {
  const [wer, setWer] = useState<{ name: string; rolle: string } | null>(null);

  useEffect(() => {
    const lesen = () => {
      try {
        const name = localStorage.getItem('pilot_name') ?? '';
        const pw = localStorage.getItem('pilot_pw') ?? '';
        const rolle = localStorage.getItem('pilot_rolle') ?? '';
        setWer(name && pw ? { name, rolle } : null);
      } catch { setWer(null); }
    };
    lesen();
    window.addEventListener('pilot-login', lesen);
    window.addEventListener('pilot-logout', lesen);
    window.addEventListener('storage', lesen);
    return () => {
      window.removeEventListener('pilot-login', lesen);
      window.removeEventListener('pilot-logout', lesen);
      window.removeEventListener('storage', lesen);
    };
  }, []);

  const kacheln = wer ? kachelnFuer(wer.rolle) : [];
  if (!wer || !kacheln.length) return null;

  return (
    <section aria-label="Schnellzugang" style={{ background: '#EAF3E6', borderBottom: '1px solid #CFE3C7', padding: '1rem' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <OffenHinweis key={wer.name} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
          <div style={{ fontWeight: 700, color: '#2D6B1E', fontSize: '1.05rem' }}>Hallo {wer.name}! Was möchtest du tun?</div>
          <button type="button" onClick={() => window.dispatchEvent(new CustomEvent('open-piloten-modal'))}
            style={{ background: 'none', border: 'none', color: '#2D6B1E', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.85rem', padding: 0 }}>
            Weitere Funktionen &amp; Abmelden
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
          {kacheln.map((k) => (
            <a key={k.href} href={k.href}
              style={{
                gridColumn: k.haupt ? '1 / -1' : undefined,
                display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.9rem 1rem', borderRadius: 12, textDecoration: 'none',
                background: k.haupt ? '#2D6B1E' : '#fff', color: k.haupt ? '#fff' : '#1C1208',
                border: `1.5px solid ${k.haupt ? '#2D6B1E' : '#CFE3C7'}`, boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
              }}>
              <span style={{ fontSize: '1.6rem' }} aria-hidden>{k.icon}</span>
              <span>
                <span style={{ display: 'block', fontWeight: 700 }}>{k.titel}</span>
                <span style={{ display: 'block', fontSize: '0.8rem', opacity: 0.85 }}>{k.sub}</span>
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
