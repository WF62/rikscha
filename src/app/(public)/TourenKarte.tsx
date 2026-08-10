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
  defaultPunkte: [number, number][];
  ziel: [number, number] | null;
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
    // Entwurf — bitte per Editor korrigieren
    defaultPunkte: [
      [50.7762, 6.9212],
      [50.7720, 6.9175],
      [50.7685, 6.9060],
      [50.7655, 6.8925],
      [50.7630, 6.8830],
      [50.7660, 6.8925],
      [50.7700, 6.9050],
      [50.7740, 6.9150],
      [50.7762, 6.9212],
    ],
    ziel: [50.7630, 6.8830],
  },
  {
    id: 'schloesser',
    name: 'Brühler Schlösserrunde',
    kurzname: 'Schlösserrunde',
    farbe: '#92400E',
    beschreibung: 'Durch Gemüsefelder nach Walberberg, Eispause in Brühl, durch den Schlosspark Augustusburg, Biergarten am Schloss.',
    laenge: 'ca. 22 km',
    dauer: 'ca. 2 Std.',
    defaultPunkte: [],
    ziel: null,
  },
  {
    id: 'rhein',
    name: 'Fahrt zum Rhein',
    kurzname: 'Zum Rhein',
    farbe: '#1D4ED8',
    beschreibung: 'Westlich durch Walberberg und Bornheim bis zum Rheinufer — weite Aussicht und Ruhe am Fluss.',
    laenge: 'ca. 12 km',
    dauer: 'ca. 1 Std.',
    defaultPunkte: [],
    ziel: null,
  },
  {
    id: 'swister',
    name: 'Fahrt zum Swistertürmchen',
    kurzname: 'Swistertürmchen',
    farbe: '#B45309',
    beschreibung: 'Entlang der Swister zum historischen Türmchen — ruhige Wege und schöne Aussicht.',
    laenge: 'ca. 6 km',
    dauer: 'ca. 35 Min.',
    defaultPunkte: [],
    ziel: null,
  },
  {
    id: 'londorf',
    name: 'Rundfahrt Gut Londorf',
    kurzname: 'Gut Londorf',
    farbe: '#6D28D9',
    beschreibung: 'Eine gemütliche Rundfahrt zum Gutshof Londorf — idyllische Feldwege und Panoramablick.',
    laenge: 'ca. 5 km',
    dauer: 'ca. 30 Min.',
    defaultPunkte: [],
    ziel: null,
  },
];

const START: [number, number] = [50.7762, 6.9212];
const STORAGE_KEY = 'rikscha_touren_punkte';

function loadSavedRoutes(): Record<string, [number, number][]> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
  } catch {
    return {};
  }
}

function saveRoutes(routes: Record<string, [number, number][]>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(routes));
}

