import { getPublicAppUrl } from '@/lib/utils/app-url';
import { createKiaContextToken } from '@/lib/ai/kia/kia-context-token';
import type { getSupabaseAdmin } from '@/lib/integrations/supabase';

type AdminClient = ReturnType<typeof getSupabaseAdmin>;

function s(metadata: Record<string, unknown>, key: string): string | null {
  const value = metadata[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

export async function maybeAppendKiaContextualCta(input: {
  admin: AdminClient;
  html: string;
  metadata?: Record<string, unknown>;
}): Promise<{ html: string; metadata?: Record<string, unknown> }> {
  const metadata = input.metadata ?? {};
  const enabled = process.env.KIA_CONTEXTUAL_EMAIL_CTA_ENABLED?.toLowerCase() === 'true';
  if (!enabled || metadata.kia_contextual_cta !== true) return input;

  const profileId = s(metadata, 'profile_id') ?? s(metadata, 'client_id') ?? s(metadata, 'user_id');
  const caseId = s(metadata, 'case_id');
  const companyId = s(metadata, 'company_id');
  const serviceSlug = s(metadata, 'service_slug');
  const taskId = s(metadata, 'task_id');
  const intentHint = s(metadata, 'kia_intent_hint');
  const originRef = s(metadata, 'email_event_ref');

  if (!profileId) return input;

  const { data: profile, error: profileError } = await input.admin
    .from('profiles')
    .select('id,tenant_id,status')
    .eq('id', profileId)
    .maybeSingle();

  if (profileError || !profile || profile.status === 'inactive') return input;

  if (caseId) {
    const { data: ownedCase, error } = await input.admin
      .from('cases')
      .select('id,client_id,company_id')
      .eq('id', caseId)
      .eq('client_id', profileId)
      .maybeSingle();
    if (error || !ownedCase) return input;
    if (companyId && ownedCase.company_id && ownedCase.company_id !== companyId) return input;
  }

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
      event_type: s(metadata, 'event_type'),
      pilot: true,
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

  return {
    html,
    metadata: {
      ...metadata,
      kia_contextual_cta_added: true,
      kia_context_expires_at: expiresAt,
    },
  };
}
