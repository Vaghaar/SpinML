'use client';

import { useEffect }           from 'react';
import { useRouter }           from 'next/navigation';
import { motion }              from 'framer-motion';
import { useQuery }            from '@tanstack/react-query';
import { profileApi, authApi, statsApi } from '@/lib/api';
import { useAuth }             from '@/hooks/useAuth';
import { LevelBadge }          from '@/components/gamification/LevelBadge';
import { StreakDisplay }        from '@/components/gamification/StreakDisplay';
import { BadgeCard }           from '@/components/gamification/BadgeCard';
import { TopFoodsChart }       from '@/components/charts/TopFoodsChart';
import { toast }               from '@/components/ui/Toast';
import type { ProfileData }    from '@/types/gamification';
import type { StatsResponse }  from '@/types';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, logout, deleteAccount, exportData } = useAuth();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/');
  }, [authLoading, isAuthenticated, router]);

  const { data: profile, isLoading } = useQuery<ProfileData>({
    queryKey: ['profile'],
    queryFn:  async () => { const { data } = await profileApi.getProfile(); return data; },
    enabled:  isAuthenticated,
  });

  const { data: stats } = useQuery<StatsResponse>({
    queryKey: ['stats-me'],
    queryFn:  async () => { const { data } = await statsApi.myStats(); return data; },
    enabled:  isAuthenticated,
  });

  if (authLoading || isLoading || !profile) {
    return (
      <div className="min-h-dvh bg-dark-bg flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-primary-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  const unlockedCount = profile.badges.filter(b => b.unlocked).length;
  const xpToNext      = (profile.level + 1) * 100;
  const xpBase        = profile.level * 100;
  const xpProgress    = Math.min(100, ((profile.xp - xpBase) / (xpToNext - xpBase)) * 100);

  return (
    <div className="min-h-dvh bg-dark-bg pb-24 md:pb-8">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div
        className="sticky top-0 z-20 backdrop-blur-xl border-b border-primary-900/40"
        style={{ background: 'linear-gradient(135deg, rgba(13,6,20,0.97), rgba(22,10,42,0.97))' }}
      >
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-slate-400 hover:text-white transition-all text-sm font-bold bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full"
          >
            ← Retour
          </button>
          <span className="font-title font-black text-white flex-1 text-lg">Mon profil</span>
          <button
            onClick={logout}
            className="text-xs font-bold text-slate-500 hover:text-slate-300 px-3 py-1.5 rounded-full hover:bg-white/5 transition-all"
          >
            Déconnexion
          </button>
        </div>
      </div>

      {/* ── Hero banner ────────────────────────────────────────────────────── */}
      <div className="relative h-28 sm:h-36 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.4), rgba(45,27,105,0.6), rgba(255,107,53,0.2))' }}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(167,139,250,0.15),transparent_60%)]" />
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-dark-bg to-transparent" />
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-14 sm:-mt-16 flex flex-col gap-6">

        {/* ── Avatar + identité ──────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-end gap-4"
        >
          <div className="flex items-end gap-4">
            {profile.pictureUrl
              ? <img src={profile.pictureUrl} alt=""
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl ring-4 ring-dark-bg shadow-2xl" />
              : <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-primary-500/20 flex items-center justify-center text-4xl ring-4 ring-dark-bg shadow-2xl">
                  🍕
                </div>
            }
            <div className="pb-1">
              <h1 className="font-title text-xl sm:text-2xl font-black text-white">{profile.name}</h1>
              <p className="text-xs text-slate-400 font-semibold">{profile.email}</p>
            </div>
          </div>
          {/* XP / level pill */}
          <div className="sm:ml-auto flex items-center gap-2">
            <span className="text-sm font-black text-primary-300 bg-primary-500/15 border border-primary-500/25 px-3 py-1.5 rounded-full">
              ⭐ Niv. {profile.level}
            </span>
            <span className="text-sm font-black text-amber-400 bg-amber-400/10 px-3 py-1.5 rounded-full">
              🔥 {profile.streakCount}j
            </span>
          </div>
        </motion.div>

        {/* ── XP bar ──────────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.05 }}
          className="glass rounded-2xl p-4 sm:p-5 flex flex-col gap-3"
        >
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="font-title font-black text-white text-2xl">Niv. {profile.level}</span>
              <span className="text-xs font-bold text-slate-400 bg-white/5 px-2 py-0.5 rounded-full">
                {profile.xp} XP
              </span>
            </div>
            <span className="text-xs text-slate-500 font-semibold">
              {xpToNext - profile.xp} XP avant le niveau {profile.level + 1}
            </span>
          </div>
          <div className="h-3 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-primary-500 to-secondary-500"
              initial={{ width: 0 }}
              animate={{ width: `${xpProgress}%` }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
            />
          </div>
        </motion.div>

        {/* ── Stats grid 4-colonnes ───────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        >
          {[
            { label: 'Spins',   value: profile.totalSpins,  icon: '🎡', sub: 'roulettes lancées' },
            { label: 'Votes',   value: profile.totalVotes,  icon: '🗳️', sub: 'votes participés'  },
            { label: 'Streak',  value: profile.streakCount, icon: '🔥', sub: 'jours consécutifs' },
            { label: 'Badges',  value: `${unlockedCount}/${profile.badges.length}`, icon: '🏅', sub: 'débloqués' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              className="glass rounded-2xl p-4 sm:p-5 flex flex-col gap-1"
            >
              <span className="text-2xl">{stat.icon}</span>
              <p className="font-title font-black text-white text-2xl sm:text-3xl leading-none mt-1">{stat.value}</p>
              <p className="text-xs text-slate-500 font-semibold">{stat.sub}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* ── Streak ──────────────────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
          <StreakDisplay streak={profile.streakCount} />
        </motion.div>

        {/* ── Top aliments + Badges (2-col desktop) ───────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="glass rounded-2xl p-5 flex flex-col gap-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-title font-black text-white">🍽️ Top aliments</h2>
              <span className="text-xs font-bold text-slate-500 bg-white/5 px-2 py-1 rounded-full">
                {stats?.totalSpins ?? 0} spins
              </span>
            </div>
            <TopFoodsChart
              places={stats?.topPlaces ?? []}
              totalSpins={stats?.totalSpins ?? 0}
            />
          </motion.section>

          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-title font-black text-white">🏅 Badges</h2>
              <span className="text-xs font-bold text-slate-500 bg-white/5 px-2 py-1 rounded-full">
                {unlockedCount} / {profile.badges.length}
              </span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {profile.badges.map((badge, i) => (
                <BadgeCard key={badge.code} badge={badge} index={i} />
              ))}
            </div>
          </motion.section>
        </div>

        {/* ── RGPD ────────────────────────────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-2xl p-5 flex flex-col gap-3"
        >
          <h2 className="font-title font-black text-white text-sm">🔐 Données personnelles</h2>
          <p className="text-xs text-slate-500 font-semibold">
            Conformément au RGPD, vous pouvez exporter ou supprimer vos données.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={exportData}
              className="flex-1 min-w-[120px] py-2.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 text-sm font-black transition-all border border-white/10"
            >
              📦 Exporter
            </button>
            <button
              onClick={() => {
                if (confirm('Supprimer définitivement votre compte et toutes vos données ?')) {
                  deleteAccount();
                }
              }}
              className="flex-1 min-w-[120px] py-2.5 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-black transition-all border border-red-500/20"
            >
              🗑 Supprimer le compte
            </button>
          </div>
        </motion.section>

      </div>

      {/* Bottom nav mobile */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-30 md:hidden border-t border-primary-900/40"
        style={{ background: 'rgba(13,6,20,0.97)', backdropFilter: 'blur(20px)' }}
      >
        <div className="flex items-stretch justify-around max-w-sm mx-auto px-2 py-1">
          {[
            { icon: '🏠', label: 'Accueil',   action: () => router.push('/dashboard') },
            { icon: '🎡', label: 'Roulettes', action: () => router.push('/dashboard') },
            { icon: '👤', label: 'Profil',    action: () => {}, active: true          },
          ].map(item => (
            <button
              key={item.label}
              onClick={item.action}
              className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-2xl transition-all ${
                item.active ? 'text-primary-300 bg-primary-500/12' : 'text-slate-600 hover:text-slate-400'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className={`text-[10px] font-black ${item.active ? 'text-primary-300' : 'text-slate-600'}`}>
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
