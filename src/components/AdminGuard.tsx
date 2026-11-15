'use client';
import { useState, useEffect, useCallback } from 'react';

const KEY = 'admin_auth_token';

function istKutscherAdmin() {
  const rolle = localStorage.getItem('kutscher_rolle') ?? '';
  return ['kutscher-admin', 'gfo', 'admin'].includes(rolle);
}

export function useAdminAuth() {
  const [eingeloggt, setEingeloggt] = useState<boolean | null>(null); // null = noch prüfen

  useEffect(() => {
    const token = localStorage.getItem(KEY);
    setEingeloggt(!!token || istKutscherAdmin());
  }, []);

  const login = useCallback(async (pw: string): Promise<string | null> => {
    const res = await fetch('/api/admin/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw }),
    });
    if (res.ok) {
      localStorage.setItem(KEY, pw);
      setEingeloggt(true);
      return null;
    }
    return res.status === 429 ? 'Zu viele falsche Versuche. Bitte 15 Minuten warten.' : 'Falsches Passwort.';
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(KEY);
    setEingeloggt(false);
  }, []);

  const getToken = useCallback(() => localStorage.getItem(KEY) ?? '', []);

  return { eingeloggt, login, logout, getToken };
}

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { eingeloggt, login } = useAdminAuth();
  const [pw, setPw] = useState('');
  const [fehler, setFehler] = useState('');
  const [laden, setLaden] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLaden(true);
    const err = await login(pw);
    setLaden(false);
    if (err) setFehler(err);
  };

  if (eingeloggt === null) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#6B7280' }}>Lädt…</div>;
  }

  if (!eingeloggt) {
    return (
      <div style={{ maxWidth: 360, margin: '4rem auto', padding: '0 1rem', fontFamily: 'sans-serif' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#2D6B1E', marginBottom: '1.5rem' }}>Admin-Bereich</h2>
        <form onSubmit={submit} style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.9rem' }}>Admin-Passwort</label>
            <input
              type="password"
              value={pw}
              onChange={e => setPw(e.target.value)}
              autoFocus
              required
              placeholder="••••••••"
              style={{ width: '100%', boxSizing: 'border-box', border: '1.5px solid #D1D5DB', borderRadius: 8, padding: '0.55rem 0.75rem', fontSize: '1rem' }}
            />
          </div>
          {fehler && <p style={{ color: '#DC2626', fontSize: '0.85rem', margin: 0 }}>{fehler}</p>}
          <button
            type="submit"
            disabled={laden}
            style={{ background: '#2D6B1E', color: '#fff', border: 'none', borderRadius: 8, padding: '0.65rem', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', opacity: laden ? 0.7 : 1 }}
          >
            {laden ? 'Prüfe…' : 'Anmelden'}
          </button>
        </form>
      </div>
    );
  }

  return <>{children}</>;
}
