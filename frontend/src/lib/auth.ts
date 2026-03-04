'use client';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const REDIRECT_URI    = `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`;

/** Génère l'URL d'autorisation Google OAuth 2.0 */
export function buildGoogleAuthUrl(): string {
  const params = new URLSearchParams({
    client_id:     process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '',
    redirect_uri:  REDIRECT_URI,
    response_type: 'code',
    scope:         'openid email profile',
    access_type:   'offline',
    prompt:        'select_account',
    state:         generateState(),
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

/** Génère un état CSRF aléatoire et le stocke en sessionStorage */
export function generateState(): string {
  const state = crypto.randomUUID();
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('oauth_state', state);
  }
  return state;
}

/** Valide le state CSRF retourné par Google */
export function validateState(state: string | null): boolean {
  if (!state || typeof window === 'undefined') return false;
  const stored = sessionStorage.getItem('oauth_state');
  sessionStorage.removeItem('oauth_state');
  return stored === state;
}

/** Retourne l'URI de redirection courant */
export function getRedirectUri(): string {
  return REDIRECT_URI;
}

/** Vérifie si un token JWT est expiré (sans vérifier la signature). */
export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}
