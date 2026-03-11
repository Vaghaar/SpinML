'use client';

import { useEffect, useRef } from 'react';

const SEGMENTS = [
  { color: '#F82F77', label: '🍕' },
  { color: '#06B6D4', label: '🌮' },
  { color: '#FF6B35', label: '🍣' },
  { color: '#22D3EE', label: '🥗' },
  { color: '#FF4D90', label: '🍔' },
  { color: '#0891B2', label: '🍜' },
  { color: '#FF8152', label: '🍱' },
  { color: '#D91A5F', label: '🥙' },
];

interface RouletteCanvasProps {
  className?: string;
}

export function RouletteCanvas({ className = '' }: RouletteCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let angle   = 0;
    let rafId   = 0;
    let pulse   = 0;

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    function draw() {
      if (!canvas || !ctx) return;
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      // Centre légèrement décalé vers le bas pour un effet dramatique
      const cx = W * 0.5;
      const cy = H * 0.72;
      const r  = Math.min(W, H) * 0.62;

      const n       = SEGMENTS.length;
      const segAng  = (2 * Math.PI) / n;
      const sepWidth = 0.018; // séparateurs

      // ─── Halo extérieur ────────────────────────────────────────────────────
      const glow = ctx.createRadialGradient(cx, cy, r * 0.7, cx, cy, r * 1.1);
      glow.addColorStop(0,   'rgba(255,107,53,0.06)');
      glow.addColorStop(0.6, 'rgba(255,107,53,0.03)');
      glow.addColorStop(1,   'transparent');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 1.1, 0, 2 * Math.PI);
      ctx.fill();

      // ─── Segments ─────────────────────────────────────────────────────────
      SEGMENTS.forEach((seg, i) => {
        const start = angle + i * segAng + sepWidth / 2;
        const end   = angle + (i + 1) * segAng - sepWidth / 2;

        // Dégradé radial par segment
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        grad.addColorStop(0,   `${seg.color}22`);
        grad.addColorStop(0.5, `${seg.color}44`);
        grad.addColorStop(1,   `${seg.color}88`);

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r, start, end);
        ctx.closePath();
        ctx.fillStyle   = grad;
        ctx.globalAlpha = 0.75;
        ctx.fill();
        ctx.globalAlpha = 1;

        // Bordure de segment (lueur)
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r, start, end);
        ctx.closePath();
        ctx.strokeStyle = `${seg.color}66`;
        ctx.lineWidth   = 1.5;
        ctx.stroke();

        // Emoji au milieu du segment
        const midAng  = angle + (i + 0.5) * segAng;
        const txtR    = r * 0.68;
        const tx = cx + Math.cos(midAng) * txtR;
        const ty = cy + Math.sin(midAng) * txtR;
        ctx.save();
        ctx.translate(tx, ty);
        ctx.rotate(midAng + Math.PI / 2);
        ctx.font      = `${r * 0.1}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.globalAlpha  = 0.7;
        ctx.fillText(seg.label, 0, 0);
        ctx.restore();
        ctx.globalAlpha = 1;
      });

      // ─── Cercle central ────────────────────────────────────────────────────
      pulse += 0.04;
      const pulseR = r * 0.1 + Math.sin(pulse) * r * 0.008;

      const center = ctx.createRadialGradient(cx, cy, 0, cx, cy, pulseR);
      center.addColorStop(0, '#F82F77');
      center.addColorStop(1, '#06020C');
      ctx.beginPath();
      ctx.arc(cx, cy, pulseR, 0, 2 * Math.PI);
      ctx.fillStyle = center;
      ctx.fill();

      // ─── Rotation lente ────────────────────────────────────────────────────
      angle += 0.0018;

      // ─── Masque dégradé en haut (fondu vers la couleur de fond) ───────────
      const mask = ctx.createLinearGradient(0, 0, 0, H);
      mask.addColorStop(0,   '#1A1A2E');
      mask.addColorStop(0.35, 'transparent');
      ctx.fillStyle = mask;
      ctx.fillRect(0, 0, W, H);

      rafId = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      aria-hidden="true"
    />
  );
}
