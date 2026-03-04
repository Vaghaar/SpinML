'use client';

import { useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { authApi }      from '@/lib/api';
import { validateState, getRedirectUri } from '@/lib/auth';
import { useAuthStore } from '@/stores/authStore';
import { usePersistedAuth } from '@/stores/authStore';
import { toast }        from '@/components/ui/Toast';

function AuthCallbackInner() {
  const router       = useRouter();
  const params       = useSearchParams();
  const { login }    = useAuthStore();
  const { setCachedUser, hasOnboarded } = usePersistedAuth();
  const attempted    = useRef(false);

  useEffect(() => {
    if (attempted.current) return;
    attempted.current = true;

    const code  = params.get('code');
    const state = params.get('state');
    const error = params.get('error');

    // Erreur retournée par Google
    if (error) {
      toast.error('Connexion annulée', 'Vous avez annulé la connexion Google.');
      router.replace('/');
      return;
    }

    // Validation CSRF state
    if (!validateState(state)) {
      toast.error('Erreur de sécurité', 'State invalide — veuillez réessayer.');
      router.replace('/');
      return;
    }

    if (!code) {
      toast.error('Erreur', 'Code d\'autorisation manquant.');
      router.replace('/');
      return;
    }

    // Échange du code contre un JWT
    authApi.googleLogin(code, getRedirectUri())
      .then(({ data }) => {
        login(data.accessToken, data.user);
        setCachedUser(data.user);
        toast.success(`Bienvenue, ${data.user.name.split(' ')[0]} !`);
        // Onboarding si c'est la première fois
        router.replace(hasOnboarded ? '/dashboard' : '/onboarding');
      })
      .catch(() => {
        toast.error('Échec de connexion', 'Impossible de se connecter avec Google.');
        router.replace('/');
      });
  }, [params, login, router, setCachedUser, hasOnboarded]);

  return (
    <div className="min-h-dvh flex items-center justify-center bg-dark-bg">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass rounded-3xl p-10 text-center max-w-sm mx-4"
      >
        {/* Spinner animé */}
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full border-4 border-dark-border" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary-500 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center text-3xl">
            🍕
          </div>
        </div>

        <h2 className="font-title text-xl font-bold text-white mb-2">
          Connexion en cours…
        </h2>
        <p className="font-body text-slate-400 text-sm">
          Vérification de vos identifiants Google
        </p>

        {/* Barre de progression */}
        <div className="mt-6 h-1 bg-dark-border rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-primary rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: '90%' }}
            transition={{ duration: 3, ease: 'easeOut' }}
          />
        </div>
      </motion.div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense>
      <AuthCallbackInner />
    </Suspense>
  );
}
