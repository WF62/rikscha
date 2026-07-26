'use client';
import { useState } from 'react';

export default function HamburgerMenu() {
  const [open, setOpen] = useState(false);

  const close = () => {
    setOpen(false);
    document.body.style.overflow = '';
  };

  const toggle = () => {
    const next = !open;
    setOpen(next);
    document.body.style.overflow = next ? 'hidden' : '';
  };

  return (
    <>
      <button
        onClick={toggle}
        aria-label="Menü öffnen"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '5px',
          cursor: 'pointer',
          background: 'none',
          border: 'none',
          padding: '6px',
        }}
        className="hamburger-btn"
      >
        <span style={{
          display: 'block', width: '24px', height: '2px', background: '#fff', borderRadius: '2px',
          transition: 'all 0.25s',
          transform: open ? 'translateY(7px) rotate(45deg)' : 'none',
        }}/>
        <span style={{
          display: 'block', width: '24px', height: '2px', background: '#fff', borderRadius: '2px',
          transition: 'all 0.25s',
          opacity: open ? 0 : 1,
        }}/>
        <span style={{
          display: 'block', width: '24px', height: '2px', background: '#fff', borderRadius: '2px',
          transition: 'all 0.25s',
          transform: open ? 'translateY(-7px) rotate(-45deg)' : 'none',
        }}/>
      </button>

      {open && (
        <div style={{
          display: 'flex', flexDirection: 'column',
          position: 'fixed', top: '52px', left: 0, right: 0, bottom: 0,
          background: '#2D6B1E', zIndex: 999, overflowY: 'auto',
          padding: '1.5rem 2rem 3rem',
        }}>
          {[
            { href: '#fahrten', label: 'Fahrten' },
            { href: '#fahrzeuge', label: 'Fahrzeuge' },
            { href: '#team', label: 'Team' },
            { href: '#touren', label: 'Touren' },
            { href: '#ausbildung', label: 'Mitmachen' },
            { href: '#spenden', label: 'Spenden' },
            { href: '/galerie', label: 'Galerie' },
            { href: '#kontakt', label: 'Kontakt' },
          ].map(({ href, label }) => (
            <a key={href} href={href} onClick={close} style={{
              color: '#fff', textDecoration: 'none', fontSize: '1.1rem',
              padding: '0.85rem 0', borderBottom: '1px solid rgba(255,255,255,0.12)', display: 'block',
            }}>{label}</a>
          ))}
          <a href="/kalender" onClick={close} style={{
            color: '#fff', textDecoration: 'none', fontSize: '1.05rem', fontWeight: 700,
            marginTop: '1rem', background: 'rgba(255,255,255,0.15)', borderRadius: '8px',
            padding: '0.85rem 1rem', display: 'block',
          }}>📅 Termine</a>
          <a href="/gutschein" onClick={close} style={{
            color: '#fff', textDecoration: 'none', fontSize: '1.05rem', fontWeight: 700,
            marginTop: '0.5rem', background: 'rgba(255,255,255,0.15)', borderRadius: '8px',
            padding: '0.85rem 1rem', display: 'block',
          }}>🎁 Gutschein</a>
          <a href="/flyer" onClick={close} style={{
            color: '#fff', textDecoration: 'none', fontSize: '1.05rem', fontWeight: 700,
            marginTop: '0.5rem', background: 'rgba(255,255,255,0.15)', borderRadius: '8px',
            padding: '0.85rem 1rem', display: 'block',
          }}>🖨️ Flyer</a>
        </div>
      )}
    </>
  );
}
