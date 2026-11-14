'use client';
import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import exifr from 'exifr';

const ERLAUBT = ['kutscher', 'kutscher-admin', 'pilot', 'gfo', 'admin'];

type Tour = {
  id: string; name: string; kurzname: string; beschreibung?: string;
  farbe: string; laenge?: string; dauer?: string;
  waypoints: [number, number][]; waypoints_mit_zeit?: { lat: number; lon: number; zeit: string }[];
  gpx_original?: string; erstellt_von: string;
};
type Foto = {
  id: string; foto_pfad: string; lat?: number; lon?: number;
  aufgenommen_am?: string; beschreibung?: string; hochgeladen_von: string;
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';

function fotoUrl(pfad: string) {
  return `${SUPABASE_URL}/storage/v1/object/public/touren-fotos/${pfad}`;
}

function parseGpx(text: string): { wps: [number, number][]; wpsZeit: { lat: number; lon: number; zeit: string }[] } {
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, 'application/xml');
  const pts = Array.from(doc.querySelectorAll('trkpt, rtept, wpt'));
  const wps: [number, number][] = [];
  const wpsZeit: { lat: number; lon: number; zeit: string }[] = [];
  for (const p of pts) {
    const lat = parseFloat(p.getAttribute('lat') ?? '');
    const lon = parseFloat(p.getAttribute('lon') ?? '');
    if (isNaN(lat) || isNaN(lon)) continue;
    wps.push([lat, lon]);
    const timeEl = p.querySelector('time');
    if (timeEl?.textContent) wpsZeit.push({ lat, lon, zeit: timeEl.textContent.trim() });
  }
  return { wps, wpsZeit };
}

function schaetzeLaenge(wps: [number, number][]): string {
  if (wps.length < 2) return '';
  let m = 0;
  for (let i = 1; i < wps.length; i++) {
    const [lat1, lon1] = wps[i - 1], [lat2, lon2] = wps[i];
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    m += R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
  const km = m / 1000;
  return `ca. ${km < 10 ? km.toFixed(1) : Math.round(km)} km`;
}

function interpolierePosition(zeit: Date, wpsZeit: { lat: number; lon: number; zeit: string }[]): { lat: number; lon: number } | null {
  if (!wpsZeit.length) return null;
  const t = zeit.getTime();
  const times = wpsZeit.map(w => ({ ...w, ms: new Date(w.zeit).getTime() }));
  if (t <= times[0].ms) return { lat: times[0].lat, lon: times[0].lon };
  if (t >= times[times.length - 1].ms) return { lat: times[times.length - 1].lat, lon: times[times.length - 1].lon };
  for (let i = 1; i < times.length; i++) {
    if (t <= times[i].ms) {
      const frac = (t - times[i - 1].ms) / (times[i].ms - times[i - 1].ms);
      return {
        lat: times[i - 1].lat + frac * (times[i].lat - times[i - 1].lat),
        lon: times[i - 1].lon + frac * (times[i].lon - times[i - 1].lon),
      };
    }
  }
  return null;
}

function naechsterPunkt(lat: number, lon: number, wps: [number, number][]): { lat: number; lon: number } | null {
  if (!wps.length) return null;
  let best = 0, bestDist = Infinity;
  for (let i = 0; i < wps.length; i++) {
    const d = Math.hypot(wps[i][0] - lat, wps[i][1] - lon);
    if (d < bestDist) { bestDist = d; best = i; }
  }
  return { lat: wps[best][0], lon: wps[best][1] };
}

function googleMapsUrl(wps: [number, number][]): string {
  if (wps.length < 2) return '';
  const start = `${wps[0][0]},${wps[0][1]}`;
  const end = `${wps[wps.length - 1][0]},${wps[wps.length - 1][1]}`;
  // Max 8 Zwischenpunkte gleichmäßig verteilt
  const zwischen: string[] = [];
  if (wps.length > 2) {
    const step = Math.max(1, Math.floor((wps.length - 2) / 8));
    for (let i = step; i < wps.length - 1; i += step) {
      zwischen.push(`${wps[i][0]},${wps[i][1]}`);
      if (zwischen.length >= 8) break;
    }
  }
  const params = new URLSearchParams({
    api: '1',
    origin: start,
    destination: end,
    travelmode: 'bicycling',
  });
  if (zwischen.length) params.set('waypoints', zwischen.join('|'));
  return `https://www.google.com/maps/dir/?${params}`;
}

function gpxErzeugen(tour: Tour): string {
  const wps = tour.waypoints_mit_zeit?.length ? tour.waypoints_mit_zeit : tour.waypoints.map(([lat, lon]) => ({ lat, lon, zeit: '' }));
  const trkpts = wps.map(w =>
    `    <trkpt lat="${w.lat}" lon="${w.lon}">${w.zeit ? `<time>${w.zeit}</time>` : ''}</trkpt>`
  ).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Rikscha-App" xmlns="http://www.topografix.com/GPX/1/1">
  <trk>
    <name>${tour.name.replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c] ?? c))}</name>
    <trkseg>
