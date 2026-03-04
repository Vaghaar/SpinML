'use client';

import { useEffect }   from 'react';
import { useRouter }   from 'next/navigation';
import { motion }      from 'framer-motion';
import { useAuth }     from '@/hooks/useAuth';
import { FOOD_AVATAR_EMOJI, LEVEL_TITLES } from '@/lib/utils';

// Stub — sera construit à l'étape 7
export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace('/');
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-dark-bg">
        <div className="w-12 h-12 rounded-full border-4 border-primary-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-dark-bg p-6 flex flex-col items-center justify-center gap-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass neon-border rounded-3xl p-8 max-w-sm w-full text-center"
      >
        {/* Avatar */}
        <div className="text-6xl mb-4">{FOOD_AVATAR_EMOJI[user.foodAvatarType]}</div>

        {/* Infos */}
        <h1 className="font-title text-2xl font-bold text-white">
          Bonjour, {user.name.split(' ')[0]} !
        </h1>
        <p className="text-slate-400 text-sm mt-1">{user.email}</p>

        {/* Niveau */}
        <div className="mt-4 glass rounded-xl p-3 flex items-center justify-between">
          <span className="font-accent text-primary-400 font-semibold">
            Niveau {user.level} — {LEVEL_TITLES[user.level] ?? 'Inconnu'}
          </span>
          <span className="font-accent text-secondary-400 text-sm">
            {user.xp} XP
          </span>
        </div>

        {/* Streak */}
        <div className="mt-2 text-sm text-slate-400">
          🔥 {user.streakCount} jour{user.streakCount > 1 ? 's' : ''} de streak
        </div>

        {/* Note étape en cours */}
        <div className="mt-6 bg-primary-500/10 border border-primary-500/30 rounded-xl p-4 text-sm text-primary-300">
          Dashboard complet — étape 7
        </div>

        {/* Déconnexion */}
        <button
          onClick={logout}
          className="mt-6 text-slate-500 hover:text-slate-300 text-sm transition-colors"
        >
          Déconnexion
        </button>
      </motion.div>
    </div>
  );
}
