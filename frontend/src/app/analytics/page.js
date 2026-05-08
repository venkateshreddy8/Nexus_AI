'use client';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import StatsCard from '@/components/StatsCard';
import { getAnalyticsOverview, getMeetingsTrend, getSpeakerStats, getActionsSummary } from '@/lib/api';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';

const CHART_COLORS = ['#3b82f6', '#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: '0.8rem' }}>
      {label && <p style={{ color: 'var(--text-tertiary)', margin: '0 0 4px' }}>{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, margin: 0 }}>{p.name}: <strong>{p.value}</strong></p>
      ))}
    </div>
  );
};

export default function AnalyticsPage() {
  const [overview, setOverview]   = useState(null);
  const [trend, setTrend]         = useState([]);
  const [speakers, setSpeakers]   = useState([]);
  const [actionSummary, setAS]    = useState(null);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    Promise.all([
      getAnalyticsOverview(),
      getMeetingsTrend(),
      getSpeakerStats(),
      getActionsSummary(),
    ]).then(([o, t, s, a]) => {
      setOverview(o);
      setTrend(t.slice(-14));  // last 14 days
      setSpeakers(s.slice(0, 6));
      setAS(a);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const statusData = actionSummary ? Object.entries(actionSummary.by_status || {}).map(([k, v]) => ({ name: k, value: v })) : [];
  const priorityData = actionSummary ? Object.entries(actionSummary.by_priority || {}).map(([k, v]) => ({ name: k, value: v })) : [];

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Header title="Analytics" subtitle="Meeting intelligence & performance insights" />
        <div className="page-body">

          {/* Stats */}
          <div className="stats-grid" style={{ marginBottom: 24 }}>
            <StatsCard title="Total Meetings"     value={overview?.total_meetings ?? '—'}     icon={<Icon1 />} color="var(--accent-blue)"   />
            <StatsCard title="Hours Transcribed"  value={`${overview?.total_hours ?? '—'}h`}   icon={<Icon2 />} color="var(--accent-cyan)"   />
            <StatsCard title="Action Items"       value={overview?.total_action_items ?? '—'}  icon={<Icon3 />} color="var(--accent-purple)" />
            <StatsCard title="Completion Rate"    value={overview && overview.total_action_items > 0 ? `${Math.round((overview.completed_action_items / overview.total_action_items) * 100)}%` : '—'} icon={<Icon4 />} color="var(--accent-green)"  />
          </div>

          {/* Charts row 1 */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
            {/* Meeting trend */}
            <div className="glass-card" style={{ padding: 20 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <TrendIcon /> Meetings Over Time
              </h3>
              {trend.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} tickFormatter={v => v.slice(5)} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="count" name="Meetings" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : <EmptyChart label="No trend data yet" />}
            </div>

            {/* Action items pie */}
            <div className="glass-card" style={{ padding: 20 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <PieChartIcon /> Action Status
              </h3>
              {statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                      {statusData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <EmptyChart label="No action items yet" />}
            </div>
          </div>

          {/* Charts row 2 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Speaker bar chart */}
            <div className="glass-card" style={{ padding: 20 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <SpeakerChartIcon /> Speaker Word Count
              </h3>
              {speakers.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={speakers} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} />
                    <YAxis type="category" dataKey="speaker" tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} width={80} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="words" name="Words" fill="url(#blueGrad)" radius={[0, 4, 4, 0]}>
                      <defs>
                        <linearGradient id="blueGrad" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#3b82f6" />
                          <stop offset="100%" stopColor="#06b6d4" />
                        </linearGradient>
                      </defs>
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : <EmptyChart label="No speaker data yet" />}
            </div>

            {/* Priority breakdown */}
            <div className="glass-card" style={{ padding: 20 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <PriorityIcon /> Action Priority Distribution
              </h3>
              {priorityData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={priorityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" name="Items" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <EmptyChart label="No priority data yet" />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyChart({ label }) {
  return (
    <div className="empty-state" style={{ height: 200, padding: 0 }}>
      <p style={{ fontSize: '0.8rem' }}>{label}</p>
    </div>
  );
}

// Icons
function Icon1() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-blue)" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>; }
function Icon2() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-cyan)" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>; }
function Icon3() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-purple)" strokeWidth="2" strokeLinecap="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>; }
function Icon4() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" strokeWidth="2" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>; }
function TrendIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-blue)" strokeWidth="2" strokeLinecap="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>; }
function PieChartIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-purple)" strokeWidth="2" strokeLinecap="round"><path d="M21.21 15.89A10 10 0 118 2.83"/><path d="M22 12A10 10 0 0012 2v10z"/></svg>; }
function SpeakerChartIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-cyan)" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>; }
function PriorityIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-amber)" strokeWidth="2" strokeLinecap="round"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>; }
