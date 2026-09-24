import type { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { resolveKiaContextToken } from './kia-context-token';
import { loadKiaConversation } from './kia-conversation-store';

type Admin = ReturnType<typeof getSupabaseAdmin>;
export function telegramContextPayload(text: string): string | null {
  return text.match(/^\/start(?:@\w+)? ctx_([A-Za-z0-9_-]{32})$/)?.[1] ?? null;
}

export async function findCaseConversation(
  admin: Admin,
  profileId: string,
  tenantId: string | null,
  caseId: string,
  companyId: string | null,
) {
  const caseQuery = admin.from('cases').select('client_id,company_id,tenant_id')
    .eq('id', caseId).eq('client_id', profileId);
  const { data: owned, error: ownerError } = await (
    tenantId ? caseQuery.eq('tenant_id', tenantId) : caseQuery.is('tenant_id', null)
  ).maybeSingle();
  if (ownerError) throw ownerError;
  if (!owned || (owned.company_id ?? null) !== companyId) return null;

  const conversationQuery = admin.from('kia_conversations').select('id,company_id,tenant_id')
    .eq('profile_id', profileId).eq('case_id', caseId).eq('status', 'active');
  const { data, error } = await (
    tenantId ? conversationQuery.eq('tenant_id', tenantId) : conversationQuery.is('tenant_id', null)
  ).order('updated_at', { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;
  if (!data || (data.company_id ?? null) !== companyId) return null;
  return loadKiaConversation({ admin, conversationId: data.id, profileId, companyId });
}

export async function loadTelegramCaseContext(input: { admin: Admin; profileId: string; tenantId: string | null;
  chatId: string; text: string }) {
  const token = telegramContextPayload(input.text);
  if (token) {
    const context = await resolveKiaContextToken({ admin: input.admin, token, profileId: input.profileId, tenantId: input.tenantId });
    if (!context?.case_id) throw new Error('invalid_context');
    return { caseId: context.case_id as string, companyId: (context.company_id ?? null) as string | null,
      serviceSlug: context.service_slug as string | null,
      stored: await findCaseConversation(input.admin, input.profileId, input.tenantId, context.case_id, context.company_id ?? null), opened: true };
  }

  const conversationQuery = input.admin.from('kia_conversations').select('id,case_id,company_id,service_slug,tenant_id')
    .eq('profile_id', input.profileId).eq('status', 'active').contains('metadata', { telegram_chat_id: input.chatId });
  const { data, error } = await (
    input.tenantId ? conversationQuery.eq('tenant_id', input.tenantId) : conversationQuery.is('tenant_id', null)
  ).order('updated_at', { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;
  if (!data?.case_id) return null;
  const stored = await findCaseConversation(input.admin, input.profileId, input.tenantId, data.case_id, data.company_id ?? null);
  if (!stored) throw new Error('invalid_context');
  return { caseId: data.case_id as string, companyId: (data.company_id ?? null) as string | null,
    serviceSlug: data.service_slug as string | null, stored, opened: false };
}
