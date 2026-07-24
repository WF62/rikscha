'use client';

import { useEffect } from 'react';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('App error:', error);
  }, [error]);

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace' }}>
      <h2 style={{ color: 'red', marginBottom: '1rem' }}>Fehler aufgetreten</h2>
      <pre style={{ background: '#f5f5f5', padding: '1rem', borderRadius: '4px', overflowX: 'auto', fontSize: '12px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {error.message}
        {'\n\n'}
        {error.stack}
      </pre>
      <button onClick={reset} style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#1B4A12', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
        Nochmal versuchen
      </button>
    </div>
  );
}
