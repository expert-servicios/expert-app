import { describe, expect, it } from 'vitest';
import {
  canPrincipalReadKiaMemory,
  validateKiaMemoryReadRequest,
  type KiaMemoryV2ReadInput,
} from '@/lib/ai/kia/kia-memory-v2-runtime';

function readRequest(overrides: Partial<KiaMemoryV2ReadInput> = {}): KiaMemoryV2ReadInput {
  return {
    query: 'estado fiscal de la empresa',
    scopes: ['company'],
    principal: 'kia:professional',
    companyId: '11111111-1111-1111-1111-111111111111',
    openAiApiKey: 'test-key',
    supabase: {} as KiaMemoryV2ReadInput['supabase'],
    ...overrides,
  };
}

describe('KIA Memory v2 runtime guards', () => {
  it('requires exact anchors for scoped retrieval', () => {
    expect(validateKiaMemoryReadRequest(readRequest())).toEqual([]);
    expect(validateKiaMemoryReadRequest(readRequest({ companyId: null }))).toContain('missing_anchor:company');
    expect(validateKiaMemoryReadRequest(readRequest({ scopes: ['case'], caseId: null }))).toContain('missing_anchor:case');
    expect(validateKiaMemoryReadRequest(readRequest({ scopes: ['working'], sessionId: null }))).toContain('missing_anchor:working');
  });

  it('requires at least one user identity anchor for user scope', () => {
    expect(validateKiaMemoryReadRequest(readRequest({
      scopes: ['user'],
      companyId: null,
      clientId: null,
      leadId: null,
      phone: null,
    }))).toContain('missing_anchor:user');
  });

  it('requires tenant anchoring for knowledge retrieval', () => {
    expect(validateKiaMemoryReadRequest(readRequest({
      scopes: ['knowledge'],
      companyId: null,
      tenantId: null,
    }))).toContain('missing_anchor:knowledge_tenant');
    expect(validateKiaMemoryReadRequest(readRequest({
      scopes: ['knowledge'],
      companyId: null,
      tenantId: '22222222-2222-2222-2222-222222222222',
    }))).toEqual([]);
  });

  it('fails closed when query, scopes or principal are missing', () => {
    expect(validateKiaMemoryReadRequest(readRequest({ query: ' ' }))).toContain('missing_query');
    expect(validateKiaMemoryReadRequest(readRequest({ scopes: [] }))).toContain('missing_scopes');
    expect(validateKiaMemoryReadRequest(readRequest({ principal: ' ' }))).toContain('missing_principal');
  });

  it('enforces exact memory-level read principals', () => {
    expect(canPrincipalReadKiaMemory({ read: ['kia:professional'] }, 'kia:professional')).toBe(true);
    expect(canPrincipalReadKiaMemory({ read: ['kia:admin'] }, 'kia:professional')).toBe(false);
    expect(canPrincipalReadKiaMemory({ read: ['kia'] }, 'kia:professional')).toBe(false);
    expect(canPrincipalReadKiaMemory({ read: ['*'] }, 'kia:professional')).toBe(true);
    expect(canPrincipalReadKiaMemory({}, 'kia:professional')).toBe(false);
  });
});
