'use client';
import { useState, useRef, useEffect } from 'react';

const QUICK_ACTIONS = [
  { label: '📋 Summarize', query: 'Please provide a quick summary of the meeting so far.' },
  { label: '✅ Action Items', query: 'What are the action items identified in this meeting?' },
  { label: '🔍 Key Decisions', query: 'What key decisions were made in this meeting?' },
  { label: '❓ Unresolved', query: 'What issues remain unresolved from this meeting?' },
];

export default function AIChatPanel({ onSend, messages = [], isConnected }) {
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (text) => {
    const query = text || input.trim();
    if (!query || !isConnected) return;
    onSend?.(query);
    setInput('');
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: 'var(--bg-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: 'var(--grad-primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: 'var(--glow-blue)',
        }}>
          <AIIcon />
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>Nexus AI</div>
          <div style={{ fontSize: '0.7rem', color: isConnected ? 'var(--accent-green)' : 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: isConnected ? 'var(--accent-green)' : 'var(--text-tertiary)', display: 'inline-block' }} />
            {isConnected ? 'Connected' : 'Disconnected'}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.length === 0 && (
          <div className="empty-state" style={{ paddingTop: 24 }}>
            <AIIcon size={40} />
            <h3 style={{ fontSize: '0.9rem' }}>Ask Nexus AI</h3>
            <p style={{ fontSize: '0.8rem' }}>Ask questions about the meeting, get summaries, or find action items.</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '88%',
              padding: '10px 14px',
              borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '4px 16px 16px 16px',
              background: msg.role === 'user'
                ? 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(6,182,212,0.15))'
                : 'var(--bg-glass-light)',
              border: msg.role === 'user'
                ? '1px solid rgba(59,130,246,0.3)'
                : '1px solid var(--border-subtle)',
              fontSize: '0.85rem',
              lineHeight: 1.6,
              color: 'var(--text-primary)',
              whiteSpace: 'pre-wrap',
            }}>
              {msg.role === 'assistant' && msg.loading ? (
                <TypingIndicator />
              ) : msg.content}
            </div>
            {msg.memory_hits?.length > 0 && (
              <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', display: 'flex', gap: 4, alignItems: 'center' }}>
                <span>📚</span>
                <span>{msg.memory_hits.length} memory hits</span>
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Quick actions */}
      <div style={{ padding: '8px 12px', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: 6, overflowX: 'auto', flexWrap: 'nowrap' }}>
        {QUICK_ACTIONS.map(({ label, query }) => (
          <button
            key={label}
            onClick={() => handleSend(query)}
            disabled={!isConnected}
            style={{
              flexShrink: 0, padding: '4px 10px',
              background: 'var(--bg-glass-light)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-full)',
              color: 'var(--text-secondary)',
              fontSize: '0.72rem', cursor: 'pointer',
              transition: 'all 150ms ease',
              whiteSpace: 'nowrap',
            }}
            onMouseOver={e => { e.target.style.borderColor = 'var(--border-accent)'; e.target.style.color = 'var(--text-primary)'; }}
            onMouseOut={e => { e.target.style.borderColor = 'var(--border-subtle)'; e.target.style.color = 'var(--text-secondary)'; }}
          >{label}</button>
        ))}
      </div>

      {/* Input */}
      <div style={{
        padding: '12px', borderTop: '1px solid var(--border-subtle)',
        display: 'flex', gap: 8, alignItems: 'flex-end',
      }}>
        <textarea
          className="input"
          placeholder={isConnected ? 'Ask about this meeting...' : 'Start a meeting to chat with AI'}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          disabled={!isConnected}
          rows={2}
          style={{ resize: 'none', fontSize: '0.85rem', flex: 1 }}
        />
        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || !isConnected}
          className="btn btn-primary btn-icon"
          style={{ flexShrink: 0, alignSelf: 'flex-end' }}
        >
          <SendIcon />
        </button>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '2px 0' }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: 6, height: 6, borderRadius: '50%',
          background: 'var(--accent-blue)',
          display: 'inline-block',
          animation: `typingDot 1.2s ease-in-out ${i * 0.2}s infinite`,
        }} />
      ))}
    </div>
  );
}

function AIIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M19.07 4.93l-2.12 2.12M7.05 16.95l-2.12 2.12"/>
    </svg>
  );
}
function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
      <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>
  );
}
