import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  isConfiguredTelegramAdminChat,
  isTelegramWebhookAuthorized,
  parseTelegramInboundMessage,
} from '@/lib/integrations/telegram';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('Telegram inbound foundation', () => {
  it('fails closed when webhook secret is missing or mismatched', () => {
    vi.stubEnv('TELEGRAM_WEBHOOK_SECRET', 'secret-123');
    expect(isTelegramWebhookAuthorized(null)).toBe(false);
    expect(isTelegramWebhookAuthorized('wrong')).toBe(false);
    expect(isTelegramWebhookAuthorized('secret-123')).toBe(true);
  });

  it('parses a text update without trusting Telegram identity as EXPERT identity', () => {
    expect(parseTelegramInboundMessage({
      update_id: 10,
      message: {
        message_id: 20,
        text: '  /status  ',
        chat: { id: 12345 },
        from: { id: 67890, username: 'ksenia' },
      },
    })).toEqual({
      updateId: 10,
      messageId: 20,
      chatId: '12345',
      userId: '67890',
      username: 'ksenia',
      text: '/status',
    });
  });

  it('ignores unsupported or empty updates', () => {
    expect(parseTelegramInboundMessage({ update_id: 1 })).toBeNull();
    expect(parseTelegramInboundMessage({
      update_id: 1,
      message: { message_id: 2, text: '   ', chat: { id: 3 } },
    })).toBeNull();
  });

  it('restricts the foundation route to the configured admin chat', () => {
    vi.stubEnv('TELEGRAM_ADMIN_CHAT_ID', '12345');
    expect(isConfiguredTelegramAdminChat('12345')).toBe(true);
    expect(isConfiguredTelegramAdminChat('999')).toBe(false);
  });
});
