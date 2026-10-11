/**
 * GET /api/reports/[id] — returns a single report (ownership enforced)
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { requireActiveActor } from '@/lib/auth/active-actor';
import { canAccessFinancialReport } from '@/lib/reports/report-access';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  const actor = await requireActiveActor(request);
  if (!actor || actor.userId !== user.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const { id } = await params;
  const admin  = getSupabaseAdmin();

  const { data: report } = await admin
    .from('kia_financial_reports')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (!report || !(await canAccessFinancialReport(admin, user.id, report.client_id))) {
    return NextResponse.json({ error: 'Informe no encontrado' }, { status: 404 });
  }

  // Only the client owner's view counts as client-facing viewed_at.
  if (report.client_id === user.id && !report.viewed_at) {
    await admin
      .from('kia_financial_reports')
      .update({ viewed_at: new Date().toISOString() })
      .eq('id', id)
      .then(() => null, () => null);
  }

  return NextResponse.json({ report });
}
