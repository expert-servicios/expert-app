import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function source(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('KIA M7.2b/M7.2c Telegram identity and routing', () => {
  it('requires active verified binding with matching Telegram user and chat ids', () => {
    const resolver = source('lib/ai/kia/kia-channel-identity.ts');
    expect(resolver).toContain(".eq('external_user_id', params.externalUserId)");
    expect(resolver).toContain(".eq('external_chat_id', params.externalChatId)");
    expect(resolver).toContain(".eq('status', 'active')");
    expect(resolver).toContain(".is('revoked_at', null)");
    expect(resolver).toContain('if (!identity?.verified_at) return null;');
    expect(resolver).toContain('profile.tenant_id !== identity.tenant_id');
  });

  it('keeps the binding table service-role only and without secrets', () => {
    const migration = source('supabase/migrations/20260916191059_kia_channel_identities.sql');
    expect(migration).toContain('enable row level security');
    expect(migration).toContain('revoke all on table public.kia_channel_identities from anon, authenticated');
    expect(migration).toContain('grant select, insert, update on table public.kia_channel_identities to service_role');
    expect(migration).not.toContain('bot_token');
    expect(migration).not.toContain('webhook_secret');
  });

  it('routes only verified Telegram identities through policy-enforced KIA', () => {
    const route = source('app/api/webhooks/telegram/route.ts');
    expect(route).toContain('resolveVerifiedTelegramIdentity');
    expect(route).toContain('if (!identity)');
    expect(route).toContain('actor.tenantId !== identity.tenantId');
    expect(route).toContain("resolveKiaPolicyToolNames('telegram_verified', actor)");
    expect(route).toContain("runPolicyEnforcedKiaDecision('telegram_verified', actor");
    expect(route).toContain('KIA_TELEGRAM_TOOLS_ENABLED');
    expect(route).not.toContain('runKiaOrchestratedDecision');
  });
});
