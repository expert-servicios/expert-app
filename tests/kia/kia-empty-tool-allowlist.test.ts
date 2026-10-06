import { describe, expect, it } from 'vitest';
import {
  isKiaToolAuthorized,
  resolveKiaToolDefinitions,
  type KiaToolAuthorizationContext,
} from '@/lib/ai/kia/kia-tool-registry';

describe('KIA empty tool allowlist', () => {
  it('means deny-all rather than no restriction', () => {
    const context: KiaToolAuthorizationContext = {
      channel: 'email',
      requestedNames: [],
      maxRiskTier: 'R2',
      allowedEffects: ['read', 'external_action'],
      autonomousOnly: false,
    };
    expect(resolveKiaToolDefinitions(context)).toEqual([]);
    expect(isKiaToolAuthorized('create_booking_meeting', context)).toBe(false);
    expect(isKiaToolAuthorized('get_case_status', context)).toBe(false);
  });
});
