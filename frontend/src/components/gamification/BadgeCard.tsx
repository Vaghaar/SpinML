'use client';

import { motion } from 'framer-motion';

export interface BadgeData {
  code:        string;
  name:        string;
  description: string;
  iconUrl?:    string;
  unlocked:    boolean;
  unlockedAt?: string;
}

const BADGE_ICONS: Record<string, string> = {
  FIRST_SPIN:        '🎡',
  SPIN_MASTER:       '🌀',
  VOTE_PARTICIPANT:  '🗳️',
  SOCIAL_BUTTERFLY:  '🦋',
  STREAK_WEEK:       '🔥',
  EARLY_ADOPTER:     '⭐',
  GROUP_CREATOR:     '👥',
  LUNCH_LEGEND:      '🏆',
};

interface BadgeCardProps {
  badge: BadgeData;
  index: number;
}

export function BadgeCard({ badge, index }: BadgeCardProps) {
  const icon = BADGE_ICONS[badge.code] ?? '🏅';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.04, type: 'spring', stiffness: 300 }}
      className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl transition-all ${
        badge.unlocked
          ? 'glass ring-1 ring-secondary-500/40'
          : 'bg-white/3 border border-white/5'
      }`}
    >
      {/* Badge icon */}
      <div className={`text-3xl ${badge.unlocked ? '' : 'grayscale opacity-30'}`}>
        {icon}
      </div>

      {/* Name */}
      <p className={`font-title text-xs font-semibold text-center leading-tight ${
        badge.unlocked ? 'text-white' : 'text-slate-600'
      }`}>
        {badge.name}
      </p>

      {/* Unlocked sparkle */}
      {badge.unlocked && (
        <motion.div
          className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-secondary-500 flex items-center justify-center text-[8px]"
          initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: index * 0.04 + 0.2 }}
        >
          ✓
        </motion.div>
      )}
    </motion.div>
  );
}
