'use client';
import { usePathname } from 'next/navigation';

/** Leiste mit Zurück-Knopf für die internen Seiten (der Kalender hat eine eigene Kopfleiste) */
export default function ZurueckLeiste() {
  const pfad = usePathname();
  if (pfad?.startsWith('/kalender')) return null;

  // Ziel: eine Ebene höher, mindestens /admin
  const teile = (pfad ?? '').split('/').filter(Boolean);
  const ziel = teile.length > 1 ? '/' + teile.slice(0, -1).join('/') : '/admin';

  return (
    <nav aria-label="Navigation" className="print:hidden bg-rikscha-green text-white flex items-center gap-4 px-4 py-2 mb-4 text-sm">
      <a href={ziel} className="font-semibold hover:underline">← Zurück</a>
      <span className="opacity-40">|</span>
      <a href="/" className="hover:underline">🏠 Website</a>
      <a href="/kalender" className="hover:underline">📅 Kalender</a>
    </nav>
  );
}