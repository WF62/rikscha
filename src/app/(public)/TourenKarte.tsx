'use client';
import 'leaflet/dist/leaflet.css';
import { useCallback, useEffect, useRef, useState } from 'react';

interface TourFoto {
  lat: number;
  lon: number;
  titel: string;
  src: string; // URL oder leer → Platzhalter
}

interface TourMeta {
  id: string;
  name: string;
  kurzname: string;
  farbe: string;
  beschreibung: string;
  laenge: string;
  dauer: string;
  defaultWaypoints: [number, number][];
  fotos?: TourFoto[];
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
    laenge: 'ca. 22 km', dauer: 'ca. 2 Std.', defaultWaypoints: [],
    fotos: [
      { lat: 50.8281, lon: 6.9006, titel: 'Schloss Augustusburg', src: '' },
      { lat: 50.8240, lon: 6.9050, titel: 'Schlosspark', src: '' },
    ] },
  { id: 'rhein', name: 'Fahrt zum Rhein', kurzname: 'Zum Rhein', farbe: '#1D4ED8',
    beschreibung: 'Westlich durch Walberberg und Bornheim bis zum Rheinufer — weite Aussicht und Ruhe am Fluss.',
    laenge: 'ca. 12 km', dauer: 'ca. 1 Std.', defaultWaypoints: [],
    fotos: [
      { lat: 50.7682, lon: 6.8450, titel: 'Rheinufer', src: '' },
    ] },
  { id: 'swister', name: 'Fahrt zum Swistertürmchen', kurzname: 'Swistertürmchen', farbe: '#B45309',
    beschreibung: 'Entlang der Swister zum historischen Türmchen — ruhige Wege und schöne Aussicht.',
    laenge: 'ca. 6 km', dauer: 'ca. 35 Min.', defaultWaypoints: [],
    fotos: [
      { lat: 50.7640, lon: 6.9450, titel: 'Swistertürmchen', src: '' },
    ] },
  { id: 'londorf', name: 'Rundfahrt Gut Londorf', kurzname: 'Gut Londorf', farbe: '#6D28D9',
    beschreibung: 'Eine gemütliche Rundfahrt zum Gutshof Londorf — idyllische Feldwege und Panoramablick.',
    laenge: 'ca. 5 km', dauer: 'ca. 30 Min.', defaultWaypoints: [],
    fotos: [
      { lat: 50.7720, lon: 6.9380, titel: 'Gut Londorf', src: '' },
    ] },
];

const START_DEFAULT: [number, number] = [50.7762, 6.9212];
const STORAGE_KEY = 'rikscha_touren_waypoints_v2';
const START_KEY = 'rikscha_startpunkt_v1';

function loadStart(): [number, number] {
  if (typeof window === 'undefined') return START_DEFAULT;
  try {
    const s = localStorage.getItem(START_KEY);
    if (s) return JSON.parse(s);
  } catch {}
  return START_DEFAULT;
}
function saveStart(p: [number, number]) {
  localStorage.setItem(START_KEY, JSON.stringify(p));
}

