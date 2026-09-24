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
      .select('id,user_id,company_id,version,status,payload,consent_at,created_at,updated_at')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!project) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('id,full_name,email')
      .eq('id', project.user_id)
      .maybeSingle();

    if (profileError) throw profileError;

    return NextResponse.json({
      project: {
        ...project,
        requester: profile ?? null,
      },
    });
  } catch (error) {
    console.error('[admin/rgpd-reviews/[id]] GET error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
