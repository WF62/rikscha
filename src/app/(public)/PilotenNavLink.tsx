'use client';

export default function PilotenNavLink() {
  return (
    <a
      href="#"
      className="nav-piloten"
      onClick={(e) => { e.preventDefault(); window.dispatchEvent(new CustomEvent('open-piloten-modal')); }}
    >
      🔑 Piloten
    </a>
  );
}
