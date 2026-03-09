'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import type { Segment } from '@/types';

interface SpinResultCardProps {
  visible:      boolean;
  winner:       Segment | null;
  onDismiss:    () => void;
  spinnerName?: string;  // Nom du membre qui a spinné (si ce n'est pas l'utilisateur courant)
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
          initial={{ opacity: 0, scale: 0.7, y: 40 }}
          animate={{ opacity: 1, scale: 1,   y: 0  }}
          exit={{    opacity: 0, scale: 0.8,  y: 20 }}
          transition={{ type: 'spring', stiffness: 400, damping: 22 }}
          className="absolute inset-0 flex items-center justify-center z-20 px-4"
        >
          {/* Backdrop blur overlay */}
          <div
            className="absolute inset-0 bg-dark-bg/70 backdrop-blur-sm"
            onClick={onDismiss}
          />

          <div className="relative glass neon-border rounded-3xl p-8 max-w-xs w-full text-center shadow-2xl">
            {/* Fireworks emoji */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.3, 1] }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="text-5xl mb-4"
            >
              🎉
            </motion.div>

            <p className="font-body text-slate-400 text-sm mb-2 uppercase tracking-widest">
              {spinnerName ? `${spinnerName} a spinné !` : 'Le destin a parlé !'}
            </p>

            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0  }}
              transition={{ delay: 0.2 }}
              className="font-title text-3xl font-bold gradient-text mb-2"
            >
              {winner.label}
            </motion.h2>

            {winner.weight !== undefined && winner.weight !== 1 && (
              <p className="text-slate-500 text-xs mt-1">
                Poids : {winner.weight}
              </p>
            )}

            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              onClick={onDismiss}
              className="mt-6 w-full py-3 rounded-xl bg-primary-500/20 hover:bg-primary-500/30 text-primary-400 font-semibold text-sm transition-colors"
            >
              Fermer
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function fireConfetti() {
  const count  = 200;
  const origin = { y: 0.6 };

  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({
      ...opts,
      origin,
      particleCount: Math.floor(count * particleRatio),
    });
  }

  fire(0.25, { spread: 26, startVelocity: 55, colors: ['#FF6B35', '#FFD700'] });
  fire(0.20, { spread: 60, colors: ['#7C3AED', '#06B6D4'] });
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8, colors: ['#10B981', '#F59E0B'] });
  fire(0.10, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2, colors: ['#FF6B35'] });
  fire(0.10, { spread: 120, startVelocity: 45, colors: ['#FFD700', '#FFFFFF'] });
}
