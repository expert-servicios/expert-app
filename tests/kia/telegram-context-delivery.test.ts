import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { telegramContextPayload } from '@/lib/ai/kia/kia-telegram-context';
import { sendTelegramMessageConfirmed } from '@/lib/integrations/telegram';
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
describe('Telegram contextual delivery', () => {
  it('scopes stored context by tenant and finalizes only the prepared assistant row', () => {
    const contextSource = readFileSync(resolve(process.cwd(), 'lib/ai/kia/kia-telegram-context.ts'), 'utf8');
    const routeSource = readFileSync(resolve(process.cwd(), 'app/api/webhooks/telegram/route.ts'), 'utf8');
    expect(contextSource).toContain("caseQuery.eq('tenant_id', tenantId)");
    expect(contextSource).toContain("caseQuery.is('tenant_id', null)");
    expect(contextSource).toContain("conversationQuery.eq('tenant_id', input.tenantId)");
    expect(routeSource).toContain(".eq('role', 'assistant')");
    expect(routeSource).toContain("delivery_state: 'prepared'");
  });

  it('accepts only the bounded opaque context payload', () => {
    const token = 'a'.repeat(32);
    expect(telegramContextPayload(`/start ctx_${token}`)).toBe(token);
    expect(telegramContextPayload(`/start@expert_bot ctx_${token}`)).toBe(token);
    expect(telegramContextPayload('/start case_personal-data')).toBeNull();
    expect(telegramContextPayload(`/start ctx_${token} extra`)).toBeNull();
  });
  it('returns the provider message id only after explicit acceptance', async () => {
    vi.stubEnv('TELEGRAM_BOT_TOKEN', 'synthetic-test-token');
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true, result: { message_id: 123 } })));
    vi.stubGlobal('fetch', fetcher);
    expect(await sendTelegramMessageConfirmed({ chatId: '42', text: 'Hello' })).toBe(123);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it('does not silently succeed or retry after an ambiguous network failure', async () => {
    vi.stubEnv('TELEGRAM_BOT_TOKEN', 'synthetic-test-token');
    const fetcher = vi.fn().mockRejectedValue(new Error('timeout'));
    vi.stubGlobal('fetch', fetcher);
    await expect(sendTelegramMessageConfirmed({ chatId: '42', text: 'Hello' })).rejects.toThrow('timeout');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it('rejects provider errors and missing configuration', async () => {
    vi.stubEnv('TELEGRAM_BOT_TOKEN', 'synthetic-test-token');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: false }), { status: 429 })));
    await expect(sendTelegramMessageConfirmed({ chatId: '42', text: 'Hello' })).rejects.toThrow('unconfirmed');
    vi.stubEnv('TELEGRAM_BOT_TOKEN', '');
    await expect(sendTelegramMessageConfirmed({ chatId: '42', text: 'Hello' })).rejects.toThrow('not_configured');
  });
});
