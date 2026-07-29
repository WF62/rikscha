'use client';
export default function PrintButton() {
  return (
    <button onClick={() => window.print()} style={{
      background:'#C8881A', color:'#fff', border:'none', cursor:'pointer',
      fontSize:'0.88rem', fontWeight:700, padding:'0.45rem 1.2rem',
      borderRadius:6, display:'flex', alignItems:'center', gap:'0.4rem',
    }}>
      🖨️ Drucken
    </button>
  );
}
