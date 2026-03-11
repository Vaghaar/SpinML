'use client';

import { motion } from 'framer-motion';
import type { SpinPhase } from '@/hooks/useSpinAnimation';
import { cn } from '@/lib/utils';

interface SpinButtonProps {
  phase:     SpinPhase;
  onClick:   () => void;
  disabled?: boolean;
  className?: string;
}

const PHASE_CONFIG: Record<SpinPhase, { label: string; className: string; pulse: boolean }> = {
  idle:         { label: '🎡  LANCER !',       className: 'bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-400 hover:to-accent-500', pulse: true  },
  anticipation: { label: '⚡ Chargement…',      className: 'bg-gradient-to-r from-secondary-500 to-yellow-500',                                        pulse: false },
  acceleration: { label: '🌀 En route !',       className: 'bg-gradient-to-r from-primary-600 to-primary-700',                                         pulse: false },
  deceleration: { label: '🎯 Presque…',         className: 'bg-gradient-to-r from-primary-600 to-primary-700',                                         pulse: false },
  revelation:   { label: '✨ Révélation !',     className: 'bg-gradient-to-r from-secondary-500 to-yellow-400',                                         pulse: false },
  result:       { label: '🔄 Relancer',         className: 'bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-400 hover:to-accent-500', pulse: true  },
};

export function SpinButton({ phase, onClick, disabled, className }: SpinButtonProps) {
  const config     = PHASE_CONFIG[phase];
  const isSpinning = phase !== 'idle' && phase !== 'result';
  const isClickable = (phase === 'idle' || phase === 'result') && !disabled;

  return (
    <motion.button
      onClick={isClickable ? onClick : undefined}
      disabled={!isClickable}
      whileHover={isClickable ? { scale: 1.06 } : {}}
      whileTap={isClickable   ? { scale: 0.96 } : {}}
      animate={config.pulse
        ? { boxShadow: [
            '0 0 25px rgba(255,107,53,0.5), 0 4px 20px rgba(0,0,0,0.4)',
            '0 0 55px rgba(255,107,53,0.9), 0 4px 20px rgba(0,0,0,0.4)',
            '0 0 25px rgba(255,107,53,0.5), 0 4px 20px rgba(0,0,0,0.4)',
          ] }
        : {}
      }
      transition={config.pulse ? { duration: 1.8, repeat: Infinity, ease: 'easeInOut' } : {}}
      className={cn(
        'relative px-12 py-5 rounded-full font-title font-black text-xl text-white',
        'transition-all duration-300 select-none',
        'shadow-lg',
        isSpinning && 'cursor-not-allowed',
        config.className,
        className,
      )}
      aria-label={config.label}
    >
      {/* Spinning ring overlay */}
      {isSpinning && (
        <span className="absolute inset-0 rounded-full border-2 border-white/25 animate-spin" />
      )}

      <span className="relative z-10 flex items-center gap-2.5">
        {isSpinning && (
          <span className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
        )}
        {config.label}
      </span>
    </motion.button>
  );
}
