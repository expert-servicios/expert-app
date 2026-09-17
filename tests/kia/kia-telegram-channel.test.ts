import { describe, expect, it } from 'vitest';
import { ROLES } from '@/lib/auth/roles';
import { KIA_CHANNELS } from '@/lib/ai/kia/kia-output-schema';
import {
  getKiaPolicyProfile,
  resolveKiaPolicyProfile,
} from '@/lib/ai/kia/kia-policy-profiles';
import { resolveKiaToolDefinitions } from '@/lib/ai/kia/kia-tool-registry';
import { shouldFailClosedChatOrchestration } from '@/lib/ai/kia/kia-orchestrator';
import { escapeTelegramHtml } from '@/lib/integrations/telegram';

describe('KIA verified Telegram channel', () => {
  it('registers Telegram as a first-class KIA channel', () => {
    expect(KIA_CHANNELS).toContain('telegram');
  });

  it('keeps telegram_verified at R1 read-only autonomous ceiling', () => {
    const profile = getKiaPolicyProfile('telegram_verified');
    expect(profile.channel).toBe('telegram');
    expect(profile.maxRiskTier).toBe('R1');
    expect(profile.futureRiskCeiling).toBe('R1');
    expect(profile.allowedEffects).toEqual(['read']);
    expect(profile.autonomousOnly).toBe(true);
    expect(profile.requiredScopes).toContain('kia:authenticated');
  });

  it('denies Telegram policy without authenticated actor scope', () => {
    const denied = resolveKiaPolicyProfile('telegram_verified', {
      role: ROLES.CLIENT,
      scopes: [],
    });
    expect(denied.ok).toBe(false);
    expect(denied.reason).toBe('missing_scope');

    const allowed = resolveKiaPolicyProfile('telegram_verified', {
      role: ROLES.CLIENT,
      scopes: ['kia:authenticated'],
    });
    expect(allowed.ok).toBe(true);
  });

  it('only exposes autonomous R0/R1 read tools on Telegram', () => {
    const names = resolveKiaToolDefinitions({
      channel: 'telegram',
      maxRiskTier: 'R1',
      allowedEffects: ['read'],
      autonomousOnly: true,
    }).map((tool) => tool.name);

    expect(names).toContain('get_client_profile');
    expect(names).toContain('get_case_status');
    expect(names).not.toContain('create_internal_task');
    expect(names).not.toContain('create_next_best_action');
    expect(names).not.toContain('create_kia_decision_log');
  });

  it('fails tools closed when chat classification or skill is unresolved', () => {
    expect(shouldFailClosedChatOrchestration({
      chatEntrypoint: true,
      classificationResolved: false,
      skillId: null,
      needsClarification: false,
    })).toBe(true);

    expect(shouldFailClosedChatOrchestration({
      chatEntrypoint: true,
      classificationResolved: true,
      skillId: null,
      needsClarification: false,
    })).toBe(true);

    expect(shouldFailClosedChatOrchestration({
      chatEntrypoint: true,
      classificationResolved: true,
      skillId: 'fiscal.viability',
      needsClarification: false,
    })).toBe(false);
  });

  it('escapes dynamic KIA output before Telegram HTML delivery', () => {
    expect(escapeTelegramHtml('5 < 7 & 9 > 2')).toBe('5 &lt; 7 &amp; 9 &gt; 2');
  });
});
