import type { getSupabaseAdmin } from '@/lib/integrations/supabase';

type AdminClient = ReturnType<typeof getSupabaseAdmin>;

export interface KiaChannelIdentity {
  id: string;
  tenantId: string;
  profileId: string;
  channel: 'telegram';
  externalUserId: string;
  externalChatId: string;
  externalUsername: string | null;
  verifiedAt: string;
}

export async function resolveVerifiedTelegramIdentity(params: {
  admin: AdminClient;
  externalUserId: string | null;
  externalChatId: string;
}): Promise<KiaChannelIdentity | null> {
  if (!params.externalUserId || !params.externalChatId) return null;

  const { data: identity, error } = await params.admin
    .from('kia_channel_identities')
    .select('id,tenant_id,profile_id,channel,external_user_id,external_chat_id,external_username,status,verified_at,revoked_at')
    .eq('channel', 'telegram')
    .eq('external_user_id', params.externalUserId)
    .eq('external_chat_id', params.externalChatId)
    .eq('status', 'active')
    .is('revoked_at', null)
    .maybeSingle();

  if (error) throw error;
  if (!identity?.verified_at) return null;

  const { data: profile, error: profileError } = await params.admin
    .from('profiles')
    .select('id,tenant_id,status')
    .eq('id', identity.profile_id)
    .maybeSingle();

  if (profileError) throw profileError;
  if (!profile || profile.status === 'inactive') return null;
  if (!profile.tenant_id || profile.tenant_id !== identity.tenant_id) return null;

  return {
    id: identity.id,
    tenantId: identity.tenant_id,
    profileId: identity.profile_id,
    channel: 'telegram',
    externalUserId: identity.external_user_id,
    externalChatId: identity.external_chat_id,
    externalUsername: identity.external_username ?? null,
    verifiedAt: identity.verified_at,
  };
}
