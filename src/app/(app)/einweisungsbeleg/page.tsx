'use client';
import { useSearchParams } from 'next/navigation';
import { Suspense, useRef, useEffect, useState, useCallback } from 'react';

// ── Signature-Pad ────────────────────────────────────────────────────────────
function SignaturePad({ label, name, onChange, readonly, existing }: {
  label: string;
  name: string;
  onChange: (dataUrl: string) => void;
  readonly?: boolean;
  existing?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [hatSig, setHatSig] = useState(false);

  useEffect(() => {
    if (!existing || !ref.current) return;
    const img = new Image();
    img.onload = () => {
      const ctx = ref.current!.getContext('2d')!;
      ctx.clearRect(0, 0, ref.current!.width, ref.current!.height);
      ctx.drawImage(img, 0, 0);
      setHatSig(true);
    };
    img.src = existing;
  }, [existing]);

  const coords = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    const scale = ref.current!.width / r.width;
    return { x: (e.clientX - r.left) * scale, y: (e.clientY - r.top) * scale };
  };

  const down = (e: React.PointerEvent) => {
    if (readonly) return;
    e.preventDefault();
    drawing.current = true;
    last.current = coords(e);
    ref.current!.setPointerCapture(e.pointerId);
  };

  const movePen = (e: React.PointerEvent) => {
    if (!drawing.current || readonly) return;
    e.preventDefault();
    const p = coords(e);
    const ctx = ref.current!.getContext('2d')!;
    ctx.beginPath();
    ctx.moveTo(last.current!.x, last.current!.y);
    ctx.lineTo(p.x, p.y);
    ctx.strokeStyle = '#1a1a18';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    last.current = p;
  };

  const up = () => {
    if (!drawing.current || readonly) return;
    drawing.current = false;
    setHatSig(true);
    onChange(ref.current!.toDataURL('image/png'));
  };

  const loeschen = () => {
    if (readonly) return;
    const ctx = ref.current!.getContext('2d')!;
    ctx.clearRect(0, 0, ref.current!.width, ref.current!.height);
    setHatSig(false);
    onChange('');
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
        <span style={{ fontSize: '0.78rem', color: '#6B7280', fontWeight: 600 }}>{label}</span>
        {!readonly && hatSig && (
          <button onClick={loeschen}
            style={{ background: 'none', border: 'none', fontSize: '0.72rem', color: '#9CA3AF', cursor: 'pointer', padding: 0 }}>
            Löschen
          </button>
        )}
      </div>
      <canvas ref={ref} width={340} height={100}
        onPointerDown={down} onPointerMove={movePen} onPointerUp={up} onPointerLeave={up}
        style={{
          border: `1.5px solid ${readonly ? '#E5E7EB' : hatSig ? '#86EFAC' : '#D1D5DB'}`,
          borderRadius: 8, width: '100%', height: 100,
          touchAction: 'none', cursor: readonly ? 'default' : 'crosshair',
          background: readonly ? '#FAFAFA' : '#fff', display: 'block',
        }}
      />
      {!readonly && !hatSig && (
        <div style={{ fontSize: '0.7rem', color: '#9CA3AF', marginTop: '0.2rem' }}>
          Mit Maus oder Finger unterschreiben ↑
        </div>
      )}
      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginTop: '0.25rem' }}>{name}</div>
    </div>
  );
}

