'use client';
import { useEffect, useState } from 'react';

type Kutscher = {
  id: string; name: string; telefon: string | null; email: string | null;
  whatsapp: string | null; adresse: string | null; kontakt_zustimmung: boolean;
};

export default function KutscherKontaktePage() {
  const [kutscher, setKutscher] = useState<Kutscher[]>([]);
  const [laden, setLaden] = useState(true);
  const [meldung, setMeldung] = useState('');
  const [bearbeitet, setBearbeitet] = useState<Record<string, Partial<Kutscher>>>({});

  const headers = () => ({
    'Content-Type': 'application/json',
    'x-kutscher-name': localStorage.getItem('kutscher_name') ?? '',
    'x-kutscher-pw': localStorage.getItem('kutscher_pw') ?? '',
  });

  useEffect(() => {
    fetch('/api/kutscher', { headers: headers() })
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setKutscher(d.filter((k: Kutscher) => k.name)); })
      .finally(() => setLaden(false));
  }, []);

  const zeig = (msg: string) => { setMeldung(msg); setTimeout(() => setMeldung(''), 3000); };

  const aendern = (id: string, field: keyof Kutscher, wert: string | boolean) => {
    setBearbeitet(prev => ({ ...prev, [id]: { ...prev[id], [field]: wert } }));
    setKutscher(prev => prev.map(k => k.id === id ? { ...k, [field]: wert } : k));
  };

  const speichern = async (k: Kutscher) => {
    const r = await fetch('/api/kutscher', {
      method: 'PATCH',
      headers: headers(),
      body: JSON.stringify({
        id: k.id,
        telefon: k.telefon ?? '',
        email: k.email ?? '',
        whatsapp: k.whatsapp ?? '',
        adresse: k.adresse ?? '',
        kontakt_zustimmung: k.kontakt_zustimmung,
      }),
    });
    if (r.ok) {
      zeig(`${k.name} gespeichert.`);
      setBearbeitet(prev => { const n = { ...prev }; delete n[k.id]; return n; });
    } else {
      zeig('Fehler beim Speichern.');
    }
  };

  if (laden) return <div style={{ padding: '2rem' }}>Lädt…</div>;

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: '1.5rem 1rem', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <a href="/admin" style={{ color: '#6B7280', fontSize: '0.9rem', textDecoration: 'none' }}>← Admin</a>
        <h1 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#1a1a18' }}>📋 Kutscher-Kontaktdaten</h1>
      </div>

      {meldung && (
        <div style={{ background: '#D1FAE5', color: '#065F46', borderRadius: 6, padding: '0.6rem 1rem', marginBottom: '1rem', fontWeight: 600 }}>
          {meldung}
        </div>
      )}

      <div style={{ fontSize: '0.82rem', color: '#6B7280', marginBottom: '1.25rem' }}>
        Kontaktdaten werden beim Einweisungsbeleg automatisch vorausgefüllt. Änderungen hier aktualisieren auch künftige Belege.
      </div>

      {kutscher.map(k => (
        <div key={k.id} style={{
          background: '#fff', border: `1.5px solid ${bearbeitet[k.id] ? '#FDE68A' : '#E5E7EB'}`,
          borderRadius: 10, padding: '1rem 1.25rem', marginBottom: '0.9rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1a1a18' }}>{k.name}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: '#6B7280', cursor: 'pointer' }}>
                <input type="checkbox" checked={!!k.kontakt_zustimmung}
                  onChange={e => aendern(k.id, 'kontakt_zustimmung', e.target.checked)} />
                Zustimmung
              </label>
              <button onClick={() => speichern(k)}
                style={{ background: '#2D6B1E', color: '#fff', border: 'none', borderRadius: 6, padding: '0.35rem 0.9rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
                Speichern
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.6rem' }}>
            {([
              { label: 'Telefon', field: 'telefon' as keyof Kutscher, type: 'tel', placeholder: '+49 …' },
              { label: 'E-Mail', field: 'email' as keyof Kutscher, type: 'email', placeholder: 'name@beispiel.de' },
              { label: 'Signal', field: 'whatsapp' as keyof Kutscher, type: 'tel', placeholder: '+49 …' },
              { label: 'Adresse', field: 'adresse' as keyof Kutscher, type: 'text', placeholder: 'Straße, PLZ Ort' },
            ]).map(f => (
              <div key={f.field}>
                <div style={{ fontSize: '0.72rem', color: '#6B7280', fontWeight: 600, marginBottom: '0.2rem' }}>{f.label}</div>
                <input
                  type={f.type}
                  value={(k[f.field] as string) ?? ''}
                  onChange={e => aendern(k.id, f.field, e.target.value)}
                  placeholder={f.placeholder}
                  style={{ width: '100%', boxSizing: 'border-box', border: '1.5px solid #D1D5DB', borderRadius: 6, padding: '0.35rem 0.5rem', fontSize: '0.88rem' }}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
