'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter }              from 'next/navigation';
import { motion }                 from 'framer-motion';
import { useQuery }               from '@tanstack/react-query';
import { rouletteApi, groupApi }  from '@/lib/api';
import { useAuth }                from '@/hooks/useAuth';
import { useGroupSocket }         from '@/hooks/useGroupSocket';
import { RouletteCard }           from '@/components/roulette/RouletteCard';
import { CreateRouletteModal }    from '@/components/roulette/CreateRouletteModal';
import { CreateGroupModal }       from '@/components/group/CreateGroupModal';
import { VoteSessionCard }        from '@/components/vote/VoteSessionCard';
import { toast }                  from '@/components/ui/Toast';
import type { Roulette, Group, LiveVoteUpdate } from '@/types';

// ─── XP bar ───────────────────────────────────────────────────────────────────

function XpBar({ xp, level }: { xp: number; level: number }) {
  const base     = level * 100;
  const next     = (level + 1) * 100;
  const progress = Math.min(100, ((xp - base) / (next - base)) * 100);
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-bold text-primary-300 shrink-0">Niv.&nbsp;{level}</span>
      <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-primary-500 to-secondary-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        />
      </div>
      <span className="text-xs text-slate-400 shrink-0 font-bold">{xp}&nbsp;XP</span>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();

  const [showCreate, setShowCreate]           = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [activeGroupId, setActiveGroupId]     = useState<string | null>(null);
  const [liveUpdates, setLiveUpdates]         = useState<Record<string, LiveVoteUpdate>>({});
  const [joinCode, setJoinCode]               = useState('');
  const [showJoin, setShowJoin]               = useState(false);
  const [joiningGroup, setJoiningGroup]       = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      sessionStorage.setItem('redirectAfterLogin', window.location.pathname + window.location.search);
      router.replace('/');
    }
  }, [authLoading, isAuthenticated, router]);

  const { data: roulettes = [], isLoading: roulettesLoading } = useQuery<Roulette[]>({
    queryKey: ['my-roulettes'],
    queryFn:  async () => { const { data } = await rouletteApi.getMyRoulettes(); return data; },
    enabled:  isAuthenticated,
  });

  const { data: groups = [], refetch: refetchGroups } = useQuery<Group[]>({
    queryKey: ['my-groups'],
    queryFn:  async () => { const { data } = await groupApi.getMyGroups(); return data; },
    enabled:  isAuthenticated,
  });

  const handleVoteUpdate = useCallback((update: LiveVoteUpdate) => {
    setLiveUpdates(prev => ({ ...prev, [update.sessionId]: update }));
  }, []);

  useGroupSocket({ groupId: activeGroupId, onVoteUpdate: handleVoteUpdate });

  const handleJoin = useCallback(async () => {
    if (!joinCode.trim()) return;
    setJoiningGroup(true);
    try {
      await groupApi.join(joinCode.trim().toUpperCase());
      toast.success('Groupe rejoint !');
      refetchGroups();
      setJoinCode('');
      setShowJoin(false);
    } catch {
      toast.error('Code invalide', "Vérifiez le code d'invitation.");
    } finally {
      setJoiningGroup(false);
    }
  }, [joinCode, refetchGroups]);

  if (authLoading || !user) {
    return (
      <div className="min-h-dvh bg-dark-bg flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-primary-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  const firstName = user.name?.split(' ')[0] ?? 'vous';

  return (
    <div className="min-h-dvh bg-dark-bg pb-24">

      {/* ── Top bar ──────────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 backdrop-blur-xl border-b border-primary-900/40"
        style={{ background: 'linear-gradient(135deg, rgba(13,6,20,0.96), rgba(22,10,42,0.96))' }}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="font-title font-black text-xl gradient-text">🎡 Spinmylunch</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/profile')}
              className="text-xs font-bold text-slate-300 hover:text-white transition-colors bg-white/8 hover:bg-white/12 px-3 py-1.5 rounded-full border border-white/10"
            >
              👤 Profil
            </button>
            <button
              onClick={logout}
              className="text-xs font-bold text-slate-500 hover:text-slate-300 transition-colors px-2 py-1.5 rounded-full"
            >
              Déco
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-5 flex flex-col gap-6">

        {/* ── User hero card ────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-hero rounded-3xl p-5 relative overflow-hidden"
        >
          {/* Decorative glow */}
          <div className="absolute -top-8 -right-8 w-40 h-40 bg-primary-500/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-8 -left-4 w-32 h-32 bg-secondary-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center gap-4 mb-4 relative">
            {user.pictureUrl
              ? <img src={user.pictureUrl} alt="" className="w-14 h-14 rounded-2xl ring-2 ring-primary-400/50 shadow-lg" />
              : <div className="w-14 h-14 rounded-2xl bg-primary-600/30 border border-primary-500/30 flex items-center justify-center text-2xl">🍕</div>
            }
            <div>
              <p className="font-title font-black text-white text-lg leading-tight">
                Bonjour, {firstName} 👋
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">
                  🔥 {user.streakCount} jour{user.streakCount !== 1 ? 's' : ''}
                </span>
                <span className="text-xs font-bold text-primary-300 bg-primary-500/10 px-2 py-0.5 rounded-full">
                  Niv. {user.level}
                </span>
              </div>
            </div>
          </div>
          <XpBar xp={user.xp} level={user.level} />
        </motion.div>

        {/* ── Roulettes ─────────────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-title font-black text-white text-lg">🎡 Mes roulettes</h2>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1 text-sm font-black bg-accent-500 hover:bg-accent-400 text-white px-4 py-2 rounded-full shadow-btn-accent transition-all active:scale-95"
            >
              + Créer
            </button>
          </div>

          {roulettesLoading ? (
            <div className="flex flex-col gap-2">
              {[1, 2].map(i => (
                <div key={i} className="h-20 glass rounded-3xl animate-pulse" />
              ))}
            </div>
          ) : roulettes.length === 0 ? (
            <div
              onClick={() => setShowCreate(true)}
              className="glass rounded-3xl p-8 text-center cursor-pointer hover:border-accent-500/40 hover:bg-accent-500/5 transition-all group border-2 border-dashed border-white/10"
            >
              <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">🎡</div>
              <p className="text-slate-200 font-black text-sm">Créez votre première roulette</p>
              <p className="text-slate-500 text-xs mt-1 font-semibold">Cliquez pour commencer</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {roulettes.map((r, i) => <RouletteCard key={r.id} roulette={r} index={i} />)}
            </div>
          )}
        </section>

        {/* ── Groupes ───────────────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-title font-black text-white text-lg">👥 Groupes</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCreateGroup(true)}
                className="text-sm font-black bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-full shadow-btn-primary transition-all active:scale-95"
              >
                + Créer
              </button>
              <button
                onClick={() => setShowJoin(s => !s)}
                className="text-sm font-black bg-white/10 hover:bg-white/15 text-white px-4 py-2 rounded-full transition-all active:scale-95 border border-white/10"
              >
                🔗 Rejoindre
              </button>
            </div>
          </div>

          {showJoin && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="glass rounded-2xl p-4 mb-3 flex gap-2 overflow-hidden border border-primary-500/30"
            >
              <input
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && handleJoin()}
                placeholder="Code d'invitation (ex: AB3DEFGH)"
                maxLength={10}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-primary-500 text-sm font-mono font-bold"
              />
              <button
                onClick={handleJoin}
                disabled={joiningGroup || joinCode.length < 4}
                className="bg-primary-600 hover:bg-primary-500 text-white px-5 py-2 rounded-xl text-sm font-black disabled:opacity-40 transition-colors"
              >
                {joiningGroup ? '…' : 'Go !'}
              </button>
            </motion.div>
          )}

          {groups.length === 0 ? (
            <div className="glass rounded-3xl p-6 text-center border-2 border-dashed border-white/10">
              <div className="text-4xl mb-2">👥</div>
              <p className="text-slate-400 text-sm font-bold">Créez un groupe ou rejoignez-en un avec un code</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {groups.map((g, i) => (
                <GroupRow
                  key={g.id}
                  group={g}
                  index={i}
                  isActive={activeGroupId === g.id}
                  onSelect={() => setActiveGroupId(prev => prev === g.id ? null : g.id)}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── Live vote sessions ─────────────────────────────────────────────── */}
        {Object.keys(liveUpdates).length > 0 && (
          <section>
            <h2 className="font-title font-black text-white text-lg mb-3">🗳️ Votes en cours</h2>
            <div className="flex flex-col gap-3">
              {Object.values(liveUpdates).map(update => (
                <VoteSessionCard
                  key={update.sessionId}
                  session={{
                    id:            update.sessionId,
                    groupId:       update.groupId,
                    mode:          update.mode,
                    status:        update.status,
                    quorumPercent: update.quorumPercent,
                    options:       update.results.map(r => ({ id: r.optionId, label: r.label })),
                    createdAt:     update.updatedAt,
                  }}
                  liveUpdate={update}
                  currentUserId={user.id}
                />
              ))}
            </div>
          </section>
        )}

      </div>

      <CreateRouletteModal open={showCreate} onClose={() => setShowCreate(false)} />
      <CreateGroupModal open={showCreateGroup} onClose={() => setShowCreateGroup(false)} />

      <footer className="max-w-2xl mx-auto px-4 mt-6 text-center">
        <button
          onClick={() => router.push('/legal')}
          className="text-xs text-slate-600 hover:text-slate-400 transition-colors font-semibold"
        >
          Mentions légales & RGPD
        </button>
      </footer>
    </div>
  );
}

// ─── Group row ────────────────────────────────────────────────────────────────

function GroupRow({ group, index, isActive, onSelect }: {
  group: Group; index: number; isActive: boolean; onSelect: () => void;
}) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onSelect}
      className={`glass rounded-2xl px-4 py-3.5 cursor-pointer transition-all ${
        isActive
          ? 'ring-2 ring-primary-500/60 bg-primary-500/5'
          : 'hover:ring-1 hover:ring-primary-500/30 hover:bg-primary-500/3'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black transition-colors ${
            isActive ? 'bg-primary-600/40 text-primary-300' : 'bg-white/8 text-slate-300'
          }`}>
            {group.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-title font-black text-white">{group.name}</p>
            <p className="text-xs text-slate-500 font-mono font-bold mt-0.5">{group.inviteCode}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isActive && <span className="w-2 h-2 rounded-full bg-primary-400 animate-pulse" />}
          <button
            onClick={e => {
              e.stopPropagation();
              navigator.clipboard.writeText(group.inviteCode);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="text-xs font-bold text-slate-400 hover:text-white transition-colors px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10"
          >
            {copied ? '✓' : '📋'}
          </button>
          <button
            onClick={e => { e.stopPropagation(); router.push(`/groups/${group.id}`); }}
            className="text-xs font-black text-primary-300 hover:text-white transition-colors px-3 py-1.5 rounded-lg bg-primary-600/20 hover:bg-primary-600/35"
          >
            Ouvrir →
          </button>
        </div>
      </div>
    </motion.div>
  );
}
