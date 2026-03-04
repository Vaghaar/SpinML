'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools }               from '@tanstack/react-query-devtools';
import { useEffect, useRef, useState }      from 'react';
import { Toaster }                          from '@/components/ui/Toast';
import { useAuthStore }                     from '@/stores/authStore';
import api                                  from '@/lib/api';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime:          60_000,  // 1 min
        gcTime:             300_000, // 5 min
        retry:              1,
        refetchOnWindowFocus: false,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (typeof window === 'undefined') return makeQueryClient();
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}

// ─── Provider principal ───────────────────────────────────────────────────────

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthInitializer />
      {children}
      <Toaster />
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}

/**
 * Tente silencieusement de rafraîchir le token au démarrage de l'app.
 * Si le cookie httpOnly refresh_token existe, l'utilisateur est reconnecté.
 */
function AuthInitializer() {
  const { login, setLoading, isAuthenticated } = useAuthStore();
  const attempted = useRef(false);

  useEffect(() => {
    if (attempted.current || isAuthenticated) return;
    attempted.current = true;

    api.post('/auth/refresh')
      .then(({ data }) => login(data.accessToken, data.user))
      .catch(() => setLoading(false));
  }, [login, setLoading, isAuthenticated]);

  return null;
}
