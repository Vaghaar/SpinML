'use client';

import { useRef, useEffect, useCallback } from 'react';
import type { Segment } from '@/types';
import type { SpinPhase } from '@/hooks/useSpinAnimation';

// Segment colors (cycling)
const SEGMENT_COLORS = [
  '#FF6B35', '#FFD700', '#7C3AED', '#06B6D4',
  '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#14B8A6', '#F97316', '#6366F1',
];

const POINTER_COLOR   = '#FFFFFF';
const HUB_OUTER_COLOR = '#1A1A2E';
const HUB_INNER_COLOR = '#FF6B35';
const BORDER_COLOR    = 'rgba(255,255,255,0.15)';

interface RouletteWheelProps {
  segments: Segment[];
  currentAngle: number;   // degrees
  phase: SpinPhase;
  winningSegmentId?: string;
  size?: number;          // canvas CSS size (square, default 340)
}

export function RouletteWheel({
  segments,
  currentAngle,
  phase,
  winningSegmentId,
  size = 340,
}: RouletteWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const w   = canvas.clientWidth;
    const h   = canvas.clientHeight;
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width  = w * dpr;
      canvas.height = h * dpr;
    }

    const ctx   = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cx  = w / 2;
    const cy  = h / 2;
    const r   = Math.min(w, h) / 2 - 8;

    ctx.clearRect(0, 0, w, h);

    if (segments.length === 0) {
      drawEmptyWheel(ctx, cx, cy, r);
      return;
    }

    const totalWeight = segments.reduce((s, seg) => s + (seg.weight ?? 1), 0);
    const angleRad    = (currentAngle * Math.PI) / 180;

    // Motion blur during deceleration/acceleration
    const isMoving  = phase === 'acceleration' || phase === 'deceleration';
    const blurPasses = isMoving ? 3 : 1;
    const blurAlpha  = isMoving ? 0.6 : 1.0;

    for (let pass = 0; pass < blurPasses; pass++) {
      const passOffset = isMoving ? ((pass - 1) * 0.018) : 0;
      ctx.globalAlpha  = pass === blurPasses - 1 ? blurAlpha : 0.2;
      drawSegments(ctx, cx, cy, r, segments, totalWeight, angleRad + passOffset, phase, winningSegmentId);
    }
    ctx.globalAlpha = 1;

    drawPointer(ctx, cx, r);
    drawHub(ctx, cx, cy, phase);
  }, [segments, currentAngle, phase, winningSegmentId]);

  // Redraw whenever props change
  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size }}
      className="drop-shadow-2xl"
      aria-label="Roulette wheel"
    />
  );
}

// ─── Drawing helpers ──────────────────────────────────────────────────────────

function drawSegments(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  segments: Segment[],
  totalWeight: number,
  rotationRad: number,
  phase: SpinPhase,
  winningSegmentId?: string,
) {
  let startAngle = -Math.PI / 2 + rotationRad; // start at top

  segments.forEach((seg, i) => {
    const weight    = seg.weight ?? 1;
    const sliceAngle = (weight / totalWeight) * 2 * Math.PI;
    const endAngle  = startAngle + sliceAngle;
    const midAngle  = startAngle + sliceAngle / 2;

    const isWinner  = phase === 'result' && seg.id === winningSegmentId;
    const color     = SEGMENT_COLORS[i % SEGMENT_COLORS.length];

    // Segment fill
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, startAngle, endAngle);
    ctx.closePath();

    if (isWinner) {
      // Radial gradient highlight for winner
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      grad.addColorStop(0, '#FFFFFF44');
      grad.addColorStop(0.5, color + 'EE');
      grad.addColorStop(1, color + 'BB');
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = color + (phase === 'result' && winningSegmentId ? '88' : 'EE');
    }
    ctx.fill();

    // Segment border
    ctx.strokeStyle = BORDER_COLOR;
    ctx.lineWidth   = 1.5;
    ctx.stroke();

    // Label
    drawSegmentLabel(ctx, cx, cy, r, midAngle, seg.label, sliceAngle, isWinner);

    startAngle = endAngle;
  });

  // Outer ring
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth   = 3;
  ctx.stroke();
}

