import type { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { recordClientRegistryEvent } from './kia-client-ledger';

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
    .select('role,body,created_at,metadata')
    .eq('conversation_id', conversation.id)
    .in('role', ['user','assistant'])
    .order('created_at', { ascending: false })
    .limit(12);

  if (messagesError) throw messagesError;

  return {
    conversation,
    messages: (messages ?? [])
      .filter(row => row.role !== 'assistant' || !['prepared', 'failed'].includes(row.metadata?.delivery_state))
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
    const { data: existing, error: lookupError } = await input.admin.from('kia_conversations')
      .select('id,company_id,case_id,metadata,status,tenant_id').eq('id', conversationId).eq('profile_id', input.profileId).maybeSingle();
    if (lookupError) throw lookupError;
    if (!existing || existing.status !== 'active' || (existing.company_id ?? null) !== (input.companyId ?? null)
      || (existing.case_id ?? null) !== (input.caseId ?? null)
      || (existing.tenant_id ?? null) !== (input.tenantId ?? null)) throw new Error('conversation_scope_changed');
    const { error } = await input.admin
      .from('kia_conversations')
      .update({
        case_id: input.caseId ?? null,
        service_slug: input.serviceSlug ?? null,
        topic: input.topic ?? null,
        last_message_at: now,
        updated_at: now,
        metadata: { ...existing.metadata, ...input.metadata },
      })
      .eq('id', conversationId)
      .eq('profile_id', input.profileId);
    if (error) throw error;
  }

  const { data: storedMessages, error: messageError } = await input.admin
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
    ])
    .select('id,role,created_at');
  if (messageError) throw messageError;

  const staffPreview = input.metadata?.staff_preview === true;
  if (process.env.KIA_CLIENT_LEDGER_ENABLED?.trim().toLowerCase() === 'true' && !staffPreview) {
    const byRole = new Map((storedMessages ?? []).map((row) => [row.role, row]));
    const userRow = byRole.get('user');
    const assistantRow = byRole.get('assistant');
    const base = {
      clientId: input.profileId,
    };
    const common = {
      companyId: input.companyId ?? null,
      caseId: input.caseId ?? null,
      channel: input.channel,
    };
    await Promise.allSettled([
      userRow
        ? recordClientRegistryEvent(input.admin, base, {
            eventType: input.channel === 'telegram' ? 'telegram.inbound' : 'chat.user',
            occurredAt: userRow.created_at,
            sourceKey: `kia-message:${userRow.id}`,
            title: input.channel === 'telegram' ? 'Telegram KIA' : 'Chat KIA',
            summary: input.userMessage.slice(0, 600),
            sourceTable: 'kia_conversation_messages',
            sourceId: userRow.id,
            sourceRef: `kia-conversation:${conversationId}`,
            direction: 'in',
            importance: 1,
            ...common,
          })
        : Promise.resolve(null),
      assistantRow
        ? recordClientRegistryEvent(input.admin, base, {
            eventType: input.channel === 'telegram' ? 'telegram.outbound' : 'chat.kia',
            occurredAt: assistantRow.created_at,
            sourceKey: `kia-message:${assistantRow.id}`,
            title: input.channel === 'telegram' ? 'Telegram KIA' : 'Chat KIA',
            summary: input.assistantMessage.slice(0, 600),
            sourceTable: 'kia_conversation_messages',
            sourceId: assistantRow.id,
            sourceRef: `kia-conversation:${conversationId}`,
            direction: 'out',
            importance: 1,
            ...common,
          })
        : Promise.resolve(null),
    ]);
  }

  return conversationId;
}
