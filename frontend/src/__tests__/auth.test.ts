import { isTokenExpired } from '@/lib/auth';

describe('isTokenExpired', () => {
  it('returns true for null token', () => {
    expect(isTokenExpired(null)).toBe(true);
  });

  it('returns true for malformed token', () => {
    expect(isTokenExpired('not.a.jwt')).toBe(true);
  });

  it('returns true for expired token', () => {
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
