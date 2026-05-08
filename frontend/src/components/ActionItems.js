'use client';
import { PRIORITY_MAP, STATUS_MAP } from '@/lib/constants';

export default function ActionItems({ items = [], onStatusChange }) {
  const sorted = [...items].sort((a, b) =>
    (PRIORITY_MAP[a.priority]?.order ?? 1) - (PRIORITY_MAP[b.priority]?.order ?? 1)
  );

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <CheckIcon />
        <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Action Items</span>
        {items.length > 0 && <span className="badge badge-purple">{items.length}</span>}
      </div>

      <div style={{ maxHeight: 320, overflowY: 'auto', padding: '8px' }}>
        {sorted.length === 0 ? (
          <div className="empty-state" style={{ padding: '32px 16px' }}>
            <CheckIcon size={32} />
            <p style={{ fontSize: '0.8rem' }}>No action items detected yet</p>
          </div>
        ) : (
          sorted.map((item, i) => (
            <ActionRow key={item.id || i} item={item} onStatusChange={onStatusChange} />
          ))
        )}
      </div>
    </div>
  );
}

function ActionRow({ item, onStatusChange }) {
  const priority = PRIORITY_MAP[item.priority] || PRIORITY_MAP.medium;
  const isDone   = item.status === 'completed';

  return (
    <div className="animate-fade-in" style={{
      display: 'flex', gap: 10, padding: '10px 8px',
      borderRadius: 'var(--radius-md)',
      borderBottom: '1px solid var(--border-subtle)',
      opacity: isDone ? 0.6 : 1,
      transition: 'all 200ms ease',
    }}>
      {/* Checkbox */}
      <button
        onClick={() => onStatusChange?.(item.id, isDone ? 'pending' : 'completed')}
        style={{
          width: 18, height: 18, flexShrink: 0,
          borderRadius: 4, border: `2px solid ${isDone ? 'var(--accent-green)' : 'var(--border-default)'}`,
          background: isDone ? 'var(--accent-green)' : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', transition: 'all 150ms ease', marginTop: 2,
        }}
      >
        {isDone && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
      </button>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: '0.82rem', color: isDone ? 'var(--text-tertiary)' : 'var(--text-primary)',
          textDecoration: isDone ? 'line-through' : 'none',
          lineHeight: 1.4, margin: '0 0 6px',
        }}>
          {item.task}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
          <span className={`badge ${priority.class}`}>{priority.label}</span>
          {item.owner && (
            <span className="tag">👤 {item.owner}</span>
          )}
          {item.deadline && (
            <span className="tag">📅 {item.deadline}</span>
          )}
        </div>
      </div>
    </div>
  );
}

function CheckIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="var(--accent-purple)" strokeWidth="2" strokeLinecap="round">
      <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
    </svg>
  );
}
