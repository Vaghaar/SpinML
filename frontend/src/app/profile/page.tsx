'use client';

import { useEffect }           from 'react';
import { useRouter }           from 'next/navigation';
import { motion }              from 'framer-motion';
import { useQuery }            from '@tanstack/react-query';
import { profileApi, authApi } from '@/lib/api';
import { useAuth }             from '@/hooks/useAuth';
import { LevelBadge }          from '@/components/gamification/LevelBadge';
import { StreakDisplay }        from '@/components/gamification/StreakDisplay';
import { BadgeCard }           from '@/components/gamification/BadgeCard';
import { toast }               from '@/components/ui/Toast';
import type { ProfileData }    from '@/types/gamification';

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

  if (authLoading || isLoading || !profile) {
    return (
      <div className="min-h-dvh bg-dark-bg flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-primary-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  const unlockedCount = profile.badges.filter(b => b.unlocked).length;

  return (
    <div className="min-h-dvh bg-dark-bg pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-dark-bg/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => router.push('/dashboard')}
            className="text-slate-400 hover:text-white transition-colors text-sm">
            ← Dashboard
          </button>
          <span className="font-title font-bold text-white flex-1 text-center">Mon profil</span>
          <span className="w-20" />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-8 flex flex-col gap-8">

        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-4">
          {profile.pictureUrl
            ? <img src={profile.pictureUrl} alt=""
                className="w-20 h-20 rounded-full ring-4 ring-primary-500/40 shadow-xl" />
            : <div className="w-20 h-20 rounded-full bg-primary-500/20 flex items-center justify-center text-4xl">🍕</div>
          }
          <div className="text-center">
            <h1 className="font-title text-2xl font-bold text-white">{profile.name}</h1>
            <p className="text-sm text-slate-400">{profile.email}</p>
          </div>
          <LevelBadge level={profile.level} xp={profile.xp} size="lg" />
        </motion.div>

        {/* Stats grid */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-3">
          {[
            { label: 'Spins',  value: profile.totalSpins,  icon: '🎡' },
            { label: 'Votes',  value: profile.totalVotes,  icon: '🗳️' },
            { label: 'Badges', value: unlockedCount,        icon: '🏅' },
          ].map(stat => (
            <div key={stat.label} className="glass rounded-2xl p-4 text-center">
              <div className="text-2xl mb-1">{stat.icon}</div>
              <p className="font-title font-bold text-white text-xl">{stat.value}</p>
              <p className="text-xs text-slate-500 font-accent">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Streak */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
          <StreakDisplay streak={profile.streakCount} />
        </motion.div>

        {/* Badges */}
        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <h2 className="font-title font-bold text-white mb-3">
            Badges
            <span className="text-slate-500 font-normal text-sm ml-2">
              {unlockedCount}/{profile.badges.length}
            </span>
          </h2>
          <div className="grid grid-cols-4 gap-3">
            {profile.badges.map((badge, i) => (
              <BadgeCard
                key={badge.code}
                badge={badge}
                index={i}
              />
            ))}
          </div>
        </motion.section>

        {/* RGPD section */}
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
              🗑 Supprimer le compte
            </button>
          </div>
        </motion.section>

        {/* Logout */}
        <button onClick={logout}
          className="text-slate-500 hover:text-slate-300 text-sm transition-colors text-center">
          Déconnexion
        </button>

      </div>
    </div>
  );
}
