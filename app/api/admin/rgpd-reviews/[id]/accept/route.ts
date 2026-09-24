import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/auth/require-admin';
import { createServerSupabaseClient } from '@/lib/integrations/supabase';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdminClient(request);
    if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const session = createServerSupabaseClient(request);
    const { data: { user }, error: userError } = await session.auth.getUser();
    if (userError || !user) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const { id } = await context.params;

    const { data, error } = await admin.rpc('accept_rgpd_review', {
      p_project_id: id,
      p_reviewer_id: user.id,
    });

    if (error) {
      if (error.message.includes('rgpd_project_not_found')) {
        return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
      }
      if (error.message.includes('rgpd_project_not_review_requested')) {
        return NextResponse.json({ error: 'Estado no válido para aceptar' }, { status: 409 });
      }
      throw error;
    }

    const result = Array.isArray(data) ? data[0] : data;
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    console.error('[admin/rgpd-reviews/[id]/accept] POST error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
