'use client';
import 'leaflet/dist/leaflet.css';
import { useEffect, useRef, useState } from 'react';

interface Tour {
  id: string;
  name: string;
  kurzname: string;
  farbe: string;
  farbeHell: string;
  beschreibung: string;
  laenge: string;
  dauer: string;
  punkte: [number, number][];
  ziel: [number, number];
}

const TOUREN: Tour[] = [
  {
    id: 'heide',
    name: 'Auf der Heide',
    kurzname: 'Mertener Heide',
    farbe: '#2D6B1E',
    farbeHell: '#D1FAC8',
    beschreibung: 'Vorbei an Pferdekoppeln, Ziegenweiden und Alpakas ins Grüne. Frische Luft und vertraute Lieblingsorte.',
    laenge: 'ca. 8 km',
    dauer: 'ca. 45 Min.',
    punkte: [
      [50.754, 6.984],
      [50.749, 6.979],
      [50.742, 6.972],
      [50.735, 6.963],
      [50.730, 6.958],
      [50.733, 6.970],
      [50.738, 6.980],
      [50.745, 6.988],
      [50.754, 6.984],
    ],
    ziel: [50.730, 6.958],
  },
  {
    id: 'schloesser',
    name: 'Brühler Schlösserrunde',
    kurzname: 'Schlösserrunde',
    farbe: '#92400E',
    farbeHell: '#FDE68A',
    beschreibung: 'Durch Gemüsefelder nach Walberberg, Eispause in Brühl, durch den Schlosspark Augustusburg, Biergarten am Schloss.',
    laenge: 'ca. 22 km',
    dauer: 'ca. 2 Std.',
    punkte: [
      [50.754, 6.984],
      [50.755, 6.963],
      [50.757, 6.943],
      [50.758, 6.922],
      [50.760, 6.907],
      [50.775, 6.903],
      [50.800, 6.903],
      [50.820, 6.904],
      [50.831, 6.908],
      [50.826, 6.915],
      [50.820, 6.928],
      [50.800, 6.942],
      [50.778, 6.955],
      [50.762, 6.968],
      [50.754, 6.984],
    ],
    ziel: [50.831, 6.908],
  },
  {
    id: 'rhein',
    name: 'Fahrt zum Rhein',
    kurzname: 'Zum Rhein',
    farbe: '#1D4ED8',
    farbeHell: '#BFDBFE',
    beschreibung: 'Westlich durch Walberberg und Bornheim bis zum Rheinufer — weite Aussicht und Ruhe am Fluss.',
    laenge: 'ca. 12 km',
    dauer: 'ca. 1 Std.',
    punkte: [
      [50.754, 6.984],
      [50.755, 6.964],
      [50.758, 6.943],
      [50.762, 6.918],
      [50.768, 6.898],
      [50.774, 6.875],
      [50.772, 6.856],
    ],
    ziel: [50.772, 6.856],
  },
  {
    id: 'swister',
    name: 'Fahrt zum Swistertürmchen',
    kurzname: 'Swistertürmchen',
    farbe: '#B45309',
    farbeHell: '#FED7AA',
    beschreibung: 'Entlang der Swister zum historischen Türmchen in Bornheim — ruhige Wege und schöne Aussicht.',
    laenge: 'ca. 6 km',
    dauer: 'ca. 35 Min.',
    punkte: [
      [50.754, 6.984],
      [50.758, 6.993],
      [50.762, 7.003],
      [50.765, 7.015],
      [50.762, 7.026],
    ],
    ziel: [50.762, 7.026],
  },
  {
    id: 'londorf',
    name: 'Rundfahrt Gut Londorf',
    kurzname: 'Gut Londorf',
    farbe: '#6D28D9',
    farbeHell: '#DDD6FE',
    beschreibung: 'Eine gemütliche Rundfahrt zum Gutshof Londorf — idyllische Feldwege und Panoramablick.',
    laenge: 'ca. 5 km',
    dauer: 'ca. 30 Min.',
    punkte: [
      [50.754, 6.984],
      [50.751, 6.991],
      [50.747, 6.999],
      [50.743, 7.007],
      [50.740, 7.012],
      [50.743, 7.004],
      [50.748, 6.997],
      [50.754, 6.984],
    ],
    ziel: [50.740, 7.012],
  },
];

