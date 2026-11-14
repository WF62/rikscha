'use client';
import { useEffect, useState } from 'react';
import OffenHinweis from '../OffenHinweis';
import { useStammdaten } from '@/lib/useStammdaten';
import { authHeaders } from '@/lib/authHeaders';

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
  const notfall: Kachel = { href: '/notfall', icon: '🆘', titel: 'Schnellmeldung', sub: 'Notfall · Verspätung · Absage' };
  if (rolle === 'kutscher' || rolle === 'pilot') return [eintragen, kalender, touren, notfall];
  if (rolle === 'kutscher-admin') return [eintragen, kalender, touren, fahrtenbuch, kassenbuch, notfall];
  if (rolle === 'pflege') return [anmelden, vermitteln];
  if (rolle === 'gfo' || rolle === 'admin') return [eintragen, { ...anmelden, haupt: false }, kalender, vermitteln, fahrtenbuch, kassenbuch, notfall];
  return [];
}

export default function SchnellStart() {
  const [wer, setWer] = useState<{ name: string; rolle: string } | null>(null);
  const [checklistenOffen, setChecklistenOffen] = useState(false);
  const { fahrzeugById, einweisungenFuer } = useStammdaten();

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

  // Prüfe ob noch offene Checklisten für diese Saison vorhanden
  useEffect(() => {
    if (!wer) { setChecklistenOffen(false); return; }
    const rollen = ['kutscher', 'kutscher-admin', 'pilot', 'admin', 'gfo'];
    if (!rollen.includes(wer.rolle)) return;
    fetch('/api/checklisten', { headers: authHeaders() })
      .then(r => r.ok ? r.json() : null)
      .then(j => {
        if (!j) return;
        const offen = j.listen.some((l: { bestaetigt: boolean; veraltet: boolean }) => !l.bestaetigt || l.veraltet);
        setChecklistenOffen(offen);
      })
      .catch(() => {});
  }, [wer]);

  const kachelnBase = wer ? kachelnFuer(wer.rolle) : [];
  // Checklisten-Kachel für Kutscher/Admin-Rollen
  const zeigeCL = wer && ['kutscher', 'kutscher-admin', 'pilot', 'admin', 'gfo'].includes(wer.rolle);
  const checklisteKachel: Kachel = {
    href: '/checklisten',
    icon: checklistenOffen ? '⚠️' : '📋',
    titel: 'Saisoneinweisung',
    sub: checklistenOffen ? 'Bitte jetzt bestätigen!' : 'Checklisten & Einweisungen',
  };
  const utensilienKachel: Kachel = {
    href: '/utensilien',
    icon: '🎒',
    titel: 'Utensilienliste',
    sub: 'Was ist in der Fahrradtasche?',
  };
  const kacheln = zeigeCL ? [...kachelnBase, checklisteKachel, utensilienKachel] : kachelnBase;
  if (!wer || !kacheln.length) return null;

  return (
    <section aria-label="Schnellzugang" style={{ background: '#EAF3E6', borderBottom: '1px solid #CFE3C7', padding: '1rem' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <OffenHinweis key={wer.name} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
          <div>
            <div style={{ fontWeight: 700, color: '#2D6B1E', fontSize: '1.05rem' }}>Hallo {wer.name}! Was möchtest du tun?</div>
            {(wer.rolle === 'kutscher' || wer.rolle === 'pilot' || wer.rolle === 'kutscher-admin' || wer.rolle === 'admin') && (() => {
              const ew = einweisungenFuer(wer.name);
              return ew.length > 0
                ? <div style={{ fontSize: '0.8rem', color: '#3B6B2E', marginTop: '0.15rem' }}>
                    Deine Rikschas: {ew.map(id => fahrzeugById(id)?.name ?? id).join(' · ')}
                  </div>
                : null;
            })()}
          </div>
          <button type="button" onClick={() => window.dispatchEvent(new CustomEvent('open-piloten-modal'))}
            style={{ background: 'none', border: 'none', color: '#2D6B1E', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.85rem', padding: 0 }}>
            Weitere Funktionen &amp; Abmelden
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
          {kacheln.map((k) => {
            const isCL = k.href === '/checklisten';
            const clOffen = isCL && checklistenOffen;
            return (
              <a key={k.href} href={k.href}
                style={{
                  gridColumn: k.haupt ? '1 / -1' : undefined,
                  display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.9rem 1rem', borderRadius: 12, textDecoration: 'none',
                  background: k.haupt ? '#2D6B1E' : clOffen ? '#FEF9C3' : '#fff',
                  color: k.haupt ? '#fff' : '#1C1208',
                  border: `1.5px solid ${k.haupt ? '#2D6B1E' : clOffen ? '#FDE047' : '#CFE3C7'}`,
                  boxShadow: clOffen ? '0 0 0 2px #FDE04788' : '0 1px 2px rgba(0,0,0,0.06)',
                }}>
                <span style={{ fontSize: '1.6rem' }} aria-hidden>{k.icon}</span>
                <span>
                  <span style={{ display: 'block', fontWeight: 700, color: clOffen ? '#92400E' : undefined }}>{k.titel}</span>
                  <span style={{ display: 'block', fontSize: '0.8rem', opacity: 0.85, color: clOffen ? '#B45309' : undefined }}>{k.sub}</span>
                </span>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
