'use client';
import { useEffect, useState } from 'react';

export default function EinfacheSpracheToggle() {
  const [aktiv, setAktiv] = useState(false);

  useEffect(() => {
    const gespeichert = localStorage.getItem('einfache_sprache') === 'true';
    setAktiv(gespeichert);
    document.documentElement.classList.toggle('einfache-sprache', gespeichert);
  }, []);

  function toggle() {
    const neu = !aktiv;
    setAktiv(neu);
    localStorage.setItem('einfache_sprache', String(neu));
    document.documentElement.classList.toggle('einfache-sprache', neu);
  }

  return (
    <button
      onClick={toggle}
      aria-pressed={aktiv}
      title={aktiv ? 'Zurück zur Standard-Sprache' : 'Texte in Einfacher Sprache anzeigen'}
      style={{
        background: aktiv ? 'rgba(255,255,255,0.25)' : 'none',
        border: '1.5px solid rgba(255,255,255,0.4)',
        borderRadius: '6px', color: '#fff', cursor: 'pointer',
        fontSize: '0.78rem', fontWeight: 600, padding: '0.25rem 0.6rem',
        lineHeight: 1.3, whiteSpace: 'nowrap',
      }}
    >
      {aktiv ? 'Standard-Sprache' : 'Einfache Sprache'}
    </button>
  );
}
