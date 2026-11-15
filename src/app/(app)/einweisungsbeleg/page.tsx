'use client';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function Beleg() {
  const params = useSearchParams();
  const kutscher = params.get('kutscher') ?? '';
  const fahrzeug = params.get('fahrzeug') ?? '';
  const datum = params.get('datum') ?? '';
  const eingewiesen_von = params.get('von') ?? '';

  const datumFormatiert = datum
    ? new Date(datum + 'T00:00:00').toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '';

  return (
    <div>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
        }
        @page { size: A4; margin: 2cm; }
        body { font-family: 'Helvetica Neue', Arial, sans-serif; }
      `}</style>

      {/* Druck-Button */}
      <div className="no-print" style={{ background: '#2D6B1E', padding: '0.75rem 1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <a href="/admin/einweisungen" style={{ color: '#fff', fontSize: '0.9rem', textDecoration: 'none' }}>← Zurück</a>
        <button onClick={() => window.print()}
          style={{ background: '#fff', color: '#2D6B1E', border: 'none', borderRadius: 7, padding: '0.5rem 1.25rem', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}>
          🖨️ Drucken / Als PDF speichern
        </button>
        <span style={{ color: '#D1FAE5', fontSize: '0.82rem' }}>Tipp: "Als PDF speichern" im Druckdialog wählen</span>
      </div>

      {/* Beleg */}
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
          </div>
        </div>

        {/* Hauptinhalt */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2.5rem' }}>
          <tbody>
            {[
              ['Kutscher / Fahrerin', kutscher],
              ['Fahrzeug', fahrzeug],
              ['Einweisung durchgeführt am', datumFormatiert],
              ['Einweisung durchgeführt durch', eingewiesen_von],
            ].map(([label, wert]) => (
              <tr key={label} style={{ borderBottom: '1px solid #E5E7EB' }}>
                <td style={{ padding: '0.9rem 0.5rem 0.9rem 0', fontSize: '0.85rem', color: '#6B7280', fontWeight: 600, whiteSpace: 'nowrap', width: '45%' }}>{label}</td>
                <td style={{ padding: '0.9rem 0.5rem', fontSize: '1rem', fontWeight: 700, color: '#1a1a18' }}>{wert || '–'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Bestätigungstext */}
        <div style={{ background: '#F0FDF4', border: '1.5px solid #86EFAC', borderRadius: 10, padding: '1rem 1.25rem', marginBottom: '2.5rem', fontSize: '0.9rem', color: '#14532D', lineHeight: 1.6 }}>
          Hiermit wird bestätigt, dass die oben genannte Person in der sicheren Handhabung und Bedienung
          des Rikscha-Fahrzeugs <strong>{fahrzeug}</strong> eingewiesen wurde und die Fahrt selbstständig
          durchführen darf.
        </div>

        {/* Unterschriften */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', marginTop: '1.5rem' }}>
          {[
            ['Unterschrift Kutscher / Fahrerin', kutscher],
            ['Unterschrift Einweiser', eingewiesen_von],
          ].map(([label, name]) => (
            <div key={label}>
              <div style={{ borderBottom: '1.5px solid #374151', marginBottom: '0.4rem', height: '2.5rem' }} />
              <div style={{ fontSize: '0.78rem', color: '#6B7280', fontWeight: 600 }}>{label}</div>
              <div style={{ fontSize: '0.82rem', color: '#374151', marginTop: '0.1rem' }}>{name}</div>
            </div>
          ))}
        </div>

        {/* Hinweis */}
        <div style={{ marginTop: '3rem', paddingTop: '1rem', borderTop: '1px solid #E5E7EB', fontSize: '0.75rem', color: '#9CA3AF', display: 'flex', justifyContent: 'space-between' }}>
          <span>Einweisungsbeleg – Mertener Rikschakutscher</span>
          <span>Bitte je 1 Exemplar für Kutscher-Ordner und Admin-Ordner aufbewahren.</span>
        </div>
      </div>
    </div>
  );
}

export default function EinweisungsbelgPage() {
  return (
    <Suspense>
      <Beleg />
    </Suspense>
  );
}
