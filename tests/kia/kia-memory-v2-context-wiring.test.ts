import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('KIA Memory v2 context wiring', () => {
  const contextBuilder = source('lib/ai/kia/kia-context-builder.ts');
  const memoryContext = source('lib/ai/kia/kia-memory-v2-context.ts');

  it('keeps Memory v2 read disabled unless the explicit flag is true', () => {
    expect(contextBuilder).toContain("process.env.KIA_MEMORY_V2_READ_ENABLED?.toLowerCase() === 'true'");
  });

  it('fails closed without a user identity anchor', () => {
    expect(memoryContext).toContain('const hasUserAnchor = Boolean(input.clientId || input.leadId || input.phone)');
    expect(memoryContext).toContain('if (!hasUserAnchor || !input.query.trim() || !input.openAiApiKey.trim()) return []');
  });

  it('does not trust company scope without a client identity', () => {
    expect(memoryContext).toContain('const effectiveCompanyId = input.clientId ? input.companyId ?? null : null');
    expect(memoryContext).toContain("if (input.clientId && input.companyId) scopes.push('company')");
  });

  it('does not use the raw requested case id as a v2 anchor', () => {
    expect(memoryContext).toContain('authorizedCaseId?: string | null');
    expect(memoryContext).toContain('const effectiveCaseId = input.authorizedCaseId ?? null');
    expect(memoryContext).toContain("if (input.authorizedCaseId) scopes.push('case')");
    expect(memoryContext).not.toContain("if (input.caseId) scopes.push('case')");
  });

  it('keeps knowledge excluded unless explicitly requested with tenant context', () => {
    expect(memoryContext).toContain("if (input.includeKnowledge === true && input.tenantId) scopes.push('knowledge')");
  });

  it('replaces the broad kia principal with a scoped identity principal', () => {
    expect(memoryContext).toContain("if (requested && requested !== 'kia') return requested");
    expect(memoryContext).toContain('return `kia:client:${input.clientId}`');
    expect(memoryContext).toContain('return `kia:lead:${input.leadId}`');
    expect(memoryContext).toContain('return `kia:phone:${input.phone}`');
  });

  it('fails open to legacy memory if v2 retrieval fails', () => {
    expect(contextBuilder).toContain('let memories = legacyMemories');
    expect(contextBuilder).toContain('loadKiaMemoryV2Context({');
    expect(contextBuilder).toContain('}).catch(() => [])');
    expect(contextBuilder).toContain('mergeKiaMemoryContexts(legacyMemories, memoryV2)');
  });

  it('does not enable Memory v2 writes', () => {
    expect(contextBuilder).not.toContain('storeKiaMemoryV2(');
  });
});
