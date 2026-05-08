'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import StatsCard from '@/components/StatsCard';
import MeetingCard from '@/components/MeetingCard';
import { getAnalyticsOverview, listMeetings, deleteMeeting } from '@/lib/api';

export default function DashboardPage() {
  const [stats, setStats]       = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  const load = async () => {
    try {
      const [s, m] = await Promise.all([getAnalyticsOverview(), listMeetings()]);
      setStats(s);
      setMeetings(m.slice(0, 5));
    } catch (e) {
      setError('Backend not running. Start the FastAPI server on port 8000.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this meeting?')) return;
    await deleteMeeting(id);
    load();
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Header title="Dashboard" subtitle="Your meeting intelligence hub">
          <Link href="/meeting" className="btn btn-primary btn-sm">
            <RecordIcon /> New Meeting
          </Link>
        </Header>

        <div className="page-body">
          {/* Error Banner */}
          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 24,
              fontSize: '0.875rem', color: 'var(--accent-red)',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* Hero Banner */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(59,130,246,0.12) 0%, rgba(6,182,212,0.08) 50%, rgba(139,92,246,0.08) 100%)',
            border: '1px solid var(--border-accent)',
            borderRadius: 'var(--radius-xl)',
            padding: '28px 32px',
            marginBottom: 24,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 24,
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.15), transparent)', pointerEvents: 'none' }} />
            <div>
              <h2 style={{ margin: '0 0 8px', fontSize: '1.4rem' }}>
                Welcome to <span className="gradient-text">Nexus AI</span>
              </h2>
              <p style={{ margin: 0, fontSize: '0.9rem', maxWidth: 480 }}>
                Your intelligent meeting copilot — transcribing, summarizing, and extracting insights in real time.
              </p>
            </div>
            <Link href="/meeting" style={{ flexShrink: 0 }}>
              <button className="btn btn-primary btn-lg" style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', inset: -1, borderRadius: 'inherit',
                  background: 'var(--grad-primary)', opacity: 0.3, filter: 'blur(8px)',
                }} />
                <RecordIcon /> Start Meeting
              </button>
            </Link>
          </div>

          {/* Stats */}
          <div className="stats-grid">
            <StatsCard
              title="Total Meetings"
              value={loading ? '...' : stats?.total_meetings ?? 0}
              subtitle="All time"
              icon={<CalendarIcon />}
              color="var(--accent-blue)"
            />
            <StatsCard
              title="Hours Transcribed"
              value={loading ? '...' : stats?.total_hours ?? 0}
              subtitle="Across all meetings"
              icon={<ClockIcon />}
              color="var(--accent-cyan)"
            />
            <StatsCard
              title="Action Items"
              value={loading ? '...' : stats?.total_action_items ?? 0}
              subtitle={`${stats?.completed_action_items ?? 0} completed`}
              icon={<TaskIcon />}
              color="var(--accent-purple)"
            />
            <StatsCard
              title="Active Now"
              value={loading ? '...' : stats?.active_meetings ?? 0}
              subtitle="Live meetings"
              icon={<LiveIcon />}
              color="var(--accent-green)"
            />
          </div>

          {/* Recent Meetings */}
          <div>
            <div className="section-header">
              <span className="section-title">
                <RecentIcon /> Recent Meetings
              </span>
              <Link href="/history" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>View all →</Link>
            </div>

            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[1,2,3].map(i => (
                  <div key={i} className="skeleton" style={{ height: 72, borderRadius: 'var(--radius-lg)' }} />
                ))}
              </div>
            ) : meetings.length === 0 ? (
              <div className="card">
                <div className="empty-state">
                  <CalendarIcon size={40} />
                  <h3>No meetings yet</h3>
                  <p>Start your first meeting to see it appear here.</p>
                  <Link href="/meeting" className="btn btn-primary btn-sm" style={{ marginTop: 8 }}>
                    <RecordIcon /> Start Meeting
                  </Link>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {meetings.map(m => (
                  <MeetingCard key={m.id} meeting={m} onDelete={handleDelete} />
                ))}
              </div>
            )}
          </div>

          {/* Quick Tips */}
          <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            {TIPS.map(({ icon, title, desc }) => (
              <div key={title} className="glass-card" style={{ padding: 16 }}>
                <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>{icon}</div>
                <h4 style={{ margin: '0 0 4px', fontSize: '0.875rem' }}>{title}</h4>
                <p style={{ margin: 0, fontSize: '0.78rem' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const TIPS = [
  { icon: '🎙️', title: 'Real-Time Transcription', desc: 'Uses your browser\'s built-in speech recognition for instant transcription.' },
  { icon: '🧠', title: 'Vector Memory', desc: 'Every conversation is stored in ChromaDB for semantic retrieval later.' },
  { icon: '✅', title: 'Auto Action Items', desc: 'AI automatically detects tasks, owners, and deadlines from conversations.' },
  { icon: '💬', title: 'AI Chat', desc: 'Ask Nexus AI anything about your meeting — summaries, decisions, context.' },
];

// Icons
function RecordIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="6"/></svg>; }
function CalendarIcon({ size = 20 }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="var(--accent-blue)" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>; }
function ClockIcon({ size = 20 }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="var(--accent-cyan)" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>; }
function TaskIcon({ size = 20 }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="var(--accent-purple)" strokeWidth="2" strokeLinecap="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>; }
function LiveIcon({ size = 20 }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M19.07 4.93l-2.12 2.12M7.05 16.95l-2.12 2.12"/></svg>; }
function RecentIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-blue)" strokeWidth="2" strokeLinecap="round"><path d="M3 12a9 9 0 109 9"/><path d="M3 3v6h6"/><path d="M12 7v5l3 3"/></svg>; }
