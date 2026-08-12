'use client';
import { useState, useEffect, useRef } from 'react';

export default function HamburgerMenu() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 120);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const close = () => {
    setOpen(false);
    document.body.style.overflow = '';
    setTimeout(() => btnRef.current?.focus(), 10);
  };

  const toggle = () => {
    const next = !open;
    setOpen(next);
    document.body.style.overflow = next ? 'hidden' : '';
    if (next) {
      setTimeout(() => menuRef.current?.querySelector<HTMLElement>('a')?.focus(), 50);
    }
  };

  // Fokusfalle & Escape-Taste
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { close(); return; }
      if (e.key !== 'Tab') return;
      const focusable = menuRef.current?.querySelectorAll<HTMLElement>('a, button');
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);

  return (
    <>
      {/* Floating Menu Button — nur Desktop, erscheint nach Scrollen */}
      <button
        onClick={toggle}
        aria-label="Menü öffnen"
        style={{
          position: 'fixed',
          right: '1.25rem',
          bottom: '1.5rem',
          zIndex: 998,
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: 'rgba(45,107,30,0.92)',
          backdropFilter: 'blur(6px)',
          border: '1.5px solid rgba(255,255,255,0.2)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.22)',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4px',
          transition: 'opacity 0.25s, transform 0.25s',
          opacity: scrolled && !open ? 1 : 0,
          pointerEvents: scrolled && !open ? 'auto' : 'none',
          transform: scrolled && !open ? 'translateY(0)' : 'translateY(12px)',
        }}
        className="floating-menu-btn"
      >
        <span style={{ display:'block', width:'18px', height:'2px', background:'#fff', borderRadius:'2px' }}/>
        <span style={{ display:'block', width:'18px', height:'2px', background:'#fff', borderRadius:'2px' }}/>
        <span style={{ display:'block', width:'18px', height:'2px', background:'#fff', borderRadius:'2px' }}/>
      </button>

      <button
        ref={btnRef}
        onClick={toggle}
        aria-label={open ? 'Menü schließen' : 'Menü öffnen'}
        aria-expanded={open}
        aria-controls="mobile-menu"
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
        <div
          ref={menuRef}
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
          style={{
            display: 'flex', flexDirection: 'column',
            position: 'fixed', top: '52px', left: 0, right: 0, bottom: 0,
            background: '#2D6B1E', zIndex: 999, overflowY: 'auto',
            padding: '1.5rem 2rem 3rem',
          }}>
          {[
            { href: '#fahrten', label: 'Fahrten' },
            { href: '#touren', label: 'Touren' },
            { href: '#fahrzeuge', label: 'Fahrzeuge' },
            { href: '#stimmen', label: 'Stimmen' },
            { href: '#kontakt', label: 'Kontakt' },
            { href: '#team', label: 'Team' },
            { href: '#ausbildung', label: 'Mitmachen' },
            { href: '#spenden', label: 'Spenden' },
            { href: '/galerie', label: 'Galerie' },
          ].map(({ href, label }) => (
            <a key={href} href={href} onClick={close} style={{
              color: '#fff', textDecoration: 'none', fontSize: '1.1rem',
              padding: '0.85rem 0', borderBottom: '1px solid rgba(255,255,255,0.12)', display: 'block',
            }}>{label}</a>
          ))}
          <a href="/buchen" onClick={close} style={{
            color: '#fff', textDecoration: 'none', fontSize: '1.05rem', fontWeight: 700,
            marginTop: '1rem', background: 'rgba(255,255,255,0.15)', borderRadius: '8px',
            padding: '0.85rem 1rem', display: 'block',
          }}>Fahrt buchen</a>
          <a href="/gutschein" onClick={close} style={{
            color: '#fff', textDecoration: 'none', fontSize: '1.05rem', fontWeight: 700,
            marginTop: '0.5rem', background: 'rgba(255,255,255,0.15)', borderRadius: '8px',
            padding: '0.85rem 1rem', display: 'block',
          }}>Gutschein</a>
          <a href="#" onClick={(e) => { e.preventDefault(); close(); window.dispatchEvent(new CustomEvent('open-piloten-modal')); }} style={{
            color: '#fff', textDecoration: 'none', fontSize: '1.05rem', fontWeight: 700,
            marginTop: '0.5rem', background: 'rgba(255,255,255,0.15)', borderRadius: '8px',
            padding: '0.85rem 1rem', display: 'block',
          }}>Piloten-Login</a>
        </div>
      )}
    </>
  );
}
