'use client';

import { motion } from 'framer-motion';
import type { OptionResult } from '@/types';

interface VoteOptionBarProps {
  option:    OptionResult;
  isWinner?: boolean;
  rank:      number;
}

export function VoteOptionBar({ option, isWinner, rank }: VoteOptionBarProps) {
  const pct = Math.round(option.percentage);

  return (
    <div className={`relative rounded-xl overflow-hidden ${isWinner ? 'ring-2 ring-secondary-500' : ''}`}>
      {/* Background bar fill */}
      <motion.div
        className={`absolute inset-y-0 left-0 ${isWinner ? 'bg-secondary-500/30' : 'bg-white/5'}`}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />

      <div className="relative flex items-center gap-3 px-4 py-3">
        {/* Rank badge */}
        <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
          ${rank === 1 ? 'bg-secondary-500 text-dark-bg' : 'bg-white/10 text-slate-400'}`}>
          {rank}
        </span>

        {/* Label */}
        <span className={`flex-1 font-body text-sm ${isWinner ? 'text-white font-semibold' : 'text-slate-300'}`}>
          {option.label}
        </span>

        {/* Vote count + percentage */}
        <div className="flex items-center gap-2 text-xs flex-shrink-0">
          <span className="text-slate-400">{option.voteCount} vote{option.voteCount !== 1 ? 's' : ''}</span>
          <span className={`font-bold tabular-nums ${isWinner ? 'text-secondary-400' : 'text-slate-300'}`}>
            {pct}%
          </span>
        </div>

        {isWinner && <span className="text-secondary-400 text-sm">✓</span>}
      </div>
    </div>
  );
}