// Routenberechnung via OSRM (OpenStreetMap-basiert, kostenlos, kein API-Key)
async function berechneRoute(waypoints: [number, number][]): Promise<{ geom: [number, number][]; distanzKm: number } | null> {
  if (waypoints.length < 2) return null;
  const coords = waypoints.map(([lat, lon]) => `${lon},${lat}`).join(';');
  try {
    const res = await fetch(
      `https://router.project-osrm.org/route/v1/cycling/${coords}?overview=full&geometries=geojson`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const route = data?.routes?.[0];
    if (!route?.geometry?.coordinates) return null;
    const geom: [number, number][] = route.geometry.coordinates.map(
      ([lon, lat]: [number, number]) => [lat, lon] as [number, number]
    );
    const distanzKm = Math.round((route.distance / 1000) * 10) / 10;
    return { geom, distanzKm };
  } catch {
    return null;
  }
}

// Höhendaten für eine Route (OpenTopoData, kostenlos, kein API-Key)
// Maximal 100 Punkte pro Anfrage → gleichmäßig samplen
async function fetchHoehenprofil(punkte: [number, number][]): Promise<number[] | null> {
  if (punkte.length < 2) return null;
  const MAX = 80;
  const step = Math.max(1, Math.floor(punkte.length / MAX));
  const sample: [number, number][] = [];
  for (let i = 0; i < punkte.length; i += step) sample.push(punkte[i]);
  if (sample[sample.length - 1] !== punkte[punkte.length - 1])
    sample.push(punkte[punkte.length - 1]);

  try {
    const locations = sample.map(([lat, lon]) => `${lat},${lon}`).join('|');
    const res = await fetch(
      `https://api.opentopodata.org/v1/srtm30m?locations=${locations}`,
      { signal: AbortSignal.timeout(12000) }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status !== 'OK') return null;
    return data.results.map((r: { elevation: number }) => Math.round(r.elevation));
  } catch {
    return null;
  }
}

// GPX exportieren (volle Routengeometrie, kompatibel mit Komoot, OsmAnd, Google Maps …)
function exportGPX(name: string, punkte: [number, number][]) {
  const trkpts = punkte
    .map(([lat, lon]) => `    <trkpt lat="${lat}" lon="${lon}"></trkpt>`)
    .join('\n');
  const gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Mertener Rikschakutscher" xmlns="http://www.topografix.com/GPX/1/1">
  <trk>
    <name>${name}</name>
    <trkseg>
${trkpts}
    </trkseg>
  </trk>
</gpx>`;
  const blob = new Blob([gpx], { type: 'application/gpx+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${name.replace(/\s+/g, '_')}.gpx`;
  a.click();
  URL.revokeObjectURL(url);
}

// GPX importieren → gibt Array von [lat, lon]-Punkten zurück
function parseGPX(text: string): [number, number][] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, 'application/xml');
  const punkte: [number, number][] = [];
  // Trackpunkte (aufgezeichnete Route) oder Wegpunkte
  const tags = doc.querySelectorAll('trkpt, rtept, wpt');
  tags.forEach(el => {
    const lat = parseFloat(el.getAttribute('lat') ?? '');
    const lon = parseFloat(el.getAttribute('lon') ?? '');
    if (!isNaN(lat) && !isNaN(lon)) punkte.push([lat, lon]);
  });
  return punkte;
}

