import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { hashTelegramLinkCode } from '@/lib/ai/kia/kia-telegram-linking';

function source(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('KIA M7.2d Telegram linking', () => {
  it('hashes link codes deterministically without storing plaintext', () => {
    const hash = hashTelegramLinkCode('sample-code');
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(hashTelegramLinkCode(' sample-code ')).toBe(hash);

    const migration = source('supabase/migrations/20260916211014_kia_telegram_link_tokens.sql');
    expect(migration).toContain('token_hash text not null unique');
    expect(migration).not.toContain('token_plaintext');
    expect(migration).not.toContain('bot_token');
  });

  it('requires expiry, single consumption, active profile and tenant consistency', () => {
    const migration = source('supabase/migrations/20260916211014_kia_telegram_link_tokens.sql');
    expect(migration).toContain('v_token.consumed_at is not null');
    expect(migration).toContain('v_token.expires_at <= now()');
    expect(migration).toContain("v_profile.status = 'inactive'");
    expect(migration).toContain('v_profile.tenant_id <> v_token.tenant_id');
    expect(migration).toContain('KIA_TELEGRAM_LINK_IDENTITY_CONFLICT');
    expect(migration).toContain('set consumed_at = now()');
  });

  it('keeps link tokens service-role only and consume RPC service-role only', () => {
    const migration = source('supabase/migrations/20260916211014_kia_telegram_link_tokens.sql');
    expect(migration).toContain('revoke all on table public.kia_channel_link_tokens from anon, authenticated, service_role');
    expect(migration).toContain('grant select, insert, update on table public.kia_channel_link_tokens to service_role');
    expect(migration).toContain('revoke all on function public.kia_consume_telegram_link_token');
    expect(migration).toContain('grant execute on function public.kia_consume_telegram_link_token');
    expect(migration).toContain("set search_path = ''");
  });

  it('supports one-tap deep-link linking from the authenticated KIA widget', () => {
    const api = source('app/api/ai/kia/telegram-link/route.ts');
    const webhook = source('app/api/webhooks/telegram/route.ts');
    const widget = source('components/KiaCopilotWidget.tsx');
    expect(api).toContain('deepLink: `https://t.me/kia_expert_bot?start=link_');
    expect(webhook).toContain("startPayload.startsWith('link_')");
    expect(webhook).toContain("via: 'deep_link'");
    expect(widget).toContain("fetch('/api/ai/kia/telegram-link'");
    expect(widget).toContain('Conectar Telegram');
  });

  it('issues codes only from an authenticated EXPERT session', () => {
    const route = source('app/api/ai/kia/telegram-link/route.ts');
    expect(route).toContain('createServerSupabaseClient(request)');
    expect(route).toContain('supabase.auth.getUser()');
    expect(route).toContain("profile.status === 'inactive'");
    expect(route).not.toContain('!profile.tenant_id');
    expect(route).toContain('createTelegramLinkCode');
  });

  it('consumes /link before normal KIA identity routing and before the client rollout gate', () => {
    const route = source('app/api/webhooks/telegram/route.ts');
    expect(route).toContain("if (command === '/link')");
    expect(route).toContain('consumeTelegramLinkCode');
    expect(route).toContain('externalUserId: inbound.userId');
    expect(route).toContain('externalChatId: inbound.chatId');
    expect(route).toContain('resolveVerifiedTelegramIdentity');
    expect(route.indexOf("if (command === '/link')")).toBeLessThan(route.indexOf("if (!adminChat && !telegramClientsEnabled)"));
    expect(route.indexOf("startPayload.startsWith('link_')")).toBeLessThan(route.indexOf("if (!adminChat && !telegramClientsEnabled)"));
  });
});
