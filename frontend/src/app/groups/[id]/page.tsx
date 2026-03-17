'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useRouter }             from 'next/navigation';
import { motion }                           from 'framer-motion';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import QRCode                               from 'qrcode';
import { groupApi, voteApi, statsApi, rouletteApi } from '@/lib/api';
import { toast } from '@/components/ui/Toast';
import { useAuth }                          from '@/hooks/useAuth';
import { useGroupSocket }                   from '@/hooks/useGroupSocket';
import { VoteSessionCard }                  from '@/components/vote/VoteSessionCard';
import { CreateVoteSessionModal }           from '@/components/vote/CreateVoteSessionModal';
import { CreateRouletteModal }              from '@/components/roulette/CreateRouletteModal';
import { GroupRouletteCard }               from '@/components/roulette/GroupRouletteCard';
import { RouletteWheel }                   from '@/components/roulette/RouletteWheel';
import { SpinResultCard }                  from '@/components/roulette/SpinResultCard';
import { TopFoodsChart }                    from '@/components/charts/TopFoodsChart';
import { useSpinAnimation }                from '@/hooks/useSpinAnimation';
import type { GroupMember, VoteSession, LiveVoteUpdate, StatsResponse, Roulette, RouletteUpdateMessage, SpinSyncMessage, Segment, MemberJoinedMessage } from '@/types';

// ─── Tabs ─────────────────────────────────────────────────────────────────────

type Tab = 'votes' | 'roulettes' | 'stats' | 'membres';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'votes',     label: 'Votes',     icon: '🗳️' },
  { id: 'roulettes', label: 'Roulettes', icon: '🎡' },
  { id: 'stats',     label: 'Stats',     icon: '📊' },
  { id: 'membres',   label: 'Membres',   icon: '👥' },
];

