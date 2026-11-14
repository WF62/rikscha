'use client';
import { useEffect, useState, useCallback } from 'react';
import { authHeaders } from '@/lib/authHeaders';

type Stelle = { id: string; name: string; aktiv: boolean; rolle?: string; organisation_id?: string | null };
type StelleMitBuchung = Stelle & { letzteBuchung: string | null; anzahlBuchungen: number };

export default function VermittlungsstellenPage() {
  const [zugang, setZugang] = useState<'pruefen' | 'ok' | 'nein'>('pruefen');
  const [stellen, setStellen] = useState<StelleMitBuchung[]>([]);
  const [laden, setLaden] = useState(false);

  useEffect(() => {
    const rolle = localStorage.getItem('kutscher_rolle') ?? '';
    if (!['kutscher-admin', 'gfo', 'admin'].includes(rolle)) { setZugang('nein'); return; }
    setZugang('ok');
    laden_();
  }, []);

  const laden_ = useCallback(async () => {
    setLaden(true);
    const h = authHeaders();
    const kRes = await fetch('/api/kutscher', { headers: h });
    if (!kRes.ok) { setLaden(false); return; }

    const alle: Stelle[] = await kRes.json();
    const pflegeStellen = alle.filter(k => k.aktiv && k.rolle === 'pflege');

    const vor30Tagen = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const stellenMitDaten: StelleMitBuchung[] = await Promise.all(
      pflegeStellen.map(async (s) => {
        const res = await fetch(
          `/api/admin/vermittlung-buchungen?organisation_id=${s.organisation_id ?? ''}&seit=${vor30Tagen}`,
          { headers: h }
        );
        if (!res.ok) return { ...s, letzteBuchung: null, anzahlBuchungen: 0 };
        const j = await res.json();
        return { ...s, letzteBuchung: j.letzteBuchung ?? null, anzahlBuchungen: j.anzahl ?? 0 };
      })
    );

    stellenMitDaten.sort((a, b) => {
      if (!a.letzteBuchung && !b.letzteBuchung) return 0;
      if (!a.letzteBuchung) return -1;
      if (!b.letzteBuchung) return 1;
      return a.letzteBuchung < b.letzteBuchung ? -1 : 1;
    });

    setStellen(stellenMitDaten);
    setLaden(false);
  }, []);

  if (zugang === 'pruefen') return <p className="text-center text-gray-400 mt-16">Einen Moment …</p>;
  if (zugang === 'nein') return <div className="p-8 text-red-600">Kein Zugang.</div>;

  const vor30Tagen = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: '1.5rem 1rem', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <a href="/admin" style={{ color: '#6B7280', fontSize: '0.9rem', textDecoration: 'none' }}>← Admin</a>
        <h1 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#1a1a18' }}>
          🏠 Vermittlungsstellen – Buchungsaktivität
        </h1>
      </div>

      <p style={{ color: '#6B7280', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
        Übersicht der aktiven Vermittlungsstellen. Stellen ohne Buchung in den letzten 30 Tagen werden zuerst angezeigt.
      </p>

      {laden ? (
        <p style={{ color: '#6B7280', textAlign: 'center' }}>Laden …</p>
      ) : (
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {stellen.map(s => {
            const inaktiv = !s.letzteBuchung || s.letzteBuchung < vor30Tagen;
            return (
              <div key={s.id} style={{
                background: '#fff',
                border: `1.5px solid ${inaktiv ? '#FCA5A5' : '#D1FAE5'}`,
                borderRadius: 10,
                padding: '0.85rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
              }}>
                <span style={{ fontSize: '1.4rem' }}>{inaktiv ? '⚠️' : '✅'}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{s.name}</div>
                  <div style={{ fontSize: '0.82rem', color: '#6B7280', marginTop: '0.1rem' }}>
                    {!s.letzteBuchung
                      ? 'Noch keine Buchung erfasst'
                      : `Letzte Buchung: ${new Date(s.letzteBuchung).toLocaleDateString('de-DE')}`}
                  </div>
                </div>
                <div style={{
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  padding: '0.2rem 0.6rem',
                  borderRadius: 6,
                  background: inaktiv ? '#FEE2E2' : '#D1FAE5',
                  color: inaktiv ? '#DC2626' : '#065F46',
                  whiteSpace: 'nowrap',
                }}>
                  {inaktiv
                    ? (s.letzteBuchung ? 'Über 30 Tage keine Buchung' : 'Keine Buchung bekannt')
                    : `${s.anzahlBuchungen} Buchung${s.anzahlBuchungen !== 1 ? 'en' : ''} (30 Tage)`}
                </div>
              </div>
            );
          })}
          {stellen.length === 0 && (
            <p style={{ color: '#6B7280', textAlign: 'center' }}>Keine aktiven Vermittlungsstellen gefunden.</p>
          )}
        </div>
      )}
    </div>
  );
}
