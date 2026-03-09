'use client';

import { useState, useCallback, useEffect } from 'react';
import { useParams, useRouter }             from 'next/navigation';
import { motion, AnimatePresence }          from 'framer-motion';
import { useQuery, useMutation }            from '@tanstack/react-query';
import { rouletteApi }                      from '@/lib/api';
import { useAuth }                          from '@/hooks/useAuth';
import { useGroupSocket }                   from '@/hooks/useGroupSocket';
import { useSpinAnimation }                 from '@/hooks/useSpinAnimation';
import { RouletteWheel }                    from '@/components/roulette/RouletteWheel';
import { SpinButton }                       from '@/components/roulette/SpinButton';
import { SpinResultCard }                   from '@/components/roulette/SpinResultCard';
import { toast }                            from '@/components/ui/Toast';
import type { Roulette, SpinResponse, Segment, SpinSyncMessage } from '@/types';

export default function RoulettePage() {
  const { id }    = useParams<{ id: string }>();
  const router    = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [winner, setWinner]             = useState<Segment | null>(null);
  const [showResult, setShowResult]     = useState(false);
  const [lastSpinResp, setLastSpinResp] = useState<SpinResponse | null>(null);
  const [spinnerName, setSpinnerName]   = useState<string | null>(null);

  const {
    phase,
    currentAngle,
    isSpinning,
    startSpin,
    reset,
  } = useSpinAnimation();

  // Spin synchronisé — quand un autre membre du groupe spinner
  const { user } = useAuth();
  const handleSpinSync = useCallback((msg: SpinSyncMessage) => {
    if (msg.rouletteId !== id) return;         // pas cette roulette
    if (msg.spunBy === user?.id) return;       // c'est notre propre spin, déjà géré
    if (isSpinning) return;                    // animation déjà en cours

    setSpinnerName(msg.spunByName);
    setShowResult(false);
    setWinner(null);
    // Convertir le SpinSyncMessage en SpinResponse partiel pour réutiliser la logique
    setLastSpinResp({
      spinResultId:     msg.spinResultId,
      winningSegmentId: msg.winningSegmentId,
      winningLabel:     msg.winningLabel,
      winningColor:     msg.winningColor,
      serverAngle:      msg.serverAngle,
      xpEarned:         0,
      badgeUnlocked:    null,
      spunAt:           msg.spunAt,
    } as SpinResponse);
    startSpin(msg.serverAngle);
  }, [id, user?.id, isSpinning, startSpin]);

  useGroupSocket({
    groupId: roulette?.groupId ?? null,
    onSpinSync: handleSpinSync,
  });

  // ── Fetch roulette ──────────────────────────────────────────────────────────
  const { data: roulette, isLoading: rouletteLoading } = useQuery<Roulette>({
    queryKey: ['roulette', id],
    queryFn:  async () => {
      const { data } = await rouletteApi.getById(id);
      return data;
    },
    enabled: !!id,
  });

  // ── Spin mutation ───────────────────────────────────────────────────────────
  const spinMutation = useMutation<SpinResponse>({
    mutationFn: async () => {
      const { data } = await rouletteApi.spin(id);
      return data;
    },
    onSuccess: (resp) => {
      setLastSpinResp(resp);
      // Start 5-phase animation — result card shown via useEffect when phase === 'result'
      startSpin(resp.serverAngle);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      if (msg?.includes('rate')) {
        toast.error('Trop vite !', 'Attendez un peu avant de respinner.');
      } else {
        toast.error('Erreur', 'Impossible de lancer le spin.');
      }
    },
  });

  // Show result card when animation enters 'result' phase
  useEffect(() => {
    if (phase === 'result' && lastSpinResp) {
      const seg = roulette?.segments.find(s => s.id === lastSpinResp.winningSegmentId) ?? null;
      setWinner(seg);
      setShowResult(true);
      if (lastSpinResp.xpEarned > 0) {
        toast.xp(lastSpinResp.xpEarned, lastSpinResp.badgeUnlocked?.name);
      }
      if (spinnerName) {
        toast.success(`${spinnerName} a spinné !`);
        setSpinnerName(null);
      }
    }
  }, [phase, lastSpinResp, roulette, spinnerName]);

  const handleSpin = useCallback(() => {
    if (isSpinning) return;
    if (!isAuthenticated) { router.push('/'); return; }
    setShowResult(false);
    setWinner(null);
    setSpinnerName(null);
    spinMutation.mutate();
  }, [isSpinning, isAuthenticated, router, spinMutation]);

  const handleDismiss = useCallback(() => {
    setShowResult(false);
    reset();
  }, [reset]);

  // ── Loading states ──────────────────────────────────────────────────────────
  if (authLoading || rouletteLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-dark-bg">
        <div className="w-12 h-12 rounded-full border-4 border-primary-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!roulette) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-dark-bg gap-4">
        <p className="text-slate-400">Roulette introuvable.</p>
        <button onClick={() => router.push('/dashboard')} className="text-primary-400 hover:underline text-sm">
          ← Retour au dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-dark-bg flex flex-col items-center justify-start pb-12">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg px-4 pt-6 pb-2 flex items-center justify-between"
      >
        <button
          onClick={() => router.push('/dashboard')}
          className="text-slate-400 hover:text-white transition-colors text-sm"
        >
          ← Retour
        </button>
        <h1 className="font-title font-bold text-white text-lg truncate max-w-[60%]">
          {roulette.name}
        </h1>
        <span className="text-xs text-slate-500 capitalize">
          {roulette.mode.toLowerCase()}
        </span>
      </motion.header>

      {/* Wheel area */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
        className="relative mt-6"
      >
        <RouletteWheel
          segments={roulette.segments}
          currentAngle={currentAngle}
          phase={phase}
          winningSegmentId={phase === 'result' ? (lastSpinResp?.winningSegmentId ?? undefined) : undefined}
          size={340}
        />

        {/* Surprise mode — mask segments */}
        {roulette.isSurpriseMode && phase === 'idle' && (
          <div className="absolute inset-0 rounded-full bg-dark-bg/80 flex items-center justify-center">
            <span className="text-4xl">🎁</span>
          </div>
        )}

        <SpinResultCard
          visible={showResult}
          winner={winner}
          onDismiss={handleDismiss}
          spinnerName={spinnerName ?? undefined}
        />
      </motion.div>

      {/* Spin button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="mt-8"
      >
        <SpinButton
          phase={phase}
          onClick={handleSpin}
          disabled={spinMutation.isPending && !isSpinning}
        />
      </motion.div>

      {/* Phase indicator */}
      <AnimatePresence mode="wait">
        {phase !== 'idle' && phase !== 'result' && (
          <motion.p
            key={phase}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{    opacity: 0, y: -8 }}
            className="mt-4 text-sm text-slate-400 font-accent"
          >
            {phase === 'anticipation' && 'Préparation…'}
            {phase === 'acceleration' && '🌀 En route !'}
            {phase === 'deceleration' && '🎯 Presque là…'}
            {phase === 'revelation'   && '✨ Révélation !'}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Segment list */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-8 w-full max-w-sm px-4"
      >
        <h2 className="font-title text-sm text-slate-400 mb-3 uppercase tracking-widest">
          Segments ({roulette.segments.length})
        </h2>
        <div className="flex flex-col gap-2">
          {roulette.segments.map((seg, i) => (
            <SegmentRow
              key={seg.id}
              segment={seg}
              index={i}
              isWinner={phase === 'result' && seg.id === lastSpinResp?.winningSegmentId}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// ─── Segment row component ────────────────────────────────────────────────────

const COLORS = [
  '#FF6B35', '#FFD700', '#7C3AED', '#06B6D4',
  '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
];

function SegmentRow({ segment, index, isWinner }: {
  segment: Segment;
  index:   number;
  isWinner: boolean;
}) {
  const color = COLORS[index % COLORS.length];
  return (
    <motion.div
      animate={isWinner ? { scale: [1, 1.04, 1] } : {}}
      transition={{ duration: 0.4, repeat: isWinner ? 2 : 0 }}
      className={`flex items-center gap-3 glass rounded-xl px-4 py-2.5 transition-colors ${
        isWinner ? 'border border-primary-500/60 bg-primary-500/10' : ''
      }`}
    >
      <span
        className="w-3 h-3 rounded-full flex-shrink-0"
        style={{ backgroundColor: color }}
      />
      <span className="font-body text-sm text-slate-200 flex-1 truncate">
        {segment.label}
      </span>
      {segment.weight !== 1 && (
        <span className="text-xs text-slate-500 font-accent">×{segment.weight}</span>
      )}
      {isWinner && <span className="text-xs text-primary-400 font-bold">✓</span>}
    </motion.div>
  );
}
