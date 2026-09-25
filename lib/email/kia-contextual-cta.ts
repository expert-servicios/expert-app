import { getPublicAppUrl } from '@/lib/utils/app-url';
import { createKiaContextToken } from '@/lib/ai/kia/kia-context-token';
import type { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { emailContextExcerpt } from '@/lib/ai/kia/kia-client-brief';

type AdminClient = ReturnType<typeof getSupabaseAdmin>;

function s(metadata: Record<string, unknown>, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

/**
 * Resolves a safe contextual KIA entry for a one-recipient client email.
 * It never renders a second CTA block. Instead it enriches metadata so the
 * single KIA email signature can point Chat and Telegram at the same context.
 */
export async function maybeAppendKiaContextualCta(input: {
  admin: AdminClient;
  html: string;
  recipients?: string[];
  metadata?: Record<string, unknown>;
}): Promise<{ html: string; metadata?: Record<string, unknown> }> {
  let metadata = input.metadata ?? {};
  const enabled = process.env.KIA_CONTEXTUAL_EMAIL_CTA_ENABLED?.toLowerCase() !== 'false';
  if (!enabled || metadata.kia_contextual_cta === false) return input;

  // A personalized context must never be attached to a broadcast.
  if (!input.recipients || input.recipients.length !== 1) return input;

  let profileId = s(metadata, 'profile_id', 'profileId', 'client_id', 'clientId', 'user_id', 'userId');
  const caseId = s(metadata, 'case_id', 'caseId');
  let companyId = s(metadata, 'company_id', 'companyId');
  let serviceSlug = s(metadata, 'service_slug', 'serviceSlug', 'service_id', 'serviceId');
  const taskId = s(metadata, 'task_id', 'taskId');
  const intentHint = s(metadata, 'kia_intent_hint', 'kiaIntentHint');
  const originRef = s(metadata, 'email_event_ref', 'emailEventRef');

  const explicitlyRequested = metadata.kia_contextual_cta === true;

  if (!profileId && input.recipients[0]) {
    const recipient = input.recipients[0].trim();
    const { data: matchingProfiles, error: profileLookupError } = await input.admin
      .from('profiles')
      .select('id')
      .ilike('email', recipient)
      .eq('role', 'client')
      .neq('status', 'inactive')
      .limit(2);
    if (profileLookupError) return input;
    if ((matchingProfiles ?? []).length === 1) profileId = matchingProfiles![0].id;
  }

  // For any uniquely identified client email, create safe context even when
  // there is no case. Generic/broadcast/non-client email keeps the generic signature.
  if (!caseId && !explicitlyRequested && !profileId) return input;

  let ownedCase: { id: string; client_id: string; company_id: string | null; service_id: string | null } | null = null;
  if (caseId) {
    const { data, error } = await input.admin
      .from('cases')
      .select('id,client_id,company_id,service_id')
      .eq('id', caseId)
      .maybeSingle();
    if (error || !data) return input;
    ownedCase = data;

    if (profileId && profileId !== data.client_id) return input;
    profileId = data.client_id;
    if (companyId && companyId !== (data.company_id ?? null)) return input;
    companyId = data.company_id ?? null;
    serviceSlug = serviceSlug ?? data.service_id ?? null;
  }

  if (!profileId) return input;

  const { data: profile, error: profileError } = await input.admin
    .from('profiles')
    .select('id,tenant_id,status,email')
    .eq('id', profileId)
    .maybeSingle();

  if (profileError || !profile || profile.status === 'inactive') return input;
  if (profile.email?.trim().toLowerCase() !== input.recipients[0].trim().toLowerCase()) return input;
  if (ownedCase && ownedCase.client_id !== profileId) return input;

  if (companyId) {
    const { data: membership, error } = await input.admin
      .from('profile_companies')
      .select('company_id')
      .eq('profile_id', profileId)
      .eq('company_id', companyId)
      .maybeSingle();
    if (error || !membership) return input;
  }

  const { token, expiresAt } = await createKiaContextToken({
    admin: input.admin,
    tenantId: profile.tenant_id ?? null,
    profileId,
    companyId,
    caseId,
    serviceSlug,
    taskId,
    originType: 'email',
    originRef,
    intentHint,
    metadata: {
      event_type: s(metadata, 'event_type', 'eventType'),
      email_subject: s(metadata, 'email_subject', 'emailSubject'),
      email_excerpt: emailContextExcerpt(input.html),
      pilot: metadata.kia_contextual_pilot !== false,
    },
  });

  const appUrl = getPublicAppUrl().replace(/\/$/, '');
  const chatHref = `${appUrl}/kia/c/${encodeURIComponent(token)}`;
  const telegramHref = `https://t.me/kia_expert_bot?start=ctx_${encodeURIComponent(token)}`;

  metadata = {
    ...metadata,
    profile_id: profileId,
    ...(caseId ? { case_id: caseId } : {}),
    ...(companyId ? { company_id: companyId } : {}),
    ...(serviceSlug ? { service_slug: serviceSlug } : {}),
    ...(taskId ? { task_id: taskId } : {}),
    kia_contextual_cta: true,
    kia_contextual_cta_added: true,
    kia_chat_href: chatHref,
    kia_telegram_href: telegramHref,
    kia_context_expires_at: expiresAt,
  };

  return { html: input.html, metadata };
}
