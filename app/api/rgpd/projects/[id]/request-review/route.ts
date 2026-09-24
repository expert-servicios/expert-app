import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'authentication_required' }, { status: 401 });
  }

  const admin = getSupabaseAdmin();

  const { data: project, error: projectError } = await admin
    .from('rgpd_self_implementation_projects')
    .select('id,version,status')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (projectError) {
    return NextResponse.json({ error: 'project_lookup_failed' }, { status: 500 });
  }

  if (!project) {
    return NextResponse.json({ error: 'project_not_found' }, { status: 404 });
  }

  if (project.status !== 'draft') {
    return NextResponse.json({ error: 'project_not_draft' }, { status: 409 });
  }

  const { data: updated, error: updateError } = await admin
    .from('rgpd_self_implementation_projects')
    .update({
      status: 'review_requested',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id,version,status,updated_at')
    .single();

  if (updateError) {
    return NextResponse.json({ error: 'review_request_failed' }, { status: 500 });
  }

  const qs = new URLSearchParams({
    servicio: 'proteccion-datos-rgpd',
    origen: 'rgpd-autoimplantacion',
    tipo: 'revision-profesional',
    rgpd_project_id: updated.id,
    rgpd_version: String(updated.version),
    resumen: 'Solicitud de revisión profesional del expediente RGPD guardado en EXPERT. Proyecto ' + updated.id + ', versión ' + updated.version + '.',
  });

  return NextResponse.json({
    project: updated,
    quote_url: '/solicitar-presupuesto?' + qs.toString(),
  });
}
