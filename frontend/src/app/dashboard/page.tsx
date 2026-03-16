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

type DashTab = 'home' | 'roulettes' | 'groups';

const TABS: { id: DashTab; icon: string; label: string }[] = [
  { id: 'home',      icon: '🏠', label: 'Accueil'   },
  { id: 'roulettes', icon: '🎡', label: 'Roulettes' },
  { id: 'groups',    icon: '👥', label: 'Groupes'   },
];

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

  const [tab, setTab]                         = useState<DashTab>('home');
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

  const firstName  = user.name?.split(' ')[0] ?? 'vous';
  const liveCount  = Object.keys(liveUpdates).length;

  return (
    <div className="min-h-dvh bg-dark-bg pb-24 md:pb-8">

      {/* ── Top bar ──────────────────────────────────────────────────────────── */}
      <div
        className="sticky top-0 z-20 backdrop-blur-xl border-b border-primary-900/40"
        style={{ background: 'linear-gradient(135deg, rgba(13,6,20,0.97), rgba(22,10,42,0.97))' }}
      >
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="font-title font-black text-xl gradient-text">🎡 Spinmylunch</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/profile')}
              className="hidden sm:flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full border border-white/10 transition-all"
            >
              {user.pictureUrl
                ? <img src={user.pictureUrl} alt="" className="w-5 h-5 rounded-full" />
                : <span>👤</span>
              }
              {firstName}
            </button>
            <button
              onClick={() => router.push('/profile')}
              className="sm:hidden w-8 h-8 rounded-full border border-white/10 bg-white/5 overflow-hidden flex items-center justify-center"
            >
              {user.pictureUrl
                ? <img src={user.pictureUrl} alt="" className="w-full h-full object-cover" />
                : <span className="text-sm">👤</span>
              }
            </button>
            <button
              onClick={logout}
              className="text-xs font-bold text-slate-500 hover:text-slate-300 px-2 py-1.5 rounded-full hover:bg-white/5 transition-all"
            >
              Déco
            </button>
          </div>
        </div>
      </div>

      {/* ── Tab bar ──────────────────────────────────────────────────────────── */}
      <div
        className="sticky top-[53px] z-10 border-b border-primary-900/30"
        style={{ background: 'rgba(13,6,20,0.92)', backdropFilter: 'blur(20px)' }}
      >
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`relative flex-1 sm:flex-none flex items-center justify-center gap-2 py-3.5 px-3 sm:px-8 text-sm font-black border-b-2 transition-all ${
                  tab === t.id
                    ? 'border-primary-400 text-primary-300'
                    : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                <span className="text-base sm:text-sm">{t.icon}</span>
                <span className="text-xs sm:text-sm">{t.label}</span>
                {t.id === 'home' && liveCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center animate-pulse">
                    {liveCount}
                  </span>
                )}
                {t.id === 'roulettes' && roulettes.length > 0 && (
                  <span className="hidden sm:flex w-4 h-4 rounded-full bg-white/10 text-slate-400 text-[9px] font-black items-center justify-center">
                    {roulettes.length}
                  </span>
                )}
                {t.id === 'groups' && groups.length > 0 && (
                  <span className="hidden sm:flex w-4 h-4 rounded-full bg-white/10 text-slate-400 text-[9px] font-black items-center justify-center">
                    {groups.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-5">

        {/* ── ACCUEIL ──────────────────────────────────────────────────────────── */}
        {tab === 'home' && (
          <div className="flex flex-col gap-6">

            {/* Hero card */}
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              className="card-hero rounded-3xl p-5 sm:p-6 relative overflow-hidden"
            >
              <div className="absolute -top-10 -right-10 w-48 h-48 bg-primary-500/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-8 -left-4 w-36 h-36 bg-secondary-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 relative">
                <div className="flex items-center gap-4 flex-1">
                  {user.pictureUrl
                    ? <img src={user.pictureUrl} alt="" className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl ring-2 ring-primary-400/50 shadow-xl shrink-0" />
                    : <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-primary-600/30 border border-primary-500/30 flex items-center justify-center text-3xl shrink-0">🍕</div>
                  }
                  <div>
                    <p className="font-title font-black text-white text-xl sm:text-2xl leading-tight">
                      Bonjour, {firstName} 👋
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="text-xs font-bold text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-full">
                        🔥 {user.streakCount} jour{user.streakCount !== 1 ? 's' : ''}
                      </span>
                      <span className="text-xs font-bold text-primary-300 bg-primary-500/10 px-2.5 py-0.5 rounded-full">
                        ⭐ Niv. {user.level}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stats rapides */}
                <div className="flex gap-6 sm:gap-8 sm:shrink-0 pl-0 sm:pl-4 border-t sm:border-t-0 sm:border-l border-white/10 pt-3 sm:pt-0 sm:pl-6">
                  {[
                    { v: roulettes.length, l: 'Roulettes', i: '🎡' },
                    { v: groups.length,    l: 'Groupes',   i: '👥' },
                    { v: user.xp,          l: 'XP total',  i: '✨' },
                  ].map(s => (
                    <div key={s.l} className="text-center">
                      <p className="font-title font-black text-white text-xl sm:text-2xl leading-none">{s.v}</p>
                      <p className="text-[10px] text-slate-500 font-bold mt-0.5">{s.i} {s.l}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 relative">
                <XpBar xp={user.xp} level={user.level} />
              </div>
            </motion.div>

            {/* Quick actions */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: '🎡', label: 'Nouvelle\nroulette',  action: () => setShowCreate(true),      bg: 'from-accent-500/25 to-accent-700/10  border-accent-500/25  hover:border-accent-400/50'   },
                { icon: '👥', label: 'Créer un\ngroupe',    action: () => setShowCreateGroup(true), bg: 'from-primary-600/25 to-primary-800/10 border-primary-500/25 hover:border-primary-400/50' },
                { icon: '🔗', label: 'Rejoindre\nun groupe', action: () => { setTab('groups'); setTimeout(() => setShowJoin(true), 100); }, bg: 'from-emerald-600/25 to-emerald-800/10 border-emerald-500/25 hover:border-emerald-400/50' },
                { icon: '📊', label: 'Mon\nprofil',          action: () => router.push('/profile'),  bg: 'from-secondary-500/25 to-secondary-700/10 border-secondary-500/25 hover:border-secondary-400/50' },
              ].map((item, i) => (
                <motion.button
                  key={item.label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={item.action}
                  className={`glass rounded-2xl p-4 flex flex-col items-center gap-2 text-center bg-gradient-to-br border transition-all ${item.bg}`}
                >
                  <span className="text-2xl">{item.icon}</span>
                  <span className="text-xs font-black text-white leading-tight whitespace-pre-line">{item.label}</span>
                </motion.button>
              ))}
            </div>

            {/* Roulettes récentes */}
            {roulettesLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {[1,2,3].map(i => <div key={i} className="h-20 glass rounded-2xl animate-pulse" />)}
              </div>
            ) : roulettes.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-title font-black text-white">🎡 Roulettes récentes</h2>
                  <button
                    onClick={() => setTab('roulettes')}
                    className="text-xs font-black text-primary-400 hover:text-primary-300 bg-primary-500/10 px-3 py-1.5 rounded-full transition-all"
                  >
                    Tout voir ({roulettes.length}) →
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {roulettes.slice(0, 6).map((r, i) => <RouletteCard key={r.id} roulette={r} index={i} />)}
                </div>
              </section>
            )}

            {/* Groupes récents */}
            {groups.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-title font-black text-white">👥 Mes groupes</h2>
                  <button
                    onClick={() => setTab('groups')}
                    className="text-xs font-black text-primary-400 hover:text-primary-300 bg-primary-500/10 px-3 py-1.5 rounded-full transition-all"
                  >
                    Tout voir ({groups.length}) →
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {groups.slice(0, 4).map((g, i) => <GroupCard key={g.id} group={g} index={i} />)}
                </div>
              </section>
            )}

            {/* Votes live */}
            {liveCount > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                  <h2 className="font-title font-black text-white">Votes en cours</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

            {/* Empty state */}
            {roulettes.length === 0 && groups.length === 0 && (
              <div className="glass rounded-3xl p-12 text-center flex flex-col items-center gap-4 border-2 border-dashed border-primary-500/20">
                <div className="text-6xl animate-float">🎡</div>
                <h3 className="font-title font-black text-white text-xl">Bienvenue sur Spinmylunch !</h3>
                <p className="text-slate-400 text-sm max-w-xs font-semibold">
                  Créez votre première roulette ou rejoignez un groupe.
                </p>
                <div className="flex flex-wrap gap-3 justify-center">
                  <button
                    onClick={() => setShowCreate(true)}
                    className="px-5 py-2.5 rounded-full bg-accent-500 hover:bg-accent-400 text-white font-black text-sm shadow-btn-accent transition-all"
                  >
                    🎡 Créer une roulette
                  </button>
                  <button
                    onClick={() => setShowCreateGroup(true)}
                    className="px-5 py-2.5 rounded-full bg-primary-600 hover:bg-primary-500 text-white font-black text-sm shadow-btn-primary transition-all"
                  >
                    👥 Créer un groupe
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── ROULETTES ──────────────────────────────────────────────────────── */}
        {tab === 'roulettes' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="font-title font-black text-white text-lg">🎡 Mes roulettes</h2>
              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-1 text-sm font-black bg-accent-500 hover:bg-accent-400 text-white px-5 py-2 rounded-full shadow-btn-accent transition-all active:scale-95"
              >
                + Créer
              </button>
            </div>

            {roulettesLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {[1,2,3,4,5,6].map(i => <div key={i} className="h-20 glass rounded-2xl animate-pulse" />)}
              </div>
            ) : roulettes.length === 0 ? (
              <div
                onClick={() => setShowCreate(true)}
                className="glass rounded-3xl p-16 text-center cursor-pointer hover:border-accent-500/40 transition-all group border-2 border-dashed border-white/10"
              >
                <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">🎡</div>
                <p className="text-slate-200 font-black text-lg">Créez votre première roulette</p>
                <p className="text-slate-500 text-sm mt-2 font-semibold">Cliquez pour commencer</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {roulettes.map((r, i) => <RouletteCard key={r.id} roulette={r} index={i} />)}
              </div>
            )}
          </div>
        )}

        {/* ── GROUPES ────────────────────────────────────────────────────────── */}
        {tab === 'groups' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="font-title font-black text-white text-lg">👥 Mes groupes</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowCreateGroup(true)}
                  className="text-sm font-black bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-full shadow-btn-primary transition-all active:scale-95"
                >
                  + Créer
                </button>
                <button
                  onClick={() => setShowJoin(s => !s)}
                  className="text-sm font-black bg-white/10 hover:bg-white/15 text-white px-4 py-2 rounded-full border border-white/10 transition-all active:scale-95"
                >
                  🔗 Rejoindre
                </button>
              </div>
            </div>

            {showJoin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="glass rounded-2xl p-4 flex gap-2 overflow-hidden border border-primary-500/30"
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
              <div className="glass rounded-3xl p-16 text-center border-2 border-dashed border-white/10">
                <div className="text-6xl mb-4">👥</div>
                <p className="text-slate-200 font-black text-lg">Aucun groupe</p>
                <p className="text-slate-500 text-sm mt-2 font-semibold">Créez ou rejoignez un groupe pour voter ensemble</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {groups.map((g, i) => <GroupCard key={g.id} group={g} index={i} />)}
              </div>
            )}
          </div>
        )}

      </div>

      <CreateRouletteModal open={showCreate} onClose={() => setShowCreate(false)} />
      <CreateGroupModal open={showCreateGroup} onClose={() => setShowCreateGroup(false)} />

      {/* Bottom nav mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 md:hidden border-t border-primary-900/40"
        style={{ background: 'rgba(13,6,20,0.97)', backdropFilter: 'blur(20px)' }}>
        <div className="flex items-stretch justify-around max-w-sm mx-auto px-2 py-1">
          {[
            { id: 'home'      as DashTab, icon: '🏠', label: 'Accueil'   },
            { id: 'roulettes' as DashTab, icon: '🎡', label: 'Roulettes' },
            { id: 'groups'    as DashTab, icon: '👥', label: 'Groupes'   },
            { icon: '👤', label: 'Profil', path: '/profile' } as const,
          ].map(item => {
            const isActive = 'id' in item && tab === item.id;
            return (
              <button
                key={item.label}
                onClick={() => {
                  if ('id' in item) setTab(item.id as DashTab);
                  else router.push(item.path);
                }}
                className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-2xl transition-all ${
                  isActive ? 'text-primary-300 bg-primary-500/12' : 'text-slate-600 hover:text-slate-400'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className={`text-[10px] font-black ${isActive ? 'text-primary-300' : 'text-slate-600'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      <footer className="max-w-5xl mx-auto px-4 mt-6 text-center hidden md:block pb-4">
        <button onClick={() => router.push('/legal')} className="text-xs text-slate-600 hover:text-slate-400 transition-colors font-semibold">
          Mentions légales & RGPD
        </button>
      </footer>
    </div>
  );
}

// ─── Group card (liste) ────────────────────────────────────────────────────────

function GroupCard({ group, index }: { group: Group; index: number }) {
  const router    = useRouter();
  const [copied, setCopied] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="glass rounded-2xl px-4 py-3.5 flex items-center justify-between gap-3 hover:ring-1 hover:ring-primary-500/30 transition-all cursor-pointer group"
      onClick={() => router.push(`/groups/${group.id}`)}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600/30 to-primary-800/20 border border-primary-500/20 flex items-center justify-center font-black text-white text-sm shrink-0 group-hover:scale-105 transition-transform">
          {group.name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="font-title font-black text-white truncate">{group.name}</p>
          <p className="text-xs text-slate-500 font-mono font-bold mt-0.5">{group.inviteCode}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={e => {
            e.stopPropagation();
            navigator.clipboard.writeText(group.inviteCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="text-xs font-bold text-slate-500 hover:text-white px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 transition-all"
        >
          {copied ? '✓' : '📋'}
        </button>
        <span className="text-xs font-black text-primary-300 bg-primary-600/20 px-2.5 py-1 rounded-lg group-hover:bg-primary-600/35 transition-all">
          Ouvrir →
        </span>
      </div>
    </motion.div>
  );
}

