import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Rikscha Fahrtenkalender',
  description: 'Kalender & Buchungssystem fuer das Rikscha-Team',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className={`${inter.className} bg-rikscha-bg min-h-screen`}>
        <header className="bg-rikscha-green text-white shadow-md">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">&#x1F6B2;</span>
              <div>
                <h1 className="text-xl font-bold leading-tight">Rikscha-Team</h1>
                <p className="text-xs text-green-200">Fahrtenkalender</p>
              </div>
            </div>
            <nav className="flex gap-4 text-sm items-center">
              <a href="/" className="hover:text-green-200 transition-colors">Kalender</a>
              <a href="/buchen" className="bg-white text-rikscha-green font-semibold px-3 py-1 rounded hover:bg-green-50 transition-colors">+ Fahrt buchen</a>
              <form action="/api/logout" method="POST">
                <button type="submit" className="text-green-300 hover:text-white text-xs transition-colors">Abmelden</button>
              </form>
            </nav>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
        <footer className="text-center text-xs text-gray-400 py-6">
          Rikscha-Team &bull; <a href="/api/ical" className="underline">iCal Feed</a>
        </footer>
      </body>
    </html>
  );
}
