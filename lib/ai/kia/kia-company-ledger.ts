import type { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { recordClientRegistryEvent, reconcileClientRegistry } from './kia-client-ledger';

type AdminClient = ReturnType<typeof getSupabaseAdmin>;

export async function reconcileCompanyRegistry(
  admin: AdminClient,
  companyId: string,
) {
  const now = new Date().toISOString();

  const [companyRes, tasksRes, integrationsRes, documentsRes, casesRes, appointmentsRes, emailLinksRes, controlsRes] =
    await Promise.all([
      admin.from('companies')
        .select('id,razon_social,nombre_comercial,cif_nif,industry,created_at,updated_at')
        .eq('id', companyId).maybeSingle(),
      admin.from('internal_tasks')
        .select('id,title,description,status,priority,source_key,created_at,completed_at,metadata')
        .eq('company_id', companyId).order('created_at', { ascending: true }).limit(300),
      admin.from('client_integrations')
        .select('id,provider,mode,api_version,status,last_success_at,last_error,created_at,updated_at')
        .eq('company_id', companyId).order('created_at', { ascending: true }).limit(100),
      admin.from('documents')
        .select('id,original_name,state,created_at,case_id')
        .eq('company_id', companyId).order('created_at', { ascending: true }).limit(300),
      admin.from('cases')
        .select('id,service,service_id,status,state,opened_at,closed_at,next_action')
        .eq('company_id', companyId).order('opened_at', { ascending: true }).limit(200),
      admin.from('appointments')
        .select('id,title,status,appointment_date,appointment_end,appointment_type,created_at')
        .eq('company_id', companyId).order('appointment_date', { ascending: true }).limit(200),
      admin.from('admin_email_item_state')
        .select('id,source_kind,provider,source_key,case_id,created_at,updated_at')
        .eq('company_id', companyId).order('created_at', { ascending: true }).limit(300),
      admin.from('company_operational_controls')
        .select('external_communication_blocked,portal_activation_blocked,accounting_write_blocked,reason,metadata,updated_at')
        .eq('company_id', companyId).maybeSingle(),
    ]);

  for (const result of [companyRes, tasksRes, integrationsRes, documentsRes, casesRes, appointmentsRes, emailLinksRes, controlsRes]) {
    if (result.error) throw result.error;
  }

  const company = companyRes.data;
  if (!company) return null;

  await recordClientRegistryEvent(admin, { companyId }, {
    eventType: 'company.registered',
    occurredAt: company.created_at ?? company.updated_at ?? now,
    sourceKey: `company:${company.id}:registered`,
    title: company.nombre_comercial ?? company.razon_social ?? 'Empresa',
    summary: [company.cif_nif, company.industry].filter(Boolean).join(' · '),
    sourceTable: 'companies',
    sourceId: company.id,
    companyId,
    importance: 4,
  });

  const controls = controlsRes.data;
  if (controls) {
    await recordClientRegistryEvent(admin, { companyId }, {
      eventType: 'company.operational_controls',
      occurredAt: controls.updated_at ?? now,
      sourceKey: `company:${companyId}:operational-controls:${controls.updated_at ?? 'current'}`,
      title: 'Controles operativos',
      summary: [
        controls.external_communication_blocked ? 'comunicación externa bloqueada' : 'comunicación externa permitida',
        controls.portal_activation_blocked ? 'portal bloqueado' : 'portal habilitable',
        controls.accounting_write_blocked ? 'escritura contable bloqueada' : 'escritura contable permitida',
        controls.reason,
      ].filter(Boolean).join(' · '),
      sourceTable: 'company_operational_controls',
      sourceId: companyId,
      companyId,
      direction: 'internal',
      importance: 5,
      metadata: controls.metadata ?? {},
    });
  }

  for (const row of tasksRes.data ?? []) {
    await recordClientRegistryEvent(admin, { companyId }, {
      eventType: 'task.created',
      occurredAt: row.created_at,
      sourceKey: `internal-task:${row.id}:created`,
      title: row.title,
      summary: [row.status, row.priority, row.description].filter(Boolean).join(' · ').slice(0, 1200),
      sourceTable: 'internal_tasks',
      sourceId: row.id,
      sourceRef: row.source_key ?? null,
      companyId,
      direction: 'internal',
      importance: row.priority === 'critica' ? 4 : row.priority === 'alta' ? 3 : 2,
      metadata: row.metadata ?? {},
    });
    if (row.completed_at) {
      await recordClientRegistryEvent(admin, { companyId }, {
        eventType: 'task.completed',
        occurredAt: row.completed_at,
        sourceKey: `internal-task:${row.id}:completed`,
        title: row.title,
        summary: 'Tarea completada',
        sourceTable: 'internal_tasks',
        sourceId: row.id,
        sourceRef: row.source_key ?? null,
        companyId,
        direction: 'internal',
        importance: 2,
      });
    }
  }

  for (const row of integrationsRes.data ?? []) {
    await recordClientRegistryEvent(admin, { companyId }, {
      eventType: 'integration.registered',
      occurredAt: row.created_at,
      sourceKey: `client-integration:${row.id}:registered`,
      title: `${row.provider} · ${row.status}`,
      summary: [row.mode, row.api_version, row.last_error].filter(Boolean).join(' · '),
      sourceTable: 'client_integrations',
      sourceId: row.id,
      companyId,
      direction: 'internal',
      importance: row.status === 'active' ? 3 : 2,
      metadata: { last_success_at: row.last_success_at, updated_at: row.updated_at },
    });
  }

  for (const row of documentsRes.data ?? []) {
    await recordClientRegistryEvent(admin, { companyId }, {
      eventType: 'document.received',
      occurredAt: row.created_at,
      sourceKey: `document:${row.id}:received`,
      title: row.original_name ?? 'Documento',
      summary: row.state,
      sourceTable: 'documents',
      sourceId: row.id,
      sourceRef: `document:${row.id}`,
      companyId,
      caseId: row.case_id,
      importance: 2,
    });
  }

  for (const row of casesRes.data ?? []) {
    if (row.opened_at) {
      await recordClientRegistryEvent(admin, { companyId }, {
        eventType: 'case.opened',
        occurredAt: row.opened_at,
        sourceKey: `company-case:${row.id}:opened`,
        title: row.service ?? row.service_id ?? 'Expediente',
        summary: [row.status, row.next_action].filter(Boolean).join(' · '),
        sourceTable: 'cases',
        sourceId: row.id,
        companyId,
        caseId: row.id,
        importance: 3,
      });
    }
    if (row.closed_at) {
      await recordClientRegistryEvent(admin, { companyId }, {
        eventType: 'case.closed',
        occurredAt: row.closed_at,
        sourceKey: `company-case:${row.id}:closed`,
        title: row.service ?? row.service_id ?? 'Expediente',
        summary: row.status ?? row.state,
        sourceTable: 'cases',
        sourceId: row.id,
        companyId,
        caseId: row.id,
        importance: 3,
      });
    }
  }

  for (const row of appointmentsRes.data ?? []) {
    const completed = row.status === 'completed' || row.status === 'completada';
    await recordClientRegistryEvent(admin, { companyId }, {
      eventType: completed ? 'appointment.completed' : 'appointment.booked',
      occurredAt: row.appointment_date ?? row.created_at,
      sourceKey: `appointment:${row.id}:${completed ? 'completed' : 'booked'}`,
      title: row.title ?? row.appointment_type ?? 'Reunión',
      summary: [row.status, row.appointment_end].filter(Boolean).join(' · '),
      sourceTable: 'appointments',
      sourceId: row.id,
      companyId,
      channel: 'meeting',
      importance: 2,
    });
  }

  for (const row of emailLinksRes.data ?? []) {
    const outbound = row.source_kind === 'sent_event';
    await recordClientRegistryEvent(admin, { companyId }, {
      eventType: outbound ? 'email.outbound' : 'email.inbound',
      occurredAt: row.created_at ?? row.updated_at ?? now,
      sourceKey: `company-email-link:${row.id}`,
      title: outbound ? 'Correo enviado vinculado' : 'Correo recibido vinculado',
      summary: `${row.provider} · ${row.source_key}`,
      sourceTable: 'admin_email_item_state',
      sourceId: row.id,
      sourceRef: outbound ? `email-event:${row.source_key}` : `gmail-thread:${row.source_key}`,
      channel: 'email',
      direction: outbound ? 'out' : 'in',
      companyId,
      caseId: row.case_id,
      importance: 2,
    });
  }

  return reconcileClientRegistry(admin, { companyId });
}
