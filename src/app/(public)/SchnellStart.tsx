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
  if (rolle === 'kutscher') return [eintragen, kalender, touren, notfall];
  if (rolle === 'kutscher-admin') return [eintragen, kalender, touren, fahrtenbuch, kassenbuch, notfall];
  if (rolle === 'pflege') return [anmelden, vermitteln];
  if (rolle === 'gfo' || rolle === 'admin') return [eintragen, { ...anmelden, haupt: false }, kalender, vermitteln, fahrtenbuch, kassenbuch, notfall];
  return [];
}

export default function SchnellStart() {
  const [wer, setWer] = useState<{ name: string; rolle: string } | null>(null);
  const [checklistenOffen, setChecklistenOffen] = useState(false);
  const [nachbestellenAnzahl, setNachbestellenAnzahl] = useState(0);
  const { fahrzeugById, einweisungenFuer } = useStammdaten();

  useEffect(() => {
    const lesen = () => {
      try {
        const name = localStorage.getItem('kutscher_name') ?? '';
        const pw = localStorage.getItem('kutscher_pw') ?? '';
        const rolle = localStorage.getItem('kutscher_rolle') ?? '';
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

  // Prüfe Nachbestellen-Markierungen (nur für Admin/Kutscher-Admin)
  useEffect(() => {
    if (!wer) { setNachbestellenAnzahl(0); return; }
    if (!['kutscher-admin', 'admin', 'gfo'].includes(wer.rolle)) return;
    fetch('/api/utensilien', { headers: authHeaders() })
      .then(r => r.ok ? r.json() : null)
      .then(j => {
        if (!j) return;
        const anzahl = (j.listen as { nachbestellen: string[] }[])
          .reduce((sum, l) => sum + (l.nachbestellen?.length ?? 0), 0);
        setNachbestellenAnzahl(anzahl);
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
        {checklistenOffen && (
          <a href="/checklisten" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#FEF9C3', border: '1.5px solid #FDE047', borderRadius: 10, padding: '0.7rem 1rem', marginBottom: '0.75rem', textDecoration: 'none', color: '#92400E' }}>
            <span style={{ fontSize: '1.3rem' }}>⚠️</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Saisoneinweisung noch nicht abgeschlossen</div>
              <div style={{ fontSize: '0.8rem', color: '#B45309' }}>Bitte Checklisten lesen und bestätigen, bevor du fährst →</div>
            </div>
          </a>
        )}
        {nachbestellenAnzahl > 0 && (
          <a href="/admin/checklisten" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#FEF2F2', border: '1.5px solid #FCA5A5', borderRadius: 10, padding: '0.7rem 1rem', marginBottom: '0.75rem', textDecoration: 'none', color: '#DC2626' }}>
            <span style={{ fontSize: '1.3rem' }}>🔴</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                {nachbestellenAnzahl} {nachbestellenAnzahl === 1 ? 'Utensil' : 'Utensilien'} zum Nachbestellen gemeldet
              </div>
              <div style={{ fontSize: '0.8rem', color: '#B91C1C' }}>Bitte in den Utensilienlisten prüfen und als erledigt markieren →</div>
            </div>
          </a>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
          <div>
            <div style={{ fontWeight: 700, color: '#2D6B1E', fontSize: '1.05rem' }}>Hallo {wer.name}! Was möchtest du tun?</div>
            {(wer.rolle === 'kutscher' || wer.rolle === 'kutscher-admin' || wer.rolle === 'admin') && (() => {
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 140px), 1fr))', gap: '0.6rem' }}>
          {kacheln.map((k) => {
            const isCL = k.href === '/checklisten';
            const clOffen = isCL && checklistenOffen;
            return (
              <a key={k.href} href={k.href}
                style={{
                  gridColumn: k.haupt ? '1 / -1' : undefined,
                  display: 'flex', alignItems: 'center', gap: '0.6rem', padding: k.haupt ? '0.9rem 1rem' : '0.7rem 0.75rem', borderRadius: 12, textDecoration: 'none',
                  background: k.haupt ? '#2D6B1E' : clOffen ? '#FEF9C3' : '#fff',
                  color: k.haupt ? '#fff' : '#1C1208',
                  border: `1.5px solid ${k.haupt ? '#2D6B1E' : clOffen ? '#FDE047' : '#CFE3C7'}`,
                  boxShadow: clOffen ? '0 0 0 2px #FDE04788' : '0 1px 2px rgba(0,0,0,0.06)',
                  minWidth: 0,
                }}>
                <span style={{ fontSize: k.haupt ? '1.6rem' : '1.4rem', flexShrink: 0 }} aria-hidden>{k.icon}</span>
                <span style={{ minWidth: 0, overflow: 'hidden' }}>
                  <span style={{ display: 'block', fontWeight: 700, fontSize: k.haupt ? '1rem' : '0.88rem', color: clOffen ? '#92400E' : undefined, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{k.titel}</span>
                  <span style={{ display: 'block', fontSize: '0.75rem', opacity: 0.85, color: clOffen ? '#B45309' : undefined, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{k.sub}</span>
                </span>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
