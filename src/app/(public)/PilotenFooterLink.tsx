'use client';

export default function PilotenFooterLink() {
  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    const g = sessionStorage.getItem('pilot_name');
    if (g) {
      const nameEl = document.getElementById('pilot-name-display');
      const bereich = document.getElementById('piloten-bereich');
      if (nameEl) nameEl.textContent = g;
      if (bereich) bereich.style.display = 'block';
      document.body.style.overflow = 'hidden';
    } else {
      if ((window as any).rikschaLadeNamen) (window as any).rikschaLadeNamen();
      const overlay = document.getElementById('pw-overlay') as HTMLElement;
      if (overlay) overlay.style.display = 'flex';
    }
  }

  return (
    <a href="javascript:void(0)" className="piloten-link" onClick={handleClick}>
      Piloten
    </a>
  );
}
