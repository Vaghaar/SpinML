import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/stores/authStore';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

// ─── Instance Axios principale ───────────────────────────────────────────────

const api: AxiosInstance = axios.create({
  baseURL:         `${BASE_URL}/api/v1`,
  withCredentials: true,    // envoie le cookie refresh_token httpOnly
  timeout:         15_000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Intercepteur requête : inject Bearer token ───────────────────────────────

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Intercepteur réponse : refresh automatique sur 401 ──────────────────────

let isRefreshing = false;
let pendingQueue: Array<{
  resolve: (token: string) => void;
  reject:  (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  pendingQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(token!)
  );
  pendingQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Rate limit — afficher un toast dédié (import dynamique pour éviter les dépendances circulaires)
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'] ?? '60';
      import('@/components/ui/Toast').then(({ toast }) => {
        toast.error('Trop vite !', `Attendez ${retryAfter}s avant de recommencer.`);
      });
      return Promise.reject(error);
    }

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Ne jamais retenter le refresh lui-même (évite la boucle infinie)
    if (originalRequest.url?.includes('/auth/refresh')) {
      useAuthStore.getState().logout();
      return Promise.reject(error);
    }

    // Si un refresh est déjà en cours, mettre en file d'attente
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({
          resolve: (token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          },
          reject,
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // Tenter le refresh — le cookie httpOnly est envoyé automatiquement
      const { data } = await axios.post(
        `${BASE_URL}/api/v1/auth/refresh`,
        {},
        { withCredentials: true }
      );

      const { accessToken, user } = data;
      useAuthStore.getState().login(accessToken, user);
      processQueue(null, accessToken);

      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      useAuthStore.getState().logout();
      if (typeof window !== 'undefined') window.location.href = '/';
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;

// ─── Endpoints Auth ───────────────────────────────────────────────────────────

export const authApi = {
  googleLogin: (code: string, redirectUri: string) =>
    api.post('/auth/google', { code, redirectUri }),
  guest:    () => api.post('/auth/guest'),
  refresh:  () => api.post('/auth/refresh'),
  logout:   () => api.post('/auth/logout'),
  delete:   () => api.delete('/auth/account'),
  export:   () => api.get('/auth/export', { responseType: 'blob' }),
};

// ─── Endpoints Profil / Gamification ─────────────────────────────────────────

export const profileApi = {
  getProfile: () => api.get('/profile'),
};

// ─── Endpoints Roulettes ──────────────────────────────────────────────────────

export const rouletteApi = {
  getMyRoulettes: () => api.get('/roulettes'),
  getByGroup: (groupId: string) => api.get('/roulettes', { params: { groupId } }),
  create:     (data: unknown) => api.post('/roulettes', data),
  getById:    (id: string)    => api.get(`/roulettes/${id}`),
  update:     (id: string, data: unknown) => api.put(`/roulettes/${id}`, data),
  delete:     (id: string)    => api.delete(`/roulettes/${id}`),
  spin:       (id: string)    => api.post(`/roulettes/${id}/spin`),
  getHistory: (id: string, page = 0, size = 20) =>
    api.get(`/roulettes/${id}/history`, { params: { page, size } }),
};

// ─── Endpoints Votes ──────────────────────────────────────────────────────────

export const voteApi = {
  getByGroup:    (groupId: string) => api.get('/votes/sessions', { params: { groupId } }),
  createSession: (data: unknown) => api.post('/votes/sessions', data),
  castVote:      (id: string, data: unknown) => api.post(`/votes/sessions/${id}/vote`, data),
  getResults:    (id: string) => api.get(`/votes/sessions/${id}/results`),
  propose:       (id: string, label: string) => api.post(`/votes/sessions/${id}/propose`, { label }),
  startVote:     (id: string) => api.post(`/votes/sessions/${id}/start`),
  closeSession:  (id: string) => api.post(`/votes/sessions/${id}/close`),
};

// ─── Endpoints Groupes ────────────────────────────────────────────────────────

export const statsApi = {
  myStats:    () => api.get('/stats/me'),
  groupStats: (id: string) => api.get(`/stats/group/${id}`),
};

export const groupApi = {
  getMyGroups:   () => api.get('/groups'),
  create:        (data: unknown) => api.post('/groups', data),
  getById:       (id: string)    => api.get(`/groups/${id}`),
  join:          (inviteCode: string) => api.post('/groups/join', { inviteCode }),
  getMembers:    (id: string)    => api.get(`/groups/${id}/members`),
  removeMember:  (groupId: string, userId: string) =>
    api.delete(`/groups/${groupId}/members/${userId}`),
};
