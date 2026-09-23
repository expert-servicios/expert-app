import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { resolveKiaContextToken } from '@/lib/ai/kia/kia-context-token';

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

  let caseSummary: Record<string, unknown> | null = null;
  if (context.case_id) {
    const { data } = await admin
      .from('cases')
      .select('id,service,service_id,state,status,next_action,due_date,company_id,updated_at')
      .eq('id', context.case_id)
      .eq('client_id', user.id)
      .maybeSingle();
    caseSummary = data ?? null;
  }

  let companySummary: Record<string, unknown> | null = null;
  if (context.company_id) {
    const { data } = await admin
      .from('companies')
      .select('id,name')
      .eq('id', context.company_id)
      .maybeSingle();
    companySummary = data ?? null;
  }

  const firstName = (profile.full_name ?? '').trim().split(/\s+/)[0] || null;
  return NextResponse.json({
    firstName,
    preferredLanguage: profile.preferred_language === 'ru' ? 'ru' : 'es',
    intentHint: context.intent_hint,
    serviceSlug: context.service_slug,
    case: caseSummary,
    company: companySummary,
  });
}
