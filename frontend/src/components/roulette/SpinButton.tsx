'use client';

import { motion } from 'framer-motion';
import type { SpinPhase } from '@/hooks/useSpinAnimation';
import { cn } from '@/lib/utils';

interface SpinButtonProps {
  phase: SpinPhase;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

const PHASE_CONFIG: Record<SpinPhase, { label: string; className: string; pulse: boolean }> = {
  idle:         { label: '🎡 SPIN !',          className: 'bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 shadow-[0_0_30px_rgba(255,107,53,0.5)]', pulse: true  },
  anticipation: { label: '⚡ Chargement…',     className: 'bg-gradient-to-r from-secondary-500 to-yellow-500',          pulse: false },
  acceleration: { label: '🌀 Spinning…',       className: 'bg-gradient-to-r from-accent-600 to-purple-600',             pulse: false },
  deceleration: { label: '🎯 Presque…',        className: 'bg-gradient-to-r from-accent-600 to-purple-600',             pulse: false },
  revelation:   { label: '✨ Révélation !',    className: 'bg-gradient-to-r from-secondary-500 to-yellow-400',          pulse: false },
  result:       { label: '🔄 Respinner',       className: 'bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 shadow-[0_0_30px_rgba(255,107,53,0.4)]', pulse: true  },
};

export function SpinButton({ phase, onClick, disabled, className }: SpinButtonProps) {
  const config      = PHASE_CONFIG[phase];
  const isSpinning  = phase !== 'idle' && phase !== 'result';
  const isClickable = (phase === 'idle' || phase === 'result') && !disabled;

  return (
    <motion.button
      onClick={isClickable ? onClick : undefined}
      disabled={!isClickable}
      whileHover={isClickable ? { scale: 1.05 } : {}}
      whileTap={isClickable ? { scale: 0.97 } : {}}
      animate={config.pulse ? { boxShadow: ['0 0 20px rgba(255,107,53,0.4)', '0 0 40px rgba(255,107,53,0.8)', '0 0 20px rgba(255,107,53,0.4)'] } : {}}
      transition={config.pulse ? { duration: 1.8, repeat: Infinity, ease: 'easeInOut' } : {}}
      className={cn(
        'relative px-10 py-4 rounded-2xl font-title font-bold text-lg text-white',
        'transition-all duration-300 select-none',
        isSpinning && 'cursor-not-allowed',
        config.className,
        className,
      )}
      aria-label={config.label}
    >
      {/* Spinning rings overlay */}
      {isSpinning && (
        <span className="absolute inset-0 rounded-2xl border-2 border-white/20 animate-spin" />
      )}

      <span className="relative z-10 flex items-center gap-2">
        {isSpinning && (
          <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
        )}
        {config.label}
      </span>
    </motion.button>
  );
}
