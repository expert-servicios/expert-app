import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { resolveKiaContextToken } from '@/lib/ai/kia/kia-context-token';
import { resolveEffectiveCaseStatus } from '@/lib/cases/case-status';
import { resolveKiaStaffPreview } from '@/lib/ai/kia/kia-staff-preview';

export async function GET(request: NextRequest) {
  const token = new URL(request.url).searchParams.get('token')?.trim();
  if (!token) return NextResponse.json({ error: 'missing_token' }, { status: 400 });

  const supabase = createServerSupabaseClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const admin = getSupabaseAdmin();
  const { data: profile } = await admin
    .from('profiles')
    .select('full_name,preferred_language,tenant_id,status')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || profile.status === 'inactive') {
    return NextResponse.json({ error: 'profile_unavailable' }, { status: 403 });
  }

  const context = await resolveKiaContextToken({
    admin,
    token,
    profileId: user.id,
    tenantId: profile.tenant_id ?? null,
  }).catch(() => null);
  if (!context) return NextResponse.json({ error: 'invalid_context' }, { status: 403 });

  const staffPreview = await resolveKiaStaffPreview({ admin, actorId: user.id, metadata: context.metadata }).catch(() => null);
  const effectiveClientId = staffPreview?.clientId ?? user.id;
  const effectiveCaseId = staffPreview?.caseRow.id ?? context.case_id ?? null;
  const effectiveCompanyId = staffPreview?.companyId ?? context.company_id ?? null;

  let caseSummary: Record<string, unknown> | null = null;
  if (effectiveCaseId) {
    const { data } = await admin
      .from('cases')
      .select('id,service,service_id,state,status,next_action,due_date,company_id,updated_at,closed_at')
      .eq('id', effectiveCaseId)
      .eq('client_id', effectiveClientId)
      .maybeSingle();
    const effectiveStatus = data ? resolveEffectiveCaseStatus(data.status, data.state) : null;
    caseSummary = data && !data.closed_at && effectiveStatus !== 'finalizado' ? data : null;
  }

  let companySummary: Record<string, unknown> | null = null;
  if (effectiveCompanyId) {
    const { data } = await admin
      .from('companies')
      .select('id,name')
      .eq('id', effectiveCompanyId)
      .maybeSingle();
    companySummary = data ?? null;
  }

  const displayProfile = staffPreview?.client ?? profile;
  const firstName = (displayProfile.full_name ?? '').trim().split(/\s+/)[0] || null;
  return NextResponse.json({
    firstName,
    preferredLanguage: displayProfile.preferred_language === 'ru' ? 'ru' : 'es',
    intentHint: context.intent_hint,
    serviceSlug: staffPreview?.serviceSlug ?? context.service_slug,
    case: caseSummary,
    company: companySummary,
    originEmail: context.origin_type === 'email' && context.metadata && typeof context.metadata === 'object'
      ? {
          subject: typeof (context.metadata as Record<string, unknown>).email_subject === 'string'
            ? (context.metadata as Record<string, unknown>).email_subject
            : null,
        }
      : null,
    staffPreview: Boolean(staffPreview),
  });
}
