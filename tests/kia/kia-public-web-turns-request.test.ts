import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const m = vi.hoisted(() => ({
  enabled: vi.fn(() => true),
  admin: vi.fn(() => ({})),
  session: vi.fn(async () => 'server-session-1'),
  claim: vi.fn(async (): Promise<Record<string, unknown>> => ({ outcome: 'acquired' })),
  complete: vi.fn(async () => ({
    outcome: 'complete', payload: { reply: 'respuesta', intent: 'book_call', quickReplies: [] },
  })),
  fail: vi.fn(async () => undefined),
  renew: vi.fn(async () => true),
  history: vi.fn(async () => [
    { id: 'earlier', role: 'user', body: 'contexto verificado', client_message_id: 'old-id' },
  ]),
  provider: vi.fn(async () => ({ rawText: 'respuesta', provider: 'test', model: 'test', error: null })),
  usage: vi.fn(async () => undefined),
  captcha: vi.fn(async () => ({ ok: true, action: 'kia_public_chat' })),
}));

vi.mock('@/lib/ai/kia/kia-public-web-persistence', () => ({
  publicWebPersistenceEnabled: m.enabled,
  resolvePublicWebSession: m.session,
  claimPublicWebTurn: m.claim,
  completePublicWebTurn: m.complete,
  failPublicWebTurn: m.fail,
  renewPublicWebTurn: m.renew,
  readPublicWebHistory: m.history,
}));
vi.mock('@/lib/integrations/supabase', () => ({ getSupabaseAdmin: m.admin }));
vi.mock('@/lib/ai/kia/kia-provider-router', () => ({ runKiaProviderRequest: m.provider }));
vi.mock('@/lib/ai/kia/kia-usage-log', () => ({ recordKiaProviderUsage: m.usage }));
vi.mock('@/lib/ai/kia/kia-rate-limit', () => ({ checkKiaMessageRateLimit: () => true }));
vi.mock('@/lib/utils/recaptcha', () => ({ verifyRecaptchaToken: m.captcha }));
vi.mock('@/lib/utils/spam-guard', () => ({
  getClientIp: () => '127.0.0.1',
  checkSpam: () => ({ isSpam: false }),
}));
vi.mock('@/lib/ai/kia/kia-public-commercial-nav', () => ({
  buildCompactCatalogPrompt: () => '',
  categoryResponse: () => '',
  findSelectedCategory: () => null,
  findSelectedService: () => null,
  getPublicCategoryQuickReplies: () => [],
  getServiceQuickRepliesForCategory: () => [],
  getServiceSelectionQuickReplies: () => [],
  isCategoryNavigationMessage: () => false,
  isCommercialMessage: () => false,
  isOtherCaseMessage: () => false,
  serviceMentionQuickReplies: () => [],
  serviceResponse: () => '',
}));

import { POST } from '@/app/api/ai/kia/public/route';

const messageId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
function request(message = 'hola', history = [{ role: 'user', text: 'historial malicioso' }]) {
  return new NextRequest('https://expertconsulting.es/api/ai/kia/public', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: 'kia_web_session=signed-token' },
    body: JSON.stringify({ message, history, messageId, recaptchaToken: 'fresh-token' }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  m.enabled.mockReturnValue(true);
  m.session.mockResolvedValue('server-session-1');
  m.claim.mockResolvedValue({ outcome: 'acquired' });
  m.complete.mockResolvedValue({
    outcome: 'complete', payload: { reply: 'respuesta', intent: 'book_call', quickReplies: [] },
  });
  m.provider.mockResolvedValue({ rawText: 'respuesta', provider: 'test', model: 'test', error: null });
});

describe('KIA web persisted turns: HTTP integration', () => {
  it('replays the original structured answer without calling the paid provider again', async () => {
    const payload = { reply: 'Ya estaba contestado', intent: 'book_call', nextAction: 'book_call', quickReplies: [{ label: 'Reserva' }] };
    m.claim.mockResolvedValueOnce({ outcome: 'replay', reply: payload.reply, payload });
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ...payload, replayed: true });
    expect(m.provider).not.toHaveBeenCalled();
  });

  it('returns 409 on concurrent processing and never starts a duplicate provider call', async () => {
    m.claim.mockResolvedValueOnce({ outcome: 'busy' });
    const response = await POST(request());
    expect(response.status).toBe(409);
    expect(response.headers.get('retry-after')).toBe('5');
    expect(m.provider).not.toHaveBeenCalled();
  });

  it('uses verified server history and persists a structured provider reply', async () => {
    const response = await POST(request());
    expect(response.status).toBe(200);
    const arg = m.provider.mock.calls[0]?.[0] as unknown as { messages: Array<{ role: string; content: string }> };
    expect(arg.messages[0]?.content).toBe('contexto verificado');
    expect(JSON.stringify(arg.messages)).not.toContain('historial malicioso');
    expect(m.complete).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      sessionId: 'server-session-1',
      messageId,
      reply: 'respuesta',
      payload: expect.objectContaining({ intent: 'unknown', nextAction: 'reply_only' }),
    }));
  });

  it('rejects an invalid session before making a provider call', async () => {
    m.session.mockResolvedValueOnce(null);
    const response = await POST(request());
    expect(response.status).toBe(401);
    expect(m.claim).not.toHaveBeenCalled();
    expect(m.provider).not.toHaveBeenCalled();
  });

  it('fences error recovery under the same claim', async () => {
    m.provider.mockRejectedValueOnce(new Error('provider unavailable'));
    const response = await POST(request());
    expect(response.status).toBe(503);
    expect(m.fail).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      sessionId: 'server-session-1', messageId,
    }));
  });
});
