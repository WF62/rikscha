import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Rikscha Fahrtenkalender',
  description: 'Kalender & Buchungssystem fuer das Rikscha-Team',
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
            <nav className="flex gap-4 text-sm">
              <a href="/" className="hover:text-green-200 transition-colors">Kalender</a>
              <a href="/buchen" className="bg-white text-rikscha-green font-semibold px-3 py-1 rounded hover:bg-green-50 transition-colors">+ Fahrt buchen</a>
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
