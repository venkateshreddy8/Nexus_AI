'use client';
import { useEffect, useRef, useState } from 'react';

export default function LiveTranscript({ entries = [], interimText = '' }) {
  const bottomRef    = useRef(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries, interimText]);

  const filtered = search
    ? entries.filter(e =>
        e.text.toLowerCase().includes(search.toLowerCase()) ||
        e.speaker.toLowerCase().includes(search.toLowerCase())
      )
    : entries;

  const formatTime = (iso) => {
    try {
      return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch { return ''; }
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100%', background: 'var(--bg-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 16px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
          <TranscriptIcon />
          <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Live Transcript</span>
          {entries.length > 0 && (
            <span className="badge badge-blue">{entries.length}</span>
          )}
        </div>
        <input
          className="input"
          placeholder="Search transcript..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: 160, padding: '5px 10px', fontSize: '0.8rem' }}
        />
      </div>

      {/* Entries */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.length === 0 && !interimText && (
          <div className="empty-state" style={{ paddingTop: 48 }}>
            <MicIcon />
            <h3>Waiting for speech...</h3>
            <p>Start recording to see the live transcript appear here.</p>
          </div>
        )}
        {filtered.map((entry, i) => (
          <div key={entry.id || i} className="animate-fade-in" style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            {/* Speaker badge */}
            <div style={{ flexShrink: 0, paddingTop: 2 }}>
              <SpeakerAvatar speaker={entry.speaker} color={entry.speaker_color} />
            </div>
            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: entry.speaker_color }}>
                  {entry.speaker}
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }} className="mono">
                  {formatTime(entry.timestamp)}
                </span>
                {entry.confidence < 0.8 && (
                  <span className="badge badge-amber" style={{ fontSize: '0.65rem' }}>Low conf.</span>
                )}
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.6, margin: 0 }}
                 className="mono">
                {entry.text}
              </p>
            </div>
          </div>
        ))}

        {/* Interim (in-progress) text */}
        {interimText && (
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', opacity: 0.6 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'var(--bg-tertiary)',
              border: '2px dashed var(--border-default)',
              flexShrink: 0,
            }} />
            <p className="mono" style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontStyle: 'italic', margin: 0 }}>
              {interimText}
              <span style={{ animation: 'pulse-dot 1s infinite', display: 'inline-block', marginLeft: 4 }}>▌</span>
            </p>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

function SpeakerAvatar({ speaker, color }) {
  const initials = speaker.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div style={{
      width: 28, height: 28, borderRadius: '50%',
      background: `${color}22`,
      border: `2px solid ${color}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '0.65rem', fontWeight: 700, color,
    }}>{initials}</div>
  );
}
function TranscriptIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-cyan)" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>;
}
function MicIcon() {
  return <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8"/></svg>;
}
