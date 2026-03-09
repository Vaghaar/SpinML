'use client';

import { useState, useCallback, useEffect } from 'react';
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
import { TopFoodsChart }                    from '@/components/charts/TopFoodsChart';
import type { GroupMember, VoteSession, LiveVoteUpdate, StatsResponse, Roulette, RouletteUpdateMessage, SpinSyncMessage } from '@/types';

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

  const [tab, setTab]                   = useState<Tab>('votes');
  const [showCreateVote, setShowCreate] = useState(false);
  const [showCreateRoulette, setShowCreateRoulette] = useState(false);
  const [qrDataUrl, setQrDataUrl]       = useState('');
  const [copiedCode, setCopiedCode]     = useState(false);
  const [liveUpdates, setLiveUpdates]   = useState<Record<string, LiveVoteUpdate>>({});

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
    toast.success(`${msg.spunByName} a spinné : ${msg.winningLabel} 🎡`);
  }, []);

  useGroupSocket({
    groupId: id,
    onVoteUpdate:     handleVoteUpdate,
    onRouletteUpdate: handleRouletteUpdate,
    onSpinSync:       handleSpinSync,
  });

  // ─── QR code ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!group?.inviteCode) return;
    QRCode.toDataURL(group.inviteCode, {
      width: 200, margin: 2,
      color: { dark: '#e2e8f0', light: '#0f172a' },
    }).then(setQrDataUrl).catch(() => {});
  }, [group?.inviteCode]);

  // ─── Dérivé ───────────────────────────────────────────────────────────────

  const isAdmin         = members.some(m => m.userId === user?.id && m.role === 'ADMIN');
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
      <div className="sticky top-0 z-10 bg-dark-bg/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => router.back()}
            className="text-slate-400 hover:text-white transition-colors text-lg leading-none">
            ←
          </button>
          <span className="font-title font-bold text-white truncate flex-1">{group.name}</span>
          <span className="text-xs text-slate-500 bg-white/5 px-2 py-1 rounded-full shrink-0">
            {members.length} membre{members.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Hero invite card */}
      <div className="relative bg-gradient-to-br from-accent-600/20 via-primary-600/10 to-transparent">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-5 flex items-center gap-5">

            {/* QR */}
            <div className="shrink-0 flex flex-col items-center gap-1.5">
              {qrDataUrl
                ? <img src={qrDataUrl} alt="QR invitation" className="w-24 h-24 rounded-xl" />
                : <div className="w-24 h-24 rounded-xl bg-white/5 animate-pulse" />
              }
              <span className="text-[10px] text-slate-600">Scanner pour rejoindre</span>
            </div>

            {/* Code + actions */}
            <div className="flex flex-col gap-2 min-w-0 flex-1">
              <p className="text-xs text-slate-400 uppercase tracking-wider">Code d'invitation</p>
              <p className="font-mono font-black text-3xl text-white tracking-[0.2em] leading-none">
                {group.inviteCode}
              </p>
              <div className="flex gap-2 mt-1">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(group.inviteCode);
                    setCopiedCode(true);
                    setTimeout(() => setCopiedCode(false), 2000);
                  }}
                  className="text-xs bg-white/5 hover:bg-white/10 text-slate-300 px-3 py-1.5 rounded-lg transition-colors font-mono"
                >
                  {copiedCode ? '✓ Copié' : '📋 Copier'}
                </button>
              </div>
            </div>

            {/* Mini stats verticales */}
            <div className="shrink-0 flex flex-col gap-2 text-right">
              <div>
                <p className="font-title font-black text-white text-xl leading-none">{openCount}</p>
                <p className="text-[10px] text-slate-500">votes ouverts</p>
              </div>
              <div>
                <p className="font-title font-black text-white text-xl leading-none">{stats?.totalSpins ?? '—'}</p>
                <p className="text-[10px] text-slate-500">spins</p>
              </div>
            </div>

          </motion.div>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-[53px] z-10 bg-dark-bg/90 backdrop-blur-md border-b border-white/5">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3.5 text-sm font-semibold border-b-2 transition-all ${
                  tab === t.id
                    ? 'border-primary-500 text-primary-400'
                    : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}>
                <span>{t.icon}</span>
                <span>{t.label}</span>
                {t.id === 'votes' && openCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-primary-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {openCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-6">

        {/* ── Onglet Votes ───────────────────────────────────────────────── */}
        {tab === 'votes' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="font-title font-bold text-white">Votes</h2>
              <button onClick={() => setShowCreate(true)}
                className="text-sm bg-primary-500/20 hover:bg-primary-500/30 text-primary-400 px-3 py-1.5 rounded-xl transition-colors font-semibold">
                + Nouveau vote
              </button>
            </div>

            {sessions.length === 0 ? (
              <div className="glass rounded-2xl p-10 text-center flex flex-col items-center gap-3">
                <span className="text-5xl">🗳️</span>
                <p className="text-slate-300 font-semibold">Aucun vote en cours</p>
                <p className="text-slate-500 text-sm">Créez un vote pour choisir quoi manger ensemble.</p>
                <button onClick={() => setShowCreate(true)}
                  className="mt-2 px-5 py-2.5 rounded-xl bg-primary-500/20 hover:bg-primary-500/30 text-primary-400 font-bold text-sm transition-colors">
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
                {closedSessions.length > 0 && (
                  <details className="group/hist">
                    <summary className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-400 transition-colors select-none py-2">
                      <span className="group-open/hist:rotate-90 transition-transform inline-block">▶</span>
                      Historique ({closedSessions.length})
                    </summary>
                    <div className="flex flex-col gap-3 mt-3">
                      {closedSessions.map(s => (
                        <VoteSessionCard key={s.id} session={s}
                          liveUpdate={liveUpdates[s.id]}
                          currentUserId={user?.id} isAdmin={isAdmin} />
                      ))}
                    </div>
                  </details>
                )}
              </>
            )}
          </div>
        )}

        {/* ── Onglet Roulettes ────────────────────────────────────────────── */}
        {tab === 'roulettes' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="font-title font-bold text-white">Roulettes du groupe</h2>
              <button onClick={() => setShowCreateRoulette(true)}
                className="text-sm bg-primary-500/20 hover:bg-primary-500/30 text-primary-400 px-3 py-1.5 rounded-xl transition-colors font-semibold">
                + Nouvelle roulette
              </button>
            </div>
            {roulettes.length === 0 ? (
              <div className="glass rounded-2xl p-10 text-center flex flex-col items-center gap-3">
                <span className="text-5xl">🎡</span>
                <p className="text-slate-300 font-semibold">Aucune roulette dans ce groupe</p>
                <p className="text-slate-500 text-sm">Créez une roulette partagée pour choisir quoi manger.</p>
                <button onClick={() => setShowCreateRoulette(true)}
                  className="mt-2 px-5 py-2.5 rounded-xl bg-primary-500/20 hover:bg-primary-500/30 text-primary-400 font-bold text-sm transition-colors">
                  Créer la première roulette
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
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
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: '🎡', value: stats?.totalSpins ?? '—',     label: 'Spins totaux'     },
                { icon: '🗳️', value: sessions.length,              label: 'Sessions de vote'  },
                { icon: '👥', value: members.length,               label: 'Membres'           },
              ].map((kpi, i) => (
                <motion.div key={kpi.label}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="glass rounded-2xl p-4 text-center flex flex-col gap-1">
                  <span className="text-2xl">{kpi.icon}</span>
                  <p className="font-title font-black text-white text-2xl leading-none">{kpi.value}</p>
                  <p className="text-[11px] text-slate-500">{kpi.label}</p>
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
          <div className="flex flex-col gap-3">
            <p className="text-xs text-slate-500 uppercase tracking-wider">
              {members.length} membre{members.length !== 1 ? 's' : ''}
            </p>

            {isAdmin && (
              <button
                onClick={handleDeleteGroup}
                disabled={deleteGroupMutation.isPending}
                className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/15 border border-red-500/20 px-4 py-2.5 rounded-xl transition-colors disabled:opacity-40 self-start"
              >
                🗑 {deleteGroupMutation.isPending ? 'Suppression…' : 'Supprimer le groupe'}
              </button>
            )}

            {members.map((m, i) => (
              <motion.div key={m.id}
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="glass rounded-xl px-4 py-3 flex items-center gap-3">
                {m.pictureUrl
                  ? <img src={m.pictureUrl} alt="" className="w-10 h-10 rounded-full ring-2 ring-white/10" />
                  : <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500/30 to-secondary-500/30 flex items-center justify-center text-base font-bold text-white">
                      {m.name.charAt(0).toUpperCase()}
                    </div>
                }
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{m.name}</p>
                  <p className="text-xs text-slate-500">
                    Membre depuis {new Date(m.joinedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
                {m.role === 'ADMIN' && (
                  <span className="text-xs text-accent-400 font-bold px-2 py-0.5 rounded-full bg-accent-500/10 border border-accent-500/20">
                    Admin
                  </span>
                )}
              </motion.div>
            ))}
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
