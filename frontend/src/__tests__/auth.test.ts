import { generateState, validateState, isTokenExpired, buildGoogleAuthUrl } from '@/lib/auth';

// Mock sessionStorage
const sessionStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem:    (key: string) => store[key] ?? null,
    setItem:    (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear:      () => { store = {}; },
  };
})();

Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock });

// Mock crypto.randomUUID
Object.defineProperty(globalThis, 'crypto', {
  value: { randomUUID: () => 'test-uuid-1234-5678-90ab-cdef01234567' },
});

describe('generateState', () => {
  beforeEach(() => sessionStorageMock.clear());

  it('stores state in sessionStorage', () => {
    const state = generateState();
    expect(state).toBeTruthy();
    expect(sessionStorageMock.getItem('oauth_state')).toBe(state);
  });
});

describe('validateState', () => {
  beforeEach(() => sessionStorageMock.clear());

  it('returns true for matching state', () => {
    const state = generateState();
    expect(validateState(state)).toBe(true);
  });

  it('returns false for mismatched state', () => {
    generateState();
    expect(validateState('wrong-state')).toBe(false);
  });

  it('removes state from storage after validation', () => {
    const state = generateState();
    validateState(state);
    expect(sessionStorageMock.getItem('oauth_state')).toBeNull();
  });
});

describe('isTokenExpired', () => {
  it('returns true for null token', () => {
    expect(isTokenExpired(null)).toBe(true);
  });

  it('returns true for malformed token', () => {
    expect(isTokenExpired('not.a.jwt')).toBe(true);
  });

  it('returns true for expired token', () => {
    // Build a JWT-like with exp in the past
    const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) - 3600 }));
    const token   = `header.${payload}.sig`;
    expect(isTokenExpired(token)).toBe(true);
  });

  it('returns false for valid future token', () => {
    const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }));
    const token   = `header.${payload}.sig`;
    expect(isTokenExpired(token)).toBe(false);
  });
});

describe('buildGoogleAuthUrl', () => {
  it('builds a URL with required params', () => {
    const url = buildGoogleAuthUrl('test-state');
    expect(url).toContain('accounts.google.com');
    expect(url).toContain('response_type=code');
    expect(url).toContain('state=test-state');
    expect(url).toContain('scope=');
  });
});
