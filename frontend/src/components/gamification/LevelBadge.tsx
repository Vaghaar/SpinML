'use client';

import { motion } from 'framer-motion';
import { LEVEL_TITLES } from '@/lib/utils';

interface LevelBadgeProps {
  level: number;
  xp:    number;
  size?: 'sm' | 'md' | 'lg';
}

export function LevelBadge({ level, xp, size = 'md' }: LevelBadgeProps) {
  const title      = LEVEL_TITLES[level] ?? 'Légende';
  const base       = level * 100;
  const next       = (level + 1) * 100;
  const progress   = Math.min(100, ((xp - base) / (next - base)) * 100);
  const remaining  = next - xp;

  const sizeMap = {
    sm: { outer: 'w-10 h-10', text: 'text-sm', label: 'text-xs' },
    md: { outer: 'w-16 h-16', text: 'text-xl', label: 'text-sm' },
    lg: { outer: 'w-24 h-24', text: 'text-3xl', label: 'text-base' },
  };
  const s = sizeMap[size];

  // SVG circle progress
  const r   = size === 'lg' ? 44 : size === 'md' ? 28 : 18;
  const circ = 2 * Math.PI * r;
  const dash = circ * (progress / 100);

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Ring */}
      <div className={`relative ${s.outer} flex items-center justify-center`}>
        <svg className="absolute inset-0 -rotate-90" viewBox={`0 0 ${r * 2 + 8} ${r * 2 + 8}`}>
          <circle cx={r + 4} cy={r + 4} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
          <motion.circle
            cx={r + 4} cy={r + 4} r={r}
            fill="none"
            stroke="url(#lvlGrad)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: circ - dash }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
          <defs>
            <linearGradient id="lvlGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FF6B35" />
              <stop offset="100%" stopColor="#FFD700" />
            </linearGradient>
          </defs>
        </svg>
        <span className={`${s.text} font-title font-bold text-white z-10`}>{level}</span>
      </div>

      {/* Title + XP */}
      <div className="text-center">
        <p className={`${s.label} font-accent text-secondary-400 font-semibold`}>{title}</p>
        {size !== 'sm' && (
          <p className="text-xs text-slate-500 mt-0.5">{remaining} XP vers niveau {level + 1}</p>
        )}
      </div>
    </div>
  );
}
