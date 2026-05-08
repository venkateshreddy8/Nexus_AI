'use client';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import MeetingCard from '@/components/MeetingCard';
import { listMeetings, deleteMeeting } from '@/lib/api';

export default function HistoryPage() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [filter, setFilter]     = useState('all');

  const load = async () => {
    try {
      const m = await listMeetings();
      setMeetings(m);
    } catch { /* backend not running */ }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this meeting and all its data?')) return;
    await deleteMeeting(id);
    load();
  };

  const filtered = meetings.filter(m => {
    const title = m.title?.toLowerCase() || '';
    const matchSearch = title.includes(search.toLowerCase());
    const matchFilter = filter === 'all' || m.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Header title="Meeting History" subtitle={`${meetings.length} meeting${meetings.length !== 1 ? 's' : ''} recorded`} />
        <div className="page-body">

          {/* Filters */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <input
              className="input"
              placeholder="🔍 Search meetings..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ maxWidth: 280 }}
            />
            <div style={{ display: 'flex', gap: 6 }}>
              {['all', 'active', 'ended'].map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: filter === f ? 'rgba(59,130,246,0.15)' : 'var(--bg-glass-light)',
                  border: filter === f ? '1px solid var(--border-accent)' : '1px solid var(--border-subtle)',
                  color: filter === f ? 'var(--accent-blue)' : 'var(--text-secondary)',
                  cursor: 'pointer', fontSize: '0.82rem', fontWeight: 500,
                  transition: 'all 150ms ease',
                }}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* List */}
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 'var(--radius-lg)' }} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                <h3>{search ? 'No meetings match your search' : 'No meetings yet'}</h3>
                <p>Start a meeting to see your history here.</p>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', margin: '0 0 4px' }}>
                Showing {filtered.length} of {meetings.length} meetings
              </p>
              {filtered.map(m => (
                <MeetingCard key={m.id} meeting={m} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
