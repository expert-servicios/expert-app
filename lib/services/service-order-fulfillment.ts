import { getServiceOperationProfile } from '@/lib/services/service-operations';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';

type SupabaseAdmin = ReturnType<typeof getSupabaseAdmin>;

function businessDueDate(days: number, from = new Date()): string {
  const due = new Date(from);
  let remaining = Math.max(0, days);
  while (remaining > 0) {
    due.setUTCDate(due.getUTCDate() + 1);
    if (due.getUTCDay() !== 0 && due.getUTCDay() !== 6) remaining -= 1;
  }
  return due.toISOString().slice(0, 10);
}

function resolveCaseCompanyId(slug: string, companyId: string | null): string | null {
  return slug === 'certificado-digital-entidad' || slug === 'pack-certificados-digitales'
    ? companyId
    : null;
}

export async function ensureBatch1OrderFulfillment(
  admin: SupabaseAdmin,
  input: {
    orderId: string;
    serviceSlug: string;
    clientId: string | null;
    companyId: string | null;
  },
): Promise<string | null> {
  const profile = getServiceOperationProfile(input.serviceSlug);
  if (!profile || !input.clientId) return null;

  const { data: existingCase, error: existingCaseError } = await admin
    .from('cases')
    .select('id')
    .eq('order_id', input.orderId)
    .maybeSingle();

  if (existingCaseError) {
    throw new Error(`Could not resolve batch 1 case for order ${input.orderId}: ${existingCaseError.message}`);
  }

  let caseId = existingCase?.id ?? null;

  if (!caseId) {
    const caseCompanyId = resolveCaseCompanyId(profile.slug, input.companyId);
    const firstTaskDays = profile.initialTasks
      .map((task) => task.dueBusinessDays)
      .filter((days): days is number => typeof days === 'number')
      .sort((a, b) => a - b)[0];

    const { data: createdCase, error: createdCaseError } = await admin
      .from('cases')
      .insert({
        client_id: input.clientId,
        company_id: caseCompanyId,
        category: profile.category,
        service: profile.displayName,
        service_id: profile.slug,
        order_id: input.orderId,
        state: profile.initialState,
        status: profile.initialStatus,
        priority: profile.initialPriority,
        due_date: typeof firstTaskDays === 'number' ? businessDueDate(firstTaskDays) : null,
        next_action: profile.nextAction,
        docs_checklist: profile.documents.map((item) => item.label),
        checklist_json: {
          version: profile.version,
          requirements: profile.requirements,
          documents: profile.documents,
          process: profile.process,
          official_sources: profile.officialSources,
          human_approval_before_submission: profile.humanApprovalBeforeSubmission,
        },
      })
      .select('id')
      .single();

    if (createdCaseError || !createdCase?.id) {
      throw new Error(`Could not create batch 1 case for order ${input.orderId}: ${createdCaseError?.message ?? 'missing id'}`);
    }

    caseId = createdCase.id;

    const { error: linkError } = await admin
      .from('orders')
      .update({ case_id: caseId })
      .eq('id', input.orderId);

    if (linkError) {
      throw new Error(`Could not link batch 1 case ${caseId} to order ${input.orderId}: ${linkError.message}`);
    }
  }

  for (const task of profile.initialTasks) {
    const { data: existingTask, error: existingTaskError } = await admin
      .from('internal_tasks')
      .select('id')
      .eq('case_id', caseId)
      .eq('source', 'system')
      .eq('title', task.title)
      .in('status', ['pendiente', 'en_progreso'])
      .maybeSingle();

    if (existingTaskError) {
      throw new Error(`Could not resolve task ${task.key} for case ${caseId}: ${existingTaskError.message}`);
    }
    if (existingTask) continue;

    const { error: taskError } = await admin
      .from('internal_tasks')
      .insert({
        title: task.title,
        description: task.description,
        status: 'pendiente',
        priority: task.priority,
        case_id: caseId,
        client_id: input.clientId,
        company_id: resolveCaseCompanyId(profile.slug, input.companyId),
        due_date: typeof task.dueBusinessDays === 'number' ? businessDueDate(task.dueBusinessDays) : null,
        source: 'system',
        metadata: {
          task_key: task.key,
          service_slug: profile.slug,
          operation_profile_version: profile.version,
          requires_human_approval: Boolean(task.requiresHumanApproval),
        },
      });

    if (taskError) {
      throw new Error(`Could not create task ${task.key} for case ${caseId}: ${taskError.message}`);
    }
  }

  return caseId;
}
