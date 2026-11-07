'use client';
import { useState } from 'react';

/** Startzeit des Formulars – wird mitgeschickt (Feld "_t"), damit Bots, die sofort absenden, auffallen. */
export function useFormularStart(): number {
  const [t] = useState(() => Date.now());
  return t;
}

/**
 * Unsichtbares Lockfeld für Spam-Bots. Menschen sehen es nicht, Screenreader überspringen es.
 * Wert über `wert`/`onChange` mitführen und als "website" mitschicken.
 */
export function Lockfeld({ wert, onChange }: { wert: string; onChange: (v: string) => void }) {
  return (
    <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', top: 'auto', width: 1, height: 1, overflow: 'hidden' }}>
      <label>
        Bitte leer lassen
        <input type="text" name="website" tabIndex={-1} autoComplete="off" value={wert} onChange={(e) => onChange(e.target.value)} />
      </label>
    </div>
  );
}
