'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') ?? '/';
  const [pw, setPw] = useState('');
  const [fehler, setFehler] = useState('');
  const [laden, setLaden] = useState(false);

  const absenden = async (e: React.FormEvent) => {
    e.preventDefault();
    setLaden(true);
    setFehler('');
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw }),
    });
    if (res.ok) {
      router.push(next);
    } else {
      setFehler('Falsches Passwort.');
      setLaden(false);
    }
  };

  return (
    <div className="min-h-screen bg-rikscha-bg flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-sm">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-3xl">&#x1F6B2;</span>
          <div>
            <h1 className="text-xl font-bold text-rikscha-green leading-tight">Rikscha-Team</h1>
            <p className="text-xs text-gray-500">Piloten-Bereich</p>
          </div>
        </div>

        <form onSubmit={absenden} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1 text-gray-700">Passwort</label>
            <input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              autoFocus
              required
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rikscha-green"
              placeholder="••••••••"
            />
          </div>
          {fehler && <p className="text-red-600 text-sm">{fehler}</p>}
          <button
            type="submit"
            disabled={laden}
            className="w-full bg-rikscha-green text-white rounded px-4 py-2 font-semibold hover:bg-rikscha-light disabled:opacity-50 transition-colors"
          >
            {laden ? 'Wird geprüft…' : 'Anmelden'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginSeite() {
  return <Suspense><LoginForm /></Suspense>;
}
