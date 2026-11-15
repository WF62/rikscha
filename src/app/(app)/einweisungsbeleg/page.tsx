'use client';
import { useSearchParams } from 'next/navigation';
import { Suspense, useRef, useEffect, useState, useCallback } from 'react';

// ── Signature-Pad ───────────────────────────────────────────────────────────
function SignaturePad({ label, name, value, onChange, readonly }: {
  label: string; name: string;
  value: string; onChange: (v: string) => void;
  readonly?: boolean;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);

  // Gespeicherte Unterschrift anzeigen
  useEffect(() => {
    if (!value || !ref.current) return;
    const img = new Image();
    img.onload = () => {
      const ctx = ref.current!.getContext('2d')!;
      ctx.clearRect(0, 0, ref.current!.width, ref.current!.height);
      ctx.drawImage(img, 0, 0);
    };
    img.src = value;
  }, [value]);

  const pos = (e: React.PointerEvent | React.TouchEvent) => {
    const r = ref.current!.getBoundingClientRect();
    if ('touches' in e) {
      const t = e.touches[0];
      return { x: (t.clientX - r.left) * (ref.current!.width / r.width), y: (t.clientY - r.top) * (ref.current!.height / r.height) };
    }
    const pe = e as React.PointerEvent;
    return { x: (pe.clientX - r.left) * (ref.current!.width / r.width), y: (pe.clientY - r.top) * (ref.current!.height / r.height) };
  };

  const start = (e: React.PointerEvent) => {
    if (readonly) return;
    e.preventDefault();
    drawing.current = true;
    last.current = pos(e);
    const ctx = ref.current!.getContext('2d')!;
    ctx.beginPath();
    ctx.arc(last.current.x, last.current.y, 1, 0, Math.PI * 2);
    ctx.fillStyle = '#1a1a18';
    ctx.fill();
  };

  const move = (e: React.PointerEvent) => {
    if (!drawing.current || readonly) return;
    e.preventDefault();
    const p = pos(e);
    const ctx = ref.current!.getContext('2d')!;
    ctx.beginPath();
    ctx.moveTo(last.current!.x, last.current!.y);
    ctx.lineTo(p.x, p.y);
    ctx.strokeStyle = '#1a1a18';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    last.current = p;
  };

  const end = () => {
    if (!drawing.current || readonly) return;
    drawing.current = false;
    onChange(ref.current!.toDataURL('image/png'));
  };

  const loeschen = () => {
    if (readonly) return;
    const ctx = ref.current!.getContext('2d')!;
    ctx.clearRect(0, 0, ref.current!.width, ref.current!.height);
    onChange('');
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.3rem' }}>
        <div style={{ fontSize: '0.78rem', color: '#6B7280', fontWeight: 600 }}>{label}</div>
        {!readonly && <button onClick={loeschen} style={{ background: 'none', border: 'none', fontSize: '0.75rem', color: '#9CA3AF', cursor: 'pointer', padding: 0 }}>Löschen</button>}
      </div>
      <canvas ref={ref} width={340} height={110}
        onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerLeave={end}
        style={{
          border: readonly ? '1.5px solid #E5E7EB' : '1.5px solid #9CA3AF',
          borderRadius: 8, width: '100%', height: 110, touchAction: 'none',
          background: readonly ? '#F9FAFB' : '#fff',
          cursor: readonly ? 'default' : 'crosshair',
          display: 'block',
        }}
      />
      {!readonly && <div style={{ fontSize: '0.72rem', color: '#9CA3AF', marginTop: '0.2rem' }}>Mit Maus oder Finger unterschreiben</div>}
      <div style={{ fontSize: '0.82rem', color: '#374151', marginTop: '0.3rem', fontWeight: 500 }}>{name}</div>
    </div>
  );
}

