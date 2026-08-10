'use client';
import { useEffect, useState } from 'react';

export default function AusleihenButton({ label }: { label: string }) {
  const [href, setHref] = useState('#kontakt');

  useEffect(() => {
    const rolle = localStorage.getItem('pilot_rolle');
    if (rolle === 'angehoeriger') {
      setHref('/buchen');
    }
  }, []);

  return (
    <a href={href} className="btn btn-outline-dark">{label}</a>
  );
}
