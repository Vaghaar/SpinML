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
        <div className="w-10 h-10 rounded-full border-4 border-primary-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  const unlockedCount = profile.badges.filter(b => b.unlocked).length;
  const xpToNext      = (profile.level + 1) * 100;
  const xpBase        = profile.level * 100;
  const xpProgress    = Math.min(100, ((profile.xp - xpBase) / (xpToNext - xpBase)) * 100);

  return (
    <div className="min-h-dvh bg-dark-bg pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-dark-bg/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => router.push('/dashboard')}
            className="text-slate-400 hover:text-white transition-colors text-lg leading-none">
            ←
          </button>
          <span className="font-title font-bold text-white flex-1">Mon profil</span>
        </div>
      </div>

      {/* Hero gradient banner */}
      <div className="relative h-32 bg-gradient-to-br from-primary-600/40 via-secondary-600/30 to-accent-600/20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,107,53,0.15),transparent_60%)]" />
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-dark-bg to-transparent" />
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-12 flex flex-col gap-6">

        {/* Avatar + identité */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-end gap-4">
          {profile.pictureUrl
            ? <img src={profile.pictureUrl} alt=""
                className="w-20 h-20 rounded-2xl ring-4 ring-dark-bg shadow-2xl" />
            : <div className="w-20 h-20 rounded-2xl bg-primary-500/20 flex items-center justify-center text-4xl ring-4 ring-dark-bg shadow-2xl">
                🍕
              </div>
          }
          <div className="pb-1">
            <h1 className="font-title text-xl font-bold text-white">{profile.name}</h1>
            <p className="text-xs text-slate-400">{profile.email}</p>
          </div>
        </motion.div>

        {/* XP bar + niveau */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}
          className="glass rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-title font-black text-white">Niv. {profile.level}</span>
              <span className="text-xs text-slate-400 bg-white/5 px-2 py-0.5 rounded-full">
                {profile.xp} XP
              </span>
            </div>
            <span className="text-xs text-slate-500">{xpToNext - profile.xp} XP avant le niveau {profile.level + 1}</span>
          </div>
          <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-primary-500 to-secondary-500"
              initial={{ width: 0 }}
              animate={{ width: `${xpProgress}%` }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
            />
          </div>
        </motion.div>

        {/* Stats grid — 4 cartes */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-3">
          {[
            { label: 'Spins',      value: profile.totalSpins,  icon: '🎡', sub: 'roulettes lancées'   },
            { label: 'Votes',      value: profile.totalVotes,  icon: '🗳️', sub: 'votes participés'    },
            { label: 'Streak',     value: profile.streakCount, icon: '🔥', sub: 'jours consécutifs'   },
            { label: 'Badges',     value: `${unlockedCount}/${profile.badges.length}`, icon: '🏅', sub: 'débloqués' },
          ].map((stat, i) => (
            <motion.div key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              className="glass rounded-2xl p-4 flex flex-col gap-1">
              <span className="text-2xl">{stat.icon}</span>
              <p className="font-title font-black text-white text-2xl leading-none mt-1">{stat.value}</p>
              <p className="text-xs text-slate-500">{stat.sub}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Streak */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
          <StreakDisplay streak={profile.streakCount} />
        </motion.div>

        {/* Top aliments */}
        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="glass rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-title font-bold text-white">Mes top aliments</h2>
            <span className="text-xs text-slate-500 bg-white/5 px-2 py-1 rounded-full">
              {stats?.totalSpins ?? 0} spins
            </span>
          </div>
          <TopFoodsChart
            places={stats?.topPlaces ?? []}
            totalSpins={stats?.totalSpins ?? 0}
          />
        </motion.section>

        {/* Badges */}
        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-title font-bold text-white">Badges</h2>
            <span className="text-xs text-slate-500 bg-white/5 px-2 py-1 rounded-full">
              {unlockedCount} / {profile.badges.length}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {profile.badges.map((badge, i) => (
              <BadgeCard key={badge.code} badge={badge} index={i} />
            ))}
          </div>
        </motion.section>

        {/* RGPD */}
        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="glass rounded-2xl p-5 flex flex-col gap-3">
          <h2 className="font-title font-semibold text-white text-sm">Données personnelles</h2>
          <p className="text-xs text-slate-500">
            Conformément au RGPD, vous pouvez exporter ou supprimer vos données.
          </p>
          <div className="flex gap-3">
            <button onClick={exportData}
              className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-sm font-semibold transition-colors">
              📦 Exporter
            </button>
            <button
              onClick={() => {
                if (confirm('Supprimer définitivement votre compte et toutes vos données ?')) {
                  deleteAccount();
                }
              }}
              className="flex-1 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-semibold transition-colors">
              🗑 Supprimer
            </button>
          </div>
        </motion.section>

        <button onClick={logout}
          className="text-slate-500 hover:text-slate-300 text-sm transition-colors text-center pb-4">
          Déconnexion
        </button>

      </div>
    </div>
  );
}
