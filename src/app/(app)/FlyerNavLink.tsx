'use client';
import { useEffect, useState } from 'react';

export default function FlyerNavLink() {
  const [istPilot, setIstPilot] = useState(false);

  useEffect(() => {
    setIstPilot(!!sessionStorage.getItem('pilot_name'));
  }, []);

  if (!istPilot) return null;
  return (
    <>
      <a href="/dokumente" className="hover:text-green-200 transition-colors">📂 Ablage</a>
      <a href="/flyer-editor" className="hover:text-green-200 transition-colors">🖨️ Flyer</a>
    </>
  );
}
