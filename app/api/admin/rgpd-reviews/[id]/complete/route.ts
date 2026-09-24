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

    const body = await request.json().catch(() => null);
    const summary = typeof body?.summary === 'string' ? body.summary.trim() : '';

    if (summary.length < 20) {
      return NextResponse.json({ error: 'Las conclusiones deben tener al menos 20 caracteres.' }, { status: 400 });
    }
    if (summary.length > 10000) {
      return NextResponse.json({ error: 'Las conclusiones son demasiado largas.' }, { status: 400 });
    }

    const { id } = await context.params;
    const { data, error } = await admin.rpc('complete_rgpd_review', {
      p_project_id: id,
      p_reviewer_id: user.id,
      p_summary: summary,
    });

    if (error) {
      if (error.message.includes('rgpd_project_not_found')) {
        return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
      }
      if (error.message.includes('rgpd_project_not_in_review')) {
        return NextResponse.json({ error: 'El expediente no está en revisión.' }, { status: 409 });
      }
      if (error.message.includes('rgpd_review_reviewer_mismatch')) {
        return NextResponse.json({ error: 'La revisión está asignada a otro operador.' }, { status: 409 });
      }
      throw error;
    }

    const result = Array.isArray(data) ? data[0] : data;
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    console.error('[admin/rgpd-reviews/[id]/complete] POST error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
