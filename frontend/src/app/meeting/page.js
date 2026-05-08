'use client';
import { useState, useCallback, useRef, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import AudioVisualizer from '@/components/AudioVisualizer';
import LiveTranscript from '@/components/LiveTranscript';
import AIChatPanel from '@/components/AIChatPanel';
import ActionItems from '@/components/ActionItems';
import MeetingSummary from '@/components/MeetingSummary';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useAudioCapture } from '@/hooks/useAudioCapture';
import { createMeeting, updateActionStatus } from '@/lib/api';

const DEFAULT_SPEAKERS = ['You', 'Speaker 2', 'Speaker 3'];

export default function MeetingPage() {
  // Meeting state
  const [meeting, setMeeting]         = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript]   = useState([]);
  const [interimText, setInterimText] = useState('');
  const [summary, setSummary]         = useState(null);
  const [actions, setActions]         = useState([]);
  const [chatMsgs, setChatMsgs]       = useState([]);
  const [speaker, setSpeaker]         = useState(DEFAULT_SPEAKERS[0]);
  const [duration, setDuration]       = useState(0);
  const [titleInput, setTitleInput]   = useState('');
  const [showSetup, setShowSetup]     = useState(true);
  const [error, setError]             = useState(null);

  const durationRef = useRef(null);
  const startTimeRef = useRef(null);

  // WebSocket
  const { send, status: wsStatus, disconnect } = useWebSocket(meeting?.id, {
    onMessage: useCallback((msg) => {
      switch (msg.type) {
        case 'transcript':
          setTranscript(prev => [...prev, msg.payload]);
          break;
        case 'action_item':
          setActions(prev => [...prev, msg.payload]);
          break;
        case 'summary_update':
          if (msg.payload) setSummary(msg.payload);
          break;
        case 'chat_response':
          setChatMsgs(prev => {
            const copy = [...prev];
            const lastIdx = copy.findLastIndex(m => m.loading);
            if (lastIdx >= 0) {
              copy[lastIdx] = {
                role: 'assistant',
                content: msg.payload.answer,
                memory_hits: msg.payload.memory_hits,
              };
            }
            return copy;
          });
          break;
        case 'meeting_ended':
          if (msg.payload?.summary) setSummary(msg.payload.summary);
          if (msg.payload?.new_actions) setActions(prev => [...prev, ...msg.payload.new_actions]);
          break;
        case 'error':
          setError(msg.payload?.message);
          break;
      }
    }, []),
  });

  // Audio
  const { startCapture, stopCapture, audioLevel, frequencyData, isCapturing } = useAudioCapture();

  // Speech recognition
  const { start: startSpeech, stop: stopSpeech, isListening, isSupported } = useSpeechRecognition({
    onResult: useCallback((text, confidence) => {
      if (!meeting) return;
      send('transcript', { text, speaker, confidence });
      setInterimText('');
    }, [meeting, send, speaker]),
    onInterim: useCallback((text) => setInterimText(text), []),
    onError: useCallback((err) => setError(`Speech recognition error: ${err}`), []),
  });

  // Duration timer
  useEffect(() => {
    if (isRecording) {
      startTimeRef.current = Date.now() - duration * 1000;
      durationRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    } else {
      clearInterval(durationRef.current);
    }
    return () => clearInterval(durationRef.current);
  }, [isRecording]);

  const handleStartMeeting = async () => {
    const title = titleInput.trim() || `Meeting — ${new Date().toLocaleString()}`;
    try {
      const m = await createMeeting({ title, participants: DEFAULT_SPEAKERS });
      setMeeting(m);
      setShowSetup(false);
      setError(null);
    } catch (e) {
      setError('Cannot connect to backend. Is the FastAPI server running on port 8000?');
    }
  };

  const handleToggleRecord = async () => {
    if (!isRecording) {
      await startCapture();
      startSpeech();
      setIsRecording(true);
    } else {
      stopSpeech();
      stopCapture();
      setIsRecording(false);
      setInterimText('');
      // Signal meeting end
      send('meeting_ended', { duration_seconds: duration });
    }
  };

  const handleChatSend = (query) => {
    setChatMsgs(prev => [
      ...prev,
      { role: 'user', content: query },
      { role: 'assistant', content: '', loading: true },
    ]);
    send('chat_query', { query });
  };

  const handleActionStatus = async (itemId, status) => {
    if (!meeting) return;
    await updateActionStatus(meeting.id, itemId, status);
    setActions(prev => prev.map(a => a.id === itemId ? { ...a, status } : a));
  };

  const formatDuration = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return [h, m, sec].map(v => String(v).padStart(2, '0')).join(':');
  };

  // ── Setup Modal ───────────────────────────────────────────────
  if (showSetup) {
    return (
      <div className="app-layout">
        <Sidebar />
        <div className="main-content">
          <Header title="New Meeting" subtitle="Configure your meeting session" />
          <div className="page-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: 480, padding: 32 }}>
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%',
                  background: 'var(--grad-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px',
                  boxShadow: 'var(--glow-blue)',
                }}>
                  <MicSetupIcon />
                </div>
                <h2 style={{ margin: '0 0 8px' }}>Start a New Meeting</h2>
                <p style={{ margin: 0, fontSize: '0.875rem' }}>Nexus AI will transcribe, summarize, and extract insights in real time.</p>
              </div>

              {error && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: 20, fontSize: '0.8rem', color: 'var(--accent-red)' }}>
                  ⚠️ {error}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: 6 }}>Meeting Title</label>
                  <input
                    className="input"
                    id="meeting-title"
                    placeholder={`Meeting — ${new Date().toLocaleDateString()}`}
                    value={titleInput}
                    onChange={e => setTitleInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleStartMeeting()}
                    autoFocus
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: 6 }}>Your Name / Speaker Label</label>
                  <select
                    className="input"
                    value={speaker}
                    onChange={e => setSpeaker(e.target.value)}
                  >
                    {DEFAULT_SPEAKERS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                {!isSupported && (
                  <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: '0.8rem', color: 'var(--accent-amber)' }}>
                    ⚠️ Speech recognition not supported in this browser. Use Chrome or Edge for transcription.
                  </div>
                )}

                <button
                  className="btn btn-primary"
                  style={{ justifyContent: 'center', padding: '14px' }}
                  onClick={handleStartMeeting}
                >
                  🚀 Start Meeting
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Meeting Room ──────────────────────────────────────────────
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Header
          title={meeting?.title || 'Live Meeting'}
          subtitle={`${isRecording ? '🔴 Recording' : '⏸ Paused'} · ${formatDuration(duration)} · WS: ${wsStatus}`}
        >
          {/* Speaker selector */}
          <select
            value={speaker}
            onChange={e => setSpeaker(e.target.value)}
            style={{ background: 'var(--bg-glass-light)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', padding: '6px 10px', fontSize: '0.8rem', cursor: 'pointer' }}
          >
            {DEFAULT_SPEAKERS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          {/* Record toggle */}
          <button
            onClick={handleToggleRecord}
            className={`btn-record ${isRecording ? 'recording' : ''}`}
            title={isRecording ? 'Stop Recording' : 'Start Recording'}
          >
            {isRecording ? <StopIcon /> : <MicIcon />}
          </button>
        </Header>

        <div className="page-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Error banner */}
          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: '0.82rem', color: 'var(--accent-red)' }}>
              ⚠️ {error}
            </div>
          )}

          {/* Audio Visualizer */}
          <AudioVisualizer frequencyData={frequencyData} audioLevel={audioLevel} isRecording={isRecording} />

          {/* Three-panel layout */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 320px',
            gridTemplateRows: 'auto auto',
            gap: 16,
            flex: 1,
          }}>
            {/* Left: Transcript (spans 2 rows on left) */}
            <div style={{ height: 480 }}>
              <LiveTranscript entries={transcript} interimText={interimText} />
            </div>

            {/* Right top: AI Chat */}
            <div style={{ height: 260 }}>
              <AIChatPanel
                messages={chatMsgs}
                onSend={handleChatSend}
                isConnected={wsStatus === 'connected'}
              />
            </div>

            {/* Left bottom: Summary */}
            <div>
              <MeetingSummary summary={summary} />
            </div>

            {/* Right bottom: Action Items */}
            <div>
              <ActionItems items={actions} onStatusChange={handleActionStatus} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Icons
function MicIcon() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8"/></svg>; }
function StopIcon() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>; }
function MicSetupIcon() { return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/></svg>; }
