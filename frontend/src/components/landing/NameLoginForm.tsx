'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { usePersistedAuth } from '@/stores/authStore';
import { toast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

interface NameLoginFormProps {
  className?: string;
}

export function NameLoginForm({ className }: NameLoginFormProps) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuthStore();
  const { setCachedUser, hasOnboarded } = usePersistedAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    setIsLoading(true);
    try {
      const { data } = await authApi.nameLogin(trimmed);
      login(data.accessToken, data.user);
      setCachedUser(data.user);
      toast.success(`Bienvenue, ${data.user.name.split(' ')[0]} !`);
      if (!hasOnboarded) {
        router.replace('/onboarding');
      } else {
        const redirect = sessionStorage.getItem('redirectAfterLogin');
        sessionStorage.removeItem('redirectAfterLogin');
        router.replace(redirect ?? '/dashboard');
      }
    } catch {
      toast.error('Erreur', 'Impossible de se connecter. Réessayez.');
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn('flex flex-col items-center gap-3 w-full max-w-sm', className)}>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Entrez votre prénom…"
        maxLength={50}
        disabled={isLoading}
        autoFocus
        className={cn(
          'w-full h-14 px-6 rounded-full text-lg font-semibold',
          'bg-white/10 border border-white/20 text-white placeholder:text-slate-400',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
          'transition-all duration-200',
          'disabled:opacity-60 disabled:cursor-not-allowed'
        )}
      />
      <button
        type="submit"
        disabled={isLoading || !name.trim()}
        className={cn(
          'w-full h-14 px-8 rounded-full text-lg font-black',
          'bg-gradient-to-r from-primary-500 to-primary-600',
          'text-white shadow-lg shadow-primary-500/30',
          'hover:shadow-primary-500/50 hover:scale-[1.02]',
          'active:scale-95 transition-all duration-200',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500'
        )}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            Connexion…
          </span>
        ) : (
          'Commencer 🎡'
        )}
      </button>
    </form>
  );
}
