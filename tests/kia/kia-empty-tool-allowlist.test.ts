import { describe, expect, it } from 'vitest';
import { isKiaToolAuthorized, resolveKiaToolDefinitions } from '@/lib/ai/kia/kia-tool-registry';

describe('KIA empty tool allowlist', () => {
  it('means deny-all rather than no restriction', () => {
    const context = {
      channel: 'email' as const,
      requestedNames: [],
      maxRiskTier: 'R2' as const,
      allowedEffects: ['read', 'external_action'] as const,
      autonomousOnly: false,
    };
    expect(resolveKiaToolDefinitions(context)).toEqual([]);
    expect(isKiaToolAuthorized('create_booking_meeting', context)).toBe(false);
    expect(isKiaToolAuthorized('get_case_status', context)).toBe(false);
  });
});
