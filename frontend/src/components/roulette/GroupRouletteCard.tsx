'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { rouletteApi } from '@/lib/api';
import { toast } from '@/components/ui/Toast';
import type { Roulette } from '@/types';

interface GroupRouletteCardProps {
  roulette:      Roulette;
  index:         number;
  currentUserId: string;
  isAdmin:       boolean;
}

export function GroupRouletteCard({ roulette, index, currentUserId, isAdmin }: GroupRouletteCardProps) {
  const router      = useRouter();
  const queryClient = useQueryClient();
  const groupId     = roulette.groupId!;
  const [proposal, setProposal] = useState('');

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['group-roulettes', groupId] });

  const proposeMutation = useMutation({
    mutationFn: () => rouletteApi.propose(roulette.id, proposal.trim()),
    onSuccess: () => { setProposal(''); invalidate(); },
    onError:   () => toast.error('Erreur', 'Impossible d\'ajouter le segment.'),
  });

  const removeMutation = useMutation({
    mutationFn: (segId: string) => rouletteApi.removeSegment(roulette.id, segId),
    onSuccess: invalidate,
    onError:   () => toast.error('Erreur', 'Impossible de supprimer.'),
  });

  const startMutation = useMutation({
    mutationFn: () => rouletteApi.start(roulette.id),
    onSuccess: () => { toast.success('Roulette démarrée !'); invalidate(); },
    onError:   () => toast.error('Erreur', 'Impossible de démarrer.'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => rouletteApi.delete(roulette.id),
    onSuccess: () => { toast.success('Roulette supprimée'); invalidate(); },
    onError:   () => toast.error('Erreur', 'Impossible de supprimer.'),
  });

  // ── Roulette ACTIVE ────────────────────────────────────────────────────────
  if (roulette.status === 'ACTIVE') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        onClick={() => router.push(`/roulette/${roulette.id}`)}
        className="glass rounded-2xl p-4 cursor-pointer hover:ring-1 hover:ring-primary-500/40 transition-all"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-title font-bold text-white truncate">{roulette.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-slate-500">{roulette.segments.length} segments</span>
              <span className="text-xs text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded-full font-semibold">Active</span>
            </div>
          </div>
          {roulette.creatorId === currentUserId && (
            <button
              onClick={e => { e.stopPropagation(); if (confirm(`Supprimer "${roulette.name}" ?`)) deleteMutation.mutate(); }}
              disabled={deleteMutation.isPending}
              className="text-slate-500 hover:text-red-400 transition-colors p-2 rounded-xl hover:bg-red-500/10 shrink-0"
              aria-label="Supprimer"
            >
              {deleteMutation.isPending ? '…' : '🗑'}
            </button>
          )}
        </div>
        <div className="flex gap-1 mt-3 overflow-hidden">
          {roulette.segments.slice(0, 8).map(seg => (
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

  // ── Roulette PENDING ───────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="glass rounded-2xl p-4 flex flex-col gap-3"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-title font-bold text-white truncate">{roulette.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-full font-semibold">
              Collecte de propositions
            </span>
            <span className="text-xs text-slate-500">{roulette.segments.length}/20</span>
          </div>
        </div>
        {roulette.creatorId === currentUserId && (
          <button
            onClick={() => { if (confirm(`Supprimer "${roulette.name}" ?`)) deleteMutation.mutate(); }}
            disabled={deleteMutation.isPending}
            className="text-slate-500 hover:text-red-400 transition-colors p-2 rounded-xl hover:bg-red-500/10 shrink-0"
            aria-label="Supprimer"
          >
            {deleteMutation.isPending ? '…' : '🗑'}
          </button>
        )}
      </div>

      {/* Liste des propositions */}
      {roulette.segments.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          {roulette.segments.map(seg => {
            const canRemove = isAdmin ||
              roulette.creatorId === currentUserId ||
              seg.proposedById === currentUserId;
            return (
              <div key={seg.id}
                className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2"
              >
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                <span className="flex-1 text-sm text-white truncate">{seg.label}</span>
                {seg.proposedByName && (
                  <span className="text-xs text-slate-500 shrink-0">{seg.proposedByName}</span>
                )}
                {canRemove && (
                  <button
                    onClick={() => removeMutation.mutate(seg.id)}
                    disabled={removeMutation.isPending}
                    className="text-slate-600 hover:text-red-400 transition-colors disabled:opacity-30 shrink-0"
                    aria-label="Retirer"
                  >
                    ✕
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-slate-500 text-center py-2">
          Aucune proposition pour l'instant — soyez le premier !
        </p>
      )}

      {/* Champ de proposition */}
      <div className="flex gap-2">
        <input
          value={proposal}
          onChange={e => setProposal(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && proposal.trim() && !proposeMutation.isPending) {
              proposeMutation.mutate();
            }
          }}
          placeholder="Proposer un restaurant…"
          maxLength={255}
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-primary-500 text-sm"
        />
        <button
          onClick={() => proposeMutation.mutate()}
          disabled={!proposal.trim() || proposeMutation.isPending}
          className="px-3 py-2 rounded-xl bg-primary-500/20 hover:bg-primary-500/30 text-primary-400 font-semibold text-sm transition-colors disabled:opacity-30"
        >
          {proposeMutation.isPending ? '…' : '+'}
        </button>
      </div>

      {/* Bouton démarrer (admin, ≥2 propositions) */}
      {isAdmin && (
        <button
          onClick={() => startMutation.mutate()}
          disabled={roulette.segments.length < 2 || startMutation.isPending}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-sm disabled:opacity-30 transition-opacity"
        >
          {startMutation.isPending
            ? 'Démarrage…'
            : roulette.segments.length < 2
              ? `Démarrer (${roulette.segments.length}/2 min)`
              : 'Démarrer la roulette'}
        </button>
      )}
    </motion.div>
  );
}
