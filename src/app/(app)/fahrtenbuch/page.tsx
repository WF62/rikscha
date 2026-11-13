'use client';
import { useEffect, useState } from 'react';

const ERLAUBT_VOLL = ['kutscher-admin', 'gfo', 'admin'];
const ERLAUBT_ALLE = ['kutscher', 'kutscher-admin', 'pilot', 'gfo', 'admin'];

type Eintrag = {
  id: string; buchung_id?: string; fahrzeug: string; datum: string;
  startzeit?: string; endzeit?: string; kutscher: string; fahrttyp: string;
  gast_name?: string; anzahl_fahrgaeste: number; km_start?: number; km_ende?: number;
  spenden: number; wetter?: string; schaden: boolean; schaden_beschreibung?: string;
  bemerkungen?: string; eingetragen_von: string; eingetragen_am: string;
};

function formatDatum(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function euro(n: number) { return n.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' }); }
function wetterIcon(w?: string) {
  return { sonne: '☀️', bewoelkt: '⛅', regen: '🌧', schnee: '❄️' }[w ?? ''] ?? '';
}

export default function Fahrtenbuch() {
  const [zugang, setZugang] = useState<'laden' | 'nein' | 'ja'>('laden');
  const [pilot, setPilot] = useState('');
  const [pw, setPw] = useState('');
  const [rolle, setRolle] = useState('');
  const [eintraege, setEintraege] = useState<Eintrag[]>([]);
  const [laedt, setLaedt] = useState(false);
  const [fahrzeuge, setFahrzeuge] = useState<string[]>([]);

  const [filterFahrzeug, setFilterFahrzeug] = useState('');
  const jetzt = new Date();
  const [filterVon, setFilterVon] = useState(`${jetzt.getFullYear()}-01-01`);
  const [filterBis, setFilterBis] = useState(jetzt.toISOString().slice(0, 10));
  const [nurEigen, setNurEigen] = useState(false);

  const hatVolleRechte = ERLAUBT_VOLL.includes(rolle);

  useEffect(() => {
    try {
      const n = localStorage.getItem('pilot_name') ?? '';
      const p = localStorage.getItem('pilot_pw') ?? '';
      const r = localStorage.getItem('pilot_rolle') ?? '';
      if (n && p && ERLAUBT_ALLE.includes(r)) { setPilot(n); setPw(p); setRolle(r); setZugang('ja'); }
      else setZugang('nein');
    } catch { setZugang('nein'); }
  }, []);

  useEffect(() => {
    if (zugang !== 'ja') return;
    fetch('/api/stammdaten').then(r => r.json()).then((data: { fahrzeuge: { name: string }[] }) => {
      if (Array.isArray(data?.fahrzeuge)) setFahrzeuge(data.fahrzeuge.map((f: { name: string }) => f.name));
    }).catch(() => {});
  }, [zugang]);

  const laden = () => {
    if (!pilot || !pw) return;
    setLaedt(true);
    const p = new URLSearchParams({ pilot, password: pw, von: filterVon, bis: filterBis });
    if (filterFahrzeug) p.set('fahrzeug', filterFahrzeug);
    if (nurEigen || !hatVolleRechte) p.set('eigen', '1');
    fetch(`/api/fahrtenbuch?${p}`).then(r => r.json()).then(d => { setEintraege(Array.isArray(d) ? d : []); setLaedt(false); }).catch(() => setLaedt(false));
  };

  useEffect(() => { if (zugang === 'ja') laden(); }, [zugang, filterFahrzeug, filterVon, filterBis, nurEigen]);

  const csvExport = () => {
    const header = ['Datum', 'Fahrzeug', 'Kutscher', 'Typ', 'Gast', 'Fahrgäste', 'km Start', 'km Ende', 'km', 'Spenden (€)', 'Wetter', 'Schaden', 'Bemerkungen'];
    const rows = eintraege.map(e => [
      formatDatum(e.datum), e.fahrzeug, e.kutscher,
      { gast: 'Gastfahrt', eigenfahrt: 'Eigenfahrt', leerfahrt: 'Überführung' }[e.fahrttyp] ?? e.fahrttyp,
      e.gast_name ?? '', e.anzahl_fahrgaeste,
      e.km_start ?? '', e.km_ende ?? '',
      e.km_start != null && e.km_ende != null ? e.km_ende - e.km_start : '',
      e.spenden.toFixed(2).replace('.', ','),
      { sonne: 'Sonnig', bewoelkt: 'Bewölkt', regen: 'Regen', schnee: 'Schnee' }[e.wetter ?? ''] ?? '',
      e.schaden ? (e.schaden_beschreibung ?? 'Ja') : '',
      e.bemerkungen ?? '',
    ]);
    const csv = [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `Fahrtenbuch_${filterFahrzeug || 'alle'}_${filterVon}_${filterBis}.csv`; a.click();
  };

  // Statistik
  const totalKm = eintraege.reduce((s, e) => s + (e.km_start != null && e.km_ende != null ? e.km_ende - e.km_start : 0), 0);
  const totalSpenden = eintraege.reduce((s, e) => s + (e.spenden || 0), 0);
  const schadenEintraege = eintraege.filter(e => e.schaden);

  if (zugang === 'laden') return <div style={{ padding: '2rem', textAlign: 'center' }}>⏳</div>;
  if (zugang === 'nein') return <div style={{ padding: '2rem', color: '#dc2626' }}>Bitte als Kutscher anmelden.</div>;

  const inp: React.CSSProperties = { border: '1.5px solid #D6CCB8', borderRadius: 7, padding: '0.4rem 0.6rem', fontSize: '0.85rem', background: '#fff' };

  return (
    <div style={{ maxWidth: 980, margin: '0 auto', padding: '1.5rem 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2D6B1E', margin: 0 }}>📒 Fahrtenbuch</h1>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <a href="/fahrtenbuch/eintragen" style={{ background: '#2D6B1E', color: '#fff', border: 'none', borderRadius: 8, padding: '0.5rem 1rem', fontWeight: 700, fontSize: '0.88rem', textDecoration: 'none' }}>+ Eintrag</a>
          <button onClick={csvExport} style={{ background: '#1D4ED8', color: '#fff', border: 'none', borderRadius: 8, padding: '0.5rem 1rem', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer' }}>⬇ CSV</button>
        </div>
      </div>

      {/* Filter */}
      <div style={{ background: '#F7F3EC', border: '1.5px solid #D6CCB8', borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        {hatVolleRechte && (
          <select style={inp} value={filterFahrzeug} onChange={e => setFilterFahrzeug(e.target.value)}>
            <option value="">Alle Fahrzeuge</option>
            {fahrzeuge.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        )}
        <label style={{ fontSize: '0.82rem', color: '#5C4E38' }}>Von</label>
        <input style={inp} type="date" value={filterVon} onChange={e => setFilterVon(e.target.value)} />
        <label style={{ fontSize: '0.82rem', color: '#5C4E38' }}>Bis</label>
        <input style={inp} type="date" value={filterBis} onChange={e => setFilterBis(e.target.value)} />
        {hatVolleRechte && (
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', cursor: 'pointer', color: '#5C4E38' }}>
            <input type="checkbox" checked={nurEigen} onChange={e => setNurEigen(e.target.checked)} />
            Nur meine
          </label>
        )}
        {laedt && <span style={{ fontSize: '0.82rem', color: '#9CA3AF' }}>⏳ Lade…</span>}
      </div>

      {/* Statistik-Kacheln */}
      {eintraege.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
          {[
            { label: 'Fahrten', wert: eintraege.length, icon: '🚲' },
            { label: 'Kilometer', wert: totalKm ? `${totalKm} km` : '–', icon: '🛣' },
            { label: 'Spenden', wert: euro(totalSpenden), icon: '💶' },
            { label: 'Schäden gemeldet', wert: schadenEintraege.length, icon: '⚠️', warn: schadenEintraege.length > 0 },
          ].map(k => (
            <div key={k.label} style={{ background: k.warn ? '#FEF3C7' : '#fff', border: `1.5px solid ${k.warn ? '#F59E0B' : '#D6CCB8'}`, borderRadius: 10, padding: '0.75rem 1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.4rem' }}>{k.icon}</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: k.warn ? '#B45309' : '#2D6B1E' }}>{k.wert}</div>
              <div style={{ fontSize: '0.75rem', color: '#5C4E38' }}>{k.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Schäden-Hinweis */}
      {schadenEintraege.length > 0 && (
        <div style={{ background: '#FEF3C7', border: '1.5px solid #F59E0B', borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '1rem' }}>
          <strong style={{ color: '#B45309' }}>⚠️ Gemeldete Schäden / Wartungsbedarf:</strong>
          {schadenEintraege.map(e => (
            <div key={e.id} style={{ marginTop: '0.4rem', fontSize: '0.85rem', color: '#1C1208' }}>
              <strong>{formatDatum(e.datum)} · {e.fahrzeug} · {e.kutscher}:</strong> {e.schaden_beschreibung || 'Schaden gemeldet'}
            </div>
          ))}
        </div>
      )}

      {/* Tabelle */}
      {eintraege.length === 0 && !laedt && (
        <p style={{ color: '#9CA3AF', fontSize: '0.9rem' }}>Keine Einträge für diesen Zeitraum.</p>
      )}
      {eintraege.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: '#F7F3EC', borderBottom: '2px solid #D6CCB8' }}>
                {['Datum', 'Fahrzeug', 'Kutscher', 'Typ', 'Gast', 'Fgs.', 'km', 'Spenden', 'Wetter', 'Bemerkung'].map(h => (
                  <th key={h} style={{ padding: '0.5rem 0.6rem', textAlign: 'left', fontWeight: 700, color: '#5C4E38', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {eintraege.map((e, i) => {
                const km = e.km_start != null && e.km_ende != null ? e.km_ende - e.km_start : null;
                return (
                  <tr key={e.id} style={{ background: e.schaden ? '#FEF9C3' : i % 2 === 0 ? '#fff' : '#FAFAF8', borderBottom: '1px solid #F0EBE0' }}>
                    <td style={{ padding: '0.45rem 0.6rem', whiteSpace: 'nowrap' }}>{formatDatum(e.datum)}</td>
                    <td style={{ padding: '0.45rem 0.6rem', fontWeight: 600 }}>{e.fahrzeug}</td>
                    <td style={{ padding: '0.45rem 0.6rem' }}>{e.kutscher}</td>
                    <td style={{ padding: '0.45rem 0.6rem', whiteSpace: 'nowrap' }}>{{ gast: 'Gast', eigenfahrt: 'Eigen', leerfahrt: 'Überf.' }[e.fahrttyp] ?? e.fahrttyp}</td>
                    <td style={{ padding: '0.45rem 0.6rem', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.gast_name ?? ''}</td>
                    <td style={{ padding: '0.45rem 0.6rem', textAlign: 'center' }}>{e.anzahl_fahrgaeste || ''}</td>
                    <td style={{ padding: '0.45rem 0.6rem', textAlign: 'right', whiteSpace: 'nowrap' }}>{km != null ? `${km} km` : ''}</td>
                    <td style={{ padding: '0.45rem 0.6rem', textAlign: 'right', whiteSpace: 'nowrap' }}>{e.spenden > 0 ? euro(e.spenden) : ''}</td>
                    <td style={{ padding: '0.45rem 0.6rem', textAlign: 'center' }}>{wetterIcon(e.wetter)}</td>
                    <td style={{ padding: '0.45rem 0.6rem', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: e.schaden ? '#B45309' : undefined }}>
                      {e.schaden ? `⚠️ ${e.schaden_beschreibung ?? ''}` : e.bemerkungen ?? ''}
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
