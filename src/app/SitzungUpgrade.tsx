'use client';
import { useEffect } from 'react';

/**
 * Wer sich vor der Umstellung angemeldet hat, hat noch das echte Passwort im Browser gespeichert.
 * Hier wird es einmalig gegen einen Anmelde-Token getauscht – danach liegt das Passwort nicht mehr im Browser.
 */
export default function SitzungUpgrade() {
  useEffect(() => {
    let name: string | null = null, pw: string | null = null;
    try { name = localStorage.getItem('kutscher_name'); pw = localStorage.getItem('kutscher_pw'); } catch { return; }
    if (!name || !pw || pw.startsWith('t1.')) return;
    // Nur einmal pro Browser-Sitzung versuchen
    try { if (sessionStorage.getItem('sitzung_upgrade')) return; sessionStorage.setItem('sitzung_upgrade', '1'); } catch { return; }
    fetch('/api/pilot-login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pilot: name, password: pw }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (j?.token && localStorage.getItem('kutscher_pw') === pw) localStorage.setItem('kutscher_pw', j.token);
      })
      .catch(() => {});
  }, []);
  return null;
}