export default function TourenKarte() {
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leafletMapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const LRef = useRef<any>(null);

  // Leaflet layer refs
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
  const [routes, setRoutes] = useState<Record<string, [number, number][]>>({});
  const [kopiert, setKopiert] = useState(false);

  // Refs für Klick-Handler (vermeidet stale closure)
  const editModusRef = useRef(false);
  const editTourIdRef = useRef(editTourId);
  const routesRef = useRef(routes);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { editModusRef.current = editModus; }, [editModus]);
  useEffect(() => { editTourIdRef.current = editTourId; }, [editTourId]);
  useEffect(() => { routesRef.current = routes; }, [routes]);

  // Aktuelle Punkte für eine Tour (saved > default)
  const getPunkte = useCallback((id: string): [number, number][] => {
    const saved = routes[id];
    const meta = TOUR_META.find(t => t.id === id);
    if (saved) return saved;
    return meta?.defaultPunkte ?? [];
  }, [routes]);

  // Waypoint-Marker der Edit-Tour neu zeichnen
  const redrawWpMarkers = useCallback((tourId: string) => {
    const L = LRef.current;
    const map = leafletMapRef.current;
    if (!L || !map) return;

    wpMarkerRefs.current.forEach(m => m.remove());
    wpMarkerRefs.current = [];

    const punkte = getPunkte(tourId);
    const farbe = TOUR_META.find(t => t.id === tourId)?.farbe ?? '#333';

    punkte.forEach((p, i) => {
      const m = L.circleMarker(p, {
        radius: i === 0 || i === punkte.length - 1 ? 8 : 5,
        color: '#fff',
        weight: 2,
        fillColor: farbe,
        fillOpacity: 1,
      }).addTo(map);
      wpMarkerRefs.current.push(m);
    });
  }, [getPunkte]);

  // Polyline einer Tour aktualisieren
  const redrawPolyline = useCallback((tourId: string, punkte: [number, number][]) => {
    const L = LRef.current;
    const map = leafletMapRef.current;
    if (!L || !map) return;

    const meta = TOUR_META.find(t => t.id === tourId);
    if (!meta) return;

    polylineRefs.current[tourId]?.remove();
    if (punkte.length < 2) {
      delete polylineRefs.current[tourId];
      return;
    }

    const line = L.polyline(punkte, {
      color: meta.farbe,
      weight: 5,
      opacity: 0.85,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map);

    line.on('click', () => setAktiveTour(tourId));
    line.bindTooltip(meta.kurzname, {
      permanent: false,
      direction: 'center',
      className: 'leaflet-tour-tooltip',
    });

    polylineRefs.current[tourId] = line;
  }, []);

  // Zielmarker einer Tour setzen
  const redrawZielMarker = useCallback((tourId: string, punkte: [number, number][]) => {
    const L = LRef.current;
    const map = leafletMapRef.current;
    if (!L || !map) return;

    zielMarkerRefs.current[tourId]?.remove();
    if (punkte.length === 0) return;

    const meta = TOUR_META.find(t => t.id === tourId);
    const ziel = punkte[punkte.length - 1];
    const zielIcon = L.divIcon({
      html: `<div style="width:12px;height:12px;background:${meta?.farbe};border:2px solid #fff;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.3)"></div>`,
      className: '',
      iconSize: [12, 12],
      iconAnchor: [6, 6],
    });
    zielMarkerRefs.current[tourId] = L.marker(ziel, { icon: zielIcon })
      .addTo(map)
      .bindPopup(`<strong>${meta?.name}</strong><br>${meta?.laenge} · ${meta?.dauer}`);
  }, []);

  // Karte initialisieren
  useEffect(() => {
    if (!mounted || !mapRef.current || leafletMapRef.current) return;

    async function init() {
      const L = (await import('leaflet')).default;
      LRef.current = L;
      if (!mapRef.current) return;

      const map = L.map(mapRef.current, {
        center: [50.763, 6.930],
        zoom: 13,
        zoomControl: true,
        scrollWheelZoom: false,
      });
      leafletMapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map);

      // Startpunkt Kloster Merten
      const startIcon = L.divIcon({
        html: `<div style="width:18px;height:18px;background:#1a1208;border:3px solid #C8881A;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.4)"></div>`,
        className: '',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });
      L.marker(START, { icon: startIcon })
        .addTo(map)
        .bindPopup('<strong>Start / Ziel</strong><br>GFO Kloster Merten');

      // Alle Touren einzeichnen (gespeicherte oder Defaults)
      const saved = loadSavedRoutes();
      setRoutes(saved);

      TOUR_META.forEach(meta => {
        const punkte = saved[meta.id] ?? meta.defaultPunkte;
        redrawPolyline(meta.id, punkte);
        redrawZielMarker(meta.id, punkte);
      });

      // Karten-Klick: im Edit-Modus Punkt hinzufügen
      map.on('click', (e: { latlng: { lat: number; lng: number } }) => {
        if (!editModusRef.current) return;
        const tourId = editTourIdRef.current;
        const current = routesRef.current;

        const meta = TOUR_META.find(t => t.id === tourId);
        const defaults = meta?.defaultPunkte ?? [];
        const existing: [number, number][] = current[tourId] ?? (defaults.length > 0 ? [...defaults] : []);
        const newPunkt: [number, number] = [
          Math.round(e.latlng.lat * 1e6) / 1e6,
          Math.round(e.latlng.lng * 1e6) / 1e6,
        ];
        const updated = { ...current, [tourId]: [...existing, newPunkt] };

        saveRoutes(updated);
        setRoutes(updated);
        routesRef.current = updated;
      });
    }

    init();
    return () => {
      leafletMapRef.current?.remove();
      leafletMapRef.current = null;
      LRef.current = null;
    };
  }, [mounted, redrawPolyline, redrawZielMarker]);

  // Polylines & Zielmarker neu zeichnen wenn routes sich ändern
  useEffect(() => {
    TOUR_META.forEach(meta => {
      const punkte = routes[meta.id] ?? meta.defaultPunkte;
      redrawPolyline(meta.id, punkte);
      redrawZielMarker(meta.id, punkte);
    });
  }, [routes, redrawPolyline, redrawZielMarker]);

  // Waypoint-Marker für Edit-Tour
  useEffect(() => {
    if (editModus) {
      redrawWpMarkers(editTourId);
    } else {
      wpMarkerRefs.current.forEach(m => m.remove());
      wpMarkerRefs.current = [];
    }
  }, [editModus, editTourId, routes, redrawWpMarkers]);

  // Cursor im Edit-Modus
  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.style.cursor = editModus ? 'crosshair' : '';
  }, [editModus]);

  function letztenPunktLoeschen() {
    const current = routes[editTourId] ?? TOUR_META.find(t => t.id === editTourId)?.defaultPunkte ?? [];
    if (current.length === 0) return;
    const updated = { ...routes, [editTourId]: current.slice(0, -1) };
    saveRoutes(updated);
    setRoutes(updated);
  }

  function routeLeeren() {
    const updated = { ...routes, [editTourId]: [] };
    saveRoutes(updated);
    setRoutes(updated);
  }

  function koordinatenKopieren() {
    const punkte = routes[editTourId] ?? TOUR_META.find(t => t.id === editTourId)?.defaultPunkte ?? [];
    const text = JSON.stringify(punkte, null, 2);
    navigator.clipboard.writeText(text).then(() => {
      setKopiert(true);
      setTimeout(() => setKopiert(false), 2000);
    });
  }

  const aktiveTourData = TOUR_META.find(t => t.id === aktiveTour);
  const editTourMeta = TOUR_META.find(t => t.id === editTourId);
  const editPunkte = routes[editTourId] ?? TOUR_META.find(t => t.id === editTourId)?.defaultPunkte ?? [];

  if (!mounted) {
    return (
      <div style={{ height: 480, background: 'var(--surface)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--mid)', fontSize: '0.9rem' }}>
        Karte wird geladen…
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* Legende */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
        {TOUR_META.map((tour) => {
          const hat = (routes[tour.id] ?? tour.defaultPunkte).length > 0;
          return (
            <button
              key={tour.id}
              onClick={() => setAktiveTour(aktiveTour === tour.id ? null : tour.id)}
              aria-pressed={aktiveTour === tour.id}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.4rem 0.85rem', borderRadius: 999,
                border: `2px solid ${tour.farbe}`,
                background: aktiveTour === tour.id ? tour.farbe : 'transparent',
                color: aktiveTour === tour.id ? '#fff' : tour.farbe,
                fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
                opacity: hat ? 1 : 0.45,
                transition: 'all 0.15s',
              }}
            >
              <span style={{
                display: 'inline-block', width: 10, height: 10, borderRadius: 2,
                background: aktiveTour === tour.id ? 'rgba(255,255,255,0.7)' : tour.farbe,
              }} />
              {tour.kurzname}
              {!hat && <span style={{ fontSize: '0.7rem', opacity: 0.7 }}> (fehlt)</span>}
            </button>
          );
        })}
        <button
          onClick={() => setEditModus(v => !v)}
          style={{
            marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.4rem 0.85rem', borderRadius: 999,
            border: `2px solid ${editModus ? '#C8881A' : 'var(--border)'}`,
            background: editModus ? '#C8881A' : 'var(--surface)',
            color: editModus ? '#fff' : 'var(--mid)',
            fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
          }}
          aria-pressed={editModus}
        >
          ✏️ {editModus ? 'Editor schließen' : 'Routen bearbeiten'}
        </button>
      </div>

      {/* Editor-Panel */}
      {editModus && (
        <div style={{
          padding: '1rem 1.25rem', borderRadius: 12,
          border: '2px solid #C8881A', background: 'var(--surface)',
          display: 'flex', flexDirection: 'column', gap: '0.85rem',
        }}>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#92400E' }}>
            ✏️ Routen-Editor
          </div>

          {/* Tour-Auswahl */}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {TOUR_META.map(t => (
              <button
                key={t.id}
                onClick={() => setEditTourId(t.id)}
                style={{
                  padding: '0.3rem 0.75rem', borderRadius: 999, fontSize: '0.8rem', fontWeight: 600,
                  border: `2px solid ${t.farbe}`,
                  background: editTourId === t.id ? t.farbe : 'transparent',
                  color: editTourId === t.id ? '#fff' : t.farbe,
                  cursor: 'pointer',
                }}
              >
                {t.kurzname}
              </button>
            ))}
          </div>

          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--ink)', lineHeight: 1.5 }}>
            Tour: <strong style={{ color: editTourMeta?.farbe }}>{editTourMeta?.name}</strong>
            {' · '}{editPunkte.length} Punkt{editPunkte.length !== 1 ? 'e' : ''} gesetzt<br />
            <span style={{ color: 'var(--mid)', fontSize: '0.8rem' }}>
              Klicke auf die Karte um Punkte hinzuzufügen. Der erste Klick startet die Strecke.
            </span>
          </p>

          {/* Aktions-Buttons */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button onClick={letztenPunktLoeschen}
              disabled={editPunkte.length === 0}
              style={btnStyle('#6B7280', editPunkte.length === 0)}>
              ↩ Letzten Punkt rückgängig
            </button>
            <button onClick={routeLeeren}
              disabled={editPunkte.length === 0}
              style={btnStyle('#DC2626', editPunkte.length === 0)}>
              🗑 Route leeren
            </button>
            <button onClick={koordinatenKopieren}
              disabled={editPunkte.length === 0}
              style={btnStyle('#2D6B1E', editPunkte.length === 0)}>
              {kopiert ? '✓ Kopiert!' : '📋 Koordinaten kopieren'}
            </button>
          </div>

          {editPunkte.length > 0 && (
            <details style={{ fontSize: '0.78rem', color: 'var(--mid)' }}>
              <summary style={{ cursor: 'pointer', userSelect: 'none', fontWeight: 600 }}>
                Koordinaten anzeigen ({editPunkte.length} Punkte)
              </summary>
              <pre style={{
                marginTop: '0.5rem', padding: '0.5rem 0.75rem',
                background: 'rgba(0,0,0,0.06)', borderRadius: 6,
                fontSize: '0.72rem', overflowX: 'auto', lineHeight: 1.6,
              }}>
                {editPunkte.map((p, i) => `[${p[0]}, ${p[1]}]${i < editPunkte.length - 1 ? ',' : ''}`).join('\n')}
              </pre>
            </details>
          )}
        </div>
      )}

      {/* Karte */}
      <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', border: '1.5px solid var(--border)', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <div ref={mapRef} style={{ height: 500, width: '100%' }} />
        {editModus && (
          <div style={{
            position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
            zIndex: 1000, background: editTourMeta?.farbe, color: '#fff',
            padding: '0.3rem 0.9rem', borderRadius: 999, fontSize: '0.78rem', fontWeight: 700,
            boxShadow: '0 2px 8px rgba(0,0,0,0.25)', pointerEvents: 'none',
          }}>
            ✏️ Klicken = Punkt setzen für: {editTourMeta?.kurzname}
          </div>
        )}
        <style>{`
          .leaflet-tour-tooltip {
            background: rgba(20,15,8,0.85); color: #fff;
            border: none; border-radius: 6px;
            font-size: 0.78rem; font-weight: 600;
            padding: 4px 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          }
          .leaflet-tour-tooltip::before { display: none; }
        `}</style>
      </div>

      {/* Tour-Detail (bei Klick auf Strecke) */}
      {aktiveTourData && !editModus && (
        <div style={{
          padding: '1rem 1.25rem', borderRadius: 12,
          border: `2px solid ${aktiveTourData.farbe}`, background: 'var(--surface)',
          display: 'flex', gap: '1.25rem', alignItems: 'flex-start', flexWrap: 'wrap',
        }}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: aktiveTourData.farbe, marginBottom: '0.3rem' }}>
              {aktiveTourData.name}
            </div>
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
        Kartendaten: © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener" style={{ color: 'var(--mid)' }}>OpenStreetMap</a>-Mitwirkende
        {' · '}Strecken sind{' '}
        {TOUR_META.every(t => (routes[t.id] ?? t.defaultPunkte).length === 0) ? 'noch nicht eingezeichnet' : 'vom Piloten eingezeichnet'}
      </p>
    </div>
  );
}

function btnStyle(color: string, disabled: boolean): React.CSSProperties {
  return {
    padding: '0.35rem 0.85rem', borderRadius: 8,
    border: `1.5px solid ${color}`,
    background: disabled ? 'transparent' : color,
    color: disabled ? 'var(--mid)' : '#fff',
    fontSize: '0.8rem', fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
  };
}
