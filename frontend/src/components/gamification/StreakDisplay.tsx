'use client';

import { motion } from 'framer-motion';

interface StreakDisplayProps {
  streak: number;
}

export function StreakDisplay({ streak }: StreakDisplayProps) {
  const isOnFire = streak >= 7;
  const weeks    = Math.floor(streak / 7);
  const days     = streak % 7;

  return (
    <div className={`glass rounded-2xl p-4 flex items-center gap-4 ${
      isOnFire ? 'ring-1 ring-primary-500/40' : ''
    }`}>
      <motion.div
        animate={isOnFire ? { scale: [1, 1.1, 1] } : {}}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        className="text-3xl flex-shrink-0"
      >
        {streak === 0 ? '💤' : isOnFire ? '🔥' : '⚡'}
      </motion.div>

      <div className="flex-1">
        <p className="font-title font-bold text-white">
          {streak} jour{streak !== 1 ? 's' : ''} de suite
        </p>
        {isOnFire && (
          <p className="text-xs text-primary-400 mt-0.5">
            🏅 Bonus ×2 XP actif !
            {weeks > 0 && ` · ${weeks} semaine${weeks > 1 ? 's' : ''}`}
          </p>
        )}
        {!isOnFire && streak > 0 && (
          <p className="text-xs text-slate-500 mt-0.5">
            {7 - days} jour{7 - days !== 1 ? 's' : ''} avant le bonus ×2
          </p>
        )}
      </div>

      {/* Week dots */}
      <div className="flex gap-1">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className={`w-2 h-2 rounded-full ${
            i < days
              ? 'bg-primary-500'
              : 'bg-white/10'
          }`} />
        ))}
      </div>
    </div>
  );
}
