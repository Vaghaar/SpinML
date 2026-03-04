import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '@/types';

interface AuthState {
  // Le token d'accès est en mémoire UNIQUEMENT (jamais persisted en localStorage)
  accessToken:     string | null;
  user:            User | null;
  isAuthenticated: boolean;
  isLoading:       boolean;
  hasOnboarded:    boolean;

  // Actions
  login:         (token: string, user: User) => void;
  logout:        () => void;
  setLoading:    (loading: boolean) => void;
  setToken:      (token: string) => void;
  updateUser:    (user: Partial<User>) => void;
  setOnboarded:  () => void;
}

// Store principal (non persisté) — token en mémoire
const useAuthStoreBase = create<AuthState>()((set) => ({
  accessToken:     null,
  user:            null,
  isAuthenticated: false,
  isLoading:       true,   // true au démarrage → tente le refresh
  hasOnboarded:    false,

  login: (token, user) =>
    set({ accessToken: token, user, isAuthenticated: true, isLoading: false }),

  logout: () =>
    set({ accessToken: null, user: null, isAuthenticated: false, isLoading: false }),

  setLoading: (loading) => set({ isLoading: loading }),

  setToken: (token) => set({ accessToken: token }),

  updateUser: (partial) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...partial } : null,
    })),

  setOnboarded: () => set({ hasOnboarded: true }),
}));

// Store persisté séparé pour les données non-sensibles (user public, onboarding flag)
interface PersistedAuthState {
  cachedUser:   User | null;
  hasOnboarded: boolean;
  setCachedUser:   (user: User | null) => void;
  setHasOnboarded: () => void;
}

export const usePersistedAuth = create<PersistedAuthState>()(
  persist(
    (set) => ({
      cachedUser:   null,
      hasOnboarded: false,
      setCachedUser:   (user) => set({ cachedUser: user }),
      setHasOnboarded: () => set({ hasOnboarded: true }),
    }),
    {
      name:    'spinmylunch-auth',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export const useAuthStore = useAuthStoreBase;
export default useAuthStoreBase;
