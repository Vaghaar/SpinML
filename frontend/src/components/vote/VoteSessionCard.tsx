'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { voteApi } from '@/lib/api';
import { VoteOptionBar } from './VoteOptionBar';
import { toast } from '@/components/ui/Toast';
import type { VoteSession, LiveVoteUpdate, OptionResult } from '@/types';

interface VoteSessionCardProps {
  session:     VoteSession;
  liveUpdate?: LiveVoteUpdate | null;
  currentUserId?: string;
  isAdmin?:    boolean;
  onClose?:    () => void;
}

export function VoteSessionCard({
  session,
  liveUpdate,
  currentUserId,
  isAdmin,
  onClose,
}: VoteSessionCardProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [points, setPoints]                 = useState<Record<string, number>>({});
  const [voted, setVoted]                   = useState(false);

  const isClosed = session.status === 'CLOSED' || liveUpdate?.status === 'CLOSED';

  // Build ranked results from live update or empty
  const results: OptionResult[] = liveUpdate?.results ?? session.options.map(o => ({
    optionId: o.id, label: o.label, voteCount: 0, totalPoints: 0, percentage: 0,
  }));

  const sorted = [...results].sort((a, b) => b.percentage - a.percentage);
  const winnerId = liveUpdate?.winner?.winningOptionId;

  const voteMutation = useMutation({
    mutationFn: async () => {
      const payload =
        session.mode === 'MAJORITY'  ? { optionId: selectedOption } :
        session.mode === 'APPROVAL'  ? { optionId: selectedOption } :
        /* POINTS */                   { votes: Object.entries(points).map(([optionId, p]) => ({ optionId, points: p })) };
      return voteApi.castVote(session.id, payload);
    },
    onSuccess: () => {
      setVoted(true);
      toast.success('Vote enregistré !');
    },
    onError: () => toast.error('Erreur', 'Impossible de voter.'),
  });

  const closeMutation = useMutation({
    mutationFn: () => voteApi.closeSession(session.id),
    onSuccess: () => { toast.success('Session fermée'); onClose?.(); },
    onError:   () => toast.error('Erreur', 'Impossible de fermer la session.'),
  });

  const canVote = !voted && !isClosed;

  const handleVote = useCallback(() => {
    if (session.mode !== 'POINTS' && !selectedOption) return;
    voteMutation.mutate();
  }, [session.mode, selectedOption, voteMutation]);

  return (
    <div className="glass rounded-2xl p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className={`text-xs font-accent uppercase tracking-wider px-2 py-0.5 rounded-full ${
            isClosed ? 'bg-slate-700 text-slate-400' : 'bg-primary-500/20 text-primary-400'
          }`}>
            {session.mode} · {isClosed ? 'Terminé' : 'En cours'}
          </span>
        </div>
        {isAdmin && !isClosed && (
          <button
            onClick={() => closeMutation.mutate()}
            disabled={closeMutation.isPending}
            className="text-xs text-slate-400 hover:text-red-400 transition-colors"
          >
            Fermer
          </button>
        )}
      </div>

      {/* Live results bars */}
      <div className="flex flex-col gap-2">
        {sorted.map((opt, i) => (
          <VoteOptionBar
            key={opt.optionId}
            option={opt}
            rank={i + 1}
            isWinner={isClosed && opt.optionId === winnerId}
          />
        ))}
      </div>

      {/* Vote controls */}
      <AnimatePresence>
        {canVote && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{    opacity: 0, height: 0 }}
            className="flex flex-col gap-3 overflow-hidden"
          >
            <p className="text-xs text-slate-400 font-accent">Votre vote :</p>

            {(session.mode === 'MAJORITY' || session.mode === 'APPROVAL') && (
              <div className="flex flex-col gap-2">
                {session.options.map(opt => (
                  <label key={opt.id} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type={session.mode === 'MAJORITY' ? 'radio' : 'checkbox'}
                      name="vote"
                      value={opt.id}
                      checked={session.mode === 'MAJORITY'
                        ? selectedOption === opt.id
                        : Boolean(points[opt.id])}
                      onChange={() => {
                        if (session.mode === 'MAJORITY') {
                          setSelectedOption(opt.id);
                        } else {
                          setPoints(p => ({ ...p, [opt.id]: p[opt.id] ? 0 : 1 }));
                        }
                      }}
                      className="accent-primary-500"
                    />
                    <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
                      {opt.label}
                    </span>
                  </label>
                ))}
              </div>
            )}

            {session.mode === 'POINTS' && (
              <div className="flex flex-col gap-2">
                {session.options.map(opt => (
                  <div key={opt.id} className="flex items-center gap-3">
                    <span className="flex-1 text-sm text-slate-300">{opt.label}</span>
                    <input
                      type="number"
                      min={0}
                      max={10}
                      value={points[opt.id] ?? 0}
                      onChange={e => setPoints(p => ({ ...p, [opt.id]: Number(e.target.value) }))}
                      className="w-16 text-center bg-white/10 border border-white/20 rounded-lg py-1 text-white text-sm"
                    />
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={handleVote}
              disabled={voteMutation.isPending}
              className="w-full py-2.5 rounded-xl bg-primary-500 hover:bg-primary-400 text-white font-bold text-sm transition-colors disabled:opacity-50"
            >
              {voteMutation.isPending ? 'Envoi…' : 'Voter'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Winner reveal */}
      {isClosed && winnerId && liveUpdate?.winner && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary-500/10 border border-secondary-500/30"
        >
          <span className="text-secondary-400">🏆</span>
          <span className="font-body text-sm text-secondary-300 font-semibold">
            {liveUpdate.winner.winningLabel}
            {liveUpdate.winner.wasTiebroken && <span className="text-xs text-slate-400 ml-1">(ex-æquo → spin)</span>}
          </span>
        </motion.div>
      )}

      {/* Quorum progress */}
      {!isClosed && liveUpdate && (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-accent-500"
              animate={{ width: `${Math.min(100, (liveUpdate.totalVoters / Math.max(liveUpdate.totalEligibleVoters, 1)) * 100)}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
          <span className="text-xs text-slate-500 flex-shrink-0">
            {liveUpdate.totalVoters}/{liveUpdate.totalEligibleVoters} votants
          </span>
        </div>
      )}
    </div>
  );
}
