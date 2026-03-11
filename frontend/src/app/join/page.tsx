'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { groupApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

// ─── Inner component — uses useSearchParams (requires Suspense) ────────────────

function JoinHandler() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const code      = searchParams.get('code');
  const attempted = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (attempted.current) return;

    if (!isAuthenticated) {
      sessionStorage.setItem('redirectAfterLogin', `/join?code=${code ?? ''}`);
      router.replace('/');
      return;
    }

    if (!code) {
      setError("Code d'invitation manquant.");
      return;
    }

    attempted.current = true;

    groupApi.join(code.trim().toUpperCase())
      .then(({ data }) => {
        router.replace(`/groups/${data.id}`);
      })
      .catch((err) => {
        const message: string = err?.response?.data?.message ?? '';
        if (message.includes('déjà membre')) {
          router.replace('/dashboard');
        } else if (err?.response?.status === 404 || message.includes('introuvable')) {
          setError("Code d'invitation invalide ou expiré.");
        } else {
          setError('Une erreur est survenue. Réessayez.');
        }
      });
  }, [authLoading, isAuthenticated, code, router]);

  if (error) {
    return (
      <div className="min-h-dvh bg-dark-bg flex flex-col items-center justify-center gap-4">
        <p className="text-red-400 text-sm">{error}</p>
        <button
          onClick={() => router.replace('/dashboard')}
          className="text-primary-400 hover:underline text-sm"
        >
          ← Retour au dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-dark-bg flex flex-col items-center justify-center gap-3">
      <div className="w-10 h-10 rounded-full border-4 border-primary-500 border-t-transparent animate-spin" />
      <p className="text-slate-400 text-sm">Rejoindre le groupe…</p>
    </div>
  );
}

// ─── Page — Suspense required by Next.js for useSearchParams ──────────────────

export default function JoinPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh bg-dark-bg flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border-4 border-primary-500 border-t-transparent animate-spin" />
        </div>
      }
    >
      <JoinHandler />
    </Suspense>
  );
}