// Bei vielen Trackpunkten: als vollständige Geometrie nutzen (kein OSRM nötig)
// Bei wenigen Punkten (<= 50): als Wegpunkte behandeln und OSRM routen lassen
const GPX_DIRECT_THRESHOLD = 50;

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fotoMarkerRefs = useRef<any[]>([]);

  const [mounted, setMounted] = useState(false);
  const [istPilot, setIstPilot] = useState(false);
  const [startPunkt, setStartPunkt] = useState<[number, number]>(START_DEFAULT);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const startMarkerRef = useRef<any>(null);
  const startPunktRef = useRef<[number, number]>(START_DEFAULT);
  const [aktiveTour, setAktiveTour] = useState<string | null>(null);
  const [editModus, setEditModus] = useState(false);
  const [editTourId, setEditTourId] = useState<string>(TOUR_META[0].id);
  const [waypoints, setWaypoints] = useState<Record<string, [number, number][]>>({});
  // Berechnete Routengeometrien (entlang echter Wege)
  const [routeGeom, setRouteGeom] = useState<Record<string, [number, number][]>>({});
  const [routeBerechnung, setRouteBerechnung] = useState<Record<string, 'idle' | 'loading' | 'ok' | 'fallback'>>({});
  const [routeDistanz, setRouteDistanz] = useState<Record<string, number>>({});
  const [hoehenProfile, setHoehenProfile] = useState<Record<string, number[]>>({});
  const [hoehenLaden, setHoehenLaden] = useState<Record<string, boolean>>({});
  const [kopiert, setKopiert] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editModusRef = useRef(false);
  const editTourIdRef = useRef(editTourId);
  const waypointsRef = useRef(waypoints);
  const [startpunktModus, setStartpunktModus] = useState(false);
  const startpunktModusRef = useRef(false);

  useEffect(() => {
    setMounted(true);
    // Pilotenprüfung: nur Piloten dürfen Routen bearbeiten
    const name = localStorage.getItem('pilot_name');
    const pw = localStorage.getItem('pilot_pw');
    const rolle = localStorage.getItem('pilot_rolle');
    setIstPilot(!!(name && pw && rolle && rolle !== 'angehoeriger'));
    // Auf Login-Änderungen reagieren (z.B. Modal schließt nach Anmeldung)
    function onStorage() {
      const n = localStorage.getItem('pilot_name');
      const p = localStorage.getItem('pilot_pw');
      const r = localStorage.getItem('pilot_rolle');
      setIstPilot(!!(n && p && r && r !== 'angehoeriger'));
    }
    window.addEventListener('storage', onStorage);
    window.addEventListener('pilot-login', onStorage);
    document.addEventListener('visibilitychange', onStorage);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('pilot-login', onStorage);
      document.removeEventListener('visibilitychange', onStorage);
    };
  }, []);
  useEffect(() => { editModusRef.current = editModus; }, [editModus]);
  useEffect(() => { editTourIdRef.current = editTourId; }, [editTourId]);
  useEffect(() => { waypointsRef.current = waypoints; }, [waypoints]);
  useEffect(() => { startPunktRef.current = startPunkt; }, [startPunkt]);
  useEffect(() => { startpunktModusRef.current = startpunktModus; }, [startpunktModus]);

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

    const result = await berechneRoute(wps);
    const punkte = result?.geom ?? wps; // Fallback: gerade Linien

    setRouteGeom(prev => ({ ...prev, [tourId]: punkte }));
    setRouteBerechnung(prev => ({ ...prev, [tourId]: result ? 'ok' : 'fallback' }));
    if (result?.distanzKm) {
      setRouteDistanz(prev => ({ ...prev, [tourId]: result.distanzKm }));
    }

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

    // Höhenprofil im Hintergrund laden
    setHoehenLaden(prev => ({ ...prev, [tourId]: true }));
    fetchHoehenprofil(punkte).then(profil => {
      if (profil) setHoehenProfile(prev => ({ ...prev, [tourId]: profil }));
      setHoehenLaden(prev => ({ ...prev, [tourId]: false }));
    });
  }, []);

  // Ref damit Marker-Handler immer aktuelle waypoints+setter sehen
  const deleteWaypointRef = useRef<(tourId: string, idx: number) => void>(() => {});
  const moveWaypointRef = useRef<(tourId: string, idx: number, pos: [number, number]) => void>(() => {});

  useEffect(() => {
    deleteWaypointRef.current = (tourId: string, idx: number) => {
      const wps = waypointsRef.current[tourId]
        ?? TOUR_META.find(t => t.id === tourId)?.defaultWaypoints ?? [];
      const updated = { ...waypointsRef.current, [tourId]: wps.filter((_, i) => i !== idx) };
      saveWaypoints(updated);
      setWaypoints(updated);
      waypointsRef.current = updated;
    };
    moveWaypointRef.current = (tourId: string, idx: number, pos: [number, number]) => {
      const wps = [...(waypointsRef.current[tourId]
        ?? TOUR_META.find(t => t.id === tourId)?.defaultWaypoints ?? [])];
      wps[idx] = pos;
      const updated = { ...waypointsRef.current, [tourId]: wps };
      saveWaypoints(updated);
      setWaypoints(updated);
      waypointsRef.current = updated;
    };
  });

  // Waypoint-Marker der Edit-Tour zeichnen (draggable + einzeln löschbar)
  const redrawWpMarkers = useCallback((tourId: string, wps: [number, number][]) => {
    const L = LRef.current;
    const map = mapInstance.current;
    if (!L || !map) return;
    wpMarkerRefs.current.forEach(m => m.remove());
    wpMarkerRefs.current = [];
    const farbe = TOUR_META.find(t => t.id === tourId)?.farbe ?? '#333';

    wps.forEach((p, i) => {
      const isEndpoint = i === 0 || i === wps.length - 1;
      const icon = L.divIcon({
        html: `<div style="
          width:${isEndpoint ? 20 : 14}px;
          height:${isEndpoint ? 20 : 14}px;
          background:${farbe};
          border:3px solid #fff;
          border-radius:50%;
          box-shadow:0 2px 6px rgba(0,0,0,0.4);
          cursor:move;
          display:flex;align-items:center;justify-content:center;
          font-size:9px;color:#fff;font-weight:700;
        ">${i + 1}</div>`,
        className: '',
        iconSize: [isEndpoint ? 20 : 14, isEndpoint ? 20 : 14],
        iconAnchor: [isEndpoint ? 10 : 7, isEndpoint ? 10 : 7],
      });

      const marker = L.marker(p, { icon, draggable: true }).addTo(map);

      // Rechtsklick / Kontextmenü → sofort löschen
      marker.on('contextmenu', (e: { originalEvent: Event }) => {
        e.originalEvent.preventDefault();
        e.originalEvent.stopPropagation();
        deleteWaypointRef.current(tourId, i);
      });

      // Linksklick → Popup mit Löschen-Button (auch für Touch ohne Rechtsklick)
      marker.bindPopup(`
        <div style="text-align:center;min-width:130px">
          <div style="font-size:0.8rem;font-weight:700;margin-bottom:4px">Wegpunkt ${i + 1}</div>
          <div style="font-size:0.7rem;color:#666;margin-bottom:8px">${p[0].toFixed(5)}, ${p[1].toFixed(5)}</div>
          <button id="del-wp-${tourId}-${i}"
            style="padding:5px 14px;background:#DC2626;color:#fff;border:none;border-radius:6px;font-size:0.82rem;cursor:pointer;font-weight:700;width:100%">
            ✕ Wegpunkt löschen
          </button>
        </div>
      `);

      marker.on('popupopen', () => {
        const btn = document.getElementById(`del-wp-${tourId}-${i}`);
        if (btn) btn.onclick = (ev) => {
          ev.stopPropagation();
          marker.closePopup();
          deleteWaypointRef.current(tourId, i);
        };
      });

      // Verschieben per Drag
      marker.on('dragend', (e: { target: { getLatLng: () => { lat: number; lng: number } } }) => {
        const ll = e.target.getLatLng();
        const pos: [number, number] = [
          Math.round(ll.lat * 1e6) / 1e6,
          Math.round(ll.lng * 1e6) / 1e6,
        ];
        moveWaypointRef.current(tourId, i, pos);
      });

      // Klick auf Marker soll nicht neuen Punkt setzen
      marker.on('click', (e: { originalEvent: Event }) => {
        e.originalEvent.stopPropagation();
      });

      wpMarkerRefs.current.push(marker);
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
        zoomControl: true, scrollWheelZoom: true,
      });
      mapInstance.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map);

      // Startmarker (aus localStorage oder Standard)
      const gespeicherterStart = loadStart();
      setStartPunkt(gespeicherterStart);
      startPunktRef.current = gespeicherterStart;

      function zeichneStartMarker(pos: [number, number]) {
        startMarkerRef.current?.remove();
        const startIcon = L.divIcon({
          html: `<div style="width:22px;height:22px;background:#1a1208;border:3px solid #C8881A;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center"><div style="width:6px;height:6px;background:#C8881A;border-radius:50%"></div></div>`,
          className: '', iconSize: [22, 22], iconAnchor: [11, 11],
        });
        startMarkerRef.current = L.marker(pos, { icon: startIcon, draggable: true }).addTo(map)
          .bindPopup('<strong>Start / Ziel</strong><br>GFO Kloster Merten<br><small>Im Routen-Editor verschiebbar</small>');
        startMarkerRef.current.on('dragend', (e: { target: { getLatLng: () => { lat: number; lng: number } } }) => {
          const ll = e.target.getLatLng();
          const neu: [number, number] = [
            Math.round(ll.lat * 1e6) / 1e6,
            Math.round(ll.lng * 1e6) / 1e6,
          ];
          saveStart(neu);
          setStartPunkt(neu);
          startPunktRef.current = neu;
        });
      }
      zeichneStartMarker(gespeicherterStart);

      // Gespeicherte Waypoints laden & Routen berechnen
      const saved = loadWaypoints();
      setWaypoints(saved);

      for (const meta of TOUR_META) {
        const wps = saved[meta.id] ?? meta.defaultWaypoints;
        await updateRoute(meta.id, wps);
      }

      // Foto-Marker für alle Touren
      fotoMarkerRefs.current.forEach(m => m.remove());
      fotoMarkerRefs.current = [];
      for (const meta of TOUR_META) {
        for (const foto of meta.fotos ?? []) {
          const fotoIcon = L.divIcon({
            html: `<div style="width:28px;height:28px;background:${meta.farbe};border:2px solid #fff;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;font-size:14px">📷</div>`,
            className: '', iconSize: [28, 28], iconAnchor: [14, 14],
          });
          const m = L.marker([foto.lat, foto.lon], { icon: fotoIcon }).addTo(map);
          const imgHtml = foto.src
            ? `<img src="${foto.src}" alt="${foto.titel}" style="width:140px;height:90px;object-fit:cover;border-radius:6px;margin-bottom:4px;display:block">`
            : `<div style="width:140px;height:80px;background:${meta.farbe}22;border-radius:6px;display:flex;align-items:center;justify-content:center;margin-bottom:4px;font-size:1.5rem">📷</div>`;
          m.bindPopup(`<div style="text-align:center;min-width:150px">${imgHtml}<div style="font-size:0.78rem;font-weight:700;color:${meta.farbe}">${foto.titel}</div><div style="font-size:0.72rem;color:#666">${meta.kurzname}</div></div>`);
          m.on('click', (e: { originalEvent: Event }) => { e.originalEvent.stopPropagation(); setAktiveTour(meta.id); });
          fotoMarkerRefs.current.push(m);
        }
      }

      // Karten-Klick im Edit-Modus
      map.on('click', (e: { latlng: { lat: number; lng: number } }) => {
        if (!editModusRef.current) return;
        const neu: [number, number] = [
          Math.round(e.latlng.lat * 1e6) / 1e6,
          Math.round(e.latlng.lng * 1e6) / 1e6,
        ];

        if (startpunktModusRef.current) {
          // Startpunkt setzen
          saveStart(neu);
          setStartPunkt(neu);
          startPunktRef.current = neu;
          startMarkerRef.current?.setLatLng(neu);
          return;
        }

        const tourId = editTourIdRef.current;
        const current = waypointsRef.current;
        const meta = TOUR_META.find(t => t.id === tourId);
        const existing: [number, number][] = current[tourId]
          ?? (meta?.defaultWaypoints.length ? [...meta.defaultWaypoints] : []);
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
    if (!editModus) setStartpunktModus(false);
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

  function gpxExportieren() {
    const meta = TOUR_META.find(t => t.id === editTourId);
    const geom = routeGeom[editTourId] ?? getWaypoints(editTourId);
    if (geom.length < 2 || !meta) return;
    exportGPX(meta.name, geom);
  }

  async function gpxImportieren(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportStatus('loading');
    try {
      const text = await file.text();
      const punkte = parseGPX(text);
      if (punkte.length < 2) { setImportStatus('error'); return; }

      if (punkte.length > GPX_DIRECT_THRESHOLD) {
        // Viele Punkte → direkt als Routengeometrie übernehmen
        setRouteGeom(prev => ({ ...prev, [editTourId]: punkte }));
        setRouteBerechnung(prev => ({ ...prev, [editTourId]: 'ok' }));
        // Als Waypoints: Anfang, Mitte, Ende speichern
        const wp: [number, number][] = [
          punkte[0],
          punkte[Math.floor(punkte.length / 2)],
          punkte[punkte.length - 1],
        ];
        const updated = { ...waypointsRef.current, [editTourId]: wp };
        saveWaypoints(updated);
        setWaypoints(updated);
        // Polyline manuell aktualisieren
        await updateRoute(editTourId, wp);
        // Überschreibe mit voller Geometrie
        setRouteGeom(prev => ({ ...prev, [editTourId]: punkte }));
      } else {
        // Wenige Punkte → als Wegpunkte + OSRM-Routing
        const updated = { ...waypointsRef.current, [editTourId]: punkte };
        saveWaypoints(updated);
        setWaypoints(updated);
        waypointsRef.current = updated;
        await updateRoute(editTourId, punkte);
      }
      setImportStatus('ok');
      setTimeout(() => setImportStatus('idle'), 3000);
    } catch {
      setImportStatus('error');
      setTimeout(() => setImportStatus('idle'), 3000);
    }
    // Input zurücksetzen damit dieselbe Datei nochmal gewählt werden kann
    if (fileInputRef.current) fileInputRef.current.value = '';
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
        {istPilot && (
          <button onClick={() => setEditModus(v => !v)} aria-pressed={editModus}
            style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.4rem 0.85rem', borderRadius: 999,
              border: `2px solid ${editModus ? '#C8881A' : 'var(--border)'}`,
              background: editModus ? '#C8881A' : 'var(--surface)',
              color: editModus ? '#fff' : 'var(--mid)',
              fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>
            ✏️ {editModus ? 'Editor schließen' : 'Routen bearbeiten'}
          </button>
        )}
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
              {startpunktModus
                ? '📍 Klicke auf die Karte um den Startpunkt zu setzen — oder den Marker ziehen.'
                : 'Klicke auf die Karte um Wegpunkte zu setzen. Die Route folgt automatisch echten Radwegen.'}
            </span>
          </p>
          {/* Startpunkt */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', padding: '0.5rem 0.75rem', background: startpunktModus ? '#FEF3C7' : 'rgba(0,0,0,0.04)', borderRadius: 8, border: startpunktModus ? '1.5px solid #C8881A' : '1px solid var(--border)' }}>
            <span style={{ fontSize: '0.82rem', flex: 1, color: 'var(--ink)' }}>
              📍 Startpunkt: <strong>{startPunkt[0].toFixed(4)}, {startPunkt[1].toFixed(4)}</strong>
            </span>
            <button onClick={() => setStartpunktModus(v => !v)} style={btnStyle('#C8881A', false)}>
              {startpunktModus ? '✓ Fertig' : 'Startpunkt setzen'}
            </button>
            <button onClick={() => { saveStart(START_DEFAULT); setStartPunkt(START_DEFAULT); startMarkerRef.current?.setLatLng(START_DEFAULT); }} title="Zurücksetzen" style={{ padding: '0.35rem 0.6rem', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--mid)', cursor: 'pointer', fontSize: '0.75rem' }}>↺</button>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button onClick={letztenPunktLoeschen} disabled={!editWps.length} style={btnStyle('#6B7280', !editWps.length)}>↩ Letzten Punkt rückgängig</button>
            <button onClick={routeLeeren} disabled={!editWps.length} style={btnStyle('#DC2626', !editWps.length)}>🗑 Route leeren</button>
            <button onClick={koordinatenKopieren} disabled={!editWps.length} style={btnStyle('#2D6B1E', !editWps.length)}>
              {kopiert ? '✓ Kopiert!' : '📋 Wegpunkte kopieren'}
            </button>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', paddingTop: '0.25rem', borderTop: '1px solid var(--border)' }}>
            <input ref={fileInputRef} type="file" accept=".gpx" onChange={gpxImportieren} style={{ display: 'none' }} />
            <button onClick={() => fileInputRef.current?.click()} style={btnStyle('#1D4ED8', false)}>
              {importStatus === 'loading' ? '⟳ Lädt…' : importStatus === 'ok' ? '✓ Importiert!' : importStatus === 'error' ? '✗ Fehler beim Import' : '📥 GPX importieren'}
            </button>
            <button onClick={gpxExportieren} disabled={editWps.length < 2} style={btnStyle('#6D28D9', editWps.length < 2)}>
              📤 GPX herunterladen
            </button>
            <span style={{ fontSize: '0.75rem', color: 'var(--mid)', alignSelf: 'center' }}>
              GPX-Dateien laufen auf OsmAnd, Komoot & Google Maps
            </span>
          </div>
          {editWps.length > 0 && (
            <details open style={{ fontSize: '0.78rem', color: 'var(--mid)' }}>
              <summary style={{ cursor: 'pointer', userSelect: 'none', fontWeight: 600, marginBottom: '0.4rem' }}>
                Wegpunkte ({editWps.length}) — ziehen zum Umsortieren
              </summary>
              <WegpunktListe
                wps={editWps}
                farbe={editMeta?.farbe ?? '#333'}
                onDelete={(i) => deleteWaypointRef.current(editTourId, i)}
                onReorder={(von, nach) => {
                  const wps = [...editWps];
                  const [elem] = wps.splice(von, 1);
                  wps.splice(nach, 0, elem);
                  const updated = { ...waypoints, [editTourId]: wps };
                  saveWaypoints(updated);
                  setWaypoints(updated);
                }}
              />
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
            {startpunktModus ? '📍 Klicken = Startpunkt setzen' : `✏️ Klicken = Wegpunkt setzen · ${editMeta?.kurzname}`}
          </div>
        )}
        <style>{`
          .leaflet-tour-tooltip { background: rgba(20,15,8,0.85); color: #fff; border: none; border-radius: 6px; font-size: 0.78rem; font-weight: 600; padding: 4px 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.3); }
          .leaflet-tour-tooltip::before { display: none; }
        `}</style>
      </div>

      {/* Tour-Detail */}
      {aktiveTourData && !editModus && (() => {
        const tid = aktiveTourData.id;
        const distanz = routeDistanz[tid];
        const profil = hoehenProfile[tid];
        const profilLaedt = hoehenLaden[tid];
        const anstieg = profil ? profil.reduce((s, h, i) => i > 0 && h > profil[i-1] ? s + (h - profil[i-1]) : s, 0) : null;
        const abstieg = profil ? profil.reduce((s, h, i) => i > 0 && h < profil[i-1] ? s + (profil[i-1] - h) : s, 0) : null;
        const hoehMin = profil ? Math.min(...profil) : null;
        const hoehMax = profil ? Math.max(...profil) : null;
        return (
          <div style={{ borderRadius: 12, border: `2px solid ${aktiveTourData.farbe}`, background: 'var(--surface)', overflow: 'hidden' }}>
            {/* Kopfzeile */}
            <div style={{ padding: '1rem 1.25rem', display: 'flex', gap: '1.25rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: aktiveTourData.farbe, marginBottom: '0.3rem' }}>{aktiveTourData.name}</div>
                <p style={{ fontSize: '0.88rem', color: 'var(--ink)', margin: 0 }}>{aktiveTourData.beschreibung}</p>
              </div>
              {/* Kennzahlen */}
              <div style={{ display: 'flex', gap: '1rem', flexShrink: 0, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: aktiveTourData.farbe }}>
                    {distanz ? `${distanz} km` : aktiveTourData.laenge}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--mid)' }}>Strecke</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: aktiveTourData.farbe }}>{aktiveTourData.dauer}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--mid)' }}>Dauer</div>
                </div>
                {anstieg !== null && (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#2D6B1E' }}>↑ {anstieg} m</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--mid)' }}>Anstieg</div>
                  </div>
                )}
                {abstieg !== null && (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#B45309' }}>↓ {abstieg} m</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--mid)' }}>Abstieg</div>
                  </div>
                )}
                <button
                  onClick={() => { const g = routeGeom[tid] ?? getWaypoints(tid); if (g.length >= 2) exportGPX(aktiveTourData.name, g); }}
                  disabled={(routeGeom[tid] ?? getWaypoints(tid)).length < 2}
                  style={btnStyle(aktiveTourData.farbe, (routeGeom[tid] ?? getWaypoints(tid)).length < 2)}>
                  📤 Tour laden (GPX)
                </button>
              </div>
            </div>

            {/* Höhenprofil */}
            {(profil || profilLaedt) && (
              <div style={{ padding: '0 1.25rem 1rem' }}>
                {profilLaedt && !profil && (
                  <div style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--mid)', fontSize: '0.8rem' }}>
                    Höhenprofil wird geladen…
                  </div>
                )}
                {profil && <HoehenProfilChart profil={profil} farbe={aktiveTourData.farbe} hoehMin={hoehMin!} hoehMax={hoehMax!} />}
              </div>
            )}

            {/* Foto-Galerie */}
            {(aktiveTourData.fotos?.length ?? 0) > 0 && (
              <div style={{ padding: '0 1.25rem 1rem', display: 'flex', gap: '0.75rem', overflowX: 'auto' }}>
                {aktiveTourData.fotos!.map((foto, i) => (
                  <div key={i} style={{ flexShrink: 0, textAlign: 'center' }}>
                    {foto.src ? (
                      <img src={foto.src} alt={foto.titel}
                        style={{ width: 140, height: 100, objectFit: 'cover', borderRadius: 8, display: 'block', border: `2px solid ${aktiveTourData.farbe}` }} />
                    ) : (
                      <div style={{ width: 140, height: 100, background: `${aktiveTourData.farbe}22`, borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: `2px dashed ${aktiveTourData.farbe}66` }}>
                        <span style={{ fontSize: '1.75rem' }}>📷</span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--mid)', marginTop: 4 }}>Foto folgt</span>
                      </div>
                    )}
                    <div style={{ fontSize: '0.72rem', color: 'var(--mid)', marginTop: '0.3rem', maxWidth: 140 }}>{foto.titel}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      <p style={{ fontSize: '0.75rem', color: 'var(--mid)', margin: 0 }}>
        Kartendaten: © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener" style={{ color: 'var(--mid)' }}>OpenStreetMap</a>-Mitwirkende · Routing: OSRM
      </p>
    </div>
  );
}

function HoehenProfilChart({ profil, farbe, hoehMin, hoehMax }: {
  profil: number[];
  farbe: string;
  hoehMin: number;
  hoehMax: number;
}) {
  const W = 600;
  const H = 90;
  const PAD = { top: 8, bottom: 20, left: 36, right: 8 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const spanne = Math.max(hoehMax - hoehMin, 5);

  const punkte = profil.map((h, i) => {
    const x = PAD.left + (i / (profil.length - 1)) * innerW;
    const y = PAD.top + innerH - ((h - hoehMin) / spanne) * innerH;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const flaecheUnten = H - PAD.bottom;
  const pfad = `M${punkte[0]} ${punkte.slice(1).map(p => `L${p}`).join(' ')} L${PAD.left + innerW},${flaecheUnten} L${PAD.left},${flaecheUnten} Z`;
  const linie = `M${punkte.join(' L')}`;

  // Y-Achse: 3 Marken
  const yMarken = [hoehMin, Math.round((hoehMin + hoehMax) / 2), hoehMax];

  return (
    <div>
      <div style={{ fontSize: '0.75rem', color: 'var(--mid)', marginBottom: '0.25rem', fontWeight: 600 }}>Höhenprofil</div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }} aria-label="Höhenprofil der Tour">
        {/* Füllbereich */}
        <path d={pfad} fill={farbe} fillOpacity={0.18} />
        {/* Linie */}
        <path d={linie} fill="none" stroke={farbe} strokeWidth={2} strokeLinejoin="round" />
        {/* Y-Marken */}
        {yMarken.map((m, i) => {
          const y = PAD.top + innerH - ((m - hoehMin) / spanne) * innerH;
          return (
            <g key={i}>
              <line x1={PAD.left - 3} y1={y} x2={PAD.left + innerW} y2={y} stroke="var(--border)" strokeWidth={0.5} strokeDasharray="3 3" />
              <text x={PAD.left - 5} y={y + 4} textAnchor="end" fontSize={9} fill="var(--mid)">{m}m</text>
            </g>
          );
        })}
        {/* X-Achse */}
        <line x1={PAD.left} y1={H - PAD.bottom} x2={PAD.left + innerW} y2={H - PAD.bottom} stroke="var(--border)" strokeWidth={1} />
        <text x={PAD.left} y={H - 4} fontSize={9} fill="var(--mid)">Start</text>
        <text x={PAD.left + innerW} y={H - 4} fontSize={9} fill="var(--mid)" textAnchor="end">Ziel</text>
      </svg>
    </div>
  );
}

function WegpunktListe({ wps, farbe, onDelete, onReorder }: {
  wps: [number, number][];
  farbe: string;
  onDelete: (i: number) => void;
  onReorder: (von: number, nach: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragIdx = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  // Touch-Drag: passive:false direkt am DOM registrieren
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let von: number | null = null;
    let nach: number | null = null;

    function zielIdx(clientY: number): number {
      const kinder = Array.from(el!.children) as HTMLElement[];
      for (let i = 0; i < kinder.length; i++) {
        const r = kinder[i].getBoundingClientRect();
        if (clientY < r.top + r.height / 2) return i;
      }
      return kinder.length - 1;
    }

    function onStart(e: TouchEvent) {
      const grip = (e.target as HTMLElement).closest('[data-grip]');
      if (!grip) return;
      const row = grip.closest('[data-idx]') as HTMLElement;
      if (!row) return;
      von = parseInt(row.dataset.idx!);
      nach = von;
      (row as HTMLElement).style.opacity = '0.5';
    }

    function onMove(e: TouchEvent) {
      if (von === null) return;
      e.preventDefault();
      const t = e.touches[0];
      nach = zielIdx(t.clientY);
      setDragOver(nach);
    }

    function onEnd(e: TouchEvent) {
      if (von === null) return;
      // Opacity zurücksetzen
      (Array.from(el!.querySelectorAll('[data-idx]')) as HTMLElement[])
        .forEach(r => (r.style.opacity = '1'));
      if (nach !== null && von !== nach) onReorder(von, nach);
      von = null; nach = null;
      setDragOver(null);
    }

    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchmove', onMove, { passive: false });
    el.addEventListener('touchend', onEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove', onMove);
      el.removeEventListener('touchend', onEnd);
    };
  }, [onReorder]);

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
      {wps.map((_, i) => {
        const isFirst = i === 0;
        const isLast = i === wps.length - 1;
        const label = isFirst ? 'Start' : isLast ? 'Ziel' : `Wegpunkt ${i}`;
        const istZiel = dragOver === i;
        return (
          <div
            key={i}
            data-idx={i}
            draggable
            onDragStart={() => { dragIdx.current = i; }}
            onDragOver={(e) => { e.preventDefault(); setDragOver(i); }}
            onDragLeave={() => setDragOver(null)}
            onDrop={() => {
              if (dragIdx.current !== null && dragIdx.current !== i) onReorder(dragIdx.current, i);
              dragIdx.current = null; setDragOver(null);
            }}
            onDragEnd={() => { dragIdx.current = null; setDragOver(null); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.4rem 0.6rem',
              background: istZiel ? `${farbe}22` : 'rgba(0,0,0,0.05)',
              borderRadius: 6, userSelect: 'none',
              border: istZiel ? `1.5px dashed ${farbe}` : '1.5px solid transparent',
              transition: 'background 0.1s',
            }}>
            <span data-grip="1" style={{ fontSize: '1.1rem', color: 'var(--mid)', flexShrink: 0, lineHeight: 1, cursor: 'grab', padding: '0 4px' }}>⠿</span>
            <span style={{ width: 22, height: 22, borderRadius: '50%', background: farbe, color: '#fff', fontWeight: 700, fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
            <span style={{ flex: 1, fontSize: '0.82rem', color: 'var(--ink)', fontWeight: isFirst || isLast ? 700 : 400 }}>{label}</span>
            <button onClick={() => onDelete(i)}
              style={{ padding: '4px 10px', background: '#DC2626', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, lineHeight: 1, flexShrink: 0 }}>
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}

function btnStyle(color: string, disabled: boolean): React.CSSProperties {
  return { padding: '0.35rem 0.85rem', borderRadius: 8, border: `1.5px solid ${color}`,
    background: disabled ? 'transparent' : color, color: disabled ? 'var(--mid)' : '#fff',
    fontSize: '0.8rem', fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1 };
}
