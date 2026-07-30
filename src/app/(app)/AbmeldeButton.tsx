'use client';

export default function AbmeldeButton() {
  function abmelden() {
    localStorage.removeItem('pilot_name');
    localStorage.removeItem('pilot_pw');
    localStorage.removeItem('pilot_rolle');
    window.location.href = '/';
  }
  return (
    <button onClick={abmelden}
      className="text-sm text-green-200 hover:text-white transition-colors">
      Abmelden
    </button>
  );
}
