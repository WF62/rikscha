'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

type Buchung = { id: string; datum: string; startzeit: string; endzeit: string; pilot: string; gaeste?: string[] };

function formatDatum(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function FahrzeugausfallBestaetigen() {
  const params = useSearchParams();
  const token = params.get('token') ?? '';
  const fahrzeug = params.get('fahrzeug') ?? '';
  const beschreibung = params.get('beschreibung') ?? '';
  const bereits = params.get('bereits') === '1';

  const heute = new Date().toISOString().slice(0, 10);
  const [name, setName] = useState('Rolf');
  const [gesperrtAb, setGesperrtAb] = useState(heute);
  const [gesperrtBis, setGesperrtBis] = useState('');
  const [status, setStatus] = useState<'warten' | 'senden' | 'ok' | 'fehler'>('warten');
  const [ergebnis, setErgebnis] = useState<{ benachrichtigt: number; betroffene_buchungen: number; buchungen: Buchung[] } | null>(null);

  useEffect(() => {
    if (bereits) setStatus('ok');
  }, [bereits]);

  const bestaetigen = async () => {
    setStatus('senden');
    const res = await fetch('/api/fahrzeugausfall/bestaetigen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, name, gesperrt_ab: gesperrtAb || null, gesperrt_bis: gesperrtBis || null }),
    });
    if (!res.ok) { setStatus('fehler'); return; }
    const d = await res.json();
    setErgebnis(d);
    setStatus('ok');
  };

  if (!token || !fahrzeug) {
    return <div style={{ padding: '2rem', color: '#dc2626' }}>Ungültiger Link.</div>;
  }

  return (
    <div style={{ maxWidth: 560, margin: '2rem auto', padding: '1rem', fontFamily: 'sans-serif' }}>
      <div style={{ background: '#991B1B', color: '#fff', borderRadius: '10px 10px 0 0', padding: '1.25rem 1.5rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.2rem' }}>🚫 Fahrzeugausfall bestätigen</h1>
        <div style={{ marginTop: '0.4rem', fontSize: '0.9rem', opacity: 0.85 }}>{fahrzeug}</div>
      </div>

      <div style={{ background: '#f7f5f0', border: '1px solid #ddd9d0', borderTop: 'none', borderRadius: '0 0 10px 10px', padding: '1.5rem' }}>

        {status === 'ok' && (
          <div>
            <div style={{ background: '#D1FAE5', border: '1px solid #6EE7B7', borderRadius: 8, padding: '1rem', marginBottom: '1rem', color: '#065F46' }}>
              {bereits
                ? '✅ Dieser Ausfall wurde bereits bestätigt.'
                : `✅ Ausfall bestätigt. ${ergebnis?.benachrichtigt ?? 0} Kutscher benachrichtigt.`}
            </div>

            {ergebnis && ergebnis.betroffene_buchungen > 0 && (
              <div>
                <p style={{ fontWeight: 700, color: '#B45309', marginBottom: '0.75rem' }}>
                  ⚠️ {ergebnis.betroffene_buchungen} betroffene Buchung{ergebnis.betroffene_buchungen > 1 ? 'en' : ''} im Sperrzeitraum:
                </p>
                {ergebnis.buchungen.map(b => (
                  <div key={b.id} style={{ background: '#FEF3C7', border: '1px solid #F59E0B', borderRadius: 7, padding: '0.6rem 0.75rem', marginBottom: '0.4rem', fontSize: '0.88rem' }}>
                    <strong>{formatDatum(b.datum)}</strong> · {b.startzeit?.slice(0, 5)}–{b.endzeit?.slice(0, 5)} · {b.pilot}
                    {b.gaeste?.length ? <span> · Gäste: {b.gaeste.join(', ')}</span> : null}
                  </div>
                ))}
                <p style={{ fontSize: '0.85rem', color: '#5a5a52', marginTop: '0.75rem' }}>
                  Diese Buchungen müssen manuell umgeplant oder storniert werden.
                </p>
              </div>
            )}

            {ergebnis && ergebnis.betroffene_buchungen === 0 && (
              <p style={{ color: '#5a5a52', fontSize: '0.9rem' }}>Keine Buchungen im Sperrzeitraum betroffen.</p>
            )}
          </div>
        )}

        {status !== 'ok' && (
          <>
            <div style={{ background: '#FEF3C7', border: '1px solid #F59E0B', borderRadius: 7, padding: '0.75rem 1rem', marginBottom: '1.25rem', fontSize: '0.9rem', lineHeight: 1.6 }}>
              <strong>Gemeldeter Schaden:</strong><br />{beschreibung}
            </div>

            <p style={{ fontSize: '0.9rem', color: '#374151', marginBottom: '1rem' }}>
              Wenn du den Ausfall bestätigst, werden alle aktiven Kutscher automatisch per E-Mail und WhatsApp informiert.
            </p>

            <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#5C4E38', marginBottom: '0.3rem' }}>Dein Name</label>
                <input
                  style={{ width: '100%', border: '1.5px solid #D6CCB8', borderRadius: 7, padding: '0.5rem 0.75rem', fontSize: '0.9rem', boxSizing: 'border-box' }}
                  value={name} onChange={e => setName(e.target.value)}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#5C4E38', marginBottom: '0.3rem' }}>Gesperrt ab</label>
                  <input type="date" style={{ width: '100%', border: '1.5px solid #D6CCB8', borderRadius: 7, padding: '0.5rem 0.6rem', fontSize: '0.9rem', boxSizing: 'border-box' }}
                    value={gesperrtAb} onChange={e => setGesperrtAb(e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#5C4E38', marginBottom: '0.3rem' }}>Voraussichtlich bis</label>
                  <input type="date" style={{ width: '100%', border: '1.5px solid #D6CCB8', borderRadius: 7, padding: '0.5rem 0.6rem', fontSize: '0.9rem', boxSizing: 'border-box' }}
                    value={gesperrtBis} onChange={e => setGesperrtBis(e.target.value)} placeholder="optional" />
                </div>
              </div>
            </div>

            {status === 'fehler' && (
              <div style={{ background: '#FEE2E2', color: '#DC2626', borderRadius: 7, padding: '0.5rem 0.75rem', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                ❌ Fehler beim Bestätigen. Bitte erneut versuchen.
              </div>
            )}

            <button onClick={bestaetigen} disabled={status === 'senden'}
              style={{ background: '#991B1B', color: '#fff', border: 'none', borderRadius: 8, padding: '0.7rem 1.5rem', fontWeight: 700, fontSize: '1rem', cursor: status === 'senden' ? 'not-allowed' : 'pointer', opacity: status === 'senden' ? 0.6 : 1, width: '100%' }}>
              {status === 'senden' ? '⏳ Wird gesendet…' : '🚫 Ausfall bestätigen & Kutscher informieren'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
