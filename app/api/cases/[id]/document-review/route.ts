import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { notifyAdmins } from '@/lib/integrations/push';
import { resolveEffectiveCaseStatus } from '@/lib/cases/case-status';

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
    const effectiveStatus = resolveEffectiveCaseStatus(caseData.status, caseData.state);
    if (!isAdmin && ['listo_para_presentar', 'presentado', 'finalizado', 'bloqueado'].includes(effectiveStatus)) {
      return NextResponse.json({
        error: 'El expediente ya ha superado la fase de revisión documental. Usa el hilo de mensajes si necesitas aportar una novedad.',
        code: 'DOCUMENT_REVIEW_PHASE_CLOSED',
      }, { status: 409 });
    }
    const isNationality = caseData.service_id === NATIONALITY_MINOR_SLUG || caseData.service?.includes('гражданство');

    if (isNationality) {
      const { data: caseTasks, error: caseTasksError } = await admin
        .from('internal_tasks')
        .select('id,title,status,source,due_date,metadata')
        .eq('case_id', caseId);

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

      if (canonicalReviewTask?.id && ['pendiente', 'en_progreso'].includes(canonicalReviewTask.status)) {
        const existingMetadata = (canonicalReviewTask.metadata as Record<string, unknown> | null) ?? {};
        const { error: updateTaskError } = await admin
          .from('internal_tasks')
          .update({
            priority: 'alta',
            due_date: canonicalReviewTask.due_date ?? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
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
      } else if (canonicalReviewTask?.id) {
        const additionalTitle = 'Revisar documentación adicional — Nacionalidad menor';
        const { data: additionalTask, error: additionalLookupError } = await admin
          .from('internal_tasks')
          .select('id,due_date,metadata')
          .eq('case_id', caseId)
          .eq('source', 'document')
          .eq('title', additionalTitle)
          .in('status', ['pendiente', 'en_progreso'])
          .maybeSingle();

        if (additionalLookupError) {
          return NextResponse.json({ error: 'No se pudo preparar la revisión de documentación adicional' }, { status: 500 });
        }

        if (additionalTask?.id) {
          const { error: updateAdditionalError } = await admin
            .from('internal_tasks')
            .update({
              priority: 'alta',
              due_date: additionalTask.due_date ?? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
              metadata: {
                ...((additionalTask.metadata as Record<string, unknown> | null) ?? {}),
                ...submissionMetadata,
                additional_documents: true,
              },
              updated_at: now,
            })
            .eq('id', additionalTask.id);
          if (updateAdditionalError) {
            return NextResponse.json({ error: 'No se pudo actualizar la revisión de documentación adicional' }, { status: 500 });
          }
        } else {
          const { error: insertAdditionalError } = await admin
            .from('internal_tasks')
            .insert({
              title: additionalTitle,
              description: 'Revisar nuevos documentos o comentarios aportados después de completar la revisión documental inicial. No reiniciar ni retroceder el workflow principal.',
              status: 'pendiente',
              priority: 'alta',
              case_id: caseId,
              client_id: caseData.client_id,
              company_id: caseData.company_id,
              due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
              source: 'document',
              metadata: {
                task_kind: 'client_documents_additional_review',
                service_slug: caseData.service_id ?? NATIONALITY_MINOR_SLUG,
                ...submissionMetadata,
                additional_documents: true,
              },
              updated_at: now,
            });
          if (insertAdditionalError) {
            return NextResponse.json({ error: 'No se pudo crear la revisión de documentación adicional' }, { status: 500 });
          }
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

    const shouldMoveToReview = effectiveStatus === 'nuevo' || effectiveStatus === 'pendiente_cliente';
    const casePatch: Record<string, unknown> = { updated_at: now };
    if (shouldMoveToReview) {
      casePatch.status = 'en_revision';
      casePatch.state = 'en_revision';
      casePatch.next_action = isNationality
        ? 'Revisar documentación, residencia, representación y apellidos registrales antes de preparar el modelo oficial'
        : 'Revisar documentación enviada por el cliente y preparar la solicitud';
    }

    const { error: caseUpdateError } = await admin
      .from('cases')
      .update(casePatch)
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
