'use client';

export default function AbmeldeButton() {
  function abmelden() {
    localStorage.removeItem('kutscher_name');
    localStorage.removeItem('kutscher_pw');
    localStorage.removeItem('kutscher_rolle');
    window.location.href = '/';
  }
  return (
    <button onClick={abmelden}
      className="text-sm text-green-200 hover:text-white transition-colors">
      Abmelden
    </button>
  );
}
