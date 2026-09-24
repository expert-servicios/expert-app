import type { SupabaseClient } from '@supabase/supabase-js';
import {
  getServiceOperationalBlueprint,
  type ServiceOperationalBlueprint,
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

type ResolvedService = {
  slug: string;
  blueprint: ServiceOperationalBlueprint | null;
};

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function genericTask(service: ResolvedService): ServiceTaskTemplate {
  return {
    key: `manual-intake-${service.slug}`,
    title: `Iniciar servicio: ${service.slug}`,
    description: 'Revisar el pedido pagado, confirmar alcance y preparar el checklist operativo con el cliente.',
    phase: 'intake',
    priority: 'alta',
    dueBusinessDays: 1,
    humanApprovalRequired: true,
  };
}

export async function ensureServiceOrderFulfillment(
  admin: SupabaseAdmin,
  input: {
    orderId: string;
    serviceSlug: string;
    serviceSlugs?: string[];
    serviceName?: string | null;
    clientId: string | null;
    companyId: string | null;
  },
): Promise<string | null> {
  if (!input.clientId) return null;

  const slugs = unique([...(input.serviceSlugs ?? []), input.serviceSlug]);
  if (slugs.length === 0) {
    throw new Error(`Could not fulfill service order ${input.orderId}: missing service slug`);
  }

  const services: ResolvedService[] = slugs.map((slug) => ({
    slug,
    blueprint: getServiceOperationalBlueprint(slug),
  }));
  const blueprints = services
    .map((service) => service.blueprint)
    .filter((blueprint): blueprint is ServiceOperationalBlueprint => Boolean(blueprint));
  const isFullySpecialized = blueprints.length === services.length;
  const primaryBlueprint = blueprints[0] ?? null;

  const requiredDocuments = unique(
    blueprints.flatMap((blueprint) =>
      blueprint.documents.filter((document) => document.required).map((document) => document.label),
    ),
  );
  const serviceLabel = input.serviceName?.trim()
    || services.map((service) => service.blueprint?.canonicalName ?? service.slug).join(', ');

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
        category: services.length === 1 && primaryBlueprint ? primaryBlueprint.category : 'servicios',
        service: serviceLabel,
        service_id: slugs.join(','),
        order_id: input.orderId,
        state: primaryBlueprint?.initialState ?? 'nuevo',
        status: primaryBlueprint?.initialStatus ?? 'nuevo',
        priority: primaryBlueprint?.initialPriority ?? 'alta',
        next_action: isFullySpecialized
          ? primaryBlueprint?.initialNextAction ?? 'Revisar el pedido y comenzar la prestación'
          : 'Revisar el pedido pagado y definir el checklist operativo',
        docs_checklist: requiredDocuments,
        checklist_json: {
          standard: 'service-operational-blueprint-v2',
          service_slugs: slugs,
          specialized: isFullySpecialized,
          services: services.map((service) => ({
            service_slug: service.slug,
            blueprint_available: Boolean(service.blueprint),
            requirements: service.blueprint?.requirements ?? [],
            documents: service.blueprint?.documents ?? [],
            steps: service.blueprint?.steps ?? [],
          })),
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

  const tasks = services.flatMap((service) =>
    (service.blueprint?.tasks ?? [genericTask(service)]).map((task) => ({
      task,
      serviceSlug: service.slug,
      blueprintSlug: service.blueprint?.slug ?? null,
    })),
  );

  for (const { task, serviceSlug, blueprintSlug } of tasks) {
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
          ...(blueprintSlug
            ? { task_kind: 'service_blueprint_step' }
            : { task_kind: 'service_manual_intake' }),
          service_slug: serviceSlug,
          blueprint_slug: blueprintSlug,
          task_key: task.key,
          phase: task.phase,
          human_approval_required: Boolean(task.humanApprovalRequired),
          depends_on: task.dependsOn ?? [],
          blocks_submission: Boolean(task.blocksSubmission),
          reference_urls: task.referenceUrls ?? [],
          blueprint_version: blueprintSlug ? '5' : null,
        },
      });

    if (taskCreateError) {
      throw new Error(`Could not create service task ${task.key}: ${taskCreateError.message}`);
    }
  }

  return caseId;
}
