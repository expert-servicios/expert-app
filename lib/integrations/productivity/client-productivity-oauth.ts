import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { encryptSecret } from '@/lib/security/encryption';

export type ProductivityProvider = 'google_workspace' | 'microsoft_365';

export const PRODUCTIVITY_PERMISSIONS = {
  google_workspace: {
    mailRead: true,
    mailSend: true,
    calendarReadWrite: true,
    filesRead: true,
    filesWrite: false,
  },
  microsoft_365: {
    mailRead: true,
    mailSend: true,
    calendarReadWrite: true,
    filesRead: true,
    filesWrite: true,
  },
} as const;

export async function assertClientCompanyMembership(userId: string, companyId: string): Promise<void> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('profile_companies')
    .select('company_id')
    .eq('profile_id', userId)
    .eq('company_id', companyId)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error('Company does not belong to the authenticated client');
}

export async function saveClientProductivityIntegration(input: {
  userId: string;
  companyId: string;
  provider: ProductivityProvider;
  accountEmail: string | null;
  secret: Record<string, unknown>;
}): Promise<string> {
  await assertClientCompanyMembership(input.userId, input.companyId);

  const admin = getSupabaseAdmin();
  const now = new Date().toISOString();
  const permissions = PRODUCTIVITY_PERMISSIONS[input.provider];

  const { data: existing, error: existingError } = await admin
    .from('client_integrations')
    .select('id')
    .eq('company_id', input.companyId)
    .eq('provider', input.provider)
    .neq('status', 'revoked')
    .limit(1)
    .maybeSingle();

  if (existingError) throw existingError;

  let integrationId = existing?.id ?? null;

  if (!integrationId) {
    const { data: created, error: createError } = await admin
      .from('client_integrations')
      .insert({
        client_id: input.userId,
        company_id: input.companyId,
        provider: input.provider,
        mode: 'oauth_delegated',
        api_version: input.provider === 'microsoft_365' ? 'graph-v1.0' : 'google-v1',
        permissions_detected: permissions,
        permissions_enabled: permissions,
        status: 'connecting',
        sync_mode: 'delegated',
        connected_by: input.userId,
        consent_at: now,
        consent_version: 'productivity-oauth-v1',
        channel: 'dashboard',
        last_error: null,
      })
      .select('id')
      .single();

    if (createError || !created?.id) throw createError ?? new Error('Could not create productivity integration');
    integrationId = created.id;
  }

  const encrypted = encryptSecret(JSON.stringify({
    ...input.secret,
    account_email: input.accountEmail,
    provider: input.provider,
    company_id: input.companyId,
  }));

  const { error: secretError } = await admin
    .from('client_integration_secrets')
    .upsert({
      integration_id: integrationId,
      encrypted_api_key: encrypted,
      updated_at: now,
    }, { onConflict: 'integration_id' });

  if (secretError) {
    if (!existing?.id) {
      await admin.from('client_integrations').delete().eq('id', integrationId);
    }
    throw secretError;
  }

  const { error: activateError } = await admin
    .from('client_integrations')
    .update({
      client_id: input.userId,
      company_id: input.companyId,
      mode: 'oauth_delegated',
      permissions_detected: permissions,
      permissions_enabled: permissions,
      status: 'active',
      sync_mode: 'delegated',
      connected_by: input.userId,
      consent_at: now,
      consent_version: 'productivity-oauth-v1',
      disconnected_at: null,
      last_error: null,
      last_success_at: now,
      updated_at: now,
    })
    .eq('id', integrationId);

  if (activateError) throw activateError;
  return integrationId;
}
