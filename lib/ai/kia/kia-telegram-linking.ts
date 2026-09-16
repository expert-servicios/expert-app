import { createHash, randomBytes } from 'node:crypto';
import type { getSupabaseAdmin } from '@/lib/integrations/supabase';

type AdminClient = ReturnType<typeof getSupabaseAdmin>;
const TELEGRAM_LINK_TTL_MS = 10 * 60 * 1000;

export function generateTelegramLinkCode(): string {
  return randomBytes(18).toString('base64url');
}

export function hashTelegramLinkCode(code: string): string {
  return createHash('sha256').update(code.trim()).digest('hex');
}

export async function createTelegramLinkCode(params: {
  admin: AdminClient;
  profileId: string;
  tenantId: string;
  now?: Date;
}): Promise<{ code: string; expiresAt: string }> {
  const now = params.now ?? new Date();
  const expiresAt = new Date(now.getTime() + TELEGRAM_LINK_TTL_MS).toISOString();
  const code = generateTelegramLinkCode();
  const { error } = await params.admin.from('kia_channel_link_tokens').insert({
    tenant_id: params.tenantId,
    profile_id: params.profileId,
    channel: 'telegram',
    token_hash: hashTelegramLinkCode(code),
    expires_at: expiresAt,
  });
  if (error) throw error;
  return { code, expiresAt };
}

export async function consumeTelegramLinkCode(params: {
  admin: AdminClient;
  code: string;
  externalUserId: string | null;
  externalChatId: string;
  externalUsername?: string | null;
}): Promise<{ profileId: string; tenantId: string; identityId: string }> {
  if (!params.externalUserId) throw new Error('Telegram user id required');
  const { data, error } = await params.admin.rpc('kia_consume_telegram_link_token', {
    p_token_hash: hashTelegramLinkCode(params.code),
    p_external_user_id: params.externalUserId,
    p_external_chat_id: params.externalChatId,
    p_external_username: params.externalUsername ?? null,
  });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.profile_id || !row?.tenant_id || !row?.identity_id) {
    throw new Error('Telegram link consumption returned no identity');
  }
  return {
    profileId: row.profile_id,
    tenantId: row.tenant_id,
    identityId: row.identity_id,
  };
}
