import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import {
  validateKiaMemoryDescriptor,
  type KiaMemoryScope,
  type KiaMemoryV2Descriptor,
} from './kia-memory-v2';

const EMBEDDING_MODEL = 'text-embedding-3-small';
const DEFAULT_SIMILARITY_THRESHOLD = 0.72;
const DEFAULT_LIMIT = 8;

type AdminClient = ReturnType<typeof getSupabaseAdmin>;

export interface KiaMemoryV2WriteInput extends KiaMemoryV2Descriptor {
  content: string;
  memoryType: 'conversation_summary' | 'key_fact' | 'preference' | 'service_interest';
  channel: string;
  openAiApiKey: string;
  metadata?: Record<string, unknown>;
}

export interface KiaMemoryV2ReadContext {
  tenantId?: string | null;
  clientId?: string | null;
  leadId?: string | null;
  phone?: string | null;
  companyId?: string | null;
  caseId?: string | null;
  professionalId?: string | null;
  sessionId?: string | null;
}

export interface KiaMemoryV2ReadInput extends KiaMemoryV2ReadContext {
  query: string;
  scopes: KiaMemoryScope[];
  principal: string;
  openAiApiKey: string;
  supabase: AdminClient;
  limit?: number;
  similarityThreshold?: number;
}

export interface KiaMemoryV2Record {
  id: string;
  content: string;
  memoryType: string;
  scope: KiaMemoryScope;
  sourceType: string;
  sourceRef: string | null;
  sourceTimestamp: string | null;
  confidence: number;
  retentionPolicy: string;
  permissions: { read?: string[]; write?: string[] };
  provenance: Record<string, unknown>;
  version: number;
  supersedesId: string | null;
  createdAt: string;
  updatedAt: string;
  similarity: number;
}

async function generateEmbedding(text: string, apiKey: string): Promise<number[]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
    body: JSON.stringify({ model: EMBEDDING_MODEL, input: text.slice(0, 8000) }),
  });

  if (!response.ok) throw new Error(`Embedding API error: HTTP ${response.status}`);
  const data = await response.json() as { data?: Array<{ embedding?: number[] }> };
  const embedding = data?.data?.[0]?.embedding;
  if (!Array.isArray(embedding)) throw new Error('Invalid embedding response');
  return embedding;
}

export function canPrincipalReadKiaMemory(
  permissions: { read?: string[] },
  principal: string,
): boolean {
  const readers = permissions.read ?? [];
  return readers.includes('*') || readers.includes(principal);
}

export function validateKiaMemoryReadRequest(input: KiaMemoryV2ReadInput): string[] {
  const errors: string[] = [];
  if (!input.query.trim()) errors.push('missing_query');
  if (!input.principal.trim()) errors.push('missing_principal');
  if (!input.scopes.length) errors.push('missing_scopes');

  for (const scope of input.scopes) {
    if (scope === 'working' && !input.sessionId) errors.push('missing_anchor:working');
    if (scope === 'user' && !(input.clientId || input.leadId || input.phone)) errors.push('missing_anchor:user');
    if (scope === 'company' && !input.companyId) errors.push('missing_anchor:company');
    if (scope === 'case' && !input.caseId) errors.push('missing_anchor:case');
    if (scope === 'professional' && !input.professionalId) errors.push('missing_anchor:professional');
    if (scope === 'knowledge' && !input.tenantId) errors.push('missing_anchor:knowledge_tenant');
  }

  return [...new Set(errors)];
}

