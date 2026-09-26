import type { SupabaseClient } from '@supabase/supabase-js';
import {
  getGmailThread,
  getGmailThreadSA,
  hasGmailSA,
  type GmailMessage,
  type GmailTokens,
} from '@/lib/integrations/gmail';

type AdminClient = SupabaseClient;

export type OperationalGmailThread = {
  messages: GmailMessage[];
  authMode: 'service_account' | 'oauth';
};

async function loadAdminOAuth(admin: AdminClient): Promise<GmailTokens | null> {
  const { data, error } = await admin.from('gmail_tokens').select('*').eq('id', 'admin').maybeSingle();
  if (error || !data) return null;
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expiry_date: Number(data.expiry_date),
    email: data.email ?? null,
    scope: data.scope ?? null,
  };
}

async function saveRefresh(admin: AdminClient, refreshed: GmailTokens | null) {
  if (!refreshed) return;
  await admin.from('gmail_tokens').update({
    access_token: refreshed.access_token,
    refresh_token: refreshed.refresh_token,
    expiry_date: refreshed.expiry_date,
    scope: refreshed.scope ?? null,
    updated_at: new Date().toISOString(),
  }).eq('id', 'admin');
}

/**
 * Read the EXPERT operational mailbox only.
 * Client/company productivity OAuth credentials are deliberately out of scope.
 */
export async function getOperationalGmailThread(
  admin: AdminClient,
  threadId: string,
): Promise<OperationalGmailThread> {
  if (hasGmailSA()) {
    try {
      return {
        messages: await getGmailThreadSA(threadId),
        authMode: 'service_account',
      };
    } catch (error) {
      console.warn('[operational-gmail] service account unavailable, trying admin OAuth', error);
    }
  }

  const tokens = await loadAdminOAuth(admin);
  if (!tokens) throw new Error('operational_gmail_auth_unavailable');
  const { messages, refreshed } = await getGmailThread(tokens, threadId);
  await saveRefresh(admin, refreshed);
  return { messages, authMode: 'oauth' };
}
