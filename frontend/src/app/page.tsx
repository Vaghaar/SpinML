'use client';

import { useEffect, useState } from 'react';
import { useRouter }           from 'next/navigation';
import { motion }              from 'framer-motion';
import { RouletteCanvas }      from '@/components/landing/RouletteCanvas';
import { GoogleSignInButton }  from '@/components/landing/GoogleSignInButton';
import { useAuthStore }        from '@/stores/authStore';
import { authApi }             from '@/lib/api';
import { toast }               from '@/components/ui/Toast';

// Stats de présentation
const STATS = [
  { label: 'Spins aujourd\'hui', value: '3 247' },
  { label: 'Groupes actifs',     value: '612' },
  { label: 'Dilemmes résolus',   value: '48K+' },
];

export default function LandingPage() {
  const router          = useRouter();
  const { isAuthenticated, isLoading, login } = useAuthStore();
  const [guestLoading, setGuestLoading] = useState(false);

  // Rediriger si déjà authentifié
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleGuest = async () => {
    setGuestLoading(true);
    try {
      const { data } = await authApi.guest();
      login(data.accessToken, data.user);
      router.replace('/dashboard');
    } catch (err) {
      console.error('[guest] erreur:', err);
      toast.error('Connexion impossible', 'Le serveur est inaccessible. Vérifiez que le backend est démarré.');
      setGuestLoading(false);
    }
  };

  return (
    <main className="relative min-h-dvh flex flex-col items-center justify-center overflow-hidden bg-dark-bg">

      {/* ─── Background : roue animée ─────────────────────────────────────── */}
      <RouletteCanvas />

      {/* ─── Overlay gradient pour lisibilité ────────────────────────────── */}
      <div className="absolute inset-0 bg-gradient-to-b from-dark-bg via-dark-bg/60 to-transparent pointer-events-none" />

      {/* ─── Contenu principal ────────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-2xl mx-auto">

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="mb-6"
        >
          <span className="glass neon-border text-primary-400 text-sm font-accent px-4 py-1.5 rounded-full">
            🎡 La roulette collaborative du midi
          </span>
        </motion.div>

        {/* Titre */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="font-title text-6xl sm:text-7xl md:text-8xl font-bold mb-4 leading-none tracking-tight"
        >
          <span className="gradient-text">Spin</span>
          <span className="text-white">My</span>
          <span className="gradient-text">Lunch</span>
        </motion.h1>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.6 }}
          className="font-body text-xl sm:text-2xl text-slate-300 mb-3"
        >
          La roulette qui décide pour toi.
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="font-body text-slate-500 mb-10 max-w-md"
        >
          Fini le "on mange quoi ?" qui dure 20 minutes. Crée ta roulette, invite ton équipe,
          spinnez ensemble et passez à table.
        </motion.p>

        {/* CTA principal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.5, type: 'spring', stiffness: 200 }}
          className="mb-4 flex flex-col items-center gap-3"
        >
          <GoogleSignInButton size="lg" />
          <button
            onClick={handleGuest}
            disabled={guestLoading}
            className="text-sm text-slate-400 hover:text-white transition-colors underline underline-offset-4 disabled:opacity-50"
          >
            {guestLoading ? 'Connexion…' : 'Continuer sans compte'}
          </button>
        </motion.div>

        {/* Note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-xs text-slate-600 mb-12"
        >
          Gratuit · Aucune carte requise · Connexion en un clic
        </motion.p>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.5 }}
          className="flex gap-8 sm:gap-16"
        >
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="font-accent text-2xl font-bold gradient-text">
                {stat.value}
              </div>
              <div className="font-body text-xs text-slate-500 mt-0.5">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* ─── Feature pills en bas ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1, duration: 0.6 }}
        className="relative z-10 flex flex-wrap justify-center gap-2 px-6 mt-10 mb-6"
      >
        {[
          '🎰 Roulette pondérée',
          '🗳️ Vote en temps réel',
          '🔥 Streaks & badges',
          '👥 Multi-joueurs',
          '🎭 Mode Surprise',
        ].map((pill) => (
          <span
            key={pill}
            className="glass text-slate-400 text-xs font-body px-3 py-1.5 rounded-full border border-white/5"
          >
            {pill}
          </span>
        ))}
      </motion.div>
    </main>
  );
}
