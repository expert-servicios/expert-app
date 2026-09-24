import { afterEach, describe, expect, it, vi } from 'vitest';
import { telegramContextPayload } from '@/lib/ai/kia/kia-telegram-context';
import { sendTelegramMessageConfirmed } from '@/lib/integrations/telegram';
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
describe('Telegram contextual delivery', () => {
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
