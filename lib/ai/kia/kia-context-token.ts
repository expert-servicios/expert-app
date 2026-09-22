import { createHash, randomBytes } from 'node:crypto';
import type { getSupabaseAdmin } from '@/lib/integrations/supabase';

type AdminClient = ReturnType<typeof getSupabaseAdmin>;
const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function generateKiaContextToken(): string {
  return randomBytes(24).toString('base64url');
}

export function hashKiaContextToken(token: string): string {
  return createHash('sha256').update(token.trim()).digest('hex');
}

export async function createKiaContextToken(input: {
  admin: AdminClient;
  tenantId?: string | null;
  profileId: string;
  companyId?: string | null;
  caseId?: string | null;
  serviceSlug?: string | null;
  taskId?: string | null;
  originType: 'email' | 'dashboard' | 'telegram' | 'system';
  originRef?: string | null;
  intentHint?: string | null;
  metadata?: Record<string, unknown>;
  ttlMs?: number;
}) {
  const token = generateKiaContextToken();
  const expiresAt = new Date(Date.now() + (input.ttlMs ?? DEFAULT_TTL_MS)).toISOString();
  const { error } = await input.admin.from('kia_context_tokens').insert({
    tenant_id: input.tenantId ?? null,
    profile_id: input.profileId,
    token_hash: hashKiaContextToken(token),
    company_id: input.companyId ?? null,
    case_id: input.caseId ?? null,
    service_slug: input.serviceSlug ?? null,
    task_id: input.taskId ?? null,
    origin_type: input.originType,
    origin_ref: input.originRef ?? null,
    intent_hint: input.intentHint ?? null,
    metadata: input.metadata ?? {},
    expires_at: expiresAt,
  });
  if (error) throw error;
  return { token, expiresAt };
}

export async function resolveKiaContextToken(input: {
  admin: AdminClient;
  token: string;
  profileId: string;
  tenantId?: string | null;
}) {
  const { data, error } = await input.admin
    .from('kia_context_tokens')
    .select('id,tenant_id,profile_id,company_id,case_id,service_slug,task_id,origin_type,origin_ref,intent_hint,metadata,expires_at,revoked_at')
    .eq('token_hash', hashKiaContextToken(input.token))
    .maybeSingle();

  if (error) throw error;
  if (!data || data.revoked_at || new Date(data.expires_at) <= new Date()) return null;
  if (data.profile_id !== input.profileId) return null;
  if ((data.tenant_id ?? null) !== (input.tenantId ?? null)) return null;

  if (data.case_id) {
    const { data: ownedCase, error: caseError } = await input.admin
      .from('cases')
      .select('id,client_id,company_id')
      .eq('id', data.case_id)
      .eq('client_id', input.profileId)
      .maybeSingle();
    if (caseError) throw caseError;
    if (!ownedCase) return null;
    if (data.company_id && ownedCase.company_id && data.company_id !== ownedCase.company_id) return null;
  }

  if (data.company_id) {
    const { data: membership, error: membershipError } = await input.admin
      .from('profile_companies')
      .select('company_id')
      .eq('profile_id', input.profileId)
      .eq('company_id', data.company_id)
      .maybeSingle();
    if (membershipError) throw membershipError;
    if (!membership) return null;
  }

  await input.admin.from('kia_context_tokens').update({ last_used_at: new Date().toISOString() }).eq('id', data.id);
  return data;
}
