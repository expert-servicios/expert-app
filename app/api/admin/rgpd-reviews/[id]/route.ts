import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/auth/require-admin';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdminClient(request);
    if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const { id } = await context.params;

    const { data: project, error } = await admin
      .from('rgpd_self_implementation_projects')
      .select('id,user_id,company_id,version,status,payload,consent_at,created_at,updated_at,reviewer_id,review_started_at,review_completed_at,review_task_id,review_summary')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!project) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

    const profileIds = [project.user_id, project.reviewer_id].filter((value): value is string => Boolean(value));
    const { data: profiles, error: profileError } = profileIds.length
      ? await admin.from('profiles').select('id,full_name,email').in('id', profileIds)
      : { data: [], error: null };

    if (profileError) throw profileError;
    const profilesById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));

    return NextResponse.json({
      project: {
        ...project,
        requester: profilesById.get(project.user_id) ?? null,
        reviewer: project.reviewer_id ? profilesById.get(project.reviewer_id) ?? null : null,
      },
    });
  } catch (error) {
    console.error('[admin/rgpd-reviews/[id]] GET error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
