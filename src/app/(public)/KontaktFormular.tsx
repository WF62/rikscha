'use client';
import { useState } from 'react';

export default function KontaktFormular() {
  const [form, setForm] = useState({ name: '', email: '', anliegen: 'fahrt', nachricht: '' });
  const [fehler, setFehler] = useState('');
  const [erfolg, setErfolg] = useState(false);
  const [laden, setLaden] = useState(false);

  async function absenden(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setFehler('Bitte gib deinen Namen ein.'); return; }
    if (!form.email.trim()) { setFehler('Bitte gib deine E-Mail-Adresse ein.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setFehler('Bitte gib eine gültige E-Mail-Adresse ein.'); return; }
    if (!form.nachricht.trim()) { setFehler('Bitte gib eine Nachricht ein.'); return; }
    setFehler('');
    setLaden(true);
    try {
      const res = await fetch('/api/kontakt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setErfolg(true);
        setForm({ name: '', email: '', anliegen: 'fahrt', nachricht: '' });
      } else {
        setFehler('Beim Senden ist ein Fehler aufgetreten. Bitte versuche es erneut.');
      }
    } catch {
      setFehler('Keine Verbindung — bitte prüfe deine Internetverbindung und versuche es erneut.');
    }
    setLaden(false);
  }

  if (erfolg) {
    return (
      <div role="status" style={{ background: '#e8f5e9', border: '1.5px solid #2D6B1E', borderRadius: 10, padding: '1.2rem 1.5rem', color: '#1a4a10', fontWeight: 500 }}>
        Vielen Dank! Deine Nachricht ist bei uns angekommen. Wir melden uns bald.
      </div>
    );
  }

  return (
    <form className="kontakt-form" aria-label="Kontaktformular" onSubmit={absenden} noValidate>
      {fehler && <p role="alert" style={{ color: '#A63228', background: '#F5E5D8', border: '1px solid #A63228', borderRadius: 8, padding: '0.7rem 1rem', marginBottom: '1rem', fontSize: '0.92rem' }}>{fehler}</p>}
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="kontakt-name">Name</label>
          <input id="kontakt-name" type="text" placeholder="Dein Name" value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="form-group">
          <label htmlFor="kontakt-email">E-Mail</label>
          <input id="kontakt-email" type="email" placeholder="deine@email.de" value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })} />
        </div>
      </div>
      <div className="form-group">
        <label htmlFor="kontakt-anliegen">Anliegen</label>
        <select id="kontakt-anliegen" value={form.anliegen} onChange={e => setForm({ ...form, anliegen: e.target.value })}>
          <option value="fahrt">Fahrt anfragen</option>
          <option value="gruppe">Gruppenfahrt mit allen Rikschas</option>
          <option value="pilot">Als Pilot mitmachen</option>
          <option value="angehoeriger">Rikscha selbst steuern — für Angehörige</option>
          <option value="frage">Allgemeine Frage</option>
        </select>
      </div>
      <div className="form-group">
        <label htmlFor="kontakt-nachricht">Nachricht</label>
        <textarea id="kontakt-nachricht" placeholder="Wann, wie viele Personen, besondere Wünsche..." value={form.nachricht}
          onChange={e => setForm({ ...form, nachricht: e.target.value })} />
      </div>
      <div>
        <button type="submit" className="btn btn-gold" disabled={laden}>
          {laden ? 'Wird gesendet…' : 'Nachricht senden'}
        </button>
      </div>
    </form>
  );
}
