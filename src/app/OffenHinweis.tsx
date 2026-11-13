'use client';
import { useEffect, useState } from 'react';
import { authHeaders } from '@/lib/authHeaders';
import type { Buchung } from '@/lib/supabase';
import VerschiebenAnfrage from './VerschiebenAnfrage';

/**
 * Hinweis „Bald und noch offen“ (heute bis übermorgen):
 * freie Fahrzeiten ohne Gast und angemeldete Fahrten ohne Kutscher.
 * Zeigt nichts, wenn nichts offen ist oder niemand angemeldet ist.
 */
type Frei = { id: string; datum: string; startzeit: string; endzeit: string; pilot: string; frei?: { von: string; bis: string }[]; gebucht?: number };
type Ohne = { id: string; datum: string; startzeit: string; endzeit: string; wunschfahrt: string | null; gaeste: string[]; personen: number };
type Daten = { heute: string; freieZeiten: Frei[]; ohneKutscher: Ohne[]; anfragen?: Buchung[]; ergebnisse?: { id: string; datum: string; text: string }[]; rolle: string };

const hhmm = (z: string) => String(z).slice(0, 5);
function tagText(iso: string, heute: string) {
  const d = new Date(iso + 'T12:00:00');
  const morgen = new Date(heute + 'T12:00:00'); morgen.setDate(morgen.getDate() + 1);
  const wort = iso === heute ? 'Heute' : iso === morgen.toISOString().slice(0, 10) ? 'Morgen' : d.toLocaleDateString('de-DE', { weekday: 'long' });
  return `${wort}, ${d.toLocaleDateString('de-DE', { day: 'numeric', month: 'numeric' })}`;
}

export default function OffenHinweis() {
  const [d, setD] = useState<Daten | null>(null);
  const [runde, setRunde] = useState(0);
  useEffect(() => {
    if (!Object.keys(authHeaders()).length) return;
    fetch('/api/offen', { headers: authHeaders() }).then((r) => (r.ok ? r.json() : null)).then(setD).catch(() => setD(null));
  }, [runde]);
  const anfragen = d?.anfragen ?? [];
  const ergebnisse = d?.ergebnisse ?? [];
  if (!d) return null;
  const anfragenBox = (anfragen.length > 0 || ergebnisse.length > 0) && (
    <div style={{ background: '#EEF6FC', border: '1.5px solid #8EC3E6', borderRadius: 12, padding: '0.8rem 1rem', margin: '0 0 1rem', color: '#0B2E45', fontSize: '0.92rem' }}>
      {anfragen.length > 0 && <>
        <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.4rem' }}>🔄 Bitte antworten: Verschiebung angefragt</div>
        {anfragen.map((b) => (
          <div key={b.id} style={{ padding: '0.4rem 0', borderTop: '1px solid #C9E2F3' }}>
            <div style={{ marginBottom: '0.3rem' }}>{tagText(b.datum, d.heute)} · bisher {hhmm(b.startzeit)}–{hhmm(b.endzeit)} Uhr{(b.gaeste ?? []).length ? ` · ${(b.gaeste ?? []).join(' & ')}` : ''}</div>
            <VerschiebenAnfrage b={b} onDone={() => { setRunde((x) => x + 1); window.dispatchEvent(new CustomEvent('rikscha-neu-laden')); }} />
          </div>
        ))}
      </>}
      {ergebnisse.length > 0 && (
        <div style={{ marginTop: anfragen.length ? '0.5rem' : 0 }}>
          {ergebnisse.map((e) => <div key={e.id} style={{ fontSize: '0.85rem', padding: '0.15rem 0' }}>ℹ️ {tagText(e.datum, d.heute)}: {e.text}</div>)}
        </div>
      )}
    </div>
  );
  if (!d.freieZeiten.length && !d.ohneKutscher.length) return anfragenBox || null;
  const vermittlung = ['pflege', 'gfo', 'admin'].includes(d.rolle);
  const kutscher = ['kutscher', 'pilot', 'gfo', 'admin'].includes(d.rolle);
  const zeile: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.25rem 0.75rem', padding: '0.4rem 0', borderTop: '1px solid #F3D9A4' };
  const link: React.CSSProperties = { color: '#2D6B1E', fontWeight: 700, textDecoration: 'underline', marginLeft: 'auto' };

  return (
    <>
    {anfragenBox}
    <div role="status" style={{ background: '#FFF7E6', border: '1.5px solid #F0C36D', borderRadius: 12, padding: '0.8rem 1rem', margin: '0 0 1rem', color: '#3B2A07', fontSize: '0.92rem' }}>
      <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.3rem' }}>⏰ Bald und noch offen</div>

      {d.freieZeiten.length > 0 && (
        <div style={{ marginBottom: '0.4rem' }}>
          <div style={{ fontWeight: 600 }}>Freie Fahrzeiten – noch Platz für Gäste:</div>
          {d.freieZeiten.map((f) => (
            <div key={f.id} style={zeile}>
              <span>{tagText(f.datum, d.heute)} · {f.pilot} · {f.gebucht ? `noch frei: ${(f.frei ?? []).map((x) => `${x.von}–${x.bis}`).join(', ')} Uhr` : `${hhmm(f.startzeit)}–${hhmm(f.endzeit)} Uhr`}</span>
              {vermittlung && <a href={`/pflege/schnell?datum=${f.datum}&frei=${f.id}`} style={link}>Gast eintragen →</a>}
            </div>
          ))}
        </div>
      )}

      {d.ohneKutscher.length > 0 && (
        <div>
          <div style={{ fontWeight: 600 }}>Angemeldet – noch kein Kutscher:</div>
          {d.ohneKutscher.map((o) => (
            <div key={o.id} style={zeile}>
              <span>
                {tagText(o.datum, d.heute)} · {hhmm(o.startzeit)}–{hhmm(o.endzeit)} Uhr
                {o.gaeste.length ? ` · ${o.gaeste.join(' & ')}` : ` · ${o.personen} ${o.personen === 1 ? 'Gast' : 'Gäste'}`}
                {o.wunschfahrt ? ` · ${o.wunschfahrt}` : ''}
              </span>
              {kutscher && <a href={`/kalender?datum=${o.datum}`} style={link}>Übernehmen →</a>}
            </div>
          ))}
          {vermittlung && (
            <div style={{ marginTop: '0.3rem', fontSize: '0.85rem' }}>
              Bitte die Gäste vorwarnen: Die Fahrt findet nur statt, wenn sich noch ein Kutscher meldet.
            </div>
          )}
        </div>
      )}
    </div>
    </>
  );
}