function drawSegmentLabel(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  midAngle: number,
  label: string,
  sliceAngle: number,
  isWinner: boolean,
) {
  const labelR    = r * 0.68;
  const lx        = cx + Math.cos(midAngle) * labelR;
  const ly        = cy + Math.sin(midAngle) * labelR;

  ctx.save();
  ctx.translate(lx, ly);
  ctx.rotate(midAngle + Math.PI / 2);

  // Font size based on available arc length
  const arcLength = sliceAngle * r;
  const fontSize  = Math.max(9, Math.min(15, arcLength / 7));
  ctx.font        = `${isWinner ? 'bold' : '600'} ${fontSize}px "Space Grotesk", sans-serif`;
  ctx.fillStyle   = isWinner ? '#FFFFFF' : 'rgba(255,255,255,0.92)';
  ctx.textAlign   = 'center';
  ctx.textBaseline = 'middle';

  // Truncate long labels
  const maxChars = Math.floor(arcLength / (fontSize * 0.55));
  const text     = label.length > maxChars && maxChars > 3
    ? label.slice(0, maxChars - 1) + '…'
    : label;

  ctx.shadowColor  = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur   = 4;
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

function drawPointer(ctx: CanvasRenderingContext2D, cx: number, r: number) {
  const py     = 12;
  const pw     = 14;
  const ph     = 28;

  ctx.save();
  ctx.translate(cx, py + ph / 2);

  ctx.beginPath();
  ctx.moveTo(0, ph / 2);          // tip pointing down
  ctx.lineTo(-pw / 2, -ph / 2);
  ctx.lineTo(pw / 2, -ph / 2);
  ctx.closePath();

  const grad = ctx.createLinearGradient(0, -ph / 2, 0, ph / 2);
  grad.addColorStop(0, '#FFFFFF');
  grad.addColorStop(1, '#CBD5E1');
  ctx.fillStyle = grad;
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur  = 8;
  ctx.fill();

  ctx.strokeStyle = POINTER_COLOR;
  ctx.lineWidth   = 1;
  ctx.stroke();
  ctx.restore();
}

function drawHub(ctx: CanvasRenderingContext2D, cx: number, cy: number, phase: SpinPhase) {
  const outerR = 24;
  const innerR = 14;

  // Pulsing glow during spin
  if (phase !== 'idle' && phase !== 'result') {
    const glow = ctx.createRadialGradient(cx, cy, innerR, cx, cy, outerR + 12);
    glow.addColorStop(0, 'rgba(255,107,53,0.6)');
    glow.addColorStop(1, 'rgba(255,107,53,0)');
    ctx.beginPath();
    ctx.arc(cx, cy, outerR + 12, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();
  }

  // Outer ring
  ctx.beginPath();
  ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
  ctx.fillStyle = HUB_OUTER_COLOR;
  ctx.fill();
  ctx.strokeStyle = phase === 'result' ? HUB_INNER_COLOR : 'rgba(255,255,255,0.2)';
  ctx.lineWidth   = 3;
  ctx.stroke();

  // Inner dot
  ctx.beginPath();
  ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
  ctx.fillStyle = phase === 'result' ? HUB_INNER_COLOR : 'rgba(255,107,53,0.7)';
  ctx.fill();

  // Dot highlight
  ctx.beginPath();
  ctx.arc(cx - 4, cy - 4, 4, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fill();
}

function drawEmptyWheel(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.04)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth   = 2;
  ctx.stroke();

  ctx.font        = '500 14px "Inter", sans-serif';
  ctx.fillStyle   = 'rgba(255,255,255,0.3)';
  ctx.textAlign   = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Aucun segment', cx, cy);

  drawPointer(ctx, cx, r);
  drawHub(ctx, cx, cy, 'idle');
}
