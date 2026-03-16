'use client';

import { useEffect, useState } from 'react';
import { useRouter }  from 'next/navigation';
import { motion }     from 'framer-motion';
import { RouletteCanvas }     from '@/components/landing/RouletteCanvas';
import { GoogleSignInButton } from '@/components/landing/GoogleSignInButton';
import { useAuthStore }       from '@/stores/authStore';
import { authApi }            from '@/lib/api';

const STATS = [
  { label: "Spins aujourd'hui", value: '3 247', icon: '🎡' },
  { label: 'Groupes actifs',    value: '612',   icon: '👥' },
  { label: 'Dilemmes résolus',  value: '48K+',  icon: '✅' },
];

const FEATURES = [
  '🎰 Roulette pondérée',
  '🗳️ Vote en temps réel',
  '🔥 Streaks & badges',
  '👥 Multi-joueurs',
  '🎭 Mode Surprise',
];

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, login } = useAuthStore();
  const [guestName, setGuestName]   = useState('');
  const [guestLoading, setGuestLoading] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      const redirect = sessionStorage.getItem('redirectAfterLogin');
      sessionStorage.removeItem('redirectAfterLogin');
      router.replace(redirect ?? '/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleGuestLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = guestName.trim();
    if (!name) return;
    setGuestLoading(true);
    try {
      const { data } = await authApi.guestLogin(name);
      login(data.accessToken, data.user);
    } catch {
      // silently ignore — user stays on page
    } finally {
      setGuestLoading(false);
    }
  };

  return (
    <main className="relative min-h-dvh flex flex-col items-center justify-center overflow-hidden bg-dark-bg">

      {/* Animated wheel background */}
      <RouletteCanvas />

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-dark-bg/95 via-dark-bg/65 to-dark-bg/95 pointer-events-none" />

      {/* Atmospheric blobs (pickthewheel-style) */}
      <div className="blob-pink top-[-200px] left-[-200px]" />
      <div className="blob-cyan bottom-[-150px] right-[-150px]" />
      <div className="blob-orange top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-2xl mx-auto">

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="mb-6"
        >
          <span className="inline-flex items-center gap-2 bg-primary-600/25 border border-primary-500/35 text-primary-300 text-sm font-bold px-5 py-2 rounded-full">
            🎡 La roulette collaborative du midi
          </span>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="font-title text-6xl sm:text-7xl md:text-8xl font-black mb-4 leading-none tracking-tight"
        >
          <span className="gradient-text">Spin</span>
          <span className="text-white">my</span>
          <span className="gradient-text">lunch</span>
        </motion.h1>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.6 }}
          className="text-xl sm:text-2xl text-slate-200 mb-3 font-extrabold"
        >
          Fini le &ldquo;on mange quoi ?&rdquo; 😤
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="text-slate-400 mb-10 max-w-md text-base font-semibold"
        >
          Crée ta roulette, invite ton équipe, spinnez ensemble et passez à table en 30 secondes.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, scale: 0.88 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.5, type: 'spring', stiffness: 220 }}
          className="mb-4 flex flex-col items-center gap-4 w-full max-w-xs"
        >
          <GoogleSignInButton size="lg" />

          <div className="flex items-center gap-3 w-full">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-slate-500 font-bold">ou</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <form onSubmit={handleGuestLogin} className="flex w-full gap-2">
            <input
              value={guestName}
              onChange={e => setGuestName(e.target.value)}
              placeholder="Ton prénom..."
              maxLength={50}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-primary-500 text-sm"
            />
            <button
              type="submit"
              disabled={!guestName.trim() || guestLoading}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm disabled:opacity-40 transition-all border border-white/10"
            >
              {guestLoading ? '…' : 'Entrer'}
            </button>
          </form>
          <p className="text-xs text-slate-600 font-semibold">Session éphémère · pas de stats</p>
        </motion.div>

        {/* Note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-xs text-slate-500 mb-12 font-semibold"
        >
          Gratuit · Aucune carte requise · Connexion Google en un clic
        </motion.p>

        {/* Stats cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.5 }}
          className="flex gap-3 sm:gap-5"
        >
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="glass rounded-2xl px-4 py-3 text-center min-w-[90px]"
            >
              <div className="text-xl mb-1">{stat.icon}</div>
              <div className="font-title text-xl font-black gradient-text">{stat.value}</div>
              <div className="text-xs text-slate-500 mt-0.5 font-bold">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Feature pills */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1, duration: 0.6 }}
        className="relative z-10 flex flex-wrap justify-center gap-2 px-6 mt-10 mb-6"
      >
        {FEATURES.map((pill) => (
          <span
            key={pill}
            className="glass-light text-slate-300 text-xs font-bold px-4 py-2 rounded-full"
          >
            {pill}
          </span>
        ))}
      </motion.div>
    </main>
  );
}
