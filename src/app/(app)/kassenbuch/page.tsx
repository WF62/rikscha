'use client';
import { useEffect, useState } from 'react';

const ERLAUBT = ['kutscher-admin', 'gfo', 'admin'];
const KATEGORIEN_EINNAHME = ['Spende', 'Förderung', 'Mitgliedsbeitrag', 'Sonstiges'];
const KATEGORIEN_AUSGABE = ['Fahrtkosten', 'Wartung/Reparatur', 'Material', 'Versicherung', 'Verwaltung', 'Sonstiges'];

type Eintrag = {
  id: string; typ: 'einnahme' | 'ausgabe'; betrag: number; datum: string;
  beschreibung: string; kategorie?: string; fahrtenbuch_id?: string;
  eingetragen_von: string; eingetragen_am: string;
};

function formatDatum(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function euro(n: number) { return n.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' }); }

export default function Kassenbuch() {
  const [zugang, setZugang] = useState<'laden' | 'nein' | 'ja'>('laden');
  const [pilot, setPilot] = useState('');
  const [pw, setPw] = useState('');
  const [eintraege, setEintraege] = useState<Eintrag[]>([]);
  const [laedt, setLaedt] = useState(false);

  const jetzt = new Date();
  const [filterVon, setFilterVon] = useState(`${jetzt.getFullYear()}-01-01`);
  const [filterBis, setFilterBis] = useState(jetzt.toISOString().slice(0, 10));
  const [filterTyp, setFilterTyp] = useState('');

  // Neuer Eintrag
  const [neTyp, setNeTyp] = useState<'einnahme' | 'ausgabe'>('ausgabe');
  const [neBetrag, setNeBetrag] = useState('');
  const [neDatum, setNeDatum] = useState(jetzt.toISOString().slice(0, 10));
  const [neBeschreibung, setNeBeschreibung] = useState('');
  const [neKategorie, setNeKategorie] = useState('');
  const [speichert, setSpeichert] = useState(false);
  const [fehler, setFehler] = useState('');
  const [erfolg, setErfolg] = useState('');

  useEffect(() => {
    try {
      const n = localStorage.getItem('pilot_name') ?? '';
      const p = localStorage.getItem('pilot_pw') ?? '';
      const r = localStorage.getItem('pilot_rolle') ?? '';
      if (n && p && ERLAUBT.includes(r)) { setPilot(n); setPw(p); setZugang('ja'); }
      else setZugang('nein');
    } catch { setZugang('nein'); }
  }, []);

  const laden = () => {
    if (!pilot || !pw) return;
    setLaedt(true);
    const p = new URLSearchParams({ pilot, password: pw, von: filterVon, bis: filterBis });
    if (filterTyp) p.set('typ', filterTyp);
    fetch(`/api/kassenbuch?${p}`).then(r => r.json()).then(d => { setEintraege(Array.isArray(d) ? d : []); setLaedt(false); }).catch(() => setLaedt(false));
  };

  useEffect(() => { if (zugang === 'ja') laden(); }, [zugang, filterVon, filterBis, filterTyp]);

  const speichern = async () => {
    if (!neBetrag || !neBeschreibung.trim()) { setFehler('Betrag und Beschreibung sind erforderlich.'); return; }
    setSpeichert(true); setFehler(''); setErfolg('');
    const res = await fetch('/api/kassenbuch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pilot, password: pw, typ: neTyp, betrag: parseFloat(neBetrag), datum: neDatum, beschreibung: neBeschreibung.trim(), kategorie: neKategorie || null }),
    });
    setSpeichert(false);
    if (!res.ok) { const d = await res.json(); setFehler(d.error ?? 'Fehler.'); return; }
    setErfolg('Eintrag gespeichert.');
    setNeBetrag(''); setNeBeschreibung(''); setNeKategorie('');
    laden();
  };

  const loeschen = async (id: string) => {
    if (!confirm('Eintrag wirklich löschen?')) return;
    await fetch('/api/kassenbuch', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pilot, password: pw, id }) });
    setEintraege(e => e.filter(x => x.id !== id));
  };

  const csvExport = () => {
    const header = ['Datum', 'Typ', 'Betrag (€)', 'Beschreibung', 'Kategorie', 'Eingetragen von'];
    const rows = eintraege.map(e => [
      formatDatum(e.datum), e.typ === 'einnahme' ? 'Einnahme' : 'Ausgabe',
      e.betrag.toFixed(2).replace('.', ','), e.beschreibung, e.kategorie ?? '', e.eingetragen_von,
    ]);
    const csv = [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `Kassenbuch_${filterVon}_${filterBis}.csv`; a.click();
  };

  if (zugang === 'laden') return <div style={{ padding: '2rem', textAlign: 'center' }}>⏳</div>;
  if (zugang === 'nein') return <div style={{ padding: '2rem', color: '#dc2626' }}>Zugang nur für Kutscher-Admin und Admin.</div>;

  const einnahmen = eintraege.filter(e => e.typ === 'einnahme').reduce((s, e) => s + e.betrag, 0);
  const ausgaben = eintraege.filter(e => e.typ === 'ausgabe').reduce((s, e) => s + e.betrag, 0);
  const saldo = einnahmen - ausgaben;

  const inp: React.CSSProperties = { border: '1.5px solid #D6CCB8', borderRadius: 7, padding: '0.45rem 0.6rem', fontSize: '0.88rem', background: '#fff', width: '100%', boxSizing: 'border-box' };
  const lbl: React.CSSProperties = { display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#5C4E38', marginBottom: '0.25rem' };

  return (
    <div style={{ maxWidth: 980, margin: '0 auto', padding: '1.5rem 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2D6B1E', margin: 0 }}>💶 Kassenbuch</h1>
        <button onClick={csvExport} style={{ background: '#1D4ED8', color: '#fff', border: 'none', borderRadius: 8, padding: '0.5rem 1rem', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer' }}>⬇ CSV</button>
      </div>

      {/* Filter */}
      <div style={{ background: '#F7F3EC', border: '1.5px solid #D6CCB8', borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <label style={{ fontSize: '0.82rem', color: '#5C4E38' }}>Von</label>
        <input style={{ ...inp, width: 'auto' }} type="date" value={filterVon} onChange={e => setFilterVon(e.target.value)} />
        <label style={{ fontSize: '0.82rem', color: '#5C4E38' }}>Bis</label>
        <input style={{ ...inp, width: 'auto' }} type="date" value={filterBis} onChange={e => setFilterBis(e.target.value)} />
        <select style={{ ...inp, width: 'auto' }} value={filterTyp} onChange={e => setFilterTyp(e.target.value)}>
          <option value="">Einnahmen & Ausgaben</option>
          <option value="einnahme">Nur Einnahmen</option>
          <option value="ausgabe">Nur Ausgaben</option>
        </select>
        {laedt && <span style={{ fontSize: '0.82rem', color: '#9CA3AF' }}>⏳</span>}
      </div>

      {/* Saldo-Kacheln */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <div style={{ background: '#D1FAE5', border: '1.5px solid #6EE7B7', borderRadius: 10, padding: '0.75rem 1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#065F46' }}>{euro(einnahmen)}</div>
          <div style={{ fontSize: '0.75rem', color: '#065F46' }}>Einnahmen</div>
        </div>
        <div style={{ background: '#FEE2E2', border: '1.5px solid #FCA5A5', borderRadius: 10, padding: '0.75rem 1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#991B1B' }}>{euro(ausgaben)}</div>
          <div style={{ fontSize: '0.75rem', color: '#991B1B' }}>Ausgaben</div>
        </div>
        <div style={{ background: saldo >= 0 ? '#EFF6FF' : '#FEF3C7', border: `1.5px solid ${saldo >= 0 ? '#93C5FD' : '#FCD34D'}`, borderRadius: 10, padding: '0.75rem 1rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: saldo >= 0 ? '#1D4ED8' : '#B45309' }}>{euro(saldo)}</div>
          <div style={{ fontSize: '0.75rem', color: saldo >= 0 ? '#1D4ED8' : '#B45309' }}>Saldo</div>
        </div>
      </div>

      {/* Neuer Eintrag */}
      <details style={{ background: '#F7F3EC', border: '1.5px solid #D6CCB8', borderRadius: 12, padding: '1rem', marginBottom: '1.25rem' }}>
        <summary style={{ fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer' }}>+ Manuellen Eintrag hinzufügen</summary>
        <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.6rem' }}>
          <div>
            <label style={lbl}>Typ</label>
            <select style={inp} value={neTyp} onChange={e => setNeTyp(e.target.value as 'einnahme' | 'ausgabe')}>
              <option value="einnahme">Einnahme</option>
              <option value="ausgabe">Ausgabe</option>
            </select>
          </div>
          <div>
            <label style={lbl}>Betrag (€)</label>
            <input style={inp} type="number" min={0.01} step={0.01} value={neBetrag} onChange={e => setNeBetrag(e.target.value)} placeholder="0,00" />
          </div>
          <div>
            <label style={lbl}>Datum</label>
            <input style={inp} type="date" value={neDatum} onChange={e => setNeDatum(e.target.value)} />
          </div>
          <div>
            <label style={lbl}>Kategorie</label>
            <select style={inp} value={neKategorie} onChange={e => setNeKategorie(e.target.value)}>
              <option value="">– wählen –</option>
              {(neTyp === 'einnahme' ? KATEGORIEN_EINNAHME : KATEGORIEN_AUSGABE).map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={lbl}>Beschreibung *</label>
            <input style={inp} value={neBeschreibung} onChange={e => setNeBeschreibung(e.target.value)} placeholder="z.B. Ersatzteile Rikscha 1" />
          </div>
        </div>
        {fehler && <div style={{ marginTop: '0.5rem', background: '#FEE2E2', color: '#DC2626', borderRadius: 7, padding: '0.4rem 0.75rem', fontSize: '0.84rem' }}>❌ {fehler}</div>}
        {erfolg && <div style={{ marginTop: '0.5rem', background: '#D1FAE5', color: '#065F46', borderRadius: 7, padding: '0.4rem 0.75rem', fontSize: '0.84rem' }}>✅ {erfolg}</div>}
        <button onClick={speichern} disabled={speichert} style={{ marginTop: '0.75rem', background: '#2D6B1E', color: '#fff', border: 'none', borderRadius: 7, padding: '0.5rem 1.1rem', fontWeight: 700, fontSize: '0.88rem', cursor: speichert ? 'not-allowed' : 'pointer', opacity: speichert ? 0.6 : 1 }}>
          {speichert ? '⏳ Speichern…' : '✓ Speichern'}
        </button>
      </details>

      {/* Tabelle */}
      {eintraege.length === 0 && !laedt && <p style={{ color: '#9CA3AF', fontSize: '0.9rem' }}>Keine Einträge für diesen Zeitraum.</p>}
      {eintraege.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: '#F7F3EC', borderBottom: '2px solid #D6CCB8' }}>
                {['Datum', 'Typ', 'Beschreibung', 'Kategorie', 'Betrag', 'Von', ''].map(h => (
                  <th key={h} style={{ padding: '0.5rem 0.6rem', textAlign: h === 'Betrag' ? 'right' : 'left', fontWeight: 700, color: '#5C4E38', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {eintraege.map((e, i) => (
                <tr key={e.id} style={{ background: i % 2 === 0 ? '#fff' : '#FAFAF8', borderBottom: '1px solid #F0EBE0' }}>
                  <td style={{ padding: '0.45rem 0.6rem', whiteSpace: 'nowrap' }}>{formatDatum(e.datum)}</td>
                  <td style={{ padding: '0.45rem 0.6rem' }}>
                    <span style={{ background: e.typ === 'einnahme' ? '#D1FAE5' : '#FEE2E2', color: e.typ === 'einnahme' ? '#065F46' : '#991B1B', borderRadius: 5, padding: '0.1rem 0.5rem', fontSize: '0.78rem', fontWeight: 700 }}>
                      {e.typ === 'einnahme' ? '+ Einnahme' : '− Ausgabe'}
                    </span>
                  </td>
                  <td style={{ padding: '0.45rem 0.6rem', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {e.beschreibung}
                    {e.fahrtenbuch_id && <span style={{ marginLeft: '0.4rem', fontSize: '0.72rem', color: '#9CA3AF' }}>📒</span>}
                  </td>
                  <td style={{ padding: '0.45rem 0.6rem', color: '#5C4E38', fontSize: '0.8rem' }}>{e.kategorie ?? ''}</td>
                  <td style={{ padding: '0.45rem 0.6rem', textAlign: 'right', fontWeight: 700, color: e.typ === 'einnahme' ? '#065F46' : '#991B1B', whiteSpace: 'nowrap' }}>
                    {e.typ === 'einnahme' ? '+' : '−'} {euro(e.betrag)}
                  </td>
                  <td style={{ padding: '0.45rem 0.6rem', fontSize: '0.78rem', color: '#9CA3AF' }}>{e.eingetragen_von}</td>
                  <td style={{ padding: '0.45rem 0.6rem' }}>
                    {!e.fahrtenbuch_id && (
                      <button onClick={() => loeschen(e.id)} style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', fontSize: '0.78rem', padding: '0.1rem 0.3rem' }}>✕</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
