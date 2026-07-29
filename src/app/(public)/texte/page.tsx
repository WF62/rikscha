'use client';
import { useEffect } from 'react';
export default function TexteRedirect() {
  useEffect(() => { window.location.replace('/flyer/bearbeiten'); }, []);
  return null;
}
