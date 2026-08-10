'use client';
import 'leaflet/dist/leaflet.css';
import { useCallback, useEffect, useRef, useState } from 'react';

interface TourMeta {
  id: string;
  name: string;
  kurzname: string;
  farbe: string;
  beschreibung: string;
  laenge: string;
  dauer: string;
  defaultWaypoints: [number, number][];
}

const TOUR_META: TourMeta[] = [
  {
    id: 'heide',
    name: 'Auf der Heide',
    kurzname: 'Mertener Heide',
    farbe: '#2D6B1E',
    beschreibung: 'Vorbei an Pferdekoppeln, Ziegenweiden und Alpakas ins Grüne. Frische Luft und vertraute Lieblingsorte.',
    laenge: 'ca. 8 km',
    dauer: 'ca. 45 Min.',
    // Wegpunkte (Entwurf) — über Editor korrigieren
    defaultWaypoints: [
      [50.7762, 6.9212],
      [50.7685, 6.9060],
      [50.7630, 6.8830],
      [50.7762, 6.9212],
    ],
  },
  { id: 'schloesser', name: 'Brühler Schlösserrunde', kurzname: 'Schlösserrunde', farbe: '#92400E',
    beschreibung: 'Durch Gemüsefelder nach Walberberg, Eispause in Brühl, durch den Schlosspark Augustusburg, Biergarten am Schloss.',
    laenge: 'ca. 22 km', dauer: 'ca. 2 Std.', defaultWaypoints: [] },
  { id: 'rhein', name: 'Fahrt zum Rhein', kurzname: 'Zum Rhein', farbe: '#1D4ED8',
    beschreibung: 'Westlich durch Walberberg und Bornheim bis zum Rheinufer — weite Aussicht und Ruhe am Fluss.',
    laenge: 'ca. 12 km', dauer: 'ca. 1 Std.', defaultWaypoints: [] },
  { id: 'swister', name: 'Fahrt zum Swistertürmchen', kurzname: 'Swistertürmchen', farbe: '#B45309',
    beschreibung: 'Entlang der Swister zum historischen Türmchen — ruhige Wege und schöne Aussicht.',
    laenge: 'ca. 6 km', dauer: 'ca. 35 Min.', defaultWaypoints: [] },
  { id: 'londorf', name: 'Rundfahrt Gut Londorf', kurzname: 'Gut Londorf', farbe: '#6D28D9',
    beschreibung: 'Eine gemütliche Rundfahrt zum Gutshof Londorf — idyllische Feldwege und Panoramablick.',
    laenge: 'ca. 5 km', dauer: 'ca. 30 Min.', defaultWaypoints: [] },
];

const START: [number, number] = [50.7762, 6.9212];
const STORAGE_KEY = 'rikscha_touren_waypoints_v2';

// Routenberechnung via OSRM (OpenStreetMap-basiert, kostenlos, kein API-Key)
async function berechneRoute(waypoints: [number, number][]): Promise<[number, number][] | null> {
  if (waypoints.length < 2) return null;
  const coords = waypoints.map(([lat, lon]) => `${lon},${lat}`).join(';');
  try {
    const res = await fetch(
      `https://router.project-osrm.org/route/v1/cycling/${coords}?overview=full&geometries=geojson`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const geom = data?.routes?.[0]?.geometry?.coordinates;
    if (!geom) return null;
    // OSRM gibt [lon, lat] zurück — wir brauchen [lat, lon] für Leaflet
    return geom.map(([lon, lat]: [number, number]) => [lat, lon] as [number, number]);
  } catch {
    return null; // Fallback: gerade Linien
  }
}

function loadWaypoints(): Record<string, [number, number][]> {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}'); } catch { return {}; }
}
function saveWaypoints(wp: Record<string, [number, number][]>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(wp));
}