// ── Hauptinhalt ─────────────────────────────────────────────────────────────
function Beleg() {
  const params = useSearchParams();
  const id = params.get('id') ?? '';
  const kutscher = params.get('kutscher') ?? '';
  const fahrzeug = params.get('fahrzeug') ?? '';
  const datum = params.get('datum') ?? '';
  const eingewiesen_von = params.get('von') ?? '';

  const [sigKutscher, setSigKutscher] = useState('');
  const [sigEinweiser, setSigEinweiser] = useState('');
  const [gespeichert, setGespeichert] = useState(false);
  const [speichert, setSpeichert] = useState(false);
  const [fehler, setFehler] = useState('');
  const [geladen, setGeladen] = useState(false);

  const datumFormatiert = datum
    ? new Date(datum + 'T00:00:00').toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '';

  // Vorhandene Unterschriften laden
  useEffect(() => {
    if (!id) { setGeladen(true); return; }
    fetch(`/api/kutscher-fahrzeuge?id=${encodeURIComponent(id)}`, {
      headers: {
        'x-pilot': localStorage.getItem('kutscher_name') ?? '',
        'x-password': localStorage.getItem('kutscher_pw') ?? '',
      }
    })
      .then(r => r.ok ? r.json() : null)
      .then(j => {
        if (j?.unterschrift_kutscher) setSigKutscher(j.unterschrift_kutscher);
        if (j?.unterschrift_einweiser) setSigEinweiser(j.unterschrift_einweiser);
        if (j?.unterschrieben_am) setGespeichert(true);
      })
      .catch(() => {})
      .finally(() => setGeladen(true));
  }, [id]);

  const speichern = useCallback(async () => {
    if (!id) { setFehler('Keine Einweisungs-ID – bitte über Admin-Seite öffnen.'); return; }
    if (!sigKutscher && !sigEinweiser) { setFehler('Bitte mindestens eine Unterschrift leisten.'); return; }
    setSpeichert(true); setFehler('');
    const res = await fetch('/api/kutscher-fahrzeuge', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, unterschrift_kutscher: sigKutscher || null, unterschrift_einweiser: sigEinweiser || null }),
    });
    if (res.ok) {
      setGespeichert(true);
    } else {
      const j = await res.json().catch(() => ({}));
      setFehler(j.error ?? 'Fehler beim Speichern.');
    }
    setSpeichert(false);
  }, [id, sigKutscher, sigEinweiser]);

  const readonly = gespeichert;

  return (
    <div>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
          canvas { border: 1px solid #ccc !important; }
        }
        @page { size: A4; margin: 2cm; }
      `}</style>

      {/* Toolbar */}
      <div className="no-print" style={{ background: '#2D6B1E', padding: '0.75rem 1rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <a href="/admin/einweisungen" style={{ color: '#fff', fontSize: '0.9rem', textDecoration: 'none' }}>← Zurück</a>
        {gespeichert && (
          <span style={{ background: '#D1FAE5', color: '#065F46', borderRadius: 6, padding: '0.25rem 0.75rem', fontSize: '0.85rem', fontWeight: 700 }}>
            ✓ Unterschriften gespeichert
          </span>
        )}
        {!gespeichert && id && (
          <button onClick={speichern} disabled={speichert}
            style={{ background: '#fff', color: '#2D6B1E', border: 'none', borderRadius: 7, padding: '0.5rem 1.25rem', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}>
            {speichert ? '…' : '💾 Unterschriften digital speichern'}
          </button>
        )}
        <button onClick={() => window.print()}
          style={{ background: 'transparent', color: '#D1FAE5', border: '1.5px solid #86EFAC', borderRadius: 7, padding: '0.45rem 1rem', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
          🖨️ Drucken / PDF
        </button>
        {fehler && <span style={{ color: '#FCA5A5', fontSize: '0.85rem' }}>{fehler}</span>}
      </div>

      {/* Beleg */}
      {geladen && (
        <div style={{ maxWidth: 680, margin: '2rem auto', padding: '2rem', background: '#fff' }}>

          {/* Kopfzeile */}
          <div style={{ borderBottom: '3px solid #2D6B1E', paddingBottom: '1rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#6B7280', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>Mertener Rikschakutscher e.V.</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1a1a18', lineHeight: 1.2, marginTop: '0.2rem' }}>🚲 Einweisungsbeleg</div>
            </div>
            <div style={{ textAlign: 'right', fontSize: '0.8rem', color: '#6B7280' }}>
              <div>Ausgestellt am</div>
              <div style={{ fontWeight: 700, color: '#1a1a18' }}>{new Date().toLocaleDateString('de-DE')}</div>
              {gespeichert && <div style={{ color: '#059669', fontWeight: 600, marginTop: '0.2rem' }}>✓ Digital unterschrieben</div>}
            </div>
          </div>

          {/* Daten */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem' }}>
            <tbody>
              {([
                ['Kutscher / Fahrerin', kutscher],
                ['Fahrzeug', fahrzeug],
                ['Einweisung durchgeführt am', datumFormatiert],
                ['Einweisung durchgeführt durch', eingewiesen_von],
              ] as [string, string][]).map(([label, wert]) => (
                <tr key={label} style={{ borderBottom: '1px solid #E5E7EB' }}>
                  <td style={{ padding: '0.9rem 0.5rem 0.9rem 0', fontSize: '0.85rem', color: '#6B7280', fontWeight: 600, whiteSpace: 'nowrap', width: '45%' }}>{label}</td>
                  <td style={{ padding: '0.9rem 0.5rem', fontSize: '1rem', fontWeight: 700, color: '#1a1a18' }}>{wert || '–'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Bestätigungstext */}
          <div style={{ background: '#F0FDF4', border: '1.5px solid #86EFAC', borderRadius: 10, padding: '1rem 1.25rem', marginBottom: '2rem', fontSize: '0.9rem', color: '#14532D', lineHeight: 1.6 }}>
            Hiermit wird bestätigt, dass die oben genannte Person in der sicheren Handhabung und Bedienung
            des Rikscha-Fahrzeugs <strong>{fahrzeug}</strong> eingewiesen wurde und die Fahrt selbstständig
            durchführen darf.
          </div>

          {/* Unterschriften */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '1.5rem' }}>
            <SignaturePad
              label="Unterschrift Kutscher / Fahrerin"
              name={kutscher}
              value={sigKutscher}
              onChange={setSigKutscher}
              readonly={readonly}
            />
            <SignaturePad
              label="Unterschrift Einweiser"
              name={eingewiesen_von}
              value={sigEinweiser}
              onChange={setSigEinweiser}
              readonly={readonly}
            />
          </div>

          {/* Fußzeile */}
          <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #E5E7EB', fontSize: '0.75rem', color: '#9CA3AF', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
            <span>Einweisungsbeleg – Mertener Rikschakutscher</span>
            <span>Bitte je 1 Exemplar für Kutscher-Ordner und Admin-Ordner aufbewahren.</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EinweisungsBelegPage() {
  return (
    <Suspense>
      <Beleg />
    </Suspense>
  );
}
