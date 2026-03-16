'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { rouletteApi } from '@/lib/api';
import { toast } from '@/components/ui/Toast';
import type { Roulette } from '@/types';


interface RouletteCardProps {
  roulette: Roulette;
  index:    number;
}

export function RouletteCard({ roulette, index }: RouletteCardProps) {
  const router      = useRouter();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: () => rouletteApi.delete(roulette.id),
    onSuccess:  () => {
      toast.success('Roulette supprimée');
      queryClient.invalidateQueries({ queryKey: ['my-roulettes'] });
    },
    onError: () => toast.error('Erreur', 'Impossible de supprimer.'),
  });

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Supprimer "${roulette.name}" ?`)) deleteMutation.mutate();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={() => router.push(`/roulette/${roulette.id}`)}
      className="glass rounded-2xl p-4 cursor-pointer hover:ring-2 hover:ring-primary-500/40 hover:bg-primary-500/4 transition-all group"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Icon */}
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary-600/30 to-accent-500/20 border border-primary-500/20 flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform">
            {roulette.isSurpriseMode ? '🎭' : '🎡'}
          </div>

          <div className="min-w-0">
            <h3 className="font-title font-black text-white truncate leading-tight">{roulette.name}</h3>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              {roulette.isSurpriseMode && (
                <span className="text-xs font-bold bg-accent-500/15 text-accent-400 px-2 py-0.5 rounded-full">
                  Surprise
                </span>
              )}
              <span className="text-xs text-slate-500 font-bold">{roulette.segments.length} seg.</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleDelete}
          disabled={deleteMutation.isPending}
          className="text-slate-600 hover:text-red-400 transition-colors p-2 rounded-xl hover:bg-red-500/10 shrink-0"
          aria-label="Supprimer"
        >
          {deleteMutation.isPending ? '…' : '🗑'}
        </button>
      </div>

      {/* Segment color bar */}
      {roulette.segments.length > 0 && (
        <div className="flex gap-1 mt-3 overflow-hidden rounded-full">
          {roulette.segments.slice(0, 10).map((seg) => (
            <div
              key={seg.id}
              className="h-2 rounded-full flex-1"
              style={{ backgroundColor: seg.color || '#FF6B35' }}
              title={seg.label}
            />
          ))}
          {roulette.segments.length > 10 && (
            <span className="text-xs text-slate-600 ml-1 font-bold">+{roulette.segments.length - 10}</span>
          )}
        </div>
      )}
    </motion.div>
  );
}
