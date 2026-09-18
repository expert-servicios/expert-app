import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { notifyAdmins } from '@/lib/integrations/push';

const NATIONALITY_MINOR_SLUG = 'nacionalidad-espanola-menor-nacido-en-espana';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: caseId } = await params;
    const supabase = createServerSupabaseClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

    const admin = getSupabaseAdmin();
    const { data: profile } = await admin.from('profiles').select('role,full_name').eq('id', user.id).maybeSingle();
    const isAdmin = profile?.role === 'admin' || profile?.role === 'owner';

    const { data: caseData, error: caseError } = await admin
      .from('cases')
      .select('id,client_id,company_id,service,service_id,status,state')
      .eq('id', caseId)
      .maybeSingle();

    if (caseError || !caseData) return NextResponse.json({ error: 'Expediente no encontrado' }, { status: 404 });
    if (!isAdmin && caseData.client_id !== user.id) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const now = new Date().toISOString();
    const { error: caseUpdateError } = await admin
      .from('cases')
      .update({
        status: 'en_revision',
        state: 'en_revision',
        next_action: 'Revisar documentación enviada por el cliente y preparar la solicitud',
        updated_at: now,
      })
      .eq('id', caseId);

    if (caseUpdateError) return NextResponse.json({ error: 'No se pudo actualizar el expediente' }, { status: 500 });

    const isNationality = caseData.service_id === NATIONALITY_MINOR_SLUG || caseData.service?.includes('гражданство');
    const taskTitle = isNationality
      ? 'Preparar y presentar solicitud de nacionalidad'
      : 'Revisar documentación enviada por cliente';

    const taskDescription = isNationality
      ? [
          'El cliente ha enviado documentación a revisión.',
          '1. Revisar documentación cargada y comentarios por punto de checklist.',
          '2. Confirmar viabilidad documental y residencia legal mínima.',
          '3. Rellenar solicitud de nacionalidad por residencia.',
          '4. Pagar tasa 790-026 de 104,05 € como suplido.',
          '5. Adjuntar justificante de pago de tasa al expediente.',
          '6. Presentar solicitud telemática.',
          '7. Subir justificante de presentación al expediente.',
          '8. Cambiar estado a presentado y avisar al cliente.',
        ].join('\n')
      : 'El cliente ha marcado la documentación como enviada. Revisar archivos y comentarios, validar suficiencia y actualizar el expediente.';

    const taskPayload = {
      title: taskTitle,
      description: taskDescription,
      status: 'pendiente',
      priority: 'alta',
      case_id: caseId,
      client_id: caseData.client_id,
      company_id: caseData.company_id,
      due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      source: 'document',
      metadata: {
        task_kind: 'client_documents_ready_for_review',
        service_slug: caseData.service_id ?? null,
        submitted_by: user.id,
        submitted_at: now,
      },
      updated_at: now,
    };

    const { data: existingTask, error: existingTaskError } = await admin
      .from('internal_tasks')
      .select('id')
      .eq('case_id', caseId)
      .eq('source', 'document')
      .eq('title', taskTitle)
      .in('status', ['pendiente', 'en_progreso'])
      .maybeSingle();

    if (existingTaskError) {
      console.error('[document-review] existing task lookup failed:', existingTaskError.message);
    } else if (existingTask?.id) {
      const { error: updateTaskError } = await admin
        .from('internal_tasks')
        .update(taskPayload)
        .eq('id', existingTask.id);
      if (updateTaskError) console.error('[document-review] task update failed:', updateTaskError.message);
    } else {
      const { error: insertTaskError } = await admin
        .from('internal_tasks')
        .insert(taskPayload);
      if (insertTaskError) console.error('[document-review] task insert failed:', insertTaskError.message);
    }

    notifyAdmins({
      title: '📂 Documentación lista para revisión',
      body: `${caseData.service ?? 'Expediente'} — ${profile?.full_name ?? 'Cliente'}`,
      url: `/admin/expedientes/${caseId}`,
      tag: `case-docs-ready-${caseId}`,
    }).catch(() => {});

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[document-review POST]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
