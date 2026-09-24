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
    const taskTitle = isNationality
      ? 'Preparar y presentar solicitud de nacionalidad'
      : 'Revisar documentación enviada por cliente';

    const taskDescription = isNationality
      ? [
          'El cliente ha enviado documentación a revisión.',
          '1. Revisar documentación cargada y comentarios por punto de checklist; no volver a pedir documentos ya disponibles.',
          '2. Confirmar viabilidad documental, residencia legal propia del menor y representación/patria potestad.',
          '3. Si EXPERT presenta, formalizar y archivar mandato de representación y, si se usa DocuSign, también el certificado de finalización.',
          '4. Antes de preparar el modelo, cerrar apellidos registrales: revisar filiación, apellido personal de la madre y posibles cambios por matrimonio. No ofrecer duplicación como libre elección cuando la línea materna está determinada.',
          '5. Confirmar con ambos progenitores el orden de apellidos y comprobar orden previo de hermanos si procede.',
          '6. Rellenar la solicitud oficial distinguiendo identidad extranjera vigente y datos para futura inscripción española.',
          '7. Obtener y validar las firmas necesarias; no reutilizar versiones retiradas del formulario.',
          '8. Completar validación pre-presentación profesional.',
          '9. Comprobar si la tasa 790-026 ya está pagada; si no lo está, pagar el importe oficial vigente y archivar justificante/NRC. Nunca duplicar el pago.',
          '10. Presentar solo con autorización profesional expresa.',
          '11. Archivar justificante, número de registro y copia final presentada; después activar seguimiento.',
          'Guía apellidos: /docs/apellidos-menor-nacionalidad-registro-civil',
          'Fuente BOE: https://www.boe.es/buscar/act.php?id=BOE-A-2007-12948',
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