export async function storeKiaMemoryV2(input: KiaMemoryV2WriteInput): Promise<string> {
  if (!input.content.trim()) throw new Error('KIA Memory v2 content is required');
  const descriptorErrors = validateKiaMemoryDescriptor(input);
  if (descriptorErrors.length > 0) {
    throw new Error(`Invalid KIA Memory v2 descriptor: ${descriptorErrors.join(',')}`);
  }
  if (!input.provenance.sourceType) throw new Error('KIA Memory v2 provenance sourceType is required');

  const embedding = await generateEmbedding(input.content, input.openAiApiKey);
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('kia_memories')
    .insert({
      client_id: input.clientId ?? null,
      lead_id: input.leadId ?? null,
      phone: input.phone ?? null,
      tenant_id: input.tenantId ?? null,
      company_id: input.companyId ?? null,
      case_id: input.caseId ?? null,
      professional_id: input.professionalId ?? null,
      session_id: input.sessionId ?? null,
      content: input.content.slice(0, 8000),
      embedding: `[${embedding.join(',')}]`,
      memory_type: input.memoryType,
      channel: input.channel,
      memory_scope: input.scope,
      source_type: input.provenance.sourceType,
      source_ref: input.provenance.sourceRef ?? null,
      source_timestamp: input.provenance.sourceTimestamp ?? null,
      confidence: input.provenance.confidence,
      retention_policy: input.retentionPolicy,
      expires_at: input.expiresAt ?? null,
      permissions: input.permissions,
      provenance: {
        sourceType: input.provenance.sourceType,
        sourceRef: input.provenance.sourceRef ?? null,
        sourceTimestamp: input.provenance.sourceTimestamp ?? null,
      },
      version: input.version,
      supersedes_id: input.supersedesId ?? null,
      metadata: input.metadata ?? {},
    })
    .select('id')
    .single();

  if (error || !data?.id) throw new Error(`KIA Memory v2 insert failed: ${error?.message ?? 'missing id'}`);
  return data.id as string;
}

export async function retrieveKiaMemoriesV2(input: KiaMemoryV2ReadInput): Promise<KiaMemoryV2Record[]> {
  const requestErrors = validateKiaMemoryReadRequest(input);
  if (requestErrors.length > 0) {
    throw new Error(`Invalid KIA Memory v2 read request: ${requestErrors.join(',')}`);
  }

  const embedding = await generateEmbedding(input.query, input.openAiApiKey);
  const { data, error } = await input.supabase.rpc('kia_memories_search_v2', {
    query_embedding: `[${embedding.join(',')}]`,
    scope_filter: input.scopes,
    tenant_id_filter: input.tenantId ?? null,
    client_id_filter: input.clientId ?? null,
    lead_id_filter: input.leadId ?? null,
    phone_filter: input.phone ?? null,
    company_id_filter: input.companyId ?? null,
    case_id_filter: input.caseId ?? null,
    professional_id_filter: input.professionalId ?? null,
    session_id_filter: input.sessionId ?? null,
    similarity_threshold: input.similarityThreshold ?? DEFAULT_SIMILARITY_THRESHOLD,
    match_count: input.limit ?? DEFAULT_LIMIT,
  });

  if (error) throw new Error(`KIA Memory v2 retrieval failed: ${error.message}`);

  return ((data ?? []) as Array<{
    id: string;
    content: string;
    memory_type: string;
    memory_scope: KiaMemoryScope;
    source_type: string;
    source_ref: string | null;
    source_timestamp: string | null;
    confidence: number | string;
    retention_policy: string;
    permissions: { read?: string[]; write?: string[] } | null;
    provenance: Record<string, unknown> | null;
    version: number;
    supersedes_id: string | null;
    created_at: string;
    updated_at: string;
    similarity: number;
  }>)
    .filter((row) => canPrincipalReadKiaMemory(row.permissions ?? {}, input.principal))
    .map((row) => ({
      id: row.id,
      content: row.content,
      memoryType: row.memory_type,
      scope: row.memory_scope,
      sourceType: row.source_type,
      sourceRef: row.source_ref,
      sourceTimestamp: row.source_timestamp,
      confidence: Number(row.confidence),
      retentionPolicy: row.retention_policy,
      permissions: row.permissions ?? {},
      provenance: row.provenance ?? {},
      version: row.version,
      supersedesId: row.supersedes_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      similarity: row.similarity,
    }));
}
