'use client';
export default function StatsCard({ title, value, subtitle, icon, color = 'var(--accent-blue)', trend }) {
  return (
    <div className="glass-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 6px' }}>
            {title}
          </p>
          <div style={{ fontSize: '2rem', fontWeight: 800, background: `linear-gradient(135deg, ${color}, ${color}99)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {value ?? '—'}
          </div>
          {subtitle && (
            <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', margin: '4px 0 0' }}>{subtitle}</p>
          )}
        </div>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: `${color}18`,
          border: `1px solid ${color}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 0 16px ${color}20`,
        }}>
          {icon}
        </div>
      </div>
      {trend !== undefined && (
        <div style={{ fontSize: '0.78rem', color: trend >= 0 ? 'var(--accent-green)' : 'var(--accent-red)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <span>{trend >= 0 ? '↑' : '↓'}</span>
          <span>{Math.abs(trend)}% from last month</span>
        </div>
      )}
    </div>
  );
}
