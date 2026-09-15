import { describe, expect, it } from 'vitest';
import {
  hasRequiredScopeAnchor,
  validateKiaMemoryDescriptor,
  type KiaMemoryV2Descriptor,
} from '@/lib/ai/kia/kia-memory-v2';

function memory(overrides: Partial<KiaMemoryV2Descriptor> = {}): KiaMemoryV2Descriptor {
  return {
    scope: 'user',
    clientId: '11111111-1111-1111-1111-111111111111',
    retentionPolicy: 'standard',
    provenance: {
      sourceType: 'conversation',
      confidence: 0.9,
    },
    permissions: {
      read: ['kia'],
      write: ['kia'],
    },
    version: 1,
    ...overrides,
  };
}

describe('KIA Memory v2 scope anchors', () => {
  it.each([
    ['working', { sessionId: '11111111-1111-1111-1111-111111111111' }],
    ['user', { clientId: '11111111-1111-1111-1111-111111111111' }],
    ['company', { companyId: '11111111-1111-1111-1111-111111111111' }],
    ['case', { caseId: '11111111-1111-1111-1111-111111111111' }],
    ['professional', { professionalId: '11111111-1111-1111-1111-111111111111' }],
    ['knowledge', {}],
  ] as const)('accepts %s with its required anchor', (scope, anchors) => {
    const descriptor = memory({
      scope,
      clientId: null,
      leadId: null,
      phone: null,
      ...anchors,
    });

    expect(hasRequiredScopeAnchor(descriptor)).toBe(true);
    expect(validateKiaMemoryDescriptor(descriptor)).toEqual([]);
  });

  it.each(['working', 'user', 'company', 'case', 'professional'] as const)(
    'rejects unanchored %s memories',
    (scope) => {
      const descriptor = memory({
        scope,
        clientId: null,
        leadId: null,
        phone: null,
        companyId: null,
        caseId: null,
        professionalId: null,
        sessionId: null,
      });

      expect(validateKiaMemoryDescriptor(descriptor)).toContain(`missing_scope_anchor:${scope}`);
    },
  );

  it('rejects invalid confidence and version', () => {
    const descriptor = memory({
      provenance: { sourceType: 'derived', confidence: 1.2 },
      version: 0,
    });

    expect(validateKiaMemoryDescriptor(descriptor)).toEqual([
      'invalid_confidence',
      'invalid_version',
    ]);
  });
});
