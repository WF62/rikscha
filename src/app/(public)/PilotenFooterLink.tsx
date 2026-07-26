'use client';

export default function PilotenFooterLink() {
  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('open-piloten-modal'));
  }

  return (
    <a href="javascript:void(0)" className="piloten-link" onClick={handleClick}>
      Piloten
    </a>
  );
}
