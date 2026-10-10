import { describe, expect, it } from 'vitest';
import { issuePublicKiaSession, verifyPublicKiaSession, publicKiaCookieOptions } from '@/lib/ai/kia/kia-public-session';

describe('KIA web anonymous session foundation', () => {
  it('uses signed expiring random session cookies without identifying clients', () => {
    const previous = process.env.KIA_PUBLIC_SESSION_SECRET;
    process.env.KIA_PUBLIC_SESSION_SECRET = 'a'.repeat(64);
    try {
      const now = Date.UTC(2026, 9, 10);
      const a = issuePublicKiaSession(now);
      const b = issuePublicKiaSession(now);
      expect(a.id).not.toBe(b.id);
      expect(verifyPublicKiaSession(a.token, now)).toBe(a.id);
      expect(verifyPublicKiaSession(a.token, now + 8 * 86400 * 1000)).toBeNull();
      expect(verifyPublicKiaSession(a.token.replace(/.$/, '0'), now)).toBeNull();
      expect(verifyPublicKiaSession(b.token, now)).toBe(b.id);
    } finally {
      if (previous === undefined) delete process.env.KIA_PUBLIC_SESSION_SECRET;
      else process.env.KIA_PUBLIC_SESSION_SECRET = previous;
    }
  });
  it('refuses to sign cookies without an independent server-side secret', () => {
    const previous = process.env.KIA_PUBLIC_SESSION_SECRET;
    delete process.env.KIA_PUBLIC_SESSION_SECRET;
    try { expect(() => issuePublicKiaSession()).toThrow('kia_public_session_secret_missing'); }
    finally { if (previous !== undefined) process.env.KIA_PUBLIC_SESSION_SECRET = previous; }
  });
  it('never exposes cookie tokens to browser scripts', () => {
    expect(publicKiaCookieOptions()).toMatchObject({ httpOnly: true, sameSite: 'lax', path: '/api/ai/kia/public' });
  });
});