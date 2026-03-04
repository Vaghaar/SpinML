'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { rouletteApi } from '@/lib/api';
import { toast } from '@/components/ui/Toast';
import type { Roulette } from '@/types';

const MODE_LABEL: Record<string, string> = {
  EQUAL:    'Égal',
  WEIGHTED: 'Pondéré',
  RANDOM:   'Aléatoire',
};

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
      className="glass rounded-2xl p-4 cursor-pointer hover:ring-1 hover:ring-primary-500/40 transition-all group"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-title font-bold text-white truncate">{roulette.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-slate-500 font-accent">
              {MODE_LABEL[roulette.mode] ?? roulette.mode}
            </span>
            {roulette.isSurpriseMode && (
              <span className="text-xs bg-accent-500/20 text-accent-400 px-1.5 py-0.5 rounded-full">Surprise</span>
            )}
            <span className="text-xs text-slate-600">·</span>
            <span className="text-xs text-slate-500">{roulette.segments.length} segments</span>
          </div>
        </div>

        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="text-slate-500 hover:text-red-400 transition-colors p-1"
            aria-label="Supprimer"
          >
            🗑
          </button>
        </div>
      </div>

      {/* Segment color preview */}
      <div className="flex gap-1 mt-3 overflow-hidden">
        {roulette.segments.slice(0, 8).map((seg, i) => (
          <div
            key={seg.id}
            className="h-1.5 rounded-full flex-1"
            style={{ backgroundColor: seg.color || '#FF6B35' }}
            title={seg.label}
          />
        ))}
        {roulette.segments.length > 8 && (
          <span className="text-xs text-slate-600 ml-1">+{roulette.segments.length - 8}</span>
        )}
      </div>
    </motion.div>
  );
}
