import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Mertener Rikschakutscher – kostenlose Rikschafahrten durch Bornheim-Merten';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#2D6B1E',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'flex-end',
          padding: '64px 72px',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Dekoratives Element oben rechts */}
        <div style={{
          position: 'absolute',
          top: 0, right: 0,
          width: '400px', height: '400px',
          background: 'rgba(255,255,255,0.04)',
          borderRadius: '0 0 0 400px',
          display: 'flex',
        }} />

        {/* Eyebrow */}
        <div style={{
          color: '#E8C070',
          fontSize: 22,
          fontWeight: 600,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          marginBottom: 20,
          display: 'flex',
        }}>
          Bornheim-Merten · Ehrenamt · seit 2018
        </div>

        {/* Haupttitel */}
        <div style={{
          color: '#ffffff',
          fontSize: 72,
          fontWeight: 800,
          lineHeight: 1.05,
          marginBottom: 24,
          display: 'flex',
        }}>
          Mertener<br />Rikschakutscher
        </div>

        {/* Untertitel */}
        <div style={{
          color: 'rgba(255,255,255,0.85)',
          fontSize: 28,
          lineHeight: 1.4,
          maxWidth: 680,
          display: 'flex',
        }}>
          Kostenlose Rikschafahrten für alle — mit Herz, Pedalen und elf begeisterten Piloten.
        </div>

        {/* Kennzahlen-Zeile */}
        <div style={{
          display: 'flex',
          gap: 48,
          marginTop: 48,
        }}>
          {[['3', 'Rikschas'], ['11', 'Piloten'], ['2018', 'Gegründet']].map(([zahl, label]) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ color: '#E8C070', fontSize: 40, fontWeight: 800, lineHeight: 1 }}>{zahl}</span>
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 18, marginTop: 4 }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Domain */}
        <div style={{
          position: 'absolute',
          top: 64, right: 72,
          color: 'rgba(255,255,255,0.5)',
          fontSize: 20,
          display: 'flex',
        }}>
          rikscha-kutscher.de
        </div>
      </div>
    ),
    { ...size }
  );
}
