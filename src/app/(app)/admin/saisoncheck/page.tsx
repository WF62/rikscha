'use client';
import { useEffect, useState, useCallback } from 'react';
import { authHeaders } from '@/lib/authHeaders';

type Eintrag = {
  name: string;
  aktiv: boolean;
  letztefahrt: string | null;
  fahrtenLetztesSaison: number;
};

type Ergebnis = {
  saison: number;
  von: string;
  bis: string;
  kutscher: Eintrag[];
};

function datum(iso: string | null) {
  if (!iso) return '–';
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

export default function SaisoncheckPage() {
  const [zugang, setZugang] = useState<'pruefen' | 'ok' | 'nein'>('pruefen');
  const [ergebnis, setErgebnis] = useState<Ergebnis | null>(null);
  const [laden, setLaden] = useState(false);
  const [saison, setSaison] = useState(new Date().getFullYear() - 1);
  const [ausgewaehlt, setAusgewaehlt] = useState<Set<string>>(new Set());
  const [setzt, setSetzt] = useState(false);
  const [meldung, setMeldung] = useState('');

  useEffect(() => {
    const rolle = localStorage.getItem('pilot_rolle') ?? '';
    if (!['gfo', 'admin'].includes(rolle)) { setZugang('nein'); return; }
    setZugang('ok');
  }, []);

  const laden_ = useCallback(async (s: number) => {
    setLaden(true);
    setMeldung('');
    setAusgewaehlt(new Set());
    const res = await fetch(`/api/admin/saisoncheck?saison=${s}`, { headers: authHeaders() });
    if (res.ok) setErgebnis(await res.json());
    setLaden(false);
  }, []);

  useEffect(() => {
    if (zugang === 'ok') laden_(saison);
  }, [zugang, saison, laden_]);

  const toggleAlle = (namen: string[]) => {
    setAusgewaehlt(prev => {
      const alle = namen.every(n => prev.has(n));
      const neu = new Set(prev);
      if (alle) namen.forEach(n => neu.delete(n)); else namen.forEach(n => neu.add(n));
      return neu;
    });
  };

  const deaktivieren = async () => {
    if (!ausgewaehlt.size) return;
    if (!confirm(`${ausgewaehlt.size} Kutscher auf inaktiv setzen?`)) return;
    setSetzt(true);
    const res = await fetch('/api/admin/saisoncheck', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ namen: Array.from(ausgewaehlt) }),
    });
    if (res.ok) {
      const j = await res.json();
      setMeldung(`✓ ${j.deaktiviert} Kutscher deaktiviert.`);
      await laden_(saison);
    }
    setSetzt(false);
  };

  if (zugang === 'pruefen') return <p className="text-center text-gray-400 mt-16">Einen Moment …</p>;
  if (zugang === 'nein') return <div className="p-8 text-red-600">Kein Zugang.</div>;

  const nichtGefahren = ergebnis?.kutscher.filter(k => k.aktiv && k.fahrtenLetztesSaison === 0) ?? [];
  const gefahren = ergebnis?.kutscher.filter(k => k.aktiv && k.fahrtenLetztesSaison > 0) ?? [];
  const inaktiv = ergebnis?.kutscher.filter(k => !k.aktiv) ?? [];

  const aktuellesJahr = new Date().getFullYear();

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: '1.5rem 1rem', fontFamily: 'sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <a href="/admin" style={{ color: '#6B7280', fontSize: '0.9rem', textDecoration: 'none' }}>← Admin</a>
        <h1 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#1a1a18', flex: 1 }}>
          🌸 Saisoncheck
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.85rem', color: '#6B7280' }}>Saison:</label>
          <select value={saison} onChange={e => setSaison(Number(e.target.value))}
            style={{ border: '1.5px solid #D1D5DB', borderRadius: 7, padding: '0.35rem 0.6rem', fontSize: '0.9rem' }}>
            {Array.from({ length: 5 }, (_, i) => aktuellesJahr - 1 - i).map(j => (
              <option key={j} value={j}>Ostern {j} – Ostern {j + 1}</option>
            ))}
          </select>
        </div>
      </div>

      {ergebnis && (
        <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '1.5rem', fontSize: '0.85rem', color: '#6B7280' }}>
          Saison {ergebnis.saison}: {datum(ergebnis.von)} bis {datum(ergebnis.bis)}
        </div>
      )}

      {laden ? (
        <p style={{ color: '#6B7280', textAlign: 'center' }}>Laden …</p>
      ) : ergebnis ? (
        <>
          {/* Nicht gefahren */}
          <div style={{ background: '#FFF7ED', border: '1.5px solid #FED7AA', borderRadius: 12, padding: '1.25rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.9rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ fontWeight: 700, color: '#C2410C' }}>
                ⚠️ Nicht gefahren in Saison {ergebnis.saison} ({nichtGefahren.length})
              </div>
              {nichtGefahren.length > 0 && (
                <button onClick={() => toggleAlle(nichtGefahren.map(k => k.name))}
                  style={{ fontSize: '0.8rem', background: 'none', border: '1px solid #FED7AA', borderRadius: 6, padding: '0.25rem 0.6rem', cursor: 'pointer', color: '#C2410C' }}>
                  {nichtGefahren.every(k => ausgewaehlt.has(k.name)) ? 'Alle abwählen' : 'Alle auswählen'}
                </button>
              )}
            </div>

            {nichtGefahren.length === 0 ? (
              <p style={{ color: '#6B7280', margin: 0, fontSize: '0.9rem' }}>Alle aktiven Kutscher haben in dieser Saison mindestens eine Fahrt gemacht. 🎉</p>
            ) : (
              <div style={{ display: 'grid', gap: '0.4rem' }}>
                {nichtGefahren.map(k => (
                  <label key={k.name} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', padding: '0.4rem 0.5rem', borderRadius: 7, background: ausgewaehlt.has(k.name) ? '#FEE2E2' : '#fff', border: `1.5px solid ${ausgewaehlt.has(k.name) ? '#FCA5A5' : '#E5E7EB'}` }}>
                    <input type="checkbox" checked={ausgewaehlt.has(k.name)}
                      onChange={() => setAusgewaehlt(prev => { const n = new Set(prev); n.has(k.name) ? n.delete(k.name) : n.add(k.name); return n; })}
                      style={{ width: 16, height: 16, cursor: 'pointer' }} />
                    <span style={{ fontWeight: 600, flex: 1 }}>{k.name}</span>
                    <span style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>
                      Letzte Fahrt: {datum(k.letztefahrt)}
                    </span>
                  </label>
                ))}
              </div>
            )}

            {ausgewaehlt.size > 0 && (
              <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button onClick={deaktivieren} disabled={setzt}
                  style={{ background: '#DC2626', color: '#fff', border: 'none', borderRadius: 8, padding: '0.55rem 1.1rem', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}>
                  {setzt ? '…' : `${ausgewaehlt.size} Kutscher deaktivieren`}
                </button>
                <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>Sie bleiben gespeichert und können jederzeit reaktiviert werden.</span>
              </div>
            )}
            {meldung && <div style={{ marginTop: '0.75rem', color: '#15803D', fontWeight: 600, fontSize: '0.9rem' }}>{meldung}</div>}
          </div>

          {/* Gefahren */}
          <div style={{ background: '#F0FDF4', border: '1.5px solid #86EFAC', borderRadius: 12, padding: '1.25rem', marginBottom: '1.5rem' }}>
            <div style={{ fontWeight: 700, color: '#15803D', marginBottom: '0.75rem' }}>✓ Aktiv gefahren ({gefahren.length})</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {gefahren.map(k => (
                <div key={k.name} style={{ background: '#fff', border: '1px solid #86EFAC', borderRadius: 7, padding: '0.3rem 0.7rem', fontSize: '0.88rem' }}>
                  <span style={{ fontWeight: 600 }}>{k.name}</span>
                  <span style={{ color: '#6B7280', marginLeft: '0.4rem' }}>{k.fahrtenLetztesSaison}×</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bereits inaktiv */}
          {inaktiv.length > 0 && (
            <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 12, padding: '1rem 1.25rem' }}>
              <div style={{ fontWeight: 600, color: '#6B7280', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Bereits inaktiv ({inaktiv.length})</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {inaktiv.map(k => (
                  <span key={k.name} style={{ fontSize: '0.85rem', color: '#9CA3AF', background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: 6, padding: '0.2rem 0.5rem' }}>{k.name}</span>
                ))}
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
