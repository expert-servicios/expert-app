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
  const [{ data: profile, error: profileError }, { data: membership, error: membershipError }] = await Promise.all([
    admin
      .from('profiles')
      .select('role,status')
      .eq('id', userId)
      .maybeSingle(),
    admin
      .from('profile_companies')
      .select('company_id,role')
      .eq('profile_id', userId)
      .eq('company_id', companyId)
      .maybeSingle(),
  ]);

  if (profileError) throw profileError;
  if (membershipError) throw membershipError;
  if (profile?.role !== 'client' || profile?.status === 'inactive' || membership?.role !== 'owner') {
    throw new Error('Only an active client owner can connect a company productivity account');
  }
}

export async function saveClientProductivityIntegration(input: {
  userId: string;
  companyId: string;
  provider: ProductivityProvider;
  accountEmail: string | null;
  secret: Record<string, unknown>;
  permissionsDetected: Record<string, boolean>;
}): Promise<string> {
  await assertClientCompanyMembership(input.userId, input.companyId);

  const admin = getSupabaseAdmin();
  const now = new Date().toISOString();
  const permissions = input.permissionsDetected;

  const { data: existing, error: existingError } = await admin
    .from('client_integrations')
    .select('id,client_id,company_id,provider,mode,api_version,permissions_detected,permissions_enabled,status,sync_mode,last_sync_at,last_success_at,last_error,connected_by,disconnected_at,consent_at,consent_version,channel,updated_at')
    .eq('company_id', input.companyId)
    .eq('provider', input.provider)
    .neq('status', 'revoked')
    .limit(1)
    .maybeSingle();

  if (existingError) throw existingError;

  let integrationId = existing?.id ?? null;
  const { data: previousSecretRow, error: previousSecretError } = existing?.id
    ? await admin
        .from('client_integration_secrets')
        .select('encrypted_api_key')
        .eq('integration_id', existing.id)
        .maybeSingle()
    : { data: null, error: null };
  if (previousSecretError) throw previousSecretError;
  const previousSecret = previousSecretRow?.encrypted_api_key ?? null;

  if (!integrationId) {
    const { data: created, error: createError } = await admin
      .from('client_integrations')
      .insert({
        client_id: input.userId,
        company_id: input.companyId,
        provider: input.provider,
        mode: 'client_account',
        api_version: 'v1',
        permissions_detected: permissions,
        permissions_enabled: permissions,
        status: 'pending',
        sync_mode: 'read_write',
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
      mode: 'client_account',
      permissions_detected: permissions,
      permissions_enabled: permissions,
      status: 'active',
      sync_mode: 'read_write',
      connected_by: input.userId,
      consent_at: now,
      consent_version: 'productivity-oauth-v1',
      disconnected_at: null,
      last_error: null,
      last_success_at: now,
      updated_at: now,
    })
    .eq('id', integrationId);

  if (activateError) {
    if (previousSecret) {
      await admin
        .from('client_integration_secrets')
        .upsert({
          integration_id: integrationId,
          encrypted_api_key: previousSecret,
          updated_at: now,
        }, { onConflict: 'integration_id' });
    } else {
      await admin
        .from('client_integration_secrets')
        .delete()
        .eq('integration_id', integrationId);
    }
    if (!existing?.id) {
      await admin.from('client_integrations').delete().eq('id', integrationId);
    }
    throw activateError;
  }
  return integrationId;
}