// ── Hauptinhalt ──────────────────────────────────────────────────────────────
function Beleg() {
  const params = useSearchParams();
  const id = params.get('id') ?? '';
  const kutscher = params.get('kutscher') ?? '';
  const fahrzeug = params.get('fahrzeug') ?? '';
  const datum = params.get('datum') ?? '';
  const eingewiesen_von = params.get('von') ?? '';

  const belegRef = useRef<HTMLDivElement>(null);
  const [sigK, setSigK] = useState('');
  const [sigE, setSigE] = useState('');
  const [vorhandeneUrl, setVorhandeneUrl] = useState('');
  const [status, setStatus] = useState<'idle' | 'generiere' | 'ok' | 'fehler'>('idle');
  const [meldung, setMeldung] = useState('');
  const [geladen, setGeladen] = useState(false);

  // Einweisungsthemen
  const THEMEN = [
    { gruppe: 'Schwerpunkte & Allgemeines', punkte: [
      'Vorstellung und Übergabe des Fahrzeugs',
      'Sicherheitscheck vor Fahrtantritt (Bremsen, Beleuchtung, Reifendruck)',
      'An- und Abmeldung in der App',
      'Zuständigkeiten und Ansprechpartner',
    ]},
    { gruppe: 'Allgemeine Regeln', punkte: [
      'Fahrregeln im Straßenverkehr (StVO)',
      'Helm- und Ausrüstungspflicht',
      'Umgang mit Gästen (ältere und pflegebedürftige Menschen)',
      'Datenschutz und Schweigepflicht',
      'Versicherungsschutz und Haftung',
    ]},
    { gruppe: 'Technik', punkte: [
      'Schaltung, Pedalunterstützung und Bremssystem',
      'Beleuchtung und Elektronik (Akku, Display)',
      'Reifenwechsel und einfache Wartung',
      'Fahrzeug sichern, abstellen und laden',
    ]},
    { gruppe: 'Verhalten bei Unregelmäßigkeiten', punkte: [
      'Verhalten bei Panne oder technischem Defekt',
      'Meldung von Schäden in der App (Fahrtenbuch)',
      'Verhalten bei Sturz oder Unfall mit Gast',
      'Notfallkontakte und Erste Hilfe',
      'Abbruch einer Fahrt und Rückmeldung',
    ]},
  ];
  const [themenChecked, setThemenChecked] = useState<Record<string, boolean>>({});
  const toggleThema = (key: string) => setThemenChecked(prev => ({ ...prev, [key]: !prev[key] }));

  // Kontaktdaten
  const [telefon, setTelefon] = useState('');
  const [kEmail, setKEmail] = useState('');
  const [signal, setSignal] = useState('');
  const [adresse, setAdresse] = useState('');
  const [zustimmung, setZustimmung] = useState(false);

  const datumFormatiert = datum
    ? new Date(datum + 'T00:00:00').toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '';

  // Vorhandenen Beleg + Kontaktdaten laden
  useEffect(() => {
    if (!id && !kutscher) { setGeladen(true); return; }
    const h = {
      'x-pilot': localStorage.getItem('kutscher_name') ?? '',
      'x-password': localStorage.getItem('kutscher_pw') ?? '',
    };
    Promise.all([
      id ? fetch(`/api/kutscher-fahrzeuge?id=${encodeURIComponent(id)}`, { headers: h }).then(r => r.ok ? r.json() : null) : Promise.resolve(null),
      kutscher ? fetch(`/api/einweisungsbeleg?kutscher=${encodeURIComponent(kutscher)}`).then(r => r.ok ? r.json() : null) : Promise.resolve(null),
    ]).then(([belegDaten, kontaktDaten]) => {
      if (belegDaten?.beleg_url) setVorhandeneUrl(belegDaten.beleg_url);
      if (kontaktDaten) {
        if (kontaktDaten.telefon) setTelefon(kontaktDaten.telefon);
        if (kontaktDaten.email) setKEmail(kontaktDaten.email);
        if (kontaktDaten.whatsapp) setSignal(kontaktDaten.whatsapp);
        if (kontaktDaten.adresse) setAdresse(kontaktDaten.adresse);
        if (kontaktDaten.kontakt_zustimmung) setZustimmung(true);
      }
    }).catch(() => {}).finally(() => setGeladen(true));
  }, [id, kutscher]);

  const speichernAlsPdf = useCallback(async () => {
    if (!belegRef.current) return;
    if (!sigK && !sigE) { setMeldung('Bitte mindestens eine Unterschrift leisten.'); return; }
    if (!id) { setMeldung('Keine Einweisungs-ID – bitte über die Admin-Seite öffnen.'); return; }

    setStatus('generiere'); setMeldung('');

    try {
      // Dynamisch laden damit der Bundle nicht immer beide lädt
      const [html2canvasModule, jsPDFModule] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);
      const html2canvas = html2canvasModule.default;
      const { jsPDF } = jsPDFModule;

      const canvas = await html2canvas(belegRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = (canvas.height / canvas.width) * pdfW;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);

      const blob = pdf.output('blob');
      const file = new File([blob], 'einweisungsbeleg.pdf', { type: 'application/pdf' });

      const form = new FormData();
      form.append('id', id);
      form.append('kutscher', kutscher);
      form.append('file', file);
      form.append('telefon', telefon);
      form.append('email', kEmail);
      form.append('whatsapp', signal);
      form.append('adresse', adresse);
      form.append('kontakt_zustimmung', String(zustimmung));

      const res = await fetch('/api/einweisungsbeleg', { method: 'POST', body: form });
      const j = await res.json();

      if (!res.ok) throw new Error(j.error ?? 'Upload fehlgeschlagen.');

      setVorhandeneUrl(j.url);
      setStatus('ok');
      setMeldung('Beleg gespeichert – im Kutscher-Ordner und Admin-Ordner abgelegt.');
    } catch (err) {
      setStatus('fehler');
      setMeldung(err instanceof Error ? err.message : 'Unbekannter Fehler.');
    }
  }, [belegRef, sigK, sigE, id, kutscher, telefon, kEmail, signal, adresse, zustimmung]);

  const fertig = status === 'ok' || !!vorhandeneUrl;

  return (
    <div>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
        }
        @page { size: A4; margin: 1.5cm; }
      `}</style>

      {/* Toolbar */}
      <div className="no-print" style={{
        background: '#2D6B1E', padding: '0.75rem 1rem',
        display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap',
      }}>
        <a href="/admin/einweisungen"
          style={{ color: '#D1FAE5', fontSize: '0.9rem', textDecoration: 'none' }}>← Zurück</a>

        {!fertig && (
          <button onClick={speichernAlsPdf} disabled={status === 'generiere'}
            style={{ background: '#fff', color: '#2D6B1E', border: 'none', borderRadius: 7, padding: '0.5rem 1.25rem', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}>
            {status === 'generiere' ? '⏳ PDF wird erstellt …' : '✅ Unterschreiben & als PDF speichern'}
          </button>
        )}

        {fertig && vorhandeneUrl && (
          <>
            <span style={{ background: '#D1FAE5', color: '#065F46', borderRadius: 6, padding: '0.3rem 0.75rem', fontSize: '0.85rem', fontWeight: 700 }}>
              ✓ Beleg gespeichert
            </span>
            <a href={vorhandeneUrl} target="_blank" rel="noopener noreferrer"
              style={{ background: 'transparent', color: '#D1FAE5', border: '1.5px solid #86EFAC', borderRadius: 7, padding: '0.4rem 0.9rem', fontSize: '0.85rem', textDecoration: 'none', fontWeight: 600 }}>
              📄 Beleg öffnen
            </a>
          </>
        )}

        <button onClick={() => window.print()}
          style={{ background: 'transparent', color: '#D1FAE5', border: '1.5px solid #86EFAC', borderRadius: 7, padding: '0.4rem 0.9rem', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 600 }}>
          🖨️ Drucken
        </button>

        {meldung && (
          <span style={{ color: status === 'fehler' ? '#FCA5A5' : '#D1FAE5', fontSize: '0.82rem' }}>
            {meldung}
          </span>
        )}
      </div>

      {/* Beleg – wird als PDF gerendert */}
      {geladen && (
        <div ref={belegRef} style={{ maxWidth: 680, margin: '2rem auto', padding: '2rem', background: '#fff', fontFamily: 'Arial, sans-serif' }}>

          {/* Kopfzeile */}
          <div style={{ borderBottom: '3px solid #2D6B1E', paddingBottom: '1rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <div style={{ fontSize: '0.78rem', color: '#6B7280', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>Mertener Rikschakutscher</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1a1a18', lineHeight: 1.2, marginTop: '0.2rem' }}>Einweisungsbeleg</div>
            </div>
            <div style={{ textAlign: 'right', fontSize: '0.78rem', color: '#6B7280' }}>
              <div>Ausgestellt am</div>
              <div style={{ fontWeight: 700, color: '#1a1a18' }}>{new Date().toLocaleDateString('de-DE')}</div>
            </div>
          </div>

          {/* Datentabelle */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.75rem' }}>
            <tbody>
              {([
                ['Kutscher / Fahrerin', kutscher],
                ['Fahrzeug', fahrzeug],
                ['Einweisung durchgeführt am', datumFormatiert],
                ['Einweisung durchgeführt durch', eingewiesen_von],
              ] as [string, string][]).map(([label, wert]) => (
                <tr key={label} style={{ borderBottom: '1px solid #E5E7EB' }}>
                  <td style={{ padding: '0.75rem 0.5rem 0.75rem 0', fontSize: '0.82rem', color: '#6B7280', fontWeight: 600, whiteSpace: 'nowrap', width: '45%' }}>{label}</td>
                  <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.95rem', fontWeight: 700, color: '#1a1a18' }}>{wert || '–'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Einweisungsthemen */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '2px solid #E5E7EB', paddingBottom: '0.4rem' }}>
              Besprochene Einweisungsthemen
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {THEMEN.map(gruppe => (
                <div key={gruppe.gruppe}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#2D6B1E', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{gruppe.gruppe}</div>
                  {gruppe.punkte.map(punkt => {
                    const key = gruppe.gruppe + '|' + punkt;
                    const checked = !!themenChecked[key];
                    return (
                      <label key={punkt} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', marginBottom: '0.3rem', cursor: fertig ? 'default' : 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => !fertig && toggleThema(key)}
                          disabled={fertig}
                          style={{ marginTop: '0.1rem', width: 13, height: 13, flexShrink: 0, accentColor: '#2D6B1E' }}
                        />
                        <span style={{ fontSize: '0.8rem', color: checked ? '#14532D' : '#374151', lineHeight: 1.4, fontWeight: checked ? 600 : 400 }}>{punkt}</span>
                      </label>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Bestätigungstext */}
          <div style={{ background: '#F0FDF4', border: '1.5px solid #86EFAC', borderRadius: 8, padding: '0.9rem 1.1rem', marginBottom: '2rem', fontSize: '0.87rem', color: '#14532D', lineHeight: 1.6 }}>
            Hiermit wird bestätigt, dass die oben genannte Person in der sicheren Handhabung und
            Bedienung des Rikscha-Fahrzeugs <strong>{fahrzeug}</strong> eingewiesen wurde und
            Fahrten selbstständig durchführen darf.
          </div>

          {/* Kontaktdaten */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#374151', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Kontaktdaten des Kutschers
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
              {([
                { label: 'Telefon', value: telefon, setter: setTelefon, type: 'tel', placeholder: '+49 …' },
                { label: 'E-Mail', value: kEmail, setter: setKEmail, type: 'email', placeholder: 'name@beispiel.de' },
                { label: 'Signal', value: signal, setter: setSignal, type: 'tel', placeholder: '+49 …' },
              ] as { label: string; value: string; setter: (v: string) => void; type: string; placeholder: string }[]).map(f => (
                <div key={f.label}>
                  <div style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: 600, marginBottom: '0.2rem' }}>{f.label}</div>
                  {fertig ? (
                    <div style={{ fontSize: '0.9rem', color: '#1a1a18', padding: '0.4rem 0.5rem', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 6 }}>{f.value || '–'}</div>
                  ) : (
                    <input
                      type={f.type}
                      value={f.value}
                      onChange={e => f.setter(e.target.value)}
                      placeholder={f.placeholder}
                      style={{ width: '100%', boxSizing: 'border-box', border: '1.5px solid #D1D5DB', borderRadius: 6, padding: '0.4rem 0.6rem', fontSize: '0.9rem' }}
                    />
                  )}
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: 600, marginBottom: '0.2rem' }}>Adresse</div>
              {fertig ? (
                <div style={{ fontSize: '0.9rem', color: '#1a1a18', padding: '0.4rem 0.5rem', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 6 }}>{adresse || '–'}</div>
              ) : (
                <input
                  type="text"
                  value={adresse}
                  onChange={e => setAdresse(e.target.value)}
                  placeholder="Straße, PLZ Ort"
                  style={{ width: '100%', boxSizing: 'border-box', border: '1.5px solid #D1D5DB', borderRadius: 6, padding: '0.4rem 0.6rem', fontSize: '0.9rem' }}
                />
              )}
            </div>
            <div style={{ marginTop: '0.9rem', background: '#FFF7ED', border: '1.5px solid #FED7AA', borderRadius: 8, padding: '0.75rem 1rem' }}>
              <label style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', cursor: fertig ? 'default' : 'pointer' }}>
                <input
                  type="checkbox"
                  checked={zustimmung}
                  onChange={e => !fertig && setZustimmung(e.target.checked)}
                  disabled={fertig}
                  style={{ marginTop: '0.1rem', width: 16, height: 16, flexShrink: 0 }}
                />
                <span style={{ fontSize: '0.82rem', color: '#92400E', lineHeight: 1.5 }}>
                  Ich stimme ausdrücklich zu, dass meine oben angegebenen Kontaktdaten im Rahmen der
                  Rikscha-App gespeichert und für vereinsinterne Kommunikation genutzt werden dürfen.
                  Diese Einwilligung kann jederzeit widerrufen werden.
                </span>
              </label>
            </div>
          </div>

          {/* Unterschriften */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '1.5rem' }}>
            <SignaturePad
              label="Unterschrift Kutscher / Fahrerin"
              name={kutscher}
              onChange={setSigK}
              readonly={fertig}
            />
            <SignaturePad
              label="Unterschrift Einweiser"
              name={eingewiesen_von}
              onChange={setSigE}
              readonly={fertig}
            />
          </div>

          {/* Fußzeile */}
          <div style={{ marginTop: '1.5rem', paddingTop: '0.75rem', borderTop: '1px solid #E5E7EB', fontSize: '0.72rem', color: '#9CA3AF', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.3rem' }}>
            <span>Einweisungsbeleg – Mertener Rikschakutscher</span>
            <span>Abgelegt im Kutscher-Ordner und Admin-Ordner.</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EinweisungsBelegPage() {
  return (
    <Suspense>
      <Beleg />
    </Suspense>
  );
}