${trkpts}
    </trkseg>
  </trk>
</gpx>`;
}

export default function TourDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [zugang, setZugang] = useState<'laden' | 'nein' | 'ja'>('laden');
  const [pilot, setPilot] = useState('');
  const [pw, setPw] = useState('');
  const [tour, setTour] = useState<Tour | null>(null);
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [laedt, setLaedt] = useState(true);

  // Felder bearbeiten
  const [name, setName] = useState('');
  const [kurzname, setKurzname] = useState('');
  const [beschreibung, setBeschreibung] = useState('');
  const [farbe, setFarbe] = useState('#2D6B1E');
  const [laenge, setLaenge] = useState('');
  const [dauer, setDauer] = useState('');
  const [speichert, setSpeichert] = useState(false);
  const [editFehler, setEditFehler] = useState('');
  const [editErfolg, setEditErfolg] = useState('');

  // GPX-Route ersetzen
  const gpxRef = useRef<HTMLInputElement>(null);
  const [neueWps, setNeueWps] = useState<[number, number][] | null>(null);
  const [neueWpsZeit, setNeueWpsZeit] = useState<{ lat: number; lon: number; zeit: string }[] | null>(null);
  const [neueGpxRoh, setNeueGpxRoh] = useState('');
  const [gpxDateiName, setGpxDateiName] = useState('');

  // Foto-Upload
  const fotoRef = useRef<HTMLInputElement>(null);
  const [fotoBeschreibung, setFotoBeschreibung] = useState('');
  const [laeadtFoto, setLaedtFoto] = useState(false);
  const [fotoFehler, setFotoFehler] = useState('');
  const [fotoErfolg, setFotoErfolg] = useState('');

  useEffect(() => {
    try {
      const n = localStorage.getItem('pilot_name') ?? '';
      const p = localStorage.getItem('pilot_pw') ?? '';
      const r = localStorage.getItem('pilot_rolle') ?? '';
      if (n && p && ERLAUBT.includes(r)) { setPilot(n); setPw(p); setZugang('ja'); }
      else setZugang('nein');
    } catch { setZugang('nein'); }
  }, []);

  useEffect(() => {
    if (zugang !== 'ja' || !id) return;
    Promise.all([
      fetch('/api/touren').then(r => r.json()),
      fetch(`/api/touren-fotos?tour_id=${id}`).then(r => r.json()),
    ]).then(([touren, fotos]) => {
      const t = Array.isArray(touren) ? touren.find((x: Tour) => x.id === id) : null;
      if (t) {
        setTour(t);
        setName(t.name); setKurzname(t.kurzname || ''); setBeschreibung(t.beschreibung || '');
        setFarbe(t.farbe); setLaenge(t.laenge || ''); setDauer(t.dauer || '');
      }
      if (Array.isArray(fotos)) setFotos(fotos);
      setLaedt(false);
    }).catch(() => setLaedt(false));
  }, [zugang, id]);

  const gpxWaehlen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setGpxDateiName(file.name);
    const text = await file.text();
    setNeueGpxRoh(text);
    const { wps, wpsZeit } = parseGpx(text);
    setNeueWps(wps);
    setNeueWpsZeit(wpsZeit.length ? wpsZeit : null);
    if (wps.length) setLaenge(schaetzeLaenge(wps));
  };

  const speichern = async () => {
    if (!tour || !name.trim()) return;
    setSpeichert(true); setEditFehler(''); setEditErfolg('');
    const body: Record<string, unknown> = { pilot, password: pw, id: tour.id, name: name.trim(), kurzname: kurzname.trim() || name.trim(), beschreibung, farbe, laenge, dauer };
    if (neueWps) { body.waypoints = neueWps; body.gpx_original = neueGpxRoh; }
    if (neueWpsZeit) body.waypoints_mit_zeit = neueWpsZeit;
    const res = await fetch('/api/touren', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setSpeichert(false);
    if (!res.ok) { const d = await res.json(); setEditFehler(d.error ?? 'Fehler.'); return; }
    setEditErfolg('Gespeichert.');
    setNeueWps(null); setNeueWpsZeit(null); setGpxDateiName('');
    if (gpxRef.current) gpxRef.current.value = '';
    setTour(t => t ? { ...t, name: name.trim(), kurzname: kurzname.trim() || name.trim(), beschreibung, farbe, laenge, dauer, waypoints: neueWps ?? t.waypoints } : t);
  };

  const fotoHochladen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !tour) return;
    setLaedtFoto(true); setFotoFehler(''); setFotoErfolg('');

    let lat: number | null = null, lon: number | null = null;
    let aufgenommenAm: string | null = null;
    try {
      const exif = await exifr.parse(file, { gps: true, pick: ['GPSLatitude', 'GPSLongitude', 'DateTimeOriginal', 'CreateDate'] });
      if (exif?.latitude) lat = exif.latitude;
      if (exif?.longitude) lon = exif.longitude;
      if (exif?.DateTimeOriginal || exif?.CreateDate) {
        aufgenommenAm = new Date(exif.DateTimeOriginal ?? exif.CreateDate).toISOString();
      }
    } catch { /* kein EXIF */ }

    // Wenn kein GPS aber Zeitstempel + Tour hat Zeitpunkte → interpolieren
    if ((!lat || !lon) && aufgenommenAm && tour.waypoints_mit_zeit?.length) {
      const pos = interpolierePosition(new Date(aufgenommenAm), tour.waypoints_mit_zeit);
      if (pos) { lat = pos.lat; lon = pos.lon; }
    }
    // Wenn GPS vorhanden aber kein Zeitstempel → nächsten Punkt auf Route suchen
    if (lat && lon && !aufgenommenAm) {
      const pos = naechsterPunkt(lat, lon, tour.waypoints);
      if (pos) { lat = pos.lat; lon = pos.lon; }
    }

    const fd = new FormData();
    fd.append('pilot', pilot); fd.append('password', pw);
    fd.append('tour_id', tour.id); fd.append('foto', file);
    if (lat) fd.append('lat', String(lat));
    if (lon) fd.append('lon', String(lon));
    if (aufgenommenAm) fd.append('aufgenommen_am', aufgenommenAm);
    if (fotoBeschreibung.trim()) fd.append('beschreibung', fotoBeschreibung.trim());

    const res = await fetch('/api/touren-fotos', { method: 'POST', body: fd });
    setLaedtFoto(false);
    if (fotoRef.current) fotoRef.current.value = '';
    if (!res.ok) { const d = await res.json(); setFotoFehler(d.error ?? 'Fehler.'); return; }
    const d = await res.json();
    setFotos(fs => [...fs, { id: d.id, foto_pfad: d.pfad, lat: lat ?? undefined, lon: lon ?? undefined, aufgenommen_am: aufgenommenAm ?? undefined, beschreibung: fotoBeschreibung.trim() || undefined, hochgeladen_von: pilot }]);
    setFotoErfolg(lat && lon ? '✅ Foto gespeichert und auf Karte verortet.' : '✅ Foto gespeichert (keine GPS-Position gefunden).');
    setFotoBeschreibung('');
  };

  const fotoLoeschen = async (fotoId: string) => {
    if (!confirm('Foto wirklich löschen?')) return;
    await fetch('/api/touren-fotos', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pilot, password: pw, id: fotoId }) });
    setFotos(fs => fs.filter(f => f.id !== fotoId));
  };

  const gpxHerunterladen = () => {
    if (!tour) return;
    const gpx = tour.gpx_original || gpxErzeugen(tour);
    const blob = new Blob([gpx], { type: 'application/gpx+xml' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${tour.name.replace(/\s+/g, '_')}.gpx`;
    a.click();
  };

  if (zugang === 'laden' || laedt) return <div style={{ padding: '2rem', textAlign: 'center' }}>⏳</div>;
  if (zugang === 'nein') return <div style={{ padding: '2rem', color: '#dc2626' }}>Bitte als Kutscher anmelden.</div>;
  if (!tour) return <div style={{ padding: '2rem', color: '#dc2626' }}>Tour nicht gefunden. <a href="/touren" style={{ color: '#2D6B1E' }}>Zurück</a></div>;

  const inp: React.CSSProperties = { width: '100%', border: '1.5px solid #D6CCB8', borderRadius: 8, padding: '0.5rem 0.75rem', fontSize: '0.9rem', boxSizing: 'border-box' };
  const lbl: React.CSSProperties = { display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#5C4E38', marginBottom: '0.3rem' };
  const btn = (extra?: React.CSSProperties): React.CSSProperties => ({ border: 'none', borderRadius: 8, padding: '0.55rem 1.1rem', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', ...extra });

  const gmUrl = googleMapsUrl(tour.waypoints);

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '1.5rem 1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <button onClick={() => router.push('/touren')} style={{ ...btn(), background: '#F7F3EC', color: '#1C1208', border: '1.5px solid #D6CCB8' }}>← Zurück</button>
        <h1 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#2D6B1E', margin: 0 }}>{tour.name}</h1>
        <span style={{ width: 14, height: 14, borderRadius: '50%', background: tour.farbe, display: 'inline-block', flexShrink: 0 }} />
      </div>

      {/* Navigation Buttons */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.75rem' }}>
        <button onClick={gpxHerunterladen} style={{ ...btn(), background: '#1D4ED8', color: '#fff' }}>⬇ GPX herunterladen</button>
        {gmUrl && (
          <a href={gmUrl} target="_blank" rel="noopener noreferrer"
            style={{ ...btn(), background: '#EA4335', color: '#fff', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
            🗺 In Google Maps öffnen
          </a>
        )}
      </div>

      {/* Tour bearbeiten */}
      <details open style={{ background: '#F7F3EC', border: '1.5px solid #D6CCB8', borderRadius: 12, padding: '1.25rem', marginBottom: '1.5rem' }}>
        <summary style={{ fontWeight: 700, fontSize: '1rem', cursor: 'pointer', color: '#1C1208' }}>✏️ Tour bearbeiten</summary>
        <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div><label style={lbl}>Name *</label><input style={inp} value={name} onChange={e => setName(e.target.value)} /></div>
          <div><label style={lbl}>Kurzname</label><input style={inp} value={kurzname} onChange={e => setKurzname(e.target.value)} /></div>
          <div><label style={lbl}>Länge</label><input style={inp} value={laenge} onChange={e => setLaenge(e.target.value)} /></div>
          <div><label style={lbl}>Dauer</label><input style={inp} value={dauer} onChange={e => setDauer(e.target.value)} /></div>
        </div>
        <div style={{ marginTop: '0.75rem' }}>
          <label style={lbl}>Beschreibung</label>
          <textarea style={{ ...inp, minHeight: 60, resize: 'vertical' }} value={beschreibung} onChange={e => setBeschreibung(e.target.value)} />
        </div>
        <div style={{ marginTop: '0.75rem' }}>
          <label style={lbl}>Farbe</label>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {['#2D6B1E', '#92400E', '#1D4ED8', '#B45309', '#7C3AED', '#DC2626'].map(c => (
              <button key={c} onClick={() => setFarbe(c)} style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: farbe === c ? '3px solid #1C1208' : '2px solid transparent', cursor: 'pointer' }} />
            ))}
            <input type="color" value={farbe} onChange={e => setFarbe(e.target.value)} style={{ width: 28, height: 28, border: 'none', borderRadius: '50%', cursor: 'pointer', padding: 0 }} />
          </div>
        </div>
        <div style={{ marginTop: '0.75rem' }}>
          <label style={lbl}>GPX-Route ersetzen (optional)</label>
          <input ref={gpxRef} type="file" accept=".gpx" onChange={gpxWaehlen} style={{ display: 'none' }} />
          <button onClick={() => gpxRef.current?.click()} style={{ ...btn(), background: neueWps ? '#2D6B1E' : '#fff', color: neueWps ? '#fff' : '#2D6B1E', border: '1.5px solid #2D6B1E' }}>
            {gpxDateiName ? `✓ ${gpxDateiName} (${neueWps?.length} Punkte)` : '📂 Neue GPX wählen…'}
          </button>
        </div>
        {editFehler && <div style={{ marginTop: '0.75rem', background: '#FEE2E2', color: '#DC2626', borderRadius: 8, padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}>❌ {editFehler}</div>}
        {editErfolg && <div style={{ marginTop: '0.75rem', background: '#D1FAE5', color: '#065F46', borderRadius: 8, padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}>✅ {editErfolg}</div>}
        <button onClick={speichern} disabled={speichert || !name.trim()} style={{ ...btn({ marginTop: '0.75rem', background: '#2D6B1E', color: '#fff', opacity: speichert ? 0.6 : 1 }) }}>
          {speichert ? '⏳ Speichern…' : '✓ Änderungen speichern'}
        </button>
      </details>

      {/* Fotos */}
      <div style={{ background: '#F7F3EC', border: '1.5px solid #D6CCB8', borderRadius: 12, padding: '1.25rem', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#1C1208', marginBottom: '1rem' }}>📷 Fotos ({fotos.length})</h2>
        <p style={{ fontSize: '0.82rem', color: '#5C4E38', marginBottom: '0.75rem' }}>
          Fotos mit GPS-Daten (Smartphone) werden automatisch auf der Karte verortet. Ohne GPS wird der Zeitstempel des Fotos genutzt, um die Position auf der Strecke zu schätzen.
        </p>
        <input ref={fotoRef} type="file" accept="image/*" onChange={fotoHochladen} style={{ display: 'none' }} />
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={lbl}>Bildunterschrift (optional)</label>
            <input style={inp} value={fotoBeschreibung} onChange={e => setFotoBeschreibung(e.target.value)} placeholder="Was ist auf dem Bild?" />
          </div>
          <button onClick={() => fotoRef.current?.click()} disabled={laeadtFoto} style={{ ...btn(), background: '#2D6B1E', color: '#fff', opacity: laeadtFoto ? 0.6 : 1 }}>
            {laeadtFoto ? '⏳ Hochladen…' : '📷 Foto hinzufügen'}
          </button>
        </div>
        {fotoFehler && <div style={{ background: '#FEE2E2', color: '#DC2626', borderRadius: 8, padding: '0.5rem 0.75rem', fontSize: '0.85rem', marginBottom: '0.5rem' }}>❌ {fotoFehler}</div>}
        {fotoErfolg && <div style={{ background: '#D1FAE5', color: '#065F46', borderRadius: 8, padding: '0.5rem 0.75rem', fontSize: '0.85rem', marginBottom: '0.5rem' }}>{fotoErfolg}</div>}

        {fotos.length === 0 && <p style={{ color: '#9CA3AF', fontSize: '0.85rem' }}>Noch keine Fotos.</p>}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.75rem', marginTop: '0.5rem' }}>
          {fotos.map(f => (
            <div key={f.id} style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', border: '1.5px solid #D6CCB8', background: '#fff' }}>
              <img src={fotoUrl(f.foto_pfad)} alt={f.beschreibung || 'Foto'} style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block' }} />
              {(f.lat && f.lon) && <div style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '0.65rem', borderRadius: 4, padding: '1px 4px' }}>📍</div>}
              {f.beschreibung && <div style={{ padding: '0.3rem 0.4rem', fontSize: '0.75rem', color: '#1C1208' }}>{f.beschreibung}</div>}
              <button onClick={() => fotoLoeschen(f.id)} style={{ display: 'block', width: '100%', background: 'none', border: 'none', borderTop: '1px solid #D6CCB8', color: '#DC2626', cursor: 'pointer', fontSize: '0.75rem', padding: '0.3rem' }}>Löschen</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
