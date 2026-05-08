'use client';
export default function Header({ title, subtitle, children }) {
  return (
    <header style={{
      position: 'fixed',
      top: 0, right: 0, left: 240,
      height: 64,
      background: 'rgba(8, 12, 24, 0.85)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border-subtle)',
      display: 'flex', alignItems: 'center',
      padding: '0 24px',
      gap: 16,
      zIndex: 40,
      transition: 'left 250ms ease',
    }}>
      <div style={{ flex: 1 }}>
        <h1 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>{title}</h1>
        {subtitle && <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', margin: 0 }}>{subtitle}</p>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {children}
        <div style={{
          width: 32, height: 32,
          borderRadius: '50%',
          background: 'var(--grad-primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.75rem', fontWeight: 700, color: 'white',
          boxShadow: 'var(--glow-blue)',
          cursor: 'pointer',
        }}>
          NA
        </div>
      </div>
    </header>
  );
}
