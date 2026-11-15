'use client';
import { useEffect, useState } from 'react';

type Thema = { id: number; gruppe: string; punkte: string[]; reihenfolge: number; fahrzeug_typ: string | null };

const FAHRZEUGE = ['flinker_flitzer', 'flotte_lotte', 'flotte_lotte_2', 'hase', 'jruuse_piter'];

export default function EinweisungsthemenAdmin() {
  const [themen, setThemen] = useState<Thema[]>([]);
  const [laden, setLaden] = useState(true);
  const [meldung, setMeldung] = useState('');
  const [filter, setFilter] = useState<'alle' | 'gemeinsam' | string>('alle');

  const headers = () => ({
    'Content-Type': 'application/json',
    'x-admin-password': localStorage.getItem('admin_auth_token') ?? '',
  });

  const fahrzeugLabel = (key: string) =>
    key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const laden_ = () => {
    setLaden(true);
    fetch('/api/einweisungsthemen?admin=1')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setThemen(d); })
      .finally(() => setLaden(false));
  };

  useEffect(() => { laden_(); }, []);

  const zeig = (msg: string) => { setMeldung(msg); setTimeout(() => setMeldung(''), 3000); };

  const speichern = async (t: Thema) => {
    const r = await fetch('/api/einweisungsthemen', {
      method: 'PUT', headers: headers(), body: JSON.stringify(t),
    });
    if (!r.ok) zeig('Fehler beim Speichern.');
  };

  const loeschen = async (id: number) => {
    if (!confirm('Gruppe wirklich löschen?')) return;
    const r = await fetch('/api/einweisungsthemen', {
      method: 'DELETE', headers: headers(), body: JSON.stringify({ id }),
    });
    if (r.ok) { zeig('Gelöscht.'); laden_(); }
    else zeig('Fehler beim Löschen.');
  };

  const neueGruppe = async () => {
    const name = prompt('Name der neuen Gruppe:');
    if (!name) return;
    const ftyp = filter === 'alle' || filter === 'gemeinsam' ? null : filter;
    const gleicheTyp = themen.filter(t => t.fahrzeug_typ === ftyp);
    const max = Math.max(0, ...gleicheTyp.map(t => t.reihenfolge));
    const r = await fetch('/api/einweisungsthemen', {
      method: 'POST', headers: headers(),
      body: JSON.stringify({ gruppe: name, punkte: [], reihenfolge: max + 1, fahrzeug_typ: ftyp }),
    });
    if (r.ok) { zeig('Gruppe angelegt.'); laden_(); }
    else zeig('Fehler.');
  };

  const updateGruppe = (id: number, gruppe: string) =>
    setThemen(prev => prev.map(t => t.id === id ? { ...t, gruppe } : t));

  const updatePunkt = (id: number, idx: number, wert: string) =>
    setThemen(prev => prev.map(t => t.id === id
      ? { ...t, punkte: t.punkte.map((p, i) => i === idx ? wert : p) } : t));

  const punktLoeschen = (id: number, idx: number) =>
    setThemen(prev => prev.map(t => t.id === id
      ? { ...t, punkte: t.punkte.filter((_, i) => i !== idx) } : t));

  const punktHinzufuegen = (id: number) =>
    setThemen(prev => prev.map(t => t.id === id
      ? { ...t, punkte: [...t.punkte, ''] } : t));

  const setFahrzeugTyp = (id: number, typ: string | null) =>
    setThemen(prev => prev.map(t => t.id === id ? { ...t, fahrzeug_typ: typ } : t));

  const verschiebenOben = (liste: Thema[], idx: number) => {
    if (idx === 0) return;
    setThemen(prev => {
      const neu = [...prev];
      const a = neu.findIndex(t => t.id === liste[idx - 1].id);
      const b = neu.findIndex(t => t.id === liste[idx].id);
      [neu[a], neu[b]] = [neu[b], neu[a]];
      neu[a].reihenfolge = a + 1;
      neu[b].reihenfolge = b + 1;
      return [...neu];
    });
  };

  const verschiebenUnten = (liste: Thema[], idx: number) => {
    if (idx === liste.length - 1) return;
    setThemen(prev => {
      const neu = [...prev];
      const a = neu.findIndex(t => t.id === liste[idx].id);
      const b = neu.findIndex(t => t.id === liste[idx + 1].id);
      [neu[a], neu[b]] = [neu[b], neu[a]];
      neu[a].reihenfolge = a + 1;
      neu[b].reihenfolge = b + 1;
      return [...neu];
    });
  };

  const allesSpeichern = async () => {
    for (const t of sichtbar) await speichern(t);
    zeig('Alle Änderungen gespeichert.');
  };

  const sichtbar = themen.filter(t => {
    if (filter === 'alle') return true;
    if (filter === 'gemeinsam') return t.fahrzeug_typ === null;
    return t.fahrzeug_typ === filter;
  });

  if (laden) return <div style={{ padding: '2rem' }}>Lädt…</div>;

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#2D6B1E' }}>Einweisungsthemen</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={neueGruppe} style={{ background: '#2D6B1E', color: '#fff', border: 'none', borderRadius: 6, padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 600 }}>
            + Neue Gruppe
          </button>
          <button onClick={allesSpeichern} style={{ background: '#1D4ED8', color: '#fff', border: 'none', borderRadius: 6, padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 600 }}>
            Alle speichern
          </button>
        </div>
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        {[{ key: 'alle', label: 'Alle' }, { key: 'gemeinsam', label: '🌐 Gemeinsam (alle Fahrzeuge)' }, ...FAHRZEUGE.map(f => ({ key: f, label: fahrzeugLabel(f) }))].map(o => (
          <button key={o.key} onClick={() => setFilter(o.key)}
            style={{ background: filter === o.key ? '#2D6B1E' : '#F3F4F6', color: filter === o.key ? '#fff' : '#374151', border: 'none', borderRadius: 20, padding: '0.3rem 0.9rem', cursor: 'pointer', fontWeight: filter === o.key ? 700 : 400, fontSize: '0.85rem' }}>
            {o.label}
          </button>
        ))}
      </div>

      {meldung && (
        <div style={{ background: '#D1FAE5', color: '#065F46', borderRadius: 6, padding: '0.6rem 1rem', marginBottom: '1rem', fontWeight: 600 }}>
          {meldung}
        </div>
      )}

      {sichtbar.length === 0 && (
        <div style={{ color: '#9CA3AF', textAlign: 'center', padding: '2rem' }}>
          Keine Gruppen für diese Auswahl. Mit „+ Neue Gruppe" hinzufügen.
        </div>
      )}

      {sichtbar.map((t, idx) => (
        <div key={t.id} style={{ background: '#fff', border: `1.5px solid ${t.fahrzeug_typ ? '#FDE68A' : '#86EFAC'}`, borderRadius: 8, padding: '1rem', marginBottom: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <button onClick={() => verschiebenOben(sichtbar, idx)} disabled={idx === 0}
                style={{ background: 'none', border: '1px solid #D1D5DB', borderRadius: 4, cursor: 'pointer', padding: '1px 6px', fontSize: '0.75rem', color: idx === 0 ? '#D1D5DB' : '#374151' }}>▲</button>
              <button onClick={() => verschiebenUnten(sichtbar, idx)} disabled={idx === sichtbar.length - 1}
                style={{ background: 'none', border: '1px solid #D1D5DB', borderRadius: 4, cursor: 'pointer', padding: '1px 6px', fontSize: '0.75rem', color: idx === sichtbar.length - 1 ? '#D1D5DB' : '#374151' }}>▼</button>
            </div>
            <input value={t.gruppe} onChange={e => updateGruppe(t.id, e.target.value)}
              style={{ flex: 1, fontSize: '1rem', fontWeight: 700, border: '1px solid #D1D5DB', borderRadius: 6, padding: '0.4rem 0.6rem', color: '#2D6B1E', minWidth: 180 }} />
            <select value={t.fahrzeug_typ ?? ''} onChange={e => setFahrzeugTyp(t.id, e.target.value || null)}
              style={{ fontSize: '0.82rem', border: '1px solid #D1D5DB', borderRadius: 6, padding: '0.35rem 0.5rem', background: t.fahrzeug_typ ? '#FEF9C3' : '#F0FDF4', color: '#374151' }}>
              <option value="">🌐 Alle Fahrzeuge</option>
              {FAHRZEUGE.map(f => <option key={f} value={f}>{fahrzeugLabel(f)}</option>)}
            </select>
            <button onClick={() => speichern(t)} style={{ background: '#2D6B1E', color: '#fff', border: 'none', borderRadius: 6, padding: '0.4rem 0.75rem', cursor: 'pointer', fontSize: '0.85rem' }}>Speichern</button>
            <button onClick={() => loeschen(t.id)} style={{ background: '#FEE2E2', color: '#991B1B', border: 'none', borderRadius: 6, padding: '0.4rem 0.75rem', cursor: 'pointer', fontSize: '0.85rem' }}>Löschen</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {t.punkte.map((p, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                <span style={{ color: '#9CA3AF', fontSize: '0.8rem', minWidth: 20 }}>{i + 1}.</span>
                <input value={p} onChange={e => updatePunkt(t.id, i, e.target.value)}
                  style={{ flex: 1, fontSize: '0.9rem', border: '1px solid #E5E7EB', borderRadius: 5, padding: '0.3rem 0.5rem' }} />
                <button onClick={() => punktLoeschen(t.id, i)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', fontSize: '1rem', padding: '0 0.3rem' }}>✕</button>
              </div>
            ))}
            <button onClick={() => punktHinzufuegen(t.id)}
              style={{ alignSelf: 'flex-start', background: 'none', border: '1px dashed #9CA3AF', borderRadius: 5, padding: '0.25rem 0.75rem', cursor: 'pointer', color: '#6B7280', fontSize: '0.85rem', marginTop: '0.25rem' }}>
              + Punkt hinzufügen
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
