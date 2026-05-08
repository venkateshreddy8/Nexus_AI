'use client';
export default function MeetingSummary({ summary }) {
  if (!summary) {
    return (
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)', padding: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <SummaryIcon />
          <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Meeting Summary</span>
        </div>
        <div className="empty-state" style={{ padding: '20px 0' }}>
          <p style={{ fontSize: '0.8rem' }}>Summary will appear as the meeting progresses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{
      background: 'var(--bg-card)', border: '1px solid var(--border-accent)',
      borderRadius: 'var(--radius-lg)', padding: 16,
      boxShadow: '0 0 20px rgba(59,130,246,0.05)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <SummaryIcon />
        <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Meeting Summary</span>
        <span className="badge badge-blue">AI Generated</span>
      </div>

      {/* Overview */}
      {summary.overview && (
        <p style={{ fontSize: '0.82rem', lineHeight: 1.6, color: 'var(--text-secondary)', marginBottom: 14 }}>
          {summary.overview}
        </p>
      )}

      {/* Key Points */}
      {summary.key_points?.length > 0 && (
        <Section title="Key Points" icon="💡" color="var(--accent-cyan)">
          {summary.key_points.map((p, i) => <BulletItem key={i} text={p} color="var(--accent-cyan)" />)}
        </Section>
      )}

      {/* Decisions */}
      {summary.decisions?.length > 0 && (
        <Section title="Decisions Made" icon="✅" color="var(--accent-green)">
          {summary.decisions.map((d, i) => <BulletItem key={i} text={d} color="var(--accent-green)" />)}
        </Section>
      )}

      {/* Unresolved */}
      {summary.unresolved?.length > 0 && (
        <Section title="Unresolved Issues" icon="⚠️" color="var(--accent-amber)">
          {summary.unresolved.map((u, i) => <BulletItem key={i} text={u} color="var(--accent-amber)" />)}
        </Section>
      )}
    </div>
  );
}

function Section({ title, icon, color, children }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: '0.75rem', fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
        <span>{icon}</span> {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {children}
      </div>
    </div>
  );
}

function BulletItem({ text, color }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
      <span style={{ color, flexShrink: 0, marginTop: 5, fontSize: '0.6rem' }}>◆</span>
      <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{text}</span>
    </div>
  );
}

function SummaryIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-blue)" strokeWidth="2" strokeLinecap="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
      <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
    </svg>
  );
}
