import type { KiaMemory } from './kia-memory-retriever';
import {
  retrieveKiaMemoriesV2,
  type KiaMemoryV2ReadContext,
  type KiaMemoryV2Record,
} from './kia-memory-v2-runtime';
import type { KiaMemoryScope } from './kia-memory-v2';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';

type AdminClient = ReturnType<typeof getSupabaseAdmin>;

export interface KiaMemoryV2ContextInput extends KiaMemoryV2ReadContext {
  query: string;
  openAiApiKey: string;
  supabase: AdminClient;
  principal?: string;
  includeKnowledge?: boolean;
}

export function resolveKiaMemoryV2Scopes(input: KiaMemoryV2ReadContext & { includeKnowledge?: boolean }): KiaMemoryScope[] {
  const scopes: KiaMemoryScope[] = [];

  if (input.sessionId) scopes.push('working');
  if (input.clientId || input.leadId || input.phone) scopes.push('user');
  if (input.companyId) scopes.push('company');
  if (input.caseId) scopes.push('case');
  if (input.professionalId) scopes.push('professional');
  if (input.includeKnowledge !== false) scopes.push('knowledge');

  return scopes;
}

export function toLegacyKiaMemory(record: KiaMemoryV2Record): KiaMemory {
  return {
    id: record.id,
    content: record.content,
    memoryType: record.memoryType,
    createdAt: record.createdAt,
    similarity: record.similarity,
  };
}

export function mergeKiaMemoryContexts(
  legacy: KiaMemory[],
  memoryV2: KiaMemoryV2Record[],
  limit = 8,
): KiaMemory[] {
  const byId = new Map<string, KiaMemory>();

  for (const item of memoryV2.map(toLegacyKiaMemory)) {
    byId.set(item.id, item);
  }
  for (const item of legacy) {
    if (!byId.has(item.id)) byId.set(item.id, item);
  }

  return [...byId.values()]
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, Math.max(1, limit));
}

export async function loadKiaMemoryV2Context(input: KiaMemoryV2ContextInput): Promise<KiaMemoryV2Record[]> {
  const scopes = resolveKiaMemoryV2Scopes(input);
  if (!input.query.trim() || !input.openAiApiKey.trim() || scopes.length === 0) return [];

  return retrieveKiaMemoriesV2({
    query: input.query,
    scopes,
    principal: input.principal ?? 'kia',
    openAiApiKey: input.openAiApiKey,
    supabase: input.supabase,
    tenantId: input.tenantId ?? null,
    clientId: input.clientId ?? null,
    leadId: input.leadId ?? null,
    phone: input.phone ?? null,
    companyId: input.companyId ?? null,
    caseId: input.caseId ?? null,
    professionalId: input.professionalId ?? null,
    sessionId: input.sessionId ?? null,
    limit: 8,
  });
}
