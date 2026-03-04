'use client';

import { useCallback } from 'react';
import { useRouter }   from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { authApi }      from '@/lib/api';
import { toast }        from '@/components/ui/Toast';

export function useAuth() {
  const router = useRouter();
  const store  = useAuthStore();

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Continuer même si l'API échoue
    } finally {
      store.logout();
      router.push('/');
    }
  }, [store, router]);

  const deleteAccount = useCallback(async () => {
    try {
      await authApi.delete();
      store.logout();
      toast.success('Compte supprimé', 'Toutes vos données ont été effacées.');
      router.push('/');
    } catch {
      toast.error('Erreur', 'Impossible de supprimer le compte.');
    }
  }, [store, router]);

  const exportData = useCallback(async () => {
    try {
      const response = await authApi.export();
      const url = URL.createObjectURL(response.data);
      const a   = document.createElement('a');
      a.href     = url;
      a.download = 'spinmylunch-export.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Erreur', 'Impossible d\'exporter les données.');
    }
  }, []);

  return {
    user:            store.user,
    isAuthenticated: store.isAuthenticated,
    isLoading:       store.isLoading,
    accessToken:     store.accessToken,
    logout,
    deleteAccount,
    exportData,
  };
}