const START: [number, number] = [50.754, 6.984];

export default function TourenKarte() {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<unknown>(null);
  const [aktiveTour, setAktiveTour] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !mapRef.current || leafletMapRef.current) return;

    let L: typeof import('leaflet');

    async function initMap() {
      L = (await import('leaflet')).default;

      if (!mapRef.current) return;

      const map = L.map(mapRef.current, {
        center: [50.763, 6.962],
        zoom: 12,
        zoomControl: true,
        scrollWheelZoom: false,
      });

      leafletMapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map);

      // Startpunkt
      const startIcon = L.divIcon({
        html: `<div style="
          width:18px;height:18px;background:#1a1208;border:3px solid #C8881A;
          border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.4);
        "></div>`,
        className: '',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });
      L.marker(START, { icon: startIcon })
        .addTo(map)
        .bindPopup('<strong>Start / Ziel</strong><br>GFO Kloster Merten');

      // Touren einzeichnen
      TOUREN.forEach((tour) => {
        const line = L.polyline(tour.punkte, {
          color: tour.farbe,
          weight: 5,
          opacity: 0.85,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(map);

        line.on('click', () => setAktiveTour(tour.id));
        line.bindTooltip(tour.kurzname, {
          permanent: false,
          direction: 'center',
          className: 'leaflet-tour-tooltip',
        });

        // Zielmarker
        const zielIcon = L.divIcon({
          html: `<div style="
            width:14px;height:14px;background:${tour.farbe};border:2px solid #fff;
            border-radius:50%;box-shadow:0 2px 5px rgba(0,0,0,0.35);
          "></div>`,
          className: '',
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });
        L.marker(tour.ziel, { icon: zielIcon })
          .addTo(map)
          .bindPopup(`<strong>${tour.name}</strong><br>${tour.laenge} · ${tour.dauer}`);
      });
    }

    initMap();

    return () => {
      if (leafletMapRef.current) {
        (leafletMapRef.current as { remove: () => void }).remove();
        leafletMapRef.current = null;
      }
    };
  }, [mounted]);

  const aktiveTourData = TOUREN.find((t) => t.id === aktiveTour);

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
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        {TOUREN.map((tour) => (
          <button
            key={tour.id}
            onClick={() => setAktiveTour(aktiveTour === tour.id ? null : tour.id)}
            aria-pressed={aktiveTour === tour.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.4rem 0.85rem',
              borderRadius: 999,
              border: `2px solid ${tour.farbe}`,
              background: aktiveTour === tour.id ? tour.farbe : 'transparent',
              color: aktiveTour === tour.id ? '#fff' : tour.farbe,
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            <span style={{
              display: 'inline-block', width: 10, height: 10,
              borderRadius: 2,
              background: aktiveTour === tour.id ? 'rgba(255,255,255,0.7)' : tour.farbe,
            }} />
            {tour.kurzname}
          </button>
        ))}
      </div>

      {/* Karte */}
      <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', border: '1.5px solid var(--border)', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <div ref={mapRef} style={{ height: 480, width: '100%' }} />
        <style>{`
          .leaflet-tour-tooltip {
            background: rgba(20,15,8,0.85);
            color: #fff;
            border: none;
            border-radius: 6px;
            font-size: 0.78rem;
            font-weight: 600;
            padding: 4px 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          }
          .leaflet-tour-tooltip::before { display: none; }
        `}</style>
      </div>

      {/* Tour-Detail */}
      {aktiveTourData && (
        <div style={{
          padding: '1rem 1.25rem',
          borderRadius: 12,
          border: `2px solid ${aktiveTourData.farbe}`,
          background: 'var(--surface)',
          display: 'flex',
          gap: '1.25rem',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
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
        Kartendaten: © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener" style={{ color: 'var(--mid)' }}>OpenStreetMap</a>-Mitwirkende · Strecken sind Näherungswerte
      </p>
    </div>
  );
}
