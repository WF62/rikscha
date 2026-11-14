'use client';
import { useState, useEffect } from 'react';

type Kategorie = 'rikscha_defekt' | 'personen_problem' | 'sonstiges';
type SchnellTyp = 'verspaetung' | 'absage' | null;
type Ansicht = 'menu' | 'notfall' | 'verspaetung' | 'absage';

const KATEGORIEN: { id: Kategorie; icon: string; label: string; farbe: string; hintergrund: string }[] = [
  { id: 'rikscha_defekt', icon: '🚲', label: 'Rikscha-Defekt', farbe: '#B45309', hintergrund: '#FEF3C7' },
  { id: 'personen_problem', icon: '🏥', label: 'Personen-Problem', farbe: '#991B1B', hintergrund: '#FEE2E2' },
  { id: 'sonstiges', icon: '❓', label: 'Sonstiges', farbe: '#1E40AF', hintergrund: '#DBEAFE' },
];

const VERSPAETUNG_OPTIONEN = [15, 30, 45, 60];

export default function NotfallPage() {
  const [pilot, setPilot] = useState('');
  const [pw, setPw] = useState('');
  const [ansicht, setAnsicht] = useState<Ansicht>('menu');

  // Notfall-Zustand
  const [kategorie, setKategorie] = useState<Kategorie | null>(null);
  const [beschreibung, setBeschreibung] = useState('');
  const [standort, setStandort] = useState<{ lat: number; lon: number } | null>(null);
  const [standortStatus, setStandortStatus] = useState<'nein' | 'laden' | 'ok' | 'fehler'>('nein');
  const [notfallStatus, setNotfallStatus] = useState<'bereit' | 'senden' | 'ok' | 'fehler'>('bereit');

  // Verspätung-Zustand
  const [verspaetungMin, setVerspaetungMin] = useState<number | null>(null);
  const [verspaetungNotiz, setVerspaetungNotiz] = useState('');
  const [verspaetungStatus, setVerspaetungStatus] = useState<'bereit' | 'senden' | 'ok' | 'fehler'>('bereit');

  // Absage-Zustand
  const [absageGrund, setAbsageGrund] = useState('');
  const [absageStatus, setAbsageStatus] = useState<'bereit' | 'senden' | 'ok' | 'fehler'>('bereit');

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
      pos => { setStandort({ lat: pos.coords.latitude, lon: pos.coords.longitude }); setStandortStatus('ok'); },
      () => setStandortStatus('fehler'),
      { timeout: 10000 }
    );
  };

  const notfallAbschicken = async () => {
    if (!kategorie) return;
    setNotfallStatus('senden');
    const res = await fetch('/api/notfall', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pilot, password: pw, kategorie, beschreibung: beschreibung || undefined, lat: standort?.lat, lon: standort?.lon }),
    });
    setNotfallStatus(res.ok ? 'ok' : 'fehler');
  };

  const verspaetungAbschicken = async () => {
    if (!verspaetungMin) return;
    setVerspaetungStatus('senden');
    const res = await fetch('/api/schnellmeldung', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pilot, password: pw, typ: 'verspaetung', minuten: verspaetungMin, notiz: verspaetungNotiz || undefined }),
    });
    setVerspaetungStatus(res.ok ? 'ok' : 'fehler');
  };

  const absageAbschicken = async () => {
    setAbsageStatus('senden');
    const res = await fetch('/api/schnellmeldung', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pilot, password: pw, typ: 'absage', grund: absageGrund || undefined }),
    });
    setAbsageStatus(res.ok ? 'ok' : 'fehler');
  };

  // Erfolgs-Screens
  if (notfallStatus === 'ok') {
    return <ErfolgScreen icon="✅" titel="Notfall gesendet" text="Alle Kutscher in der Signal-Gruppe wurden benachrichtigt." />;
  }
  if (verspaetungStatus === 'ok') {
    return <ErfolgScreen icon="⏰" titel="Verspätung gemeldet" text={`Die Gruppe wurde informiert: Du kommst ca. ${verspaetungMin} Minuten später.`} />;
  }
  if (absageStatus === 'ok') {
    return <ErfolgScreen icon="📵" titel="Absage gesendet" text="Die Gruppe wurde informiert, dass du heute nicht fahren kannst." />;
  }

  // Verspätung-Formular
  if (ansicht === 'verspaetung') {
    return (
      <div style={{ minHeight: '100dvh', background: '#fff', padding: '1rem', maxWidth: 480, margin: '0 auto' }}>
        <div style={{ background: '#92400E', borderRadius: 14, padding: '1.25rem 1.5rem', marginBottom: '1.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.4rem' }}>⏰</div>
          <h1 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#fff' }}>Verspätung melden</h1>
          <p style={{ margin: '0.4rem 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)' }}>Wie viel später kommst du?</p>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#374151', marginBottom: '0.6rem' }}>Verspätung</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
            {VERSPAETUNG_OPTIONEN.map(m => (
              <button key={m} type="button" onClick={() => setVerspaetungMin(m)}
                style={{
                  padding: '0.85rem 0.5rem', borderRadius: 10,
                  border: `2px solid ${verspaetungMin === m ? '#92400E' : '#E5E7EB'}`,
                  background: verspaetungMin === m ? '#FEF3C7' : '#F9FAFB',
                  fontWeight: 700, fontSize: '1rem', color: verspaetungMin === m ? '#92400E' : '#374151',
                  cursor: 'pointer',
                }}>
                {m} min
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontWeight: 700, fontSize: '0.9rem', color: '#374151', marginBottom: '0.5rem' }}>
            Notiz <span style={{ fontWeight: 400, color: '#6B7280' }}>(optional)</span>
          </label>
          <textarea rows={2} value={verspaetungNotiz} onChange={e => setVerspaetungNotiz(e.target.value)}
            placeholder="z.B. Stau auf der A555"
            style={{ width: '100%', border: '1.5px solid #D1D5DB', borderRadius: 10, padding: '0.65rem 0.85rem', fontSize: '1rem', lineHeight: 1.5, boxSizing: 'border-box', resize: 'vertical' }}
          />
        </div>

        {verspaetungStatus === 'fehler' && (
          <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 8, padding: '0.6rem 0.9rem', fontSize: '0.9rem', color: '#DC2626', marginBottom: '0.75rem' }}>
            ❌ Fehler beim Senden. Bitte erneut versuchen.
          </div>
        )}

        <button type="button" onClick={verspaetungAbschicken} disabled={!verspaetungMin || verspaetungStatus === 'senden'}
          style={{ width: '100%', padding: '1rem', borderRadius: 14, border: 'none', background: !verspaetungMin ? '#E5E7EB' : '#92400E', color: !verspaetungMin ? '#9CA3AF' : '#fff', fontWeight: 800, fontSize: '1rem', cursor: !verspaetungMin ? 'not-allowed' : 'pointer', marginBottom: '0.75rem' }}>
          {verspaetungStatus === 'senden' ? '⏳ Wird gesendet…' : '⏰ Verspätung melden'}
        </button>
        <button type="button" onClick={() => setAnsicht('menu')}
          style={{ width: '100%', padding: '0.7rem', borderRadius: 10, border: '1.5px solid #E5E7EB', background: 'none', color: '#6B7280', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer' }}>
          ← Zurück
        </button>
      </div>
    );
  }

  // Absage-Formular
  if (ansicht === 'absage') {
    return (
      <div style={{ minHeight: '100dvh', background: '#fff', padding: '1rem', maxWidth: 480, margin: '0 auto' }}>
        <div style={{ background: '#374151', borderRadius: 14, padding: '1.25rem 1.5rem', marginBottom: '1.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.4rem' }}>📵</div>
          <h1 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#fff' }}>Kurzfristig absagen</h1>
          <p style={{ margin: '0.4rem 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)' }}>Die Gruppe wird sofort informiert</p>
        </div>

        <div style={{ background: '#FEF9C3', border: '1px solid #FDE047', borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '1.25rem', fontSize: '0.88rem', color: '#92400E' }}>
          ℹ️ Eine Signal-Nachricht geht an die Kutscher-Gruppe: <strong>{pilot || 'Du'}</strong> kann heute nicht fahren.
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontWeight: 700, fontSize: '0.9rem', color: '#374151', marginBottom: '0.5rem' }}>
            Grund <span style={{ fontWeight: 400, color: '#6B7280' }}>(optional)</span>
          </label>
          <textarea rows={2} value={absageGrund} onChange={e => setAbsageGrund(e.target.value)}
            placeholder="z.B. Krank, privater Termin, …"
            style={{ width: '100%', border: '1.5px solid #D1D5DB', borderRadius: 10, padding: '0.65rem 0.85rem', fontSize: '1rem', lineHeight: 1.5, boxSizing: 'border-box', resize: 'vertical' }}
          />
        </div>

        {absageStatus === 'fehler' && (
          <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 8, padding: '0.6rem 0.9rem', fontSize: '0.9rem', color: '#DC2626', marginBottom: '0.75rem' }}>
            ❌ Fehler beim Senden. Bitte erneut versuchen.
          </div>
        )}

        <button type="button" onClick={absageAbschicken} disabled={absageStatus === 'senden'}
          style={{ width: '100%', padding: '1rem', borderRadius: 14, border: 'none', background: '#374151', color: '#fff', fontWeight: 800, fontSize: '1rem', cursor: 'pointer', marginBottom: '0.75rem' }}>
          {absageStatus === 'senden' ? '⏳ Wird gesendet…' : '📵 Absage senden'}
        </button>
        <button type="button" onClick={() => setAnsicht('menu')}
          style={{ width: '100%', padding: '0.7rem', borderRadius: 10, border: '1.5px solid #E5E7EB', background: 'none', color: '#6B7280', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer' }}>
          ← Zurück
        </button>
      </div>
    );
  }

  // Notfall-Formular
  if (ansicht === 'notfall') {
    const kat = kategorie ? KATEGORIEN.find(k => k.id === kategorie) : null;
    return (
      <div style={{ minHeight: '100dvh', background: '#fff', padding: '1rem', maxWidth: 480, margin: '0 auto' }}>
        <div style={{ background: '#7F1D1D', borderRadius: 14, padding: '1.25rem 1.5rem', marginBottom: '1.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.4rem' }}>🆘</div>
          <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>Notfall melden</h1>
          <p style={{ margin: '0.4rem 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)' }}>Signal-Nachricht geht sofort an alle Kutscher</p>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#374151', marginBottom: '0.6rem' }}>Was ist passiert?</div>
          <div style={{ display: 'grid', gap: '0.6rem' }}>
            {KATEGORIEN.map(k => (
              <button key={k.id} type="button" onClick={() => setKategorie(k.id)}
                style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.1rem', borderRadius: 12, border: `2.5px solid ${kategorie === k.id ? k.farbe : '#E5E7EB'}`, background: kategorie === k.id ? k.hintergrund : '#F9FAFB', cursor: 'pointer', textAlign: 'left' }}>
                <span style={{ fontSize: '2rem' }}>{k.icon}</span>
                <span style={{ fontWeight: 700, fontSize: '1rem', color: kategorie === k.id ? k.farbe : '#1a1a18' }}>{k.label}</span>
                {kategorie === k.id && <span style={{ marginLeft: 'auto', color: k.farbe, fontWeight: 700 }}>✓</span>}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontWeight: 700, fontSize: '0.9rem', color: '#374151', marginBottom: '0.5rem' }}>
            Kurze Beschreibung <span style={{ fontWeight: 400, color: '#6B7280' }}>(optional)</span>
          </label>
          <textarea rows={3} value={beschreibung} onChange={e => setBeschreibung(e.target.value)}
            placeholder="Was genau ist passiert? Wo genau bist du?"
            style={{ width: '100%', border: '1.5px solid #D1D5DB', borderRadius: 10, padding: '0.65rem 0.85rem', fontSize: '1rem', lineHeight: 1.5, boxSizing: 'border-box', resize: 'vertical' }} />
        </div>

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
          {standortStatus === 'laden' && <div style={{ color: '#6B7280', fontSize: '0.9rem', padding: '0.5rem 0' }}>⏳ Standort wird ermittelt…</div>}
          {standortStatus === 'ok' && standort && (
            <div style={{ background: '#F0FDF4', border: '1.5px solid #86EFAC', borderRadius: 10, padding: '0.6rem 0.9rem', fontSize: '0.9rem', color: '#15803D', fontWeight: 600 }}>
              ✅ Standort: {standort.lat.toFixed(5)}, {standort.lon.toFixed(5)}
              <button type="button" onClick={() => { setStandort(null); setStandortStatus('nein'); }}
                style={{ marginLeft: '0.75rem', background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', fontSize: '0.85rem' }}>entfernen</button>
            </div>
          )}
          {standortStatus === 'fehler' && <div style={{ color: '#DC2626', fontSize: '0.88rem', padding: '0.4rem 0' }}>❌ Standort konnte nicht ermittelt werden.</div>}
        </div>

        {notfallStatus === 'fehler' && (
          <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 8, padding: '0.6rem 0.9rem', fontSize: '0.9rem', color: '#DC2626', marginBottom: '0.75rem' }}>
            ❌ Fehler beim Senden. Bitte erneut versuchen.
          </div>
        )}

        <button type="button" onClick={notfallAbschicken} disabled={!kategorie || notfallStatus === 'senden'}
          style={{ width: '100%', padding: '1rem', borderRadius: 14, border: 'none', background: !kategorie ? '#E5E7EB' : (kat?.farbe ?? '#7F1D1D'), color: !kategorie ? '#9CA3AF' : '#fff', fontWeight: 800, fontSize: '1.1rem', cursor: !kategorie ? 'not-allowed' : 'pointer', boxShadow: !kategorie ? 'none' : '0 2px 8px rgba(127,29,29,0.3)', marginBottom: '0.75rem' }}>
          {notfallStatus === 'senden' ? '⏳ Wird gesendet…' : '🆘 Notfall melden & Signal senden'}
        </button>
        <button type="button" onClick={() => setAnsicht('menu')}
          style={{ width: '100%', padding: '0.7rem', borderRadius: 10, border: '1.5px solid #E5E7EB', background: 'none', color: '#6B7280', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer' }}>
          ← Zurück
        </button>
      </div>
    );
  }

  // Haupt-Menü
  return (
    <div style={{ minHeight: '100dvh', background: '#fff', padding: '1rem', maxWidth: 480, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', paddingTop: '1.5rem', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#1a1a18' }}>Schnellmeldung</h1>
        {pilot && <p style={{ margin: '0.3rem 0 0', fontSize: '0.9rem', color: '#6B7280' }}>{pilot}</p>}
      </div>

      {/* SOS */}
      <div style={{ marginBottom: '1rem' }}>
        <button type="button" onClick={() => setAnsicht('notfall')}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '1.1rem', background: '#FEF2F2', border: '2.5px solid #FECACA', borderRadius: 16, padding: '1.25rem 1.5rem', cursor: 'pointer', textAlign: 'left' }}>
          <span style={{ fontSize: '2.5rem' }}>🆘</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#7F1D1D' }}>Notfall melden</div>
            <div style={{ fontSize: '0.82rem', color: '#B91C1C', marginTop: '0.1rem' }}>Defekt, Unfall, medizinisch</div>
          </div>
          <span style={{ marginLeft: 'auto', color: '#B91C1C', fontSize: '1.3rem' }}>›</span>
        </button>
      </div>

      {/* Verspätung */}
      <div style={{ marginBottom: '1rem' }}>
        <button type="button" onClick={() => setAnsicht('verspaetung')}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '1.1rem', background: '#FFFBEB', border: '2.5px solid #FDE68A', borderRadius: 16, padding: '1.25rem 1.5rem', cursor: 'pointer', textAlign: 'left' }}>
          <span style={{ fontSize: '2.5rem' }}>⏰</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#92400E' }}>Verspätung melden</div>
            <div style={{ fontSize: '0.82rem', color: '#B45309', marginTop: '0.1rem' }}>15 / 30 / 45 / 60 Minuten</div>
          </div>
          <span style={{ marginLeft: 'auto', color: '#B45309', fontSize: '1.3rem' }}>›</span>
        </button>
      </div>

      {/* Absage */}
      <div style={{ marginBottom: '2rem' }}>
        <button type="button" onClick={() => setAnsicht('absage')}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '1.1rem', background: '#F9FAFB', border: '2.5px solid #E5E7EB', borderRadius: 16, padding: '1.25rem 1.5rem', cursor: 'pointer', textAlign: 'left' }}>
          <span style={{ fontSize: '2.5rem' }}>📵</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#374151' }}>Kurzfristig absagen</div>
            <div style={{ fontSize: '0.82rem', color: '#6B7280', marginTop: '0.1rem' }}>Gruppe wird sofort informiert</div>
          </div>
          <span style={{ marginLeft: 'auto', color: '#6B7280', fontSize: '1.3rem' }}>›</span>
        </button>
      </div>

      <p style={{ textAlign: 'center', fontSize: '0.78rem', color: '#9CA3AF', lineHeight: 1.5 }}>
        Alle Meldungen gehen per Signal an die Kutscher-Gruppe.
      </p>
    </div>
  );
}

function ErfolgScreen({ icon, titel, text }: { icon: string; titel: string; text: string }) {
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F0FDF4', padding: '1rem' }}>
      <div style={{ maxWidth: 420, width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>{icon}</div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#065F46', marginBottom: '0.75rem' }}>{titel}</h1>
        <p style={{ color: '#374151', marginBottom: '1.5rem', lineHeight: 1.6 }}>{text}</p>
        <a href="/" style={{ display: 'inline-block', background: '#2D6B1E', color: '#fff', padding: '0.75rem 2rem', borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: '1rem' }}>
          Zurück zur Startseite
        </a>
      </div>
    </div>
  );
}
