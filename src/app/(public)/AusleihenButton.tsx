'use client';
import { useEffect, useState } from 'react';

export default function AusleihenButton({ label }: { label: string }) {
  const [rolle, setRolle] = useState<string | null>(null);

  useEffect(() => {
    setRolle(localStorage.getItem('pilot_rolle'));
  }, []);

  function handleClick(e: React.MouseEvent) {
    if (rolle === 'angehoeriger') {
      window.location.href = '/buchen';
    } else {
      e.preventDefault();
      window.dispatchEvent(new Event('open-piloten-modal'));
    }
  }

  return (
    <a href="/buchen" onClick={handleClick} className="btn btn-outline-dark">{label}</a>
  );
}
