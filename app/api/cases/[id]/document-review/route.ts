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
    const isNationality = caseData.service_id === NATIONALITY_MINOR_SLUG || caseData.service?.includes('гражданство');

    if (isNationality) {
      const { data: caseTasks, error: caseTasksError } = await admin
        .from('internal_tasks')
        .select('id,title,status,source,metadata')
        .eq('case_id', caseId)
        .in('status', ['pendiente', 'en_progreso']);

      if (caseTasksError) {
        console.error('[document-review] nationality task lookup failed:', caseTasksError.message);
        return NextResponse.json({ error: 'No se pudo preparar la revisión documental' }, { status: 500 });
      }

      const canonicalReviewTask = (caseTasks ?? []).find((task) => {
        const metadata = (task.metadata as Record<string, unknown> | null) ?? null;
        return metadata?.task_key === 'review_documents';
      });

      const submissionMetadata = {
        client_documents_ready: true,
        submitted_by: user.id,
        submitted_at: now,
      };

      if (canonicalReviewTask?.id) {
        const existingMetadata = (canonicalReviewTask.metadata as Record<string, unknown> | null) ?? {};
        const { error: updateTaskError } = await admin
          .from('internal_tasks')
          .update({
            priority: 'alta',
            due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
            metadata: {
              ...existingMetadata,
              ...submissionMetadata,
            },
            updated_at: now,
          })
          .eq('id', canonicalReviewTask.id);

        if (updateTaskError) {
          console.error('[document-review] canonical nationality task update failed:', updateTaskError.message);
          return NextResponse.json({ error: 'No se pudo actualizar la tarea de revisión' }, { status: 500 });
        }
      } else {
        const { error: insertTaskError } = await admin
          .from('internal_tasks')
          .insert({
            title: 'Revisar expediente de nacionalidad recién pagado',
            description: 'Revisar la documentación enviada por el cliente, comentarios del checklist y faltantes reales antes de avanzar al siguiente gate del workflow.',
            status: 'pendiente',
            priority: 'alta',
            case_id: caseId,
            client_id: caseData.client_id,
            company_id: caseData.company_id,
            due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
            source: 'document',
            metadata: {
              task_kind: 'service_blueprint_step',
              service_slug: caseData.service_id ?? NATIONALITY_MINOR_SLUG,
              blueprint_slug: NATIONALITY_MINOR_SLUG,
              task_key: 'review_documents',
              phase: 'intake',
              human_approval_required: false,
              depends_on: [],
              blocks_submission: false,
              reference_urls: [],
              due_business_days: 1,
              sequence_index: 0,
              blueprint_version: '5',
              ...submissionMetadata,
            },
            updated_at: now,
          });

        if (insertTaskError) {
          console.error('[document-review] nationality fallback task insert failed:', insertTaskError.message);
          return NextResponse.json({ error: 'No se pudo crear la tarea de revisión' }, { status: 500 });
        }
      }
    } else {
      const taskTitle = 'Revisar documentación enviada por cliente';
      const taskPayload = {
        title: taskTitle,
        description: 'El cliente ha marcado la documentación como enviada. Revisar archivos y comentarios, validar suficiencia y actualizar el expediente.',
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
        return NextResponse.json({ error: 'No se pudo preparar la tarea de revisión' }, { status: 500 });
      }

      if (existingTask?.id) {
        const { error: updateTaskError } = await admin
          .from('internal_tasks')
          .update(taskPayload)
          .eq('id', existingTask.id);
        if (updateTaskError) {
          console.error('[document-review] task update failed:', updateTaskError.message);
          return NextResponse.json({ error: 'No se pudo actualizar la tarea de revisión' }, { status: 500 });
        }
      } else {
        const { error: insertTaskError } = await admin
          .from('internal_tasks')
          .insert(taskPayload);
        if (insertTaskError) {
          console.error('[document-review] task insert failed:', insertTaskError.message);
          return NextResponse.json({ error: 'No se pudo crear la tarea de revisión' }, { status: 500 });
        }
      }
    }

    const { error: caseUpdateError } = await admin
      .from('cases')
      .update({
        status: 'en_revision',
        state: 'en_revision',
        next_action: isNationality
          ? 'Revisar documentación, residencia, representación y apellidos registrales antes de preparar el modelo oficial'
          : 'Revisar documentación enviada por el cliente y preparar la solicitud',
        updated_at: now,
      })
      .eq('id', caseId);

    if (caseUpdateError) {
      console.error('[document-review] case update failed after task persistence:', caseUpdateError.message);
      return NextResponse.json({ error: 'La tarea se creó, pero no se pudo actualizar el expediente' }, { status: 500 });
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
