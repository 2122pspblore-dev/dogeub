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
    if (!ctx) return undefined;

    let drawing = false;
    let points = [];
    let resizeFrame = 0;

    const paint = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      ctx.clearRect(0, 0, width, height);

      // Keep the snap targets visible so users can discover the interaction.
      ctx.fillStyle = 'rgba(125, 211, 252, 0.28)';
      for (let y = SPACING / 2; y < height; y += SPACING) {
        for (let x = SPACING / 2; x < width; x += SPACING) {
          ctx.beginPath();
          ctx.arc(x, y, 1.35, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (points.length > 1) {
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        points.slice(1).forEach((point) => ctx.lineTo(point.x, point.y));
        ctx.strokeStyle = 'rgba(125, 211, 252, 0.95)';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowColor = 'rgba(56, 189, 248, 0.7)';
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

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(window.innerWidth * ratio);
      canvas.height = Math.round(window.innerHeight * ratio);
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      paint();
    };

    const isInteractive = (target) =>
      target instanceof Element &&
      Boolean(target.closest('a, button, input, textarea, select, [role="button"], [contenteditable="true"]'));

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
      paint();
    };

    const onMove = (event) => {
      if (!drawing) return;
      const point = eventPoint(event);
      if (!point) return;
      const last = points[points.length - 1];
      if (last && last.x === point.x && last.y === point.y) return;
      if (last && Math.hypot(last.x - point.x, last.y - point.y) > SPACING * 1.6) return;
      points.push(point);
      paint();
    };

    const onUp = () => { drawing = false; };
    const clear = () => { drawing = false; points = []; paint(); };
    const onKeyDown = (event) => { if (event.key === 'Escape') clear(); };
    const scheduleResize = () => {
      window.cancelAnimationFrame(resizeFrame);
      resizeFrame = window.requestAnimationFrame(resize);
    };

    resize();
    window.addEventListener('resize', scheduleResize);
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.cancelAnimationFrame(resizeFrame);
      window.removeEventListener('resize', scheduleResize);
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [enabled]);

  if (!enabled) return null;
  return <canvas ref={canvasRef} aria-hidden="true" className="fixed inset-0 z-[1] pointer-events-none" />;
}
