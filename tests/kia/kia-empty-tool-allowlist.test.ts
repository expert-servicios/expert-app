import { describe, expect, it } from 'vitest';
import { resolveKiaToolDefinitions } from '@/lib/ai/kia/kia-tool-registry';

describe('KIA empty tool allowlist', () => {
  it('means deny-all rather than no restriction', () => {
    expect(resolveKiaToolDefinitions({
      channel: 'email',
      requestedNames: [],
      maxRiskTier: 'R2',
      allowedEffects: ['read', 'external_action'],
      autonomousOnly: false,
    })).toEqual([]);
  });
});
