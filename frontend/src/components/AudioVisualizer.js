'use client';
import { useEffect, useRef } from 'react';

export default function AudioVisualizer({ frequencyData, audioLevel, isRecording }) {
  const canvasRef = useRef(null);
  const animRef   = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width  = canvas.offsetWidth * window.devicePixelRatio;
    const H = canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;

    const bars  = 48;
    const gap   = 3;
    const bw    = (w - gap * (bars - 1)) / bars;
    const data  = frequencyData || new Uint8Array(bars);

    ctx.clearRect(0, 0, w, h);

    for (let i = 0; i < bars; i++) {
      const val = data[Math.floor((i / bars) * data.length)] / 255;
      const barH = isRecording ? Math.max(3, val * h * 0.85) : 3;
      const x    = i * (bw + gap);
      const y    = (h - barH) / 2;

      // Gradient per bar
      const progress = i / bars;
      const r1 = Math.round(59  + (6  - 59)  * progress);
      const g1 = Math.round(130 + (182 - 130) * progress);
      const b1 = Math.round(246 + (212 - 246) * progress);
      const color = `rgba(${r1},${g1},${b1},${isRecording ? 0.85 : 0.3})`;

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(x, y, bw, barH, 2);
      ctx.fill();

      if (isRecording && val > 0.5) {
        ctx.shadowBlur  = 8;
        ctx.shadowColor = color;
        ctx.fill();
        ctx.shadowBlur  = 0;
      }
    }
  }, [frequencyData, isRecording, audioLevel]);

  return (
    <div style={{
      background: 'var(--bg-glass)',
      backdropFilter: 'blur(20px)',
      border: `1px solid ${isRecording ? 'rgba(239,68,68,0.3)' : 'var(--border-subtle)'}`,
      borderRadius: 'var(--radius-lg)',
      padding: '12px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      boxShadow: isRecording ? '0 0 20px rgba(239,68,68,0.15)' : 'none',
      transition: 'all 300ms ease',
    }}>
      {/* Status indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <div style={{
          width: 10, height: 10, borderRadius: '50%',
          background: isRecording ? 'var(--accent-red)' : 'var(--text-tertiary)',
          boxShadow: isRecording ? 'var(--glow-red)' : 'none',
          animation: isRecording ? 'pulse-dot 1.5s infinite' : 'none',
        }} />
        <span style={{ fontSize: '0.75rem', color: isRecording ? 'var(--accent-red)' : 'var(--text-tertiary)', fontWeight: 600 }}>
          {isRecording ? 'REC' : 'IDLE'}
        </span>
      </div>

      {/* Canvas waveform */}
      <canvas
        ref={canvasRef}
        style={{ flex: 1, height: 48, display: 'block' }}
      />

      {/* Audio level meter */}
      <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {[...Array(5)].map((_, i) => (
          <div key={i} style={{
            width: 4, height: 6,
            borderRadius: 2,
            background: (audioLevel || 0) > (i / 5)
              ? `hsl(${200 - i * 20}, 90%, 60%)`
              : 'var(--bg-tertiary)',
            transition: 'background 100ms ease',
          }} />
        ))}
      </div>
    </div>
  );
}
