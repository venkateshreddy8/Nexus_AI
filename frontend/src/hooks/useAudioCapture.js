'use client';
import { useCallback, useRef, useState } from 'react';

export function useAudioCapture() {
  const analyserRef   = useRef(null);
  const animFrameRef  = useRef(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [frequencyData, setFrequencyData] = useState(new Uint8Array(64));
  const [isCapturing, setIsCapturing] = useState(false);
  const streamRef = useRef(null);

  const startCapture = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;

      const ctx      = new (window.AudioContext || window.webkitAudioContext)();
      const source   = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      source.connect(analyser);
      analyserRef.current = analyser;

      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((s, v) => s + v, 0) / data.length;
        setAudioLevel(avg / 255);
        setFrequencyData(new Uint8Array(data));
        animFrameRef.current = requestAnimationFrame(tick);
      };
      tick();
      setIsCapturing(true);
    } catch (e) {
      console.warn('Microphone access denied:', e);
    }
  }, []);

  const stopCapture = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    analyserRef.current = null;
    streamRef.current   = null;
    setAudioLevel(0);
    setIsCapturing(false);
  }, []);

  return { startCapture, stopCapture, audioLevel, frequencyData, isCapturing };
}
