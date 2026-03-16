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
  idle:         { label: '🎡  LANCER !',       className: 'bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500', pulse: true  },
  anticipation: { label: 'Chargement…',      className: 'bg-gradient-to-r from-secondary-500 to-secondary-600',                                         pulse: false },
  acceleration: { label: 'En route !',       className: 'bg-gradient-to-r from-primary-600 to-primary-700',                                            pulse: false },
  deceleration: { label: 'Presque…',         className: 'bg-gradient-to-r from-primary-600 to-primary-700',                                            pulse: false },
  revelation:   { label: 'Révélation !',     className: 'bg-gradient-to-r from-secondary-400 to-secondary-500',                                         pulse: false },
  result:       { label: '🔄 Relancer',         className: 'bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500', pulse: true  },
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
            '0 0 25px rgba(248,47,119,0.5), 0 4px 20px rgba(0,0,0,0.4)',
            '0 0 55px rgba(248,47,119,0.9), 0 4px 20px rgba(0,0,0,0.4)',
            '0 0 25px rgba(248,47,119,0.5), 0 4px 20px rgba(0,0,0,0.4)',
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
      <span className="relative z-10">
        {config.label}
      </span>
    </motion.button>
  );
}
