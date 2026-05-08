import { API_BASE } from './constants';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Request failed');
  }
  return res.json();
}

// ── Meetings ──────────────────────────────────────────────────
export const createMeeting = (data)       => request('/api/meetings/', { method: 'POST', body: JSON.stringify(data) });
export const listMeetings  = ()           => request('/api/meetings/');
export const getMeeting    = (id)         => request(`/api/meetings/${id}`);
export const endMeeting    = (id, dur)    => request(`/api/meetings/${id}/end`, { method: 'PUT', body: JSON.stringify({ duration_seconds: dur }) });
export const deleteMeeting = (id)         => request(`/api/meetings/${id}`, { method: 'DELETE' });
export const getMeetingSummary = (id)     => request(`/api/meetings/${id}/summary`);
export const getMeetingActions = (id)     => request(`/api/meetings/${id}/actions`);
export const updateActionStatus = (mid, iid, status) =>
  request(`/api/meetings/${mid}/actions/${iid}`, { method: 'PATCH', body: JSON.stringify({ status }) });

// ── Analytics ─────────────────────────────────────────────────
export const getAnalyticsOverview = ()  => request('/api/analytics/overview');
export const getMeetingsTrend     = ()  => request('/api/analytics/meetings-trend');
export const getSpeakerStats      = ()  => request('/api/analytics/speakers');
export const getActionsSummary    = ()  => request('/api/analytics/action-items-summary');
