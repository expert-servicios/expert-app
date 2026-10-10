import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const m = vi.hoisted(() => ({
  enabled: vi.fn(() => true),
  rate: vi.fn(() => true),
  captcha: vi.fn(async (): Promise<{ ok: boolean; action?: string; skipped?: boolean }> => ({ ok: true, action: 'kia_public_chat' })),
  ensure: vi.fn(async () => ({ sessionId: 'session-1', setCookie: 'signed-token', cookieMaxAge: 3600 })),
  history: vi.fn(async () => [{ id: 'turn-1', role: 'user', body: 'hola', created_at: '2026-10-10T10:00:00Z' }]),
  admin: vi.fn(() => ({ from: vi.fn() })),
}));
vi.mock('@/lib/ai/kia/kia-public-web-persistence', () => ({
  publicWebPersistenceEnabled: m.enabled,
  ensurePublicWebSession: m.ensure,
  readPublicWebHistory: m.history,
}));
vi.mock('@/lib/integrations/supabase', () => ({ getSupabaseAdmin: m.admin }));
vi.mock('@/lib/ai/kia/kia-rate-limit', () => ({ checkKiaMessageRateLimit: m.rate }));
vi.mock('@/lib/utils/recaptcha', () => ({ verifyRecaptchaToken: m.captcha }));
vi.mock('@/lib/utils/spam-guard', () => ({ getClientIp: () => '127.0.0.1' }));
import { GET, POST } from '@/app/api/ai/kia/public/session/route';

const path = 'https://expertconsulting.es/api/ai/kia/public/session';
const get = (site = 'same-origin', origin?: string) =>
  new NextRequest(path, { headers: { 'sec-fetch-site': site, ...(origin ? { origin } : {}), cookie: 'kia_web_session=signed-token' } });
const post = (origin: string, site = 'same-origin') =>
  new NextRequest(path, { method: 'POST', headers: { origin, 'sec-fetch-site': site, 'content-type': 'application/json' }, body: JSON.stringify({ recaptchaToken: 'test' }) });

beforeEach(() => { vi.clearAllMocks(); m.enabled.mockReturnValue(true); m.rate.mockReturnValue(true); m.captcha.mockResolvedValue({ ok: true, action: 'kia_public_chat' }); });

describe('KIA public web sessions: request-level security', () => {
  it('rejects cross-site GET requests even with an attached session cookie', async () => {
    const res = await GET(get('cross-site'));
    expect(res.status).toBe(403);
    expect(res.headers.get('cache-control')).toContain('no-store');
    expect(m.history).not.toHaveBeenCalled();
  });
  it('returns only the valid session history without minting cookies', async () => {
    const res = await GET(get());
    expect(res.status).toBe(200);
    expect((await res.json()).messages).toHaveLength(1);
    expect(res.headers.get('set-cookie')).toBeNull();
    expect(m.ensure).not.toHaveBeenCalled();
  });
  it('rejects cross-site POST requests before CAPTCHA or session creation', async () => {
    const res = await POST(post('https://attacker.test', 'cross-site'));
    expect(res.status).toBe(403);
    expect(m.captcha).not.toHaveBeenCalled();
    expect(m.ensure).not.toHaveBeenCalled();
  });
  it('creates an HttpOnly session only after a validated request', async () => {
    const res = await POST(post('https://expertconsulting.es'));
    expect(res.status).toBe(200);
    expect(m.captcha).toHaveBeenCalled();
    expect(m.ensure).toHaveBeenCalled();
    expect(res.headers.get('set-cookie')).toContain('HttpOnly');
  });
  it('fails closed when CAPTCHA is skipped or lacks the expected action', async () => {
    m.captcha.mockResolvedValueOnce({ ok: true, skipped: true, action: 'kia_public_chat' });
    expect((await POST(post('https://expertconsulting.es'))).status).toBe(403);
    m.captcha.mockResolvedValueOnce({ ok: true });
    expect((await POST(post('https://expertconsulting.es'))).status).toBe(403);
    expect(m.ensure).not.toHaveBeenCalled();
  });
  it('does not expose endpoints while disabled', async () => {
    m.enabled.mockReturnValue(false);
    expect((await GET(get())).status).toBe(404);
    expect((await POST(post('https://expertconsulting.es'))).status).toBe(404);
    expect(m.admin).not.toHaveBeenCalled();
  });
});
