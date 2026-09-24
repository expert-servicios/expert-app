import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/auth/require-admin';

const ALLOWED_STATUSES = ['draft', 'review_requested', 'in_review', 'completed', 'archived'] as const;

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdminClient(request);
    if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const url = new URL(request.url);
    const rawStatus = url.searchParams.get('status');
    const status = rawStatus && ALLOWED_STATUSES.includes(rawStatus as (typeof ALLOWED_STATUSES)[number])
      ? rawStatus
      : 'review_requested';

    const { data: projects, error } = await admin
      .from('rgpd_self_implementation_projects')
      .select('id,user_id,company_id,version,status,payload,consent_at,created_at,updated_at')
      .eq('status', status)
      .order('updated_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    const userIds = [...new Set((projects ?? []).map((p) => p.user_id))];
    const { data: profiles, error: profilesError } = userIds.length
      ? await admin.from('profiles').select('id,full_name,email').in('id', userIds)
      : { data: [], error: null };

    if (profilesError) throw profilesError;
    const profilesById = new Map((profiles ?? []).map((p) => [p.id, p]));

    const items = (projects ?? []).map((project) => {
      const payload = project.payload && typeof project.payload === 'object'
        ? project.payload as Record<string, unknown>
        : {};
      const profileData = payload.profile && typeof payload.profile === 'object'
        ? payload.profile as Record<string, unknown>
        : {};
      const treatmentsData = payload.treatments && typeof payload.treatments === 'object'
        ? payload.treatments as Record<string, unknown>
        : {};
      const providersData = payload.providers && typeof payload.providers === 'object'
        ? payload.providers as Record<string, unknown>
        : {};

      const selectedTreatments = Array.isArray(treatmentsData.selectedIds)
        ? treatmentsData.selectedIds.length
        : 0;
      const customTreatments = Array.isArray(treatmentsData.customTreatments)
        ? treatmentsData.customTreatments.length
        : 0;
      const selectedProviders = Array.isArray(providersData.selectedIds)
        ? providersData.selectedIds.length
        : 0;
      const customProviders = Array.isArray(providersData.custom)
        ? providersData.custom.length
        : 0;

      return {
        id: project.id,
        version: project.version,
        status: project.status,
        user_id: project.user_id,
        company_id: project.company_id,
        created_at: project.created_at,
        updated_at: project.updated_at,
        consent_at: project.consent_at,
        requester: profilesById.get(project.user_id) ?? null,
        company: {
          legal_name: typeof profileData.legalName === 'string' ? profileData.legalName : null,
          tax_id: typeof profileData.taxId === 'string' ? profileData.taxId : null,
          activity: typeof profileData.activity === 'string' ? profileData.activity : null,
          contact_email: typeof profileData.contactEmail === 'string' ? profileData.contactEmail : null,
        },
        summary: {
          treatment_count: selectedTreatments + customTreatments,
          provider_count: selectedProviders + customProviders,
        },
      };
    });

    return NextResponse.json({
      items,
      status,
      count: items.length,
    });
  } catch (error) {
    console.error('[admin/rgpd-reviews] GET error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
