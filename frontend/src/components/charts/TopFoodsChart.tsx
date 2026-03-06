'use client';

import { motion } from 'framer-motion';
import type { PlaceCount } from '@/types';

const BAR_COLORS = [
  'from-primary-500 to-secondary-500',
  'from-secondary-500 to-accent-500',
  'from-accent-500 to-primary-500',
  'from-primary-400 to-primary-600',
  'from-secondary-400 to-secondary-600',
  'from-accent-400 to-accent-600',
];

const FOOD_EMOJI: Record<string, string> = {
  pizza:   '🍕', sushi:   '🍣', burger:  '🍔', tacos:   '🌮',
  salade:  '🥗', pates:   '🍝', pâtes:   '🍝', kebab:   '🥙',
  poulet:  '🍗', sandwich:'🥪', ramen:   '🍜', thai:    '🍲',
  indien:  '🍛', chinois: '🥡', mexicain:'🌯', japonais:'🍱',
};

function getEmoji(label: string): string {
  const key = label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return Object.entries(FOOD_EMOJI).find(([k]) => key.includes(k))?.[1] ?? '🍽️';
}

interface TopFoodsChartProps {
  places:     PlaceCount[];
  totalSpins: number;
  emptyLabel?: string;
}

export function TopFoodsChart({ places, totalSpins, emptyLabel }: TopFoodsChartProps) {
  if (places.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-2">
        <span className="text-4xl">🎡</span>
        <p className="text-slate-500 text-sm">{emptyLabel ?? 'Pas encore de spins — lancez la roulette !'}</p>
      </div>
    );
  }

  const max = Math.max(...places.map(p => p.count), 1);

  return (
    <div className="flex flex-col gap-3">
      {places.map((place, i) => {
        const pct    = (place.count / max) * 100;
        const ofAll  = totalSpins > 0 ? Math.round((place.count / totalSpins) * 100) : 0;
        const emoji  = getEmoji(place.label);
        const color  = BAR_COLORS[i % BAR_COLORS.length];

        return (
          <motion.div
            key={place.label}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1,  x: 0   }}
            transition={{ delay: i * 0.07, duration: 0.4 }}
            className="flex flex-col gap-1"
          >
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="text-base w-6 text-center">{emoji}</span>
                <span className="text-slate-200 font-semibold truncate max-w-[160px]">{place.label}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-slate-500">{ofAll}%</span>
                <span className="text-sm font-bold text-white tabular-nums w-8 text-right">
                  {place.count}
                </span>
              </div>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full bg-gradient-to-r ${color}`}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ delay: i * 0.07 + 0.1, duration: 0.6, ease: 'easeOut' }}
              />
            </div>
          </motion.div>
        );
      })}

      <p className="text-xs text-slate-600 text-right mt-1">
        {totalSpins} spin{totalSpins !== 1 ? 's' : ''} au total
      </p>
    </div>
  );
}
