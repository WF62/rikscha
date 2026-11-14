'use client';
import { useState, useEffect } from 'react';

type Kategorie = 'rikscha_defekt' | 'personen_problem' | 'sonstiges';

const KATEGORIEN: { id: Kategorie; icon: string; label: string; farbe: string; hintergrund: string }[] = [
  { id: 'rikscha_defekt', icon: '🚲', label: 'Rikscha-Defekt', farbe: '#B45309', hintergrund: '#FEF3C7' },
  { id: 'personen_problem', icon: '🏥', label: 'Personen-Problem', farbe: '#991B1B', hintergrund: '#FEE2E2' },
  { id: 'sonstiges', icon: '❓', label: 'Sonstiges', farbe: '#1E40AF', hintergrund: '#DBEAFE' },
];

export default function NotfallPage() {
  const [pilot, setPilot] = useState('');
  const [pw, setPw] = useState('');
  const [kategorie, setKategorie] = useState<Kategorie | null>(null);
  const [beschreibung, setBeschreibung] = useState('');
  const [standort, setStandort] = useState<{ lat: number; lon: number } | null>(null);
  const [standortStatus, setStandortStatus] = useState<'nein' | 'laden' | 'ok' | 'fehler'>('nein');
  const [status, setStatus] = useState<'bereit' | 'senden' | 'ok' | 'fehler'>('bereit');

  useEffect(() => {
    try {
      setPilot(localStorage.getItem('pilot_name') ?? '');
      setPw(localStorage.getItem('pilot_pw') ?? '');
    } catch {}
  }, []);

  const standortHolen = () => {
    if (!navigator.geolocation) { setStandortStatus('fehler'); return; }
    setStandortStatus('laden');
    navigator.geolocation.getCurrentPosition(
      pos => {
        setStandort({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setStandortStatus('ok');
      },
      () => setStandortStatus('fehler'),
      { timeout: 10000 }
    );
  };

  const abschicken = async () => {
    if (!kategorie) return;
    setStatus('senden');
    const res = await fetch('/api/notfall', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pilot, password: pw, kategorie, beschreibung: beschreibung || undefined,
        lat: standort?.lat, lon: standort?.lon,
      }),
    });
    setStatus(res.ok ? 'ok' : 'fehler');
  };

  if (status === 'ok') {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FEF9C3', padding: '1rem' }}>
        <div style={{ maxWidth: 420, width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>✅</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#065F46', marginBottom: '0.75rem' }}>
            Notfall gesendet
          </h1>
          <p style={{ color: '#374151', marginBottom: '1.5rem', lineHeight: 1.6 }}>
            Alle Kutscher in der Signal-Gruppe wurden benachrichtigt.<br />
            Wer kann, meldet sich direkt bei dir.
          </p>
          <a href="/" style={{ display: 'inline-block', background: '#2D6B1E', color: '#fff', padding: '0.75rem 2rem', borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: '1rem' }}>
            Zurück zur Startseite
          </a>
        </div>
      </div>
    );
  }

  const kat = kategorie ? KATEGORIEN.find(k => k.id === kategorie) : null;

  return (
    <div style={{ minHeight: '100dvh', background: '#fff', padding: '1rem', maxWidth: 480, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ background: '#7F1D1D', borderRadius: 14, padding: '1.25rem 1.5rem', marginBottom: '1.5rem', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '0.4rem' }}>🆘</div>
        <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>
          Notfall melden
        </h1>
        <p style={{ margin: '0.4rem 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)' }}>
          Eine Signal-Nachricht geht sofort an alle Kutscher
        </p>
      </div>

      {/* Kategorie */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#374151', marginBottom: '0.6rem' }}>
          Was ist passiert?
        </div>
        <div style={{ display: 'grid', gap: '0.6rem' }}>
          {KATEGORIEN.map(k => (
            <button key={k.id} type="button" onClick={() => setKategorie(k.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '1rem',
                padding: '1rem 1.1rem', borderRadius: 12, border: `2.5px solid ${kategorie === k.id ? k.farbe : '#E5E7EB'}`,
                background: kategorie === k.id ? k.hintergrund : '#F9FAFB',
                cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.15s',
              }}>
              <span style={{ fontSize: '2rem' }}>{k.icon}</span>
              <span style={{ fontWeight: 700, fontSize: '1rem', color: kategorie === k.id ? k.farbe : '#1a1a18' }}>
                {k.label}
              </span>
              {kategorie === k.id && <span style={{ marginLeft: 'auto', color: k.farbe, fontWeight: 700 }}>✓</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Beschreibung */}
      <div style={{ marginBottom: '1.25rem' }}>
        <label style={{ display: 'block', fontWeight: 700, fontSize: '0.9rem', color: '#374151', marginBottom: '0.5rem' }}>
          Kurze Beschreibung <span style={{ fontWeight: 400, color: '#6B7280' }}>(optional)</span>
        </label>
        <textarea
          rows={3}
          value={beschreibung}
          onChange={e => setBeschreibung(e.target.value)}
          placeholder="Was genau ist passiert? Wo genau bist du?"
          style={{ width: '100%', border: '1.5px solid #D1D5DB', borderRadius: 10, padding: '0.65rem 0.85rem', fontSize: '1rem', lineHeight: 1.5, boxSizing: 'border-box', resize: 'vertical' }}
        />
      </div>

      {/* Standort */}
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#374151', marginBottom: '0.5rem' }}>
          Standort <span style={{ fontWeight: 400, color: '#6B7280' }}>(empfohlen)</span>
        </div>
        {standortStatus === 'nein' && (
          <button type="button" onClick={standortHolen}
            style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: '#F0FDF4', border: '1.5px solid #86EFAC', borderRadius: 10, padding: '0.65rem 1rem', fontSize: '0.95rem', cursor: 'pointer', color: '#15803D', fontWeight: 600 }}>
            <span>📍</span> Aktuellen Standort ermitteln
          </button>
        )}
        {standortStatus === 'laden' && (
          <div style={{ color: '#6B7280', fontSize: '0.9rem', padding: '0.5rem 0' }}>⏳ Standort wird ermittelt…</div>
        )}
        {standortStatus === 'ok' && standort && (
          <div style={{ background: '#F0FDF4', border: '1.5px solid #86EFAC', borderRadius: 10, padding: '0.6rem 0.9rem', fontSize: '0.9rem', color: '#15803D', fontWeight: 600 }}>
            ✅ Standort: {standort.lat.toFixed(5)}, {standort.lon.toFixed(5)}
            <button type="button" onClick={() => { setStandort(null); setStandortStatus('nein'); }}
              style={{ marginLeft: '0.75rem', background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', fontSize: '0.85rem' }}>
              entfernen
            </button>
          </div>
        )}
        {standortStatus === 'fehler' && (
          <div style={{ color: '#DC2626', fontSize: '0.88rem', padding: '0.4rem 0' }}>
            ❌ Standort konnte nicht ermittelt werden. Schreib ihn in die Beschreibung.
          </div>
        )}
      </div>

      {/* Absenden */}
      {status === 'fehler' && (
        <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 8, padding: '0.6rem 0.9rem', fontSize: '0.9rem', color: '#DC2626', marginBottom: '0.75rem' }}>
          ❌ Fehler beim Senden. Bitte erneut versuchen.
        </div>
      )}

      <button
        type="button"
        onClick={abschicken}
        disabled={!kategorie || status === 'senden'}
        style={{
          width: '100%', padding: '1rem', borderRadius: 14, border: 'none',
          background: !kategorie ? '#E5E7EB' : (kat?.farbe ?? '#7F1D1D'),
          color: !kategorie ? '#9CA3AF' : '#fff',
          fontWeight: 800, fontSize: '1.1rem', cursor: !kategorie ? 'not-allowed' : 'pointer',
          boxShadow: !kategorie ? 'none' : '0 2px 8px rgba(127,29,29,0.3)',
        }}>
        {status === 'senden' ? '⏳ Wird gesendet…' : '🆘 Notfall melden & Signal senden'}
      </button>

      <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#9CA3AF', marginTop: '1rem', lineHeight: 1.5 }}>
        Die Nachricht geht sofort an die Kutscher-Signal-Gruppe.<br />
        Wer helfen kann, meldet sich direkt bei dir.
      </p>
    </div>
  );
}
