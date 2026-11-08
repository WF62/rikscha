'use client';
import { useEffect, useState } from 'react';

/**
 * Lädt die Seite komplett neu – mit der neuesten App-Version und den neuesten Daten.
 * Zeigt daneben, von wann der angezeigte Stand ist.
 */
export default function AktualisierenKnopf({ hell = false }: { hell?: boolean }) {
  const [stand, setStand] = useState('');
  const [laedt, setLaedt] = useState(false);
  useEffect(() => {
    setStand(new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }));
  }, []);
  return (
    <span className="inline-flex items-center gap-2">
      {stand && <span className={`text-xs ${hell ? 'text-white/80' : 'text-gray-500'}`}>Stand {stand} Uhr</span>}
      <button type="button" disabled={laedt} title="Neueste Daten und neueste Version laden"
        onClick={() => { setLaedt(true); window.location.reload(); }}
        className={`text-sm font-semibold rounded px-3 py-1.5 border ${hell
          ? 'bg-white/15 border-white/60 text-white hover:bg-white/25'
          : 'bg-white border-rikscha-green text-rikscha-green hover:bg-green-50'} disabled:opacity-60`}>
        {laedt ? '⏳ Lädt…' : '🔄 Aktualisieren'}
      </button>
    </span>
  );
}
