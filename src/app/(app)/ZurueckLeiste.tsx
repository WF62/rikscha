'use client';
import { usePathname } from 'next/navigation';

/** Leiste mit Zurück-Knopf für die internen Seiten (der Kalender hat eine eigene Kopfleiste) */
export default function ZurueckLeiste() {
  const pfad = usePathname();
  if (pfad?.startsWith('/kalender')) return null;
  const zurueck = () => {
    // Zurück zur vorigen Seite der App – sonst zur Startseite (z. B. wenn die Seite in einem neuen Tab geöffnet wurde)
    if (window.history.length > 1 && document.referrer.startsWith(location.origin)) window.history.back();
    else window.location.href = '/';
  };
  return (
    <nav aria-label="Navigation" className="print:hidden bg-rikscha-green text-white flex items-center gap-4 px-4 py-2 mb-4 text-sm">
      <button onClick={zurueck} className="font-semibold hover:underline">← Zurück</button>
      <span className="opacity-40">|</span>
      <a href="/" className="hover:underline">🏠 Website</a>
      <a href="/kalender" className="hover:underline">📅 Kalender</a>
    </nav>
  );
}
