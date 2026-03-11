'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import type { Segment } from '@/types';

interface SpinResultCardProps {
  visible:      boolean;
  winner:       Segment | null;
  onDismiss:    () => void;
  spinnerName?: string;
}

export function SpinResultCard({ visible, winner, onDismiss, spinnerName }: SpinResultCardProps) {
  const confettiFired = useRef(false);

  useEffect(() => {
    if (visible && winner && !confettiFired.current) {
      confettiFired.current = true;
      fireConfetti();
    }
    if (!visible) {
      confettiFired.current = false;
    }
  }, [visible, winner]);

  return (
    <AnimatePresence>
      {visible && winner && (
        <motion.div
          key="result-card"
          initial={{ opacity: 0, scale: 0.6, y: 50 }}
          animate={{ opacity: 1, scale: 1,   y: 0  }}
          exit={{    opacity: 0, scale: 0.8,  y: 20 }}
          transition={{ type: 'spring', stiffness: 420, damping: 24 }}
          className="absolute inset-0 flex items-center justify-center z-20 px-4"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-dark-bg/85 backdrop-blur-md"
            onClick={onDismiss}
          />

          {/* Card */}
          <div
            className="relative rounded-3xl p-8 max-w-xs w-full text-center"
            style={{
              background:  'linear-gradient(135deg, #2D1B69 0%, #1E0F3A 100%)',
              border:      '2px solid rgba(124,58,237,0.55)',
              boxShadow:   '0 0 80px rgba(124,58,237,0.3), 0 24px 48px rgba(0,0,0,0.6), inset 0 0 40px rgba(124,58,237,0.08)',
            }}
          >
            {/* Big celebration emoji */}
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: [0, 1.4, 1], rotate: [0, 10, 0] }}
              transition={{ delay: 0.05, duration: 0.55 }}
              className="text-6xl mb-4"
            >
              🎉
            </motion.div>

            <p className="text-xs font-black text-primary-300 uppercase tracking-widest mb-3">
              {spinnerName ? `${spinnerName} a spinné !` : 'Le destin a parlé !'}
            </p>

            <motion.h2
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="font-title text-3xl font-black gradient-text mb-4 leading-tight"
            >
              {winner.label}
            </motion.h2>

            {winner.weight !== undefined && winner.weight !== 1 && (
              <p className="text-slate-500 text-xs mb-3 font-bold">
                Poids : ×{winner.weight}
              </p>
            )}

            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 }}
              onClick={onDismiss}
              className="mt-1 w-full py-3 rounded-2xl bg-white/10 hover:bg-white/18 text-white font-black text-sm transition-colors border border-white/10"
            >
              Fermer ✕
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function fireConfetti() {
  const count  = 220;
  const origin = { y: 0.55 };

  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({ ...opts, origin, particleCount: Math.floor(count * particleRatio) });
  }

  fire(0.25, { spread: 26, startVelocity: 55, colors: ['#A78BFA', '#FFD700'] });
  fire(0.20, { spread: 60, colors: ['#7C3AED', '#FF6B35'] });
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8, colors: ['#10B981', '#F59E0B'] });
  fire(0.10, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2, colors: ['#A78BFA'] });
  fire(0.10, { spread: 120, startVelocity: 45, colors: ['#FFD700', '#FFFFFF'] });
}
