'use client';
import { useEffect } from 'react';
export default function FlyerBearbeitenRedirect() {
  useEffect(() => { window.location.replace('/bearbeiten'); }, []);
  return null;
}
