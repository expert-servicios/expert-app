import type { getSupabaseAdmin } from '@/lib/integrations/supabase';

type AdminClient = ReturnType<typeof getSupabaseAdmin>;

export async function loadKiaConversation(input: {
  admin: AdminClient;
  conversationId: string;
  profileId: string;
  companyId?: string | null;
}) {
  const { data: conversation, error } = await input.admin
    .from('kia_conversations')
    .select('id,profile_id,company_id,case_id,service_slug,topic,status,channel,metadata')
    .eq('id', input.conversationId)
    .eq('profile_id', input.profileId)
    .maybeSingle();

  if (error) throw error;
  if (!conversation || conversation.status !== 'active') return null;
  if ((conversation.company_id ?? null) !== (input.companyId ?? null)) return null;

  const { data: messages, error: messagesError } = await input.admin
    .from('kia_conversation_messages')
    .select('role,body,created_at')
    .eq('conversation_id', conversation.id)
    .in('role', ['user','assistant'])
    .order('created_at', { ascending: false })
    .limit(12);

  if (messagesError) throw messagesError;

  return {
    conversation,
    messages: (messages ?? [])
      .reverse()
      .map((row) => ({
        role: row.role as 'user' | 'assistant',
        text: row.body,
        createdAt: row.created_at,
      })),
  };
}

export async function persistKiaConversationTurn(input: {
  admin: AdminClient;
  conversationId?: string;
  tenantId?: string | null;
  profileId: string;
  companyId?: string | null;
  caseId?: string | null;
  serviceSlug?: string | null;
  topic?: string | null;
  originType?: 'email' | 'dashboard' | 'telegram' | 'waba' | 'system';
  channel: 'dashboard' | 'telegram' | 'waba' | 'email';
  userMessage: string;
  assistantMessage: string;
  intent?: string | null;
  avatarState?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const now = new Date().toISOString();
  let conversationId = input.conversationId;

  if (!conversationId) {
    const { data: created, error } = await input.admin
      .from('kia_conversations')
      .insert({
        tenant_id: input.tenantId ?? null,
        profile_id: input.profileId,
        channel: input.channel,
        company_id: input.companyId ?? null,
        case_id: input.caseId ?? null,
        service_slug: input.serviceSlug ?? null,
        topic: input.topic ?? null,
        status: 'active',
        origin_type: input.originType ?? input.channel,
        metadata: input.metadata ?? {},
        last_message_at: now,
      })
      .select('id')
      .single();
    if (error) throw error;
    conversationId = created.id;
  } else {
    const { error } = await input.admin
      .from('kia_conversations')
      .update({
        case_id: input.caseId ?? null,
        service_slug: input.serviceSlug ?? null,
        topic: input.topic ?? null,
        last_message_at: now,
        updated_at: now,
      })
      .eq('id', conversationId)
      .eq('profile_id', input.profileId);
    if (error) throw error;
  }

  const { error: messageError } = await input.admin
    .from('kia_conversation_messages')
    .insert([
      {
        conversation_id: conversationId,
        tenant_id: input.tenantId ?? null,
        profile_id: input.profileId,
        channel: input.channel,
        role: 'user',
        body: input.userMessage,
        metadata: input.metadata ?? {},
      },
      {
        conversation_id: conversationId,
        tenant_id: input.tenantId ?? null,
        profile_id: input.profileId,
        channel: input.channel,
        role: 'assistant',
        body: input.assistantMessage,
        intent: input.intent ?? null,
        avatar_state: input.avatarState ?? null,
        metadata: input.metadata ?? {},
      },
    ]);
  if (messageError) throw messageError;

  return conversationId;
}
