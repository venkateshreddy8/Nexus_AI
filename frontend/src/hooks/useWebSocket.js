'use client';
import { useEffect, useRef, useCallback, useState } from 'react';
import { WS_BASE } from '@/lib/constants';

const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 16000];

export function useWebSocket(meetingId, { onMessage } = {}) {
  const wsRef       = useRef(null);
  const reconnRef   = useRef(0);
  const timerRef    = useRef(null);
  const onMsgRef    = useRef(onMessage);
  const [status, setStatus] = useState('disconnected'); // connected | connecting | disconnected | error

  useEffect(() => { onMsgRef.current = onMessage; }, [onMessage]);

  const connect = useCallback(() => {
    if (!meetingId) return;
    setStatus('connecting');

    const url = `${WS_BASE}/ws/${meetingId}`;
    const ws  = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus('connected');
      reconnRef.current = 0;
    };

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        onMsgRef.current?.(msg);
      } catch { /* ignore */ }
    };

    ws.onclose = () => {
      setStatus('disconnected');
      const delay = RECONNECT_DELAYS[Math.min(reconnRef.current, RECONNECT_DELAYS.length - 1)];
      reconnRef.current += 1;
      timerRef.current = setTimeout(connect, delay);
    };

    ws.onerror = () => {
      setStatus('error');
      ws.close();
    };
  }, [meetingId]);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(timerRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const send = useCallback((type, payload) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, payload, meeting_id: meetingId }));
    }
  }, [meetingId]);

  const disconnect = useCallback(() => {
    clearTimeout(timerRef.current);
    wsRef.current?.close();
    reconnRef.current = 999; // prevent reconnect
    setStatus('disconnected');
  }, []);

  return { send, status, disconnect };
}
