import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export const PUBLIC_KIA_SESSION_COOKIE = 'kia_web_session';
const LIFETIME_SECONDS = 60 * 60 * 24 * 7;
const TOKEN_RE = /^v1\.([a-f0-9]{32})\.([0-9]{10})\.([a-f0-9]{64})$/;

function secret(): string {
  const value = process.env.KIA_PUBLIC_SESSION_SECRET;
  if (!value || value.length < 32) throw new Error('kia_public_session_secret_missing');
  return value;
}

function signature(id: string, expires: number) {
  return createHmac('sha256', secret()).update(`v1.${id}.${expires}`).digest('hex');
}

/** This cookie proves continuity of a browser session, never personal identity. */
export function issuePublicKiaSession(now = Date.now()) {
  const id = randomBytes(16).toString('hex');
  const expires = Math.floor(now / 1000) + LIFETIME_SECONDS;
  return { id, token: `v1.${id}.${expires}.${signature(id, expires)}`, maxAge: LIFETIME_SECONDS };
}

export function verifyPublicKiaSession(token: string | undefined | null, now = Date.now()): string | null {
  if (!token || token.length > 160) return null;
  const match = TOKEN_RE.exec(token);
  if (!match) return null;
  const [, id, rawExpiry, supplied] = match;
  const expiry = Number(rawExpiry);
  if (!Number.isSafeInteger(expiry) || expiry <= Math.floor(now / 1000)) return null;
  const correct = Buffer.from(signature(id, expiry), 'hex');
  const received = Buffer.from(supplied, 'hex');
  return correct.length === received.length && timingSafeEqual(correct, received) ? id : null;
}

export function publicKiaCookieOptions(maxAge = LIFETIME_SECONDS) {
  return { httpOnly: true as const, secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const, path: '/api/ai/kia/public', maxAge };
}
