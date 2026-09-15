import { describe, expect, it } from 'vitest';
import {
  mergeKiaMemoryContexts,
  resolveKiaMemoryV2Scopes,
  toLegacyKiaMemory,
} from '@/lib/ai/kia/kia-memory-v2-context';
import type { KiaMemory } from '@/lib/ai/kia/kia-memory-retriever';
import type { KiaMemoryV2Record } from '@/lib/ai/kia/kia-memory-v2-runtime';

function v2(overrides: Partial<KiaMemoryV2Record> = {}): KiaMemoryV2Record {
  return {
    id: 'v2-1',
    content: 'empresa con incidencia fiscal pendiente',
    memoryType: 'key_fact',
    scope: 'company',
    sourceType: 'professional',
    sourceRef: 'case:1',
    sourceTimestamp: null,
    confidence: 0.95,
    retentionPolicy: 'long',
    permissions: { read: ['kia'] },
    provenance: {},
    version: 1,
    supersedesId: null,
    createdAt: '2026-09-15T10:00:00.000Z',
    updatedAt: '2026-09-15T10:00:00.000Z',
    similarity: 0.91,
    ...overrides,
  };
}

describe('KIA Memory v2 context adapter', () => {
  it('selects only scopes backed by available context anchors', () => {
    expect(resolveKiaMemoryV2Scopes({
      clientId: 'client-1',
      companyId: 'company-1',
      caseId: 'case-1',
    })).toEqual(['user', 'company', 'case', 'knowledge']);

    expect(resolveKiaMemoryV2Scopes({ includeKnowledge: false })).toEqual([]);
    expect(resolveKiaMemoryV2Scopes({ professionalId: 'p-1' })).toEqual(['professional', 'knowledge']);
  });

  it('maps v2 records into the legacy prompt memory shape', () => {
    expect(toLegacyKiaMemory(v2())).toEqual({
      id: 'v2-1',
      content: 'empresa con incidencia fiscal pendiente',
      memoryType: 'key_fact',
      createdAt: '2026-09-15T10:00:00.000Z',
      similarity: 0.91,
    });
  });

  it('prefers v2 on duplicate ids and sorts by similarity', () => {
    const legacy: KiaMemory[] = [
      { id: 'same', content: 'legacy', memoryType: 'key_fact', createdAt: '2026-09-14T10:00:00.000Z', similarity: 0.4 },
      { id: 'legacy-2', content: 'legacy high', memoryType: 'key_fact', createdAt: '2026-09-14T10:00:00.000Z', similarity: 0.8 },
    ];
    const modern = [
      v2({ id: 'same', content: 'v2 authoritative', similarity: 0.95 }),
      v2({ id: 'v2-2', content: 'v2 second', similarity: 0.7 }),
    ];

    expect(mergeKiaMemoryContexts(legacy, modern)).toEqual([
      expect.objectContaining({ id: 'same', content: 'v2 authoritative', similarity: 0.95 }),
      expect.objectContaining({ id: 'legacy-2', similarity: 0.8 }),
      expect.objectContaining({ id: 'v2-2', similarity: 0.7 }),
    ]);
  });

  it('respects the merged context limit', () => {
    const legacy: KiaMemory[] = Array.from({ length: 5 }, (_, i) => ({
      id: `legacy-${i}`,
      content: String(i),
      memoryType: 'key_fact',
      createdAt: '2026-09-14T10:00:00.000Z',
      similarity: 0.5 - i * 0.01,
    }));

    expect(mergeKiaMemoryContexts(legacy, [v2()], 3)).toHaveLength(3);
  });
});
