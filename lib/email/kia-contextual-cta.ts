import { getPublicAppUrl } from '@/lib/utils/app-url';
import { createKiaContextToken } from '@/lib/ai/kia/kia-context-token';
import type { getSupabaseAdmin } from '@/lib/integrations/supabase';

type AdminClient = ReturnType<typeof getSupabaseAdmin>;

function s(metadata: Record<string, unknown>, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

export async function maybeAppendKiaContextualCta(input: {
  admin: AdminClient;
  html: string;
  recipients?: string[];
  metadata?: Record<string, unknown>;
}): Promise<{ html: string; metadata?: Record<string, unknown> }> {
  let metadata = input.metadata ?? {};
  const enabled = process.env.KIA_CONTEXTUAL_EMAIL_CTA_ENABLED?.toLowerCase() === 'true';
  if (!enabled || metadata.kia_contextual_cta === false) return input;
  if (input.html.includes('data-kia-contextual-cta=')) return input;
  // A personalized link must never be broadcast or attached to another client's email.
  if (!input.recipients || input.recipients.length !== 1) return input;

  let profileId = s(metadata, 'profile_id', 'profileId', 'client_id', 'clientId', 'user_id', 'userId');
  const caseId = s(metadata, 'case_id', 'caseId');
  let companyId = s(metadata, 'company_id', 'companyId');
  let serviceSlug = s(metadata, 'service_slug', 'serviceSlug', 'service_id', 'serviceId');
  const taskId = s(metadata, 'task_id', 'taskId');
  const intentHint = s(metadata, 'kia_intent_hint', 'kiaIntentHint');
  const originRef = s(metadata, 'email_event_ref', 'emailEventRef');

  // Case emails are eligible by default. Generic emails remain opt-in through
  // metadata.kia_contextual_cta=true or metadata.kia_author=true in sendEmail().
  const explicitlyRequested = metadata.kia_contextual_cta === true;
  if (!caseId && !explicitlyRequested) return input;

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
      pilot: metadata.kia_contextual_pilot !== false,
    },
  });

  const href = `${getPublicAppUrl().replace(/\/$/, '')}/kia/c/${encodeURIComponent(token)}`;
  const locale = metadata.preferred_language === 'ru' || metadata.checkout_locale === 'ru' ? 'ru' : 'es';
  const title = locale === 'ru'
    ? '💬 Спросить KIA об этом'
    : '💬 Hablar con KIA sobre esto';
  const note = locale === 'ru'
    ? 'KIA уже получит контекст этого сообщения — повторно объяснять ситуацию не нужно.'
    : 'KIA abrirá este tema con contexto; no tendrás que volver a explicarlo.';

  const block = `
    <table data-kia-contextual-cta="true" width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:26px 0;">
      <tr>
        <td align="center">
          <a href="${href}" style="display:inline-block;background:#07111d;color:#ffffff;text-decoration:none;padding:13px 20px;border-radius:12px;font-size:14px;font-weight:700;">
            ${title}
          </a>
          <p style="margin:9px auto 0;max-width:440px;font-size:11px;line-height:1.5;color:#7b8794;">${note}</p>
        </td>
      </tr>
    </table>`;

  const html = input.html.includes('</body>')
    ? input.html.replace('</body>', `${block}</body>`)
    : `${input.html}${block}`;

  metadata = {
    ...metadata,
    profile_id: profileId,
    ...(caseId ? { case_id: caseId } : {}),
    ...(companyId ? { company_id: companyId } : {}),
    ...(serviceSlug ? { service_slug: serviceSlug } : {}),
    ...(taskId ? { task_id: taskId } : {}),
    kia_contextual_cta: true,
    kia_contextual_cta_added: true,
    kia_context_expires_at: expiresAt,
  };

  return { html, metadata };
}
