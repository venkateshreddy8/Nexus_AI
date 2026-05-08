'use client';
import Link from 'next/link';
import { MEETING_STATUS_MAP } from '@/lib/constants';

export default function MeetingCard({ meeting, onDelete }) {
  const status = MEETING_STATUS_MAP[meeting.status] || MEETING_STATUS_MAP.ended;
  const participants = parseJSON(meeting.participants, []);
  const duration = formatDuration(meeting.duration_seconds);
  const date = formatDate(meeting.created_at);

  return (
    <div className="card animate-fade-in" style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <h3 style={{ fontSize: '0.95rem', margin: 0, truncate: true }}>{meeting.title}</h3>
            <span className={`badge ${status.class}`}>
              {meeting.status === 'active' && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', display: 'inline-block', animation: 'pulse-dot 2s infinite', marginRight: 4 }} />}
              {status.label}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Meta icon="📅" text={date} />
            {duration && <Meta icon="⏱️" text={duration} />}
            {participants.length > 0 && <Meta icon="👥" text={`${participants.length} participant${participants.length !== 1 ? 's' : ''}`} />}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <Link href={`/history/${meeting.id}`} className="btn btn-secondary btn-sm">View</Link>
          {onDelete && (
            <button onClick={() => onDelete(meeting.id)} className="btn btn-ghost btn-sm" style={{ color: 'var(--accent-red)' }}>
              <TrashIcon />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Meta({ icon, text }) {
  return (
    <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
      <span>{icon}</span> {text}
    </span>
  );
}

function parseJSON(val, fallback) {
  if (Array.isArray(val)) return val;
  try { return JSON.parse(val) || fallback; } catch { return fallback; }
}

function formatDuration(secs) {
  if (!secs) return null;
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function formatDate(iso) {
  try { return new Date(iso).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }); }
  catch { return iso; }
}

function TrashIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>;
}