export default function TourenKarte() {
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstance = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const LRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const polylineRefs = useRef<Record<string, any>>({});
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wpMarkerRefs = useRef<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const zielMarkerRefs = useRef<Record<string, any>>({});

  const [mounted, setMounted] = useState(false);
  const [aktiveTour, setAktiveTour] = useState<string | null>(null);
  const [editModus, setEditModus] = useState(false);
  const [editTourId, setEditTourId] = useState<string>(TOUR_META[0].id);
  const [waypoints, setWaypoints] = useState<Record<string, [number, number][]>>({});
  // Berechnete Routengeometrien (entlang echter Wege)
  const [routeGeom, setRouteGeom] = useState<Record<string, [number, number][]>>({});
  const [routeBerechnung, setRouteBerechnung] = useState<Record<string, 'idle' | 'loading' | 'ok' | 'fallback'>>({});
  const [kopiert, setKopiert] = useState(false);

  const editModusRef = useRef(false);
  const editTourIdRef = useRef(editTourId);
  const waypointsRef = useRef(waypoints);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { editModusRef.current = editModus; }, [editModus]);
  useEffect(() => { editTourIdRef.current = editTourId; }, [editTourId]);
  useEffect(() => { waypointsRef.current = waypoints; }, [waypoints]);

  const getWaypoints = useCallback((id: string): [number, number][] => {
    return waypoints[id] ?? TOUR_META.find(t => t.id === id)?.defaultWaypoints ?? [];
  }, [waypoints]);

  const getRouteGeom = useCallback((id: string): [number, number][] => {
    return routeGeom[id] ?? getWaypoints(id);
  }, [routeGeom, getWaypoints]);

  // Route über OSRM berechnen und Polyline aktualisieren
  const updateRoute = useCallback(async (tourId: string, wps: [number, number][]) => {
    const L = LRef.current;
    const map = mapInstance.current;
    if (!L || !map) return;
    const meta = TOUR_META.find(t => t.id === tourId);
    if (!meta) return;

    if (wps.length < 2) {
      polylineRefs.current[tourId]?.remove();
      delete polylineRefs.current[tourId];
      zielMarkerRefs.current[tourId]?.remove();
      delete zielMarkerRefs.current[tourId];
      return;
    }

    setRouteBerechnung(prev => ({ ...prev, [tourId]: 'loading' }));

    const geom = await berechneRoute(wps);
    const punkte = geom ?? wps; // Fallback: gerade Linien

    setRouteGeom(prev => ({ ...prev, [tourId]: punkte }));
    setRouteBerechnung(prev => ({ ...prev, [tourId]: geom ? 'ok' : 'fallback' }));

    // Polyline neu zeichnen
    polylineRefs.current[tourId]?.remove();
    const line = L.polyline(punkte, {
      color: meta.farbe, weight: 5, opacity: 0.9,
      lineCap: 'round', lineJoin: 'round',
    }).addTo(map);
    line.on('click', () => setAktiveTour(tourId));
    line.bindTooltip(meta.kurzname, {
      permanent: false, direction: 'center', className: 'leaflet-tour-tooltip',
    });
    polylineRefs.current[tourId] = line;

    // Zielmarker
    zielMarkerRefs.current[tourId]?.remove();
    const ziel = wps[wps.length - 1];
    const zielIcon = L.divIcon({
      html: `<div style="width:12px;height:12px;background:${meta.farbe};border:2px solid #fff;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.35)"></div>`,
      className: '', iconSize: [12, 12], iconAnchor: [6, 6],
    });
    zielMarkerRefs.current[tourId] = L.marker(ziel, { icon: zielIcon })
      .addTo(map)
      .bindPopup(`<strong>${meta.name}</strong><br>${meta.laenge} · ${meta.dauer}`);
  }, []);

  // Waypoint-Marker der Edit-Tour zeichnen
  const redrawWpMarkers = useCallback((tourId: string, wps: [number, number][]) => {
    const L = LRef.current;
    const map = mapInstance.current;
    if (!L || !map) return;
    wpMarkerRefs.current.forEach(m => m.remove());
    wpMarkerRefs.current = [];
    const farbe = TOUR_META.find(t => t.id === tourId)?.farbe ?? '#333';
    wps.forEach((p, i) => {
      const m = L.circleMarker(p, {
        radius: i === 0 || i === wps.length - 1 ? 9 : 6,
        color: '#fff', weight: 2, fillColor: farbe, fillOpacity: 1,
      }).addTo(map);
      m.bindTooltip(`Punkt ${i + 1}: ${p[0].toFixed(5)}, ${p[1].toFixed(5)}`, { direction: 'top' });
      wpMarkerRefs.current.push(m);
    });
  }, []);

  // Karte initialisieren
  useEffect(() => {
    if (!mounted || !mapRef.current || mapInstance.current) return;

    async function init() {
      const L = (await import('leaflet')).default;
      LRef.current = L;
      if (!mapRef.current) return;

      const map = L.map(mapRef.current, {
        center: [50.763, 6.930], zoom: 13,
        zoomControl: true, scrollWheelZoom: false,
      });
      mapInstance.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map);

      // Startmarker
      const startIcon = L.divIcon({
        html: `<div style="width:18px;height:18px;background:#1a1208;border:3px solid #C8881A;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.4)"></div>`,
        className: '', iconSize: [18, 18], iconAnchor: [9, 9],
      });
      L.marker(START, { icon: startIcon }).addTo(map)
        .bindPopup('<strong>Start / Ziel</strong><br>GFO Kloster Merten');

      // Gespeicherte Waypoints laden & Routen berechnen
      const saved = loadWaypoints();
      setWaypoints(saved);

      for (const meta of TOUR_META) {
        const wps = saved[meta.id] ?? meta.defaultWaypoints;
        await updateRoute(meta.id, wps);
      }

      // Karten-Klick im Edit-Modus
      map.on('click', (e: { latlng: { lat: number; lng: number } }) => {
        if (!editModusRef.current) return;
        const tourId = editTourIdRef.current;
        const current = waypointsRef.current;
        const meta = TOUR_META.find(t => t.id === tourId);
        const existing: [number, number][] = current[tourId]
          ?? (meta?.defaultWaypoints.length ? [...meta.defaultWaypoints] : []);
        const neu: [number, number] = [
          Math.round(e.latlng.lat * 1e6) / 1e6,
          Math.round(e.latlng.lng * 1e6) / 1e6,
        ];
        const updated = { ...current, [tourId]: [...existing, neu] };
        saveWaypoints(updated);
        setWaypoints(updated);
        waypointsRef.current = updated;
      });
    }

    init();
    return () => { mapInstance.current?.remove(); mapInstance.current = null; LRef.current = null; };
  }, [mounted, updateRoute]);

  // Wenn Waypoints sich ändern → Route neu berechnen
  useEffect(() => {
    if (!mapInstance.current) return;
    TOUR_META.forEach(meta => {
      const wps = waypoints[meta.id] ?? meta.defaultWaypoints;
      updateRoute(meta.id, wps);
    });
  }, [waypoints, updateRoute]);

  // Waypoint-Marker im Edit-Modus
  useEffect(() => {
    if (editModus) {
      redrawWpMarkers(editTourId, getWaypoints(editTourId));
    } else {
      wpMarkerRefs.current.forEach(m => m.remove());
      wpMarkerRefs.current = [];
    }
  }, [editModus, editTourId, waypoints, redrawWpMarkers, getWaypoints]);

  useEffect(() => {
    if (mapRef.current) mapRef.current.style.cursor = editModus ? 'crosshair' : '';
  }, [editModus]);

  function letztenPunktLoeschen() {
    const wps = waypoints[editTourId] ?? TOUR_META.find(t => t.id === editTourId)?.defaultWaypoints ?? [];
    if (!wps.length) return;
    const updated = { ...waypoints, [editTourId]: wps.slice(0, -1) };
    saveWaypoints(updated);
    setWaypoints(updated);
  }

  function routeLeeren() {
    const updated = { ...waypoints, [editTourId]: [] };
    saveWaypoints(updated);
    setWaypoints(updated);
  }

  function koordinatenKopieren() {
    const wps = getWaypoints(editTourId);
    navigator.clipboard.writeText(JSON.stringify(wps, null, 2)).then(() => {
      setKopiert(true);
      setTimeout(() => setKopiert(false), 2000);
    });
  }

  const editMeta = TOUR_META.find(t => t.id === editTourId);
  const editWps = getWaypoints(editTourId);
  const aktiveTourData = TOUR_META.find(t => t.id === aktiveTour);

  if (!mounted) return (
    <div style={{ height: 500, background: 'var(--surface)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--mid)', fontSize: '0.9rem' }}>
      Karte wird geladen…
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* Legende */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
        {TOUR_META.map(tour => {
          const wps = waypoints[tour.id] ?? tour.defaultWaypoints;
          const status = routeBerechnung[tour.id];
          return (
            <button key={tour.id}
              onClick={() => setAktiveTour(aktiveTour === tour.id ? null : tour.id)}
              aria-pressed={aktiveTour === tour.id}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.4rem 0.85rem', borderRadius: 999,
                border: `2px solid ${tour.farbe}`,
                background: aktiveTour === tour.id ? tour.farbe : 'transparent',
                color: aktiveTour === tour.id ? '#fff' : tour.farbe,
                fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
                opacity: wps.length ? 1 : 0.45, transition: 'all 0.15s',
              }}>
              <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: aktiveTour === tour.id ? 'rgba(255,255,255,0.7)' : tour.farbe }} />
              {tour.kurzname}
              {status === 'loading' && <span style={{ fontSize: '0.65rem' }}>⟳</span>}
              {!wps.length && <span style={{ fontSize: '0.7rem', opacity: 0.7 }}> (fehlt)</span>}
            </button>
          );
        })}
        <button onClick={() => setEditModus(v => !v)} aria-pressed={editModus}
          style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.4rem 0.85rem', borderRadius: 999,
            border: `2px solid ${editModus ? '#C8881A' : 'var(--border)'}`,
            background: editModus ? '#C8881A' : 'var(--surface)',
            color: editModus ? '#fff' : 'var(--mid)',
            fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>
          ✏️ {editModus ? 'Editor schließen' : 'Routen bearbeiten'}
        </button>
      </div>

      {/* Editor */}
      {editModus && (
        <div style={{ padding: '1rem 1.25rem', borderRadius: 12, border: '2px solid #C8881A', background: 'var(--surface)', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#92400E' }}>✏️ Routen-Editor</div>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {TOUR_META.map(t => (
              <button key={t.id} onClick={() => setEditTourId(t.id)}
                style={{ padding: '0.3rem 0.75rem', borderRadius: 999, fontSize: '0.8rem', fontWeight: 600,
                  border: `2px solid ${t.farbe}`,
                  background: editTourId === t.id ? t.farbe : 'transparent',
                  color: editTourId === t.id ? '#fff' : t.farbe, cursor: 'pointer' }}>
                {t.kurzname}
              </button>
            ))}
          </div>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--ink)', lineHeight: 1.5 }}>
            Tour: <strong style={{ color: editMeta?.farbe }}>{editMeta?.name}</strong>
            {' · '}{editWps.length} Wegpunkt{editWps.length !== 1 ? 'e' : ''}
            {routeBerechnung[editTourId] === 'loading' && <span style={{ color: '#C8881A' }}> · Route wird berechnet…</span>}
            {routeBerechnung[editTourId] === 'ok' && <span style={{ color: '#2D6B1E' }}> · Route berechnet ✓</span>}
            {routeBerechnung[editTourId] === 'fallback' && <span style={{ color: '#6B7280' }}> · Gerade Linie (kein Netz)</span>}
            <br />
            <span style={{ color: 'var(--mid)', fontSize: '0.8rem' }}>
              Klicke auf die Karte um Wegpunkte zu setzen. Die Route folgt automatisch echten Radwegen.
            </span>
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button onClick={letztenPunktLoeschen} disabled={!editWps.length} style={btnStyle('#6B7280', !editWps.length)}>↩ Letzten Punkt rückgängig</button>
            <button onClick={routeLeeren} disabled={!editWps.length} style={btnStyle('#DC2626', !editWps.length)}>🗑 Route leeren</button>
            <button onClick={koordinatenKopieren} disabled={!editWps.length} style={btnStyle('#2D6B1E', !editWps.length)}>
              {kopiert ? '✓ Kopiert!' : '📋 Wegpunkte kopieren'}
            </button>
          </div>
          {editWps.length > 0 && (
            <details style={{ fontSize: '0.78rem', color: 'var(--mid)' }}>
              <summary style={{ cursor: 'pointer', userSelect: 'none', fontWeight: 600 }}>
                Wegpunkte anzeigen ({editWps.length})
              </summary>
              <pre style={{ marginTop: '0.5rem', padding: '0.5rem 0.75rem', background: 'rgba(0,0,0,0.06)', borderRadius: 6, fontSize: '0.72rem', overflowX: 'auto', lineHeight: 1.6 }}>
                {editWps.map((p, i) => `[${p[0]}, ${p[1]}]${i < editWps.length - 1 ? ',' : ''}`).join('\n')}
              </pre>
            </details>
          )}
        </div>
      )}

      {/* Karte */}
      <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', border: '1.5px solid var(--border)', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <div ref={mapRef} style={{ height: 500, width: '100%' }} />
        {editModus && (
          <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', zIndex: 1000,
            background: editMeta?.farbe, color: '#fff', padding: '0.3rem 0.9rem', borderRadius: 999,
            fontSize: '0.78rem', fontWeight: 700, boxShadow: '0 2px 8px rgba(0,0,0,0.25)', pointerEvents: 'none' }}>
            ✏️ Klicken = Wegpunkt setzen · {editMeta?.kurzname}
          </div>
        )}
        <style>{`
          .leaflet-tour-tooltip { background: rgba(20,15,8,0.85); color: #fff; border: none; border-radius: 6px; font-size: 0.78rem; font-weight: 600; padding: 4px 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.3); }
          .leaflet-tour-tooltip::before { display: none; }
        `}</style>
      </div>

      {/* Tour-Detail */}
      {aktiveTourData && !editModus && (
        <div style={{ padding: '1rem 1.25rem', borderRadius: 12, border: `2px solid ${aktiveTourData.farbe}`, background: 'var(--surface)', display: 'flex', gap: '1.25rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: aktiveTourData.farbe, marginBottom: '0.3rem' }}>{aktiveTourData.name}</div>
            <p style={{ fontSize: '0.88rem', color: 'var(--ink)', margin: 0 }}>{aktiveTourData.beschreibung}</p>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', flexShrink: 0 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: aktiveTourData.farbe }}>{aktiveTourData.laenge}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--mid)' }}>Strecke</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: aktiveTourData.farbe }}>{aktiveTourData.dauer}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--mid)' }}>Dauer</div>
            </div>
          </div>
        </div>
      )}

      <p style={{ fontSize: '0.75rem', color: 'var(--mid)', margin: 0 }}>
        Kartendaten: © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener" style={{ color: 'var(--mid)' }}>OpenStreetMap</a>-Mitwirkende · Routing: OSRM
      </p>
    </div>
  );
}

function btnStyle(color: string, disabled: boolean): React.CSSProperties {
  return { padding: '0.35rem 0.85rem', borderRadius: 8, border: `1.5px solid ${color}`,
    background: disabled ? 'transparent' : color, color: disabled ? 'var(--mid)' : '#fff',
    fontSize: '0.8rem', fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1 };
}
