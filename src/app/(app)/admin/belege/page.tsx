'use client';
import { useEffect, useState, useCallback } from 'react';
import { authHeaders } from '@/lib/authHeaders';

type Einweisung = {
  id: string;
  kutscher_name: string;
  fahrzeug_id: string;
  eingewiesen_von: string;
  eingewiesen_am: string;
  beleg_url?: string;
};
type Fahrzeug = { id: string; name: string };

export default function BelegePage() {
  const [zugang, setZugang] = useState<'pruefen' | 'ok' | 'nein'>('pruefen');
  const [einweisungen, setEinweisungen] = useState<Einweisung[]>([]);
  const [fahrzeuge, setFahrzeuge] = useState<Fahrzeug[]>([]);
  const [laden, setLaden] = useState(true);
  const [filter, setFilter] = useState<'alle' | 'offen' | 'erledigt'>('alle');
  const [suchtext, setSuchtext] = useState('');

  useEffect(() => {
    const rolle = localStorage.getItem('kutscher_rolle') ?? '';
    if (!['kutscher-admin', 'gfo', 'admin'].includes(rolle)) { setZugang('nein'); return; }
    setZugang('ok');
    laden_();
  }, []);

  const laden_ = useCallback(async () => {
    setLaden(true);
    const h = authHeaders();
    const [ewRes, fzRes] = await Promise.all([
      fetch('/api/kutscher-fahrzeuge', { headers: h }),
      fetch('/api/fahrzeuge', { headers: h }),
    ]);
    if (ewRes.ok) setEinweisungen(await ewRes.json());
    if (fzRes.ok) setFahrzeuge(await fzRes.json());
    setLaden(false);
  }, []);

  if (zugang === 'pruefen') return <p style={{ textAlign: 'center', color: '#9CA3AF', marginTop: '4rem' }}>Einen Moment …</p>;
  if (zugang === 'nein') return <div style={{ padding: '2rem', color: '#DC2626' }}>Kein Zugang.</div>;

  const fzName = (id: string) => fahrzeuge.find(f => f.id === id)?.name ?? id;

  const gefiltert = einweisungen
    .filter(e => {
      if (filter === 'offen') return !e.beleg_url;
      if (filter === 'erledigt') return !!e.beleg_url;
      return true;
    })
    .filter(e => {
      if (!suchtext) return true;
      const s = suchtext.toLowerCase();
      return e.kutscher_name.toLowerCase().includes(s) || fzName(e.fahrzeug_id).toLowerCase().includes(s);
    })
    .sort((a, b) => {
      // Offene zuerst, dann nach Name
      if (!a.beleg_url && b.beleg_url) return -1;
      if (a.beleg_url && !b.beleg_url) return 1;
      return a.kutscher_name.localeCompare(b.kutscher_name, 'de');
    });

  const anzahlOffen = einweisungen.filter(e => !e.beleg_url).length;
  const anzahlErledigt = einweisungen.filter(e => !!e.beleg_url).length;

  // Kutscher mit mind. einer offenen Einweisung
  const kutscherOffen = Array.from(new Set(
    einweisungen.filter(e => !e.beleg_url).map(e => e.kutscher_name)
  )).length;

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: '1.5rem 1rem', fontFamily: 'sans-serif' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <a href="/admin/einweisungen" style={{ color: '#6B7280', fontSize: '0.9rem', textDecoration: 'none' }}>← Einweisungen</a>
        <h1 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#1a1a18' }}>📋 Einweisungsbelege</h1>
      </div>

      {/* Kennzahlen */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Gesamt', zahl: einweisungen.length, bg: '#F9FAFB', border: '#E5E7EB', farbe: '#374151' },
          { label: 'Beleg fehlt', zahl: anzahlOffen, bg: '#FEF2F2', border: '#FCA5A5', farbe: '#DC2626' },
          { label: 'Unterschrieben', zahl: anzahlErledigt, bg: '#F0FDF4', border: '#86EFAC', farbe: '#059669' },
        ].map(k => (
          <div key={k.label} style={{ background: k.bg, border: `1.5px solid ${k.border}`, borderRadius: 10, padding: '0.9rem 1rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: k.farbe }}>{k.zahl}</div>
            <div style={{ fontSize: '0.8rem', color: '#6B7280', marginTop: '0.1rem' }}>{k.label}</div>
          </div>
        ))}
      </div>

      {anzahlOffen > 0 && (
        <div style={{ background: '#FEF9C3', border: '1.5px solid #FDE047', borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '1.25rem', fontSize: '0.88rem', color: '#92400E' }}>
          ⚠️ <strong>{kutscherOffen} {kutscherOffen === 1 ? 'Kutscher hat' : 'Kutscher haben'}</strong> noch {anzahlOffen === 1 ? 'einen offenen Beleg' : `${anzahlOffen} offene Belege`} — bitte unterschreiben und speichern.
        </div>
      )}

      {/* Filter + Suche */}
      <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        {(['alle', 'offen', 'erledigt'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{
              border: '1.5px solid', borderRadius: 7, padding: '0.35rem 0.9rem', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
              background: filter === f ? '#2D6B1E' : '#fff',
              color: filter === f ? '#fff' : '#374151',
              borderColor: filter === f ? '#2D6B1E' : '#D1D5DB',
            }}>
            {f === 'alle' ? `Alle (${einweisungen.length})` : f === 'offen' ? `Offen (${anzahlOffen})` : `Erledigt (${anzahlErledigt})`}
          </button>
        ))}
        <input value={suchtext} onChange={e => setSuchtext(e.target.value)}
          placeholder="Suche nach Kutscher oder Fahrzeug …"
          style={{ flex: 1, minWidth: 180, border: '1.5px solid #D1D5DB', borderRadius: 7, padding: '0.35rem 0.75rem', fontSize: '0.85rem' }} />
      </div>

      {/* Tabelle */}
      {laden ? (
        <p style={{ color: '#9CA3AF', textAlign: 'center', padding: '2rem' }}>Laden …</p>
      ) : gefiltert.length === 0 ? (
        <p style={{ color: '#9CA3AF', textAlign: 'center', padding: '2rem' }}>Keine Einträge gefunden.</p>
      ) : (
        <div style={{ background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: '2px solid #E5E7EB' }}>
                {['Status', 'Kutscher', 'Fahrzeug', 'Eingewiesen am', 'Eingewiesen durch', 'Beleg'].map(h => (
                  <th key={h} style={{ padding: '0.65rem 0.75rem', fontSize: '0.78rem', fontWeight: 700, color: '#6B7280', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {gefiltert.map((e, i) => {
                const params = new URLSearchParams({
                  id: e.id,
                  kutscher: e.kutscher_name,
                  fahrzeug: fzName(e.fahrzeug_id),
                  datum: e.eingewiesen_am ?? '',
                  von: e.eingewiesen_von ?? '',
                });
                return (
                  <tr key={e.id} style={{ borderBottom: i < gefiltert.length - 1 ? '1px solid #F3F4F6' : 'none', background: e.beleg_url ? '#fff' : '#FFFBEB' }}>
                    <td style={{ padding: '0.65rem 0.75rem' }}>
                      {e.beleg_url
                        ? <span style={{ background: '#D1FAE5', color: '#065F46', borderRadius: 5, padding: '0.2rem 0.6rem', fontSize: '0.78rem', fontWeight: 700 }}>✓ Unterschrieben</span>
                        : <span style={{ background: '#FEE2E2', color: '#DC2626', borderRadius: 5, padding: '0.2rem 0.6rem', fontSize: '0.78rem', fontWeight: 700 }}>⚠ Offen</span>
                      }
                    </td>
                    <td style={{ padding: '0.65rem 0.75rem', fontWeight: 600, fontSize: '0.9rem' }}>{e.kutscher_name}</td>
                    <td style={{ padding: '0.65rem 0.75rem', fontSize: '0.88rem', color: '#374151' }}>{fzName(e.fahrzeug_id)}</td>
                    <td style={{ padding: '0.65rem 0.75rem', fontSize: '0.85rem', color: '#6B7280', whiteSpace: 'nowrap' }}>
                      {e.eingewiesen_am ? new Date(e.eingewiesen_am + 'T00:00:00').toLocaleDateString('de-DE') : '–'}
                    </td>
                    <td style={{ padding: '0.65rem 0.75rem', fontSize: '0.85rem', color: '#6B7280' }}>{e.eingewiesen_von || '–'}</td>
                    <td style={{ padding: '0.65rem 0.75rem' }}>
                      {e.beleg_url ? (
                        <a href={e.beleg_url} target="_blank" rel="noopener noreferrer"
                          style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 6, color: '#065F46', fontSize: '0.8rem', padding: '0.25rem 0.6rem', textDecoration: 'none', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          📄 PDF öffnen
                        </a>
                      ) : (
                        <a href={`/einweisungsbeleg?${params.toString()}`} target="_blank" rel="noopener noreferrer"
                          style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 6, color: '#1D4ED8', fontSize: '0.8rem', padding: '0.25rem 0.6rem', textDecoration: 'none', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          🖊️ Ausfüllen
                        </a>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
