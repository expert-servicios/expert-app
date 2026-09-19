import type { SupabaseClient } from '@supabase/supabase-js';
import {
  getServiceOperationalBlueprint,
  type ServiceTaskTemplate,
} from '@/lib/services/service-operational-blueprints';

type SupabaseAdmin = SupabaseClient;

function addBusinessDays(from: Date, businessDays: number): string {
  const date = new Date(from);
  let remaining = Math.max(0, businessDays);
  while (remaining > 0) {
    date.setUTCDate(date.getUTCDate() + 1);
    const day = date.getUTCDay();
    if (day !== 0 && day !== 6) remaining -= 1;
  }
  return date.toISOString().slice(0, 10);
}

function taskDueDate(task: ServiceTaskTemplate): string | null {
  return typeof task.dueBusinessDays === 'number'
    ? addBusinessDays(new Date(), task.dueBusinessDays)
    : null;
}

export async function ensureServiceOrderFulfillment(
  admin: SupabaseAdmin,
  input: {
    orderId: string;
    serviceSlug: string;
    clientId: string | null;
    companyId: string | null;
  },
): Promise<string | null> {
  if (!input.clientId) return null;

  const blueprint = getServiceOperationalBlueprint(input.serviceSlug);
  if (!blueprint) return null;

  const { data: existingCase, error: caseLookupError } = await admin
    .from('cases')
    .select('id,service_id')
    .eq('order_id', input.orderId)
    .maybeSingle();

  if (caseLookupError) {
    throw new Error(`Could not resolve service case for order ${input.orderId}: ${caseLookupError.message}`);
  }

  let caseId = existingCase?.id ?? null;

  if (!caseId) {
    const { data: createdCase, error: createError } = await admin
      .from('cases')
      .insert({
        client_id: input.clientId,
        company_id: input.companyId,
        category: blueprint.category,
        service: blueprint.canonicalName,
        service_id: blueprint.slug,
        order_id: input.orderId,
        state: blueprint.initialState,
        status: blueprint.initialStatus,
        priority: blueprint.initialPriority,
        next_action: blueprint.initialNextAction,
        docs_checklist: blueprint.documents.filter((doc) => doc.required).map((doc) => doc.label),
        checklist_json: {
          standard: 'service-operational-blueprint-v1',
          service_slug: blueprint.slug,
          requirements: blueprint.requirements,
          documents: blueprint.documents,
          steps: blueprint.steps,
        },
      })
      .select('id')
      .single();

    if (createError || !createdCase?.id) {
      throw new Error(`Could not create service case for order ${input.orderId}: ${createError?.message ?? 'missing case id'}`);
    }

    caseId = createdCase.id;

    const { error: orderLinkError } = await admin
      .from('orders')
      .update({ case_id: caseId })
      .eq('id', input.orderId);

    if (orderLinkError) {
      throw new Error(`Could not link case ${caseId} to order ${input.orderId}: ${orderLinkError.message}`);
    }
  }

  for (const task of blueprint.tasks) {
    const { data: existingTask, error: taskLookupError } = await admin
      .from('internal_tasks')
      .select('id')
      .eq('case_id', caseId)
      .eq('source', 'system')
      .eq('title', task.title)
      .in('status', ['pendiente', 'en_progreso'])
      .maybeSingle();

    if (taskLookupError) {
      throw new Error(`Could not resolve service task ${task.key}: ${taskLookupError.message}`);
    }
    if (existingTask) continue;

    const { error: taskCreateError } = await admin
      .from('internal_tasks')
      .insert({
        title: task.title,
        description: task.description,
        status: 'pendiente',
        priority: task.priority,
        case_id: caseId,
        client_id: input.clientId,
        company_id: input.companyId,
        due_date: taskDueDate(task),
        source: 'system',
        metadata: {
          task_kind: 'service_blueprint_step',
          service_slug: blueprint.slug,
          task_key: task.key,
          phase: task.phase,
          human_approval_required: Boolean(task.humanApprovalRequired),
          blueprint_version: '1',
        },
      });

    if (taskCreateError) {
      throw new Error(`Could not create service task ${task.key}: ${taskCreateError.message}`);
    }
  }

  return caseId;
}
