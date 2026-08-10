'use client';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const gespeichert = localStorage.getItem('theme');
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const istDark = gespeichert === 'dark' || (!gespeichert && systemDark);
    setDark(istDark);
    document.documentElement.dataset.theme = gespeichert ?? '';
  }, []);

  function toggle() {
    const neu = !dark;
    setDark(neu);
    const theme = neu ? 'dark' : 'light';
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('theme', theme);
  }

  return (
    <button
      onClick={toggle}
      aria-label={dark ? 'Helles Design aktivieren' : 'Dunkles Design aktivieren'}
      title={dark ? 'Helles Design' : 'Dunkles Design'}
      style={{
        background: 'none', border: '1.5px solid rgba(255,255,255,0.4)', borderRadius: '6px',
        color: '#fff', cursor: 'pointer', fontSize: '0.95rem', padding: '0.25rem 0.5rem',
        lineHeight: 1,
      }}
    >
      {dark ? '☀️' : '🌙'}
    </button>
  );
}
