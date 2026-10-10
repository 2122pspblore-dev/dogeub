import { useEffect, useRef } from 'react';
import { useOptions } from '../utils/optionsContext';

const SPACING = 24;
const SNAP_RADIUS = 10;

function getPoint(x, y) {
  const col = Math.round((x - SPACING / 2) / SPACING);
  const row = Math.round((y - SPACING / 2) / SPACING);
  const point = { x: SPACING / 2 + col * SPACING, y: SPACING / 2 + row * SPACING };
  return Math.hypot(point.x - x, point.y - y) <= SNAP_RADIUS ? point : null;
}

export default function InteractiveDots() {
  const canvasRef = useRef(null);
  const { options } = useOptions();
  const enabled = options.bgDesign === 'dots' || options.bgDesign === 'Dots';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !enabled) return undefined;
    const ctx = canvas.getContext('2d');
    let drawing = false;
    let points = [];
    let audioContext;

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(window.innerWidth * ratio);
      canvas.height = Math.round(window.innerHeight * ratio);
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      paint();
    };

    const paint = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      if (points.length > 1) {
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        points.slice(1).forEach((point) => ctx.lineTo(point.x, point.y));
        ctx.strokeStyle = 'rgba(125, 211, 252, 0.9)';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowColor = 'rgba(56, 189, 248, 0.65)';
        ctx.shadowBlur = 9;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
      points.forEach((point) => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(186, 230, 253, 0.98)';
        ctx.shadowColor = 'rgba(56, 189, 248, 0.9)';
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;
      });
    };

    const pluck = () => {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        audioContext ||= new AudioCtx();
        if (audioContext.state === 'suspended') audioContext.resume();
        const now = audioContext.currentTime;
        const oscillator = audioContext.createOscillator();
        const overtone = audioContext.createOscillator();
        const gain = audioContext.createGain();
        const filter = audioContext.createBiquadFilter();
        const frequencies = [523.25, 659.25, 783.99, 987.77, 1046.5, 1318.51];
        const frequency = frequencies[Math.floor(Math.random() * frequencies.length)];
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, now);
        overtone.type = 'triangle';
        overtone.frequency.setValueAtTime(frequency * 2.01, now);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2400, now);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.12, now + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);
        oscillator.connect(filter);
        overtone.connect(filter);
        filter.connect(gain);
        gain.connect(audioContext.destination);
        oscillator.start(now);
        overtone.start(now);
        oscillator.stop(now + 0.44);
        overtone.stop(now + 0.44);
      } catch {
        // Audio is optional; connecting dots should still work if sound is unavailable.
      }
    };

    const isInteractive = (target) => target instanceof Element && Boolean(target.closest('a, button, input, textarea, select, [role="button"], [contenteditable="true"]'));
    const eventPoint = (event) => {
      const rect = canvas.getBoundingClientRect();
      return getPoint(event.clientX - rect.left, event.clientY - rect.top);
    };

    const onDown = (event) => {
      if (event.button !== 0 || isInteractive(event.target)) return;
      const point = eventPoint(event);
      if (!point) return;
      drawing = true;
      points = [point];
      pluck();
      paint();
    };
    const onMove = (event) => {
      if (!drawing) return;
      const point = eventPoint(event);
      if (!point) return;
      const last = points[points.length - 1];
      if (last && last.x === point.x && last.y === point.y) return;
      // Only add nearby dots, so the line feels like it snaps from dot to dot.
      if (last && Math.hypot(last.x - point.x, last.y - point.y) > SPACING * 1.6) return;
      points.push(point);
      pluck();
      paint();
    };
    const onUp = () => { drawing = false; };
    const clear = () => { drawing = false; points = []; paint(); };

    resize();
    window.addEventListener('resize', resize);
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    window.addEventListener('keydown', (event) => { if (event.key === 'Escape') clear(); });
    return () => {
      window.removeEventListener('resize', resize);
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      audioContext?.close();
    };
  }, [enabled]);

  if (!enabled) return null;
  return <canvas ref={canvasRef} aria-hidden="true" className="fixed inset-0 z-[1] pointer-events-none" />;
}
