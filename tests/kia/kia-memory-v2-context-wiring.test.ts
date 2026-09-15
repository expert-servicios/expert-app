import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('KIA Memory v2 context wiring', () => {
  const contextBuilder = source('lib/ai/kia/kia-context-builder.ts');

  it('keeps Memory v2 read disabled unless the explicit flag is true', () => {
    expect(contextBuilder).toContain("process.env.KIA_MEMORY_V2_READ_ENABLED?.toLowerCase() === 'true'");
  });

  it('uses the authorized company id and requested case id for v2 anchors', () => {
    expect(contextBuilder).toContain('companyId: resolvedCompanyId');
    expect(contextBuilder).toContain('caseId: input.caseId ?? null');
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