export default function GroupPage() {
  const { id }      = useParams<{ id: string }>();
  const router      = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      sessionStorage.setItem('redirectAfterLogin', window.location.pathname + window.location.search);
      router.replace('/');
    }
  }, [authLoading, isAuthenticated, router]);

  const [tab, setTab]                   = useState<Tab>('votes');
  const [showCreateVote, setShowCreate] = useState(false);
  const [showCreateRoulette, setShowCreateRoulette] = useState(false);
  const [qrDataUrl, setQrDataUrl]       = useState('');
  const [copiedCode, setCopiedCode]     = useState(false);
  const [liveUpdates, setLiveUpdates]   = useState<Record<string, LiveVoteUpdate>>({});

  // ─── Spin overlay (roue visible pour tous les membres) ───────────────────────
  const [spinEvent, setSpinEvent]           = useState<SpinSyncMessage | null>(null);
  const [overlaySegments, setOverlaySegments] = useState<Segment[] | null>(null);
  const [showOverlayResult, setShowOverlayResult] = useState(false);

  const {
    phase:        overlayPhase,
    currentAngle: overlayAngle,
    startSpin:    startOverlaySpin,
    reset:        resetOverlay,
  } = useSpinAnimation();

  // Ref pour éviter les dépendances cycliques avec startOverlaySpin
  const startOverlaySpinRef = useRef(startOverlaySpin);
  useEffect(() => { startOverlaySpinRef.current = startOverlaySpin; });

  // Fetch la roulette et lance l'animation quand un spin arrive
  useEffect(() => {
    if (!spinEvent) return;
    let cancelled = false;
    rouletteApi.getById(spinEvent.rouletteId)
      .then(({ data }) => {
        if (cancelled) return;
        setOverlaySegments(data.segments);
        startOverlaySpinRef.current(spinEvent.serverAngle);
      })
      .catch(() => {
        if (cancelled) return;
        setSpinEvent(null);
        toast.success(`${spinEvent.spunByName} a spinné : ${spinEvent.winningLabel} 🎡`);
      });
    return () => { cancelled = true; };
  }, [spinEvent]);

  // Affiche le résultat quand l'animation se termine
  useEffect(() => {
    if (overlayPhase === 'result') setShowOverlayResult(true);
  }, [overlayPhase]);

  const closeOverlay = useCallback(() => {
    setSpinEvent(null);
    setOverlaySegments(null);
    setShowOverlayResult(false);
    resetOverlay();
  }, [resetOverlay]);

  // ─── Requêtes ─────────────────────────────────────────────────────────────

  const { data: group, isLoading: groupLoading } = useQuery({
    queryKey: ['group', id],
    queryFn:  async () => { const { data } = await groupApi.getById(id); return data; },
    enabled:  !!id && isAuthenticated,
  });

  const { data: members = [] } = useQuery<GroupMember[]>({
    queryKey: ['group-members', id],
    queryFn:  async () => { const { data } = await groupApi.getMembers(id); return data; },
    enabled:  !!id && isAuthenticated,
  });

  const { data: sessions = [], refetch: refetchSessions } = useQuery<VoteSession[]>({
    queryKey: ['group-sessions', id],
    queryFn:  async () => { const { data } = await voteApi.getByGroup(id); return data; },
    enabled:  !!id && isAuthenticated,
  });

  const { data: roulettes = [] } = useQuery<Roulette[]>({
    queryKey: ['group-roulettes', id],
    queryFn:  async () => { const { data } = await rouletteApi.getByGroup(id); return data; },
    enabled:  !!id && isAuthenticated && tab === 'roulettes',
  });

  const { data: stats } = useQuery<StatsResponse>({
    queryKey: ['group-stats', id],
    queryFn:  async () => { const { data } = await statsApi.groupStats(id); return data; },
    enabled:  !!id && isAuthenticated && tab === 'stats',
  });

  // ─── WebSocket ────────────────────────────────────────────────────────────

  const deleteGroupMutation = useMutation({
    mutationFn: () => groupApi.delete(id),
    onSuccess: () => {
      toast.success('Groupe supprimé');
      queryClient.invalidateQueries({ queryKey: ['my-groups'] });
      router.replace('/dashboard');
    },
    onError: () => toast.error('Erreur', 'Impossible de supprimer le groupe.'),
  });

  const handleDeleteGroup = () => {
    if (confirm(`Supprimer définitivement le groupe "${group?.name}" ?\n\nToutes les roulettes et les votes seront supprimés.`)) {
      deleteGroupMutation.mutate();
    }
  };

  const handleVoteUpdate = useCallback((update: LiveVoteUpdate) => {
    setLiveUpdates(prev => ({ ...prev, [update.sessionId]: update }));
    refetchSessions();
  }, [refetchSessions]);

  const handleRouletteUpdate = useCallback((msg: RouletteUpdateMessage) => {
    queryClient.invalidateQueries({ queryKey: ['group-roulettes', id] });
    if (msg.event === 'STARTED') {
      toast.success(`"${msg.rouletteName}" est prête à spinner !`);
    }
  }, [queryClient, id]);

  const handleSpinSync = useCallback((msg: SpinSyncMessage) => {
    setSpinEvent(msg);
    setShowOverlayResult(false);
  }, []);

  const handleMemberJoined = useCallback((msg: MemberJoinedMessage) => {
    queryClient.invalidateQueries({ queryKey: ['group-members', id] });
    queryClient.invalidateQueries({ queryKey: ['group', id] });
  }, [queryClient, id]);

  useGroupSocket({
    groupId: id,
    onVoteUpdate:     handleVoteUpdate,
    onRouletteUpdate: handleRouletteUpdate,
    onSpinSync:       handleSpinSync,
    onMemberJoined:   handleMemberJoined,
  });

  // ─── QR code ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!group?.inviteCode) return;
    const joinUrl = `${window.location.origin}/join?code=${group.inviteCode}`;
    QRCode.toDataURL(joinUrl, {
      width: 200, margin: 2,
      color: { dark: '#e2e8f0', light: '#0f172a' },
    }).then(setQrDataUrl).catch(() => {});
  }, [group?.inviteCode]);

  // ─── Dérivé ───────────────────────────────────────────────────────────────

  const isAdmin         = !!group && !!user && group.adminId === user.id;
  const activeSessions  = sessions.filter(s => s.status === 'ACTIVE');
  const pendingSessions = sessions.filter(s => s.status === 'PENDING');
  const closedSessions  = sessions.filter(s => s.status === 'CLOSED');
  const openCount       = activeSessions.length + pendingSessions.length;

  // ─── Render ───────────────────────────────────────────────────────────────

  if (authLoading || groupLoading) {
    return (
      <div className="min-h-dvh bg-dark-bg flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-primary-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-dvh bg-dark-bg flex items-center justify-center">
        <p className="text-slate-400">Groupe introuvable.</p>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-dark-bg pb-24">

      {/* Top bar */}
      <div className="sticky top-0 z-20 backdrop-blur-xl border-b border-primary-900/40"
        style={{ background: 'linear-gradient(135deg, rgba(13,6,20,0.97), rgba(22,10,42,0.97))' }}>
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => router.back()}
            className="text-slate-400 hover:text-white transition-colors font-bold text-sm bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full">
            ← Retour
          </button>
          <span className="font-title font-black text-white truncate flex-1 text-lg">{group.name}</span>
          <span className="text-xs font-bold text-slate-400 bg-primary-500/10 px-2.5 py-1 rounded-full shrink-0 border border-primary-500/20">
            👥 {members.length} membre{members.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Hero invite card */}
      <div className="relative">
        <div className="max-w-5xl mx-auto px-4 py-5">
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="card-hero rounded-3xl p-5 sm:p-6 relative overflow-hidden">
            <div className="absolute -top-8 -right-8 w-40 h-40 bg-primary-500/15 rounded-full blur-2xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center gap-5">
              {/* QR */}
              <div className="shrink-0 flex flex-col items-center gap-1.5">
                {qrDataUrl
                  ? <img src={qrDataUrl} alt="QR invitation" className="w-24 h-24 rounded-2xl border border-white/10" />
                  : <div className="w-24 h-24 rounded-2xl bg-white/5 animate-pulse" />
                }
                <span className="text-[10px] text-slate-600 font-bold">Scanner pour rejoindre</span>
              </div>

              {/* Code */}
              <div className="flex flex-col gap-2 min-w-0 flex-1">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Code d'invitation</p>
                <p className="font-mono font-black text-3xl sm:text-4xl text-white tracking-[0.25em] leading-none">
                  {group.inviteCode}
                </p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(group.inviteCode);
                    setCopiedCode(true);
                    setTimeout(() => setCopiedCode(false), 2000);
                  }}
                  className="self-start text-xs font-black bg-white/8 hover:bg-white/15 text-slate-200 px-4 py-2 rounded-full transition-all border border-white/10"
                >
                  {copiedCode ? '✓ Copié !' : '📋 Copier le code'}
                </button>
              </div>

              {/* Stats rapides */}
              <div className="flex sm:flex-col gap-4 sm:gap-3 sm:shrink-0 sm:text-right border-t sm:border-t-0 sm:border-l border-white/10 pt-4 sm:pt-0 sm:pl-6">
                {[
                  { v: openCount,              l: 'votes ouverts', i: '🗳️' },
                  { v: stats?.totalSpins ?? '—', l: 'spins totaux', i: '🎡' },
                  { v: members.length,          l: 'membres',       i: '👥' },
                ].map(s => (
                  <div key={s.l}>
                    <p className="font-title font-black text-white text-2xl leading-none">{s.v}</p>
                    <p className="text-[10px] text-slate-500 font-bold">{s.i} {s.l}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-[57px] z-10 border-b border-primary-900/30"
        style={{ background: 'rgba(13,6,20,0.92)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex overflow-x-auto scrollbar-none">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 py-3.5 px-3 sm:px-6 text-sm font-black border-b-2 transition-all whitespace-nowrap ${
                  tab === t.id
                    ? 'border-primary-400 text-primary-300'
                    : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}>
                <span>{t.icon}</span>
                <span className="text-xs sm:text-sm">{t.label}</span>
                {t.id === 'votes' && openCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center animate-pulse">
                    {openCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-6">

        {/* ── Onglet Votes ───────────────────────────────────────────────── */}
        {tab === 'votes' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="font-title font-black text-white text-lg">🗳️ Votes</h2>
              <button onClick={() => setShowCreate(true)}
                className="text-sm font-black bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-full shadow-btn-primary transition-all active:scale-95">
                + Nouveau vote
              </button>
            </div>

            {sessions.length === 0 ? (
              <div className="glass rounded-3xl p-12 text-center flex flex-col items-center gap-3 border-2 border-dashed border-white/10">
                <span className="text-5xl">🗳️</span>
                <p className="text-slate-200 font-black text-lg">Aucun vote en cours</p>
                <p className="text-slate-500 text-sm font-semibold">Créez un vote pour choisir quoi manger ensemble.</p>
                <button onClick={() => setShowCreate(true)}
                  className="mt-2 px-5 py-2.5 rounded-full bg-primary-600 hover:bg-primary-500 text-white font-black text-sm transition-all shadow-btn-primary">
                  Créer le premier vote
                </button>
              </div>
            ) : (
              <>
                {/* Collecte propositions */}
                {pendingSessions.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <SectionLabel icon="✏️" label="Collecte de propositions" count={pendingSessions.length} />
                    {pendingSessions.map(s => (
                      <VoteSessionCard key={s.id}
                        session={liveUpdates[s.id] ? mergeUpdate(s, liveUpdates[s.id]) : s}
                        liveUpdate={liveUpdates[s.id]}
                        currentUserId={user?.id}
                        isAdmin={isAdmin}
                        onClose={() => queryClient.invalidateQueries({ queryKey: ['group-sessions', id] })}
                      />
                    ))}
                  </div>
                )}

                {/* Votes actifs */}
                {activeSessions.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <SectionLabel icon="🔴" label="Vote en cours" count={activeSessions.length} live />
                    {activeSessions.map(s => (
                      <VoteSessionCard key={s.id}
                        session={liveUpdates[s.id] ? mergeUpdate(s, liveUpdates[s.id]) : s}
                        liveUpdate={liveUpdates[s.id]}
                        currentUserId={user?.id}
                        isAdmin={isAdmin}
                        onClose={() => queryClient.invalidateQueries({ queryKey: ['group-sessions', id] })}
                      />
                    ))}
                  </div>
                )}

                {/* Historique */}
                {closedSessions.length > 0 && (() => {
                  const hasTiebreaker = closedSessions.some(
                    s => liveUpdates[s.id]?.tiebreakerRouletteId ?? s.tiebreakerRouletteId
                  );
                  return (
                    <details className="group/hist" open={hasTiebreaker}>
                      <summary className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-400 transition-colors select-none py-2">
                        <span className="group-open/hist:rotate-90 transition-transform inline-block">▶</span>
                        Historique ({closedSessions.length})
                        {hasTiebreaker && (
                          <span className="text-primary-400">· Départage en attente !</span>
                        )}
                      </summary>
                      <div className="flex flex-col gap-3 mt-3">
                        {closedSessions.map(s => (
                          <VoteSessionCard key={s.id} session={s}
                            liveUpdate={liveUpdates[s.id]}
                            currentUserId={user?.id} isAdmin={isAdmin} />
                        ))}
                      </div>
                    </details>
                  );
                })()}
              </>
            )}
          </div>
        )}

        {/* ── Onglet Roulettes ────────────────────────────────────────────── */}
        {tab === 'roulettes' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="font-title font-black text-white text-lg">🎡 Roulettes du groupe</h2>
              <button onClick={() => setShowCreateRoulette(true)}
                className="text-sm font-black bg-accent-500 hover:bg-accent-400 text-white px-4 py-2 rounded-full shadow-btn-accent transition-all active:scale-95">
                + Nouvelle roulette
              </button>
            </div>
            {roulettes.length === 0 ? (
              <div className="glass rounded-3xl p-12 text-center flex flex-col items-center gap-3 border-2 border-dashed border-white/10">
                <span className="text-5xl">🎡</span>
                <p className="text-slate-200 font-black text-lg">Aucune roulette dans ce groupe</p>
                <p className="text-slate-500 text-sm font-semibold">Créez une roulette partagée pour choisir quoi manger.</p>
                <button onClick={() => setShowCreateRoulette(true)}
                  className="mt-2 px-5 py-2.5 rounded-full bg-accent-500 hover:bg-accent-400 text-white font-black text-sm transition-all shadow-btn-accent">
                  Créer la première roulette
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {roulettes.map((r, i) => (
                  <GroupRouletteCard
                    key={r.id}
                    roulette={r}
                    index={i}
                    currentUserId={user?.id ?? ''}
                    isAdmin={isAdmin}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Onglet Stats ────────────────────────────────────────────────── */}
        {tab === 'stats' && (
          <div className="flex flex-col gap-4">

            {/* KPI row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: '🎡', value: stats?.totalSpins ?? '—', label: 'Spins totaux'    },
                { icon: '🗳️', value: sessions.length,           label: 'Sessions vote'  },
                { icon: '👥', value: members.length,            label: 'Membres'        },
                { icon: '🏆', value: closedSessions.length,     label: 'Votes terminés' },
              ].map((kpi, i) => (
                <motion.div key={kpi.label}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="glass rounded-2xl p-4 text-center flex flex-col gap-1">
                  <span className="text-2xl">{kpi.icon}</span>
                  <p className="font-title font-black text-white text-2xl leading-none">{kpi.value}</p>
                  <p className="text-[11px] text-slate-500 font-bold">{kpi.label}</p>
                </motion.div>
              ))}
            </div>

            {/* Top aliments du groupe */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
              className="glass rounded-2xl p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="font-title font-bold text-white">Top aliments du groupe</h2>
                <span className="text-xs text-slate-500 bg-white/5 px-2 py-1 rounded-full">
                  {stats?.totalSpins ?? 0} spins
                </span>
              </div>
              <TopFoodsChart
                places={stats?.topPlaces ?? []}
                totalSpins={stats?.totalSpins ?? 0}
                emptyLabel="Pas encore de spins dans ce groupe !"
              />
            </motion.div>

            {/* Vainqueurs récents des votes */}
            {closedSessions.filter(s => liveUpdates[s.id]?.winner).length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                className="glass rounded-2xl p-5 flex flex-col gap-3">
                <h2 className="font-title font-bold text-white">Derniers gagnants</h2>
                <div className="flex flex-col gap-2">
                  {closedSessions
                    .filter(s => liveUpdates[s.id]?.winner)
                    .slice(0, 4)
                    .map(s => (
                      <div key={s.id} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/5">
                        <span className="text-secondary-400">🏆</span>
                        <span className="text-sm text-slate-200 flex-1">{liveUpdates[s.id].winner!.winningLabel}</span>
                        <span className="text-xs text-slate-500 capitalize">{s.mode.toLowerCase()}</span>
                      </div>
                    ))
                  }
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* ── Onglet Membres ──────────────────────────────────────────────── */}
        {tab === 'membres' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="font-title font-black text-white text-lg">👥 Membres</h2>
              <span className="text-xs font-bold text-slate-400 bg-white/5 px-2.5 py-1 rounded-full">
                {members.length} membre{members.length !== 1 ? 's' : ''}
              </span>
            </div>

            {isAdmin && (
              <button
                onClick={handleDeleteGroup}
                disabled={deleteGroupMutation.isPending}
                className="flex items-center gap-2 text-sm font-black text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/15 border border-red-500/20 px-4 py-2.5 rounded-full transition-all disabled:opacity-40 self-start"
              >
                🗑 {deleteGroupMutation.isPending ? 'Suppression…' : 'Supprimer le groupe'}
              </button>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {members.map((m, i) => (
                <motion.div key={m.id}
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className="glass rounded-2xl px-4 py-3.5 flex items-center gap-3">
                  {m.pictureUrl
                    ? <img src={m.pictureUrl} alt="" className="w-11 h-11 rounded-xl ring-2 ring-primary-500/20 shrink-0" />
                    : <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-500/30 to-accent-500/20 border border-primary-500/20 flex items-center justify-center font-black text-white shrink-0">
                        {m.name.charAt(0).toUpperCase()}
                      </div>
                  }
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-white truncate">{m.name}</p>
                    <p className="text-xs text-slate-500 font-semibold">
                      Depuis {new Date(m.joinedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  {m.role === 'ADMIN' && (
                    <span className="text-xs font-black text-primary-300 px-2 py-0.5 rounded-full bg-primary-500/15 border border-primary-500/25 shrink-0">
                      Admin
                    </span>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}

      </div>

      <CreateVoteSessionModal
        groupId={id}
        open={showCreateVote}
        onClose={() => setShowCreate(false)}
        onCreated={() => queryClient.invalidateQueries({ queryKey: ['group-sessions', id] })}
      />
      <CreateRouletteModal
        groupId={id}
        open={showCreateRoulette}
        onClose={() => setShowCreateRoulette(false)}
      />

      {/* ── Spin overlay — visible pour tous les membres quand quelqu'un spin ── */}
      {spinEvent && overlaySegments && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
          <p className="text-slate-400 text-sm font-semibold uppercase tracking-wider">
            {spinEvent.spunByName} a lancé la roue !
          </p>
          <div className="relative">
            <RouletteWheel
              segments={overlaySegments}
              currentAngle={overlayAngle}
              phase={overlayPhase}
              winningSegmentId={overlayPhase === 'result' ? spinEvent.winningSegmentId : undefined}
              size={300}
            />
            <SpinResultCard
              visible={showOverlayResult}
              winner={overlaySegments.find(s => s.id === spinEvent.winningSegmentId) ?? null}
              onDismiss={closeOverlay}
              spinnerName={spinEvent.spunByName}
            />
          </div>
          {!showOverlayResult && (
            <p className="text-xs text-slate-600 animate-pulse">La roue tourne…</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function SectionLabel({ icon, label, count, live }: { icon: string; label: string; count: number; live?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      {live && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
      <span>{icon}</span>
      <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">{label}</span>
      <span className="text-xs text-slate-600">({count})</span>
    </div>
  );
}

function mergeUpdate(session: VoteSession, update: LiveVoteUpdate): VoteSession {
  return {
    ...session,
    status:  update.status,
    options: update.results.map(r => ({ id: r.optionId, label: r.label })),
  };
}
