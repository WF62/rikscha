import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'Mertener Rikschakutscher',
    template: '%s · Mertener Rikschakutscher',
  },
  description: 'Kostenlose Rikschafahrten durch Bornheim-Merten seit 2018. Drei Rikschas, elf Piloten, ein Herz fürs Ehrenamt.',
  metadataBase: new URL('https://rikscha-kutscher.de'),
  alternates: { canonical: '/' },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
