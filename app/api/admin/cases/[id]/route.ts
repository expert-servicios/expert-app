import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { requireActiveActor } from '@/lib/auth/active-actor';
import { registerProfitabilityEvent } from '@/lib/profitability/register-event';
import { generateCaseSnapshot } from '@/lib/profitability/generate-snapshot';
import { canTransition, caseStatusToVisualState, resolveEffectiveCaseStatus } from '@/lib/cases/case-status';
import type { CaseStatus } from '@/lib/cases/case-status';
import { sendEmail } from '@/lib/email/send';
import { notifyClient } from '@/lib/integrations/push';
import { upsertCalendarEventSA, hasCalendarSA } from '@/lib/integrations/google-calendar';
import {
  caseDocsRequired,
  caseDocsReceived,
  caseInProgress,
  casePendingExternal,
  caseDelivered,
  caseBlocked,
  reviewRequest,
  type TenantBrand,
} from '@/lib/email/templates';
import { getTenantForUser } from '@/lib/auth/tenant';
import { notifyTenantAdminStatusChanged } from '@/lib/email/notify-tenant-admins';
import { notifyAdminCaseActivity } from '@/lib/admin/case-admin-notifications';

// ── Automation settings helper ──────────────────────────────────────────────
// Returns enabled automation keys. Missing rows default to enabled for backward compatibility.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getEnabledAutomations(admin: any, keys: string[]): Promise<Set<string>> {
  try {
    const { data } = await admin
      .from('automation_settings')
      .select('key, enabled')
      .in('key', keys);
    const enabled = new Set<string>();
    const seen = new Set<string>();
    for (const row of (data ?? []) as { key: string; enabled: boolean }[]) {
      seen.add(row.key);
      if (row.enabled) enabled.add(row.key);
    }
    for (const key of keys) {
      if (!seen.has(key)) enabled.add(key);
    }
    return enabled;
  } catch {
    return new Set(keys); // table not yet migrated — treat requested automations as enabled
  }
}

// ── Status → client email mapping ──────────────────────────────────────────
// Sends the appropriate template when admin transitions the case status.
// Respects automation_settings toggles — fire-and-forget, never blocks the status update.
async function sendCaseStatusEmail(params: {
  newStatus: CaseStatus;
  clientEmail: string;
  clientName: string;
  clientId: string;
  service: string;
  adminNote: string | null;
  caseId: string;
  enabledAutomations: Set<string>;
  brand?: TenantBrand;
}): Promise<void> {
  const { newStatus, clientEmail, clientName, clientId, service, adminNote, caseId, enabledAutomations, brand } = params;
  const isEnabled = (key: string) => enabledAutomations.has(key);
  const funFact = '';

  let tpl: { subject: string; html: string } | null = null;

  switch (newStatus) {
    case 'pendiente_cliente':
      if (!isEnabled('case.pendiente_cliente')) return;
      tpl = caseDocsRequired(clientName, service, [], adminNote, funFact, brand);
      break;
    case 'en_revision':
      if (!isEnabled('case.en_revision')) return;
      tpl = caseDocsReceived(clientName, service, adminNote, funFact, brand);
      break;
    case 'listo_para_presentar':
      if (!isEnabled('case.listo_para_presentar')) return;
      tpl = caseInProgress(clientName, service, adminNote, funFact, brand);
      break;
    case 'presentado':
      if (!isEnabled('case.presentado')) return;
      tpl = casePendingExternal(clientName, service, null, adminNote, funFact, brand);
      break;
    case 'bloqueado':
      if (!isEnabled('case.bloqueado')) return;
      tpl = caseBlocked(clientName, service, adminNote, brand);
      break;
    case 'finalizado': {
      const sendDelivered = isEnabled('case.finalizado');
      const sendReview = isEnabled('case.review_request');
      if (!sendDelivered && !sendReview) return;

      // Generate review token only when the review email is enabled.
      let reviewToken = '';
      if (sendReview) {
        try {
          reviewToken = randomBytes(32).toString('hex');
          const admin = getSupabaseAdmin();
          await admin.from('review_requests').insert({
            case_id: caseId,
            client_id: clientId,
            token: reviewToken,
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          });
        } catch { reviewToken = ''; }
      }

      if (sendDelivered) {
        const deliveredTpl = caseDelivered(clientName, service, adminNote, funFact, brand);
        void sendEmail({ to: clientEmail, eventType: 'case.delivered', ...deliveredTpl, metadata: { caseId } });
      }
      if (sendReview && reviewToken) {
        const reviewTpl = reviewRequest(clientName, service, reviewToken, brand);
        void sendEmail({ to: clientEmail, eventType: 'case.review_request', ...reviewTpl, metadata: { caseId } });
      }
      return;
    }
    default:
      return;
  }

  if (tpl) {
    void sendEmail({ to: clientEmail, eventType: `case.${newStatus}`, ...tpl, metadata: { caseId } });
  }
}

// Fetch client email + name for a given userId
async function getClientInfo(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  userId: string
): Promise<{ email: string; name: string } | null> {
  const [authResult, profileResult] = await Promise.all([
    admin.auth.admin.getUserById(userId),
    admin.from('profiles').select('full_name').eq('id', userId).single(),
  ]);
  const email = authResult.data?.user?.email;
  if (!email) return null;
  return { email, name: profileResult.data?.full_name ?? email.split('@')[0] };
}

type AdminClient = ReturnType<typeof getSupabaseAdmin>;

type ScopedCase = {
  id: string;
  category: string | null;
  service: string | null;
  service_id: string | null;
  state: string | null;
  status: string | null;
  priority: string | null;
  next_action: string | null;
  due_date: string | null;
  order_id: string | null;
  opened_at: string | null;
  closed_at: string | null;
  client_id: string;
  company_id: string | null;
  tenant_id: string | null;
  admin_note: string | null;
  docs_checklist: unknown;
  checklist_json: unknown;
  assigned_to: string | null;
  google_calendar_event_id: string | null;
};

async function getScopedCase(
  admin: AdminClient,
  caseId: string,
  actorTenantId: string | null,
): Promise<ScopedCase | null> {
  let query = admin
    .from('cases')
    .select(
      'id,category,service,service_id,state,status,priority,next_action,due_date,order_id,opened_at,closed_at,client_id,company_id,tenant_id,admin_note,docs_checklist,checklist_json,assigned_to,google_calendar_event_id',
    )
    .eq('id', caseId);

  if (actorTenantId) query = query.eq('tenant_id', actorTenantId);

  const { data: caseData, error } = await query.maybeSingle();
  if (error || !caseData) return null;

  const scopeTenantId = actorTenantId ?? caseData.tenant_id;
  if (scopeTenantId) {
    const [clientScope, companyScope] = await Promise.all([
      admin
        .from('profiles')
        .select('id')
        .eq('id', caseData.client_id)
        .eq('tenant_id', scopeTenantId)
        .maybeSingle(),
      caseData.company_id
        ? admin
            .from('companies')
            .select('id')
            .eq('id', caseData.company_id)
            .eq('tenant_id', scopeTenantId)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);

    if (clientScope.error || !clientScope.data) return null;
    if (caseData.company_id && (companyScope.error || !companyScope.data)) return null;
  }

  if (caseData.company_id) {
    const { data: membership, error: membershipError } = await admin
      .from('profile_companies')
      .select('company_id')
      .eq('profile_id', caseData.client_id)
      .eq('company_id', caseData.company_id)
      .maybeSingle();

    if (membershipError || !membership) return null;
  }

  return caseData as ScopedCase;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const actor = await requireActiveActor(request, ['admin', 'owner']);
    if (!actor) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const admin = getSupabaseAdmin();
    const rawCaseData = await getScopedCase(admin, id, actor.tenantId);
    if (!rawCaseData) {
      return NextResponse.json({ error: 'Expediente no encontrado' }, { status: 404 });
    }

    let documentsQuery = admin
      .from('documents')
      .select('id,original_name,state,created_at,file_path,uploaded_by_role,client_id,company_id')
      .eq('case_id', id)
      .eq('client_id', rawCaseData.client_id);
    documentsQuery = rawCaseData.company_id
      ? documentsQuery.eq('company_id', rawCaseData.company_id)
      : documentsQuery.is('company_id', null);

    const [docsResult, notesResult] = await Promise.all([
      documentsQuery.order('created_at', { ascending: false }),
      admin
        .from('case_document_notes')
        .select('id,item_key,item_label,comment,updated_at,updated_by')
        .eq('case_id', id)
        .order('updated_at', { ascending: false }),
    ]);
    const effectiveStatus = resolveEffectiveCaseStatus(rawCaseData.status, rawCaseData.state);
    const caseData = {
      ...rawCaseData,
      effective_status: effectiveStatus,
      visual_state: caseStatusToVisualState(effectiveStatus),
    };

    // Fetch client info
    const [authUser, clientProfile, assigneeProfile] = await Promise.all([
      admin.auth.admin.getUserById(caseData.client_id),
      admin.from('profiles').select('full_name,phone').eq('id', caseData.client_id).single(),
      caseData.assigned_to
        ? admin.from('profiles').select('id,full_name').eq('id', caseData.assigned_to).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    // Generate signed download URLs (1h validity)
    const docs = await Promise.all(
      (docsResult.data ?? []).map(async (doc) => {
        const { data: urlData } = await admin.storage
          .from('client-documents')
          .createSignedUrl(doc.file_path, 3600);
        return { ...doc, downloadUrl: urlData?.signedUrl ?? null };
      })
    );

    return NextResponse.json({
      case: {
        ...caseData,
        client: {
          email: authUser.data.user?.email ?? '',
          full_name: clientProfile.data?.full_name ?? null,
          phone: clientProfile.data?.phone ?? null
        },
        assignee: assigneeProfile.data ?? null,
      },
      documents: docs,
      documentNotes: notesResult.data ?? [],
    });
  } catch (err) {
    console.error('[admin/cases/[id] GET]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const actor = await requireActiveActor(request, ['admin', 'owner']);
    if (!actor) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const admin = getSupabaseAdmin();
    const current = await getScopedCase(admin, id, actor.tenantId);
    if (!current) return NextResponse.json({ error: 'Expediente no encontrado' }, { status: 404 });

    const body = await request.json() as {
      status?: CaseStatus;
      priority?: string;
      admin_note?: string;
      next_action?: string;
      due_date?: string;
      assigned_to?: string | null;
    };

    // Validate status transition if status is being updated
    if (body.status) {
      const fromStatus = resolveEffectiveCaseStatus(current.status, current.state);
      if (fromStatus !== body.status && !canTransition(fromStatus, body.status)) {
        return NextResponse.json(
          { error: `Transición no permitida: ${fromStatus} → ${body.status}` },
          { status: 422 }
        );
      }

      // Update case
      const changedAt = new Date().toISOString();
      const updatePayload: Record<string, unknown> = { status: body.status, updated_at: changedAt };
      if (body.priority)    updatePayload.priority    = body.priority;
      if (body.admin_note !== undefined) updatePayload.admin_note  = body.admin_note;
      if (body.next_action !== undefined) updatePayload.next_action = body.next_action;
      if (body.due_date !== undefined)   updatePayload.due_date    = body.due_date;
      if (body.assigned_to !== undefined) updatePayload.assigned_to = body.assigned_to;
      if (body.status === 'finalizado')  updatePayload.closed_at   = new Date().toISOString();

      let statusUpdate = admin
        .from('cases')
        .update(updatePayload)
        .eq('id', id)
        .eq('client_id', current.client_id);
      statusUpdate = current.company_id
        ? statusUpdate.eq('company_id', current.company_id)
        : statusUpdate.is('company_id', null);
      if (current.tenant_id) statusUpdate = statusUpdate.eq('tenant_id', current.tenant_id);

      const { data: updatedStatusCase, error: updateErr } = await statusUpdate
        .select('id')
        .maybeSingle();
      if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });
      if (!updatedStatusCase) {
        return NextResponse.json(
          { error: 'El expediente cambió durante la actualización' },
          { status: 409 },
        );
      }

      // Send client notification email (fire-and-forget — never blocks the response)
      if (body.status !== fromStatus) {
        // Read automation toggles for the relevant keys; missing rows default to enabled.
        const automationKeys = body.status === 'finalizado'
          ? ['case.finalizado', 'case.review_request']
          : [`case.${body.status}`];

        const [clientInfo, enabledAutomations, clientTenant] = await Promise.all([
          getClientInfo(admin, current.client_id),
          getEnabledAutomations(admin, automationKeys),
          getTenantForUser(current.client_id).catch(() => null),
        ]);
        // Use tenant branding if the client belongs to a non-EXPERT tenant
        const brand: TenantBrand | undefined =
          clientTenant && clientTenant.slug !== 'expert'
            ? (clientTenant.settings as TenantBrand)
            : undefined;

        const STATUS_PUSH_LABELS: Partial<Record<CaseStatus, string>> = {
          pendiente_cliente:    'Necesitamos tu documentación para continuar',
          en_revision:          'Estamos revisando tu documentación',
          listo_para_presentar: 'Tu expediente está listo para presentar',
          presentado:           'Tu trámite ha sido presentado ante el organismo',
          finalizado:           'Tu expediente ha finalizado',
        };

        if (clientInfo) {
          void sendCaseStatusEmail({
            newStatus: body.status,
            clientEmail: clientInfo.email,
            clientName: clientInfo.name,
            clientId: current.client_id,
            service: current.service ?? 'Trámite EXPERT',
            adminNote: body.admin_note ?? null,
            caseId: id,
            enabledAutomations,
            brand,
          }).catch((err) => console.error('[cases PATCH] email error:', err));

          // Notify tenant_admin if client belongs to a non-EXPERT tenant
          if (clientTenant && clientTenant.slug !== 'expert') {
            const STATUS_LABELS: Record<string, string> = {
              pendiente_cliente: 'Pendiente documentación',
              en_revision: 'En revisión',
              listo_para_presentar: 'Listo para presentar',
              presentado: 'Presentado',
              finalizado: 'Finalizado',
              bloqueado: 'Bloqueado',
            };
            void notifyTenantAdminStatusChanged({
              clientId: current.client_id,
              clientName: clientInfo.name,
              service: current.service ?? 'Trámite',
              caseId: id,
              newStatus: body.status,
              statusLabel: STATUS_LABELS[body.status] ?? body.status,
              brand: brand,
            }).catch(() => {});
          }
        }

        // Push notification to client
        const pushLabel = STATUS_PUSH_LABELS[body.status];
        if (pushLabel) {
          notifyClient(current.client_id, {
            title: current.service ?? 'Actualización de expediente',
            body:  pushLabel,
            url:   `/dashboard/expedientes/${id}`,
            tag:   `case-status-${id}`,
          }).catch(() => {});
        }

        void notifyAdminCaseActivity({
          kind: 'status_changed',
          caseId: id,
          service: current.service ?? 'Expediente',
          clientName: clientInfo?.name ?? null,
          detail: `Estado: ${fromStatus} → ${body.status}${body.next_action ? ` · Siguiente acción: ${body.next_action}` : ''}`,
          eventRef: changedAt,
          occurredAt: changedAt,
        });
      }

      // Register profitability event (fire-and-forget)
      const serviceId = current.service_id ?? 'unknown';
      const clientId  = current.client_id  ?? undefined;
      void registerProfitabilityEvent({
        caseId:    id,
        clientId,
        serviceId,
        eventType: 'case_status_changed',
        source:    'manual',
        operator:  'admin',
        metadata:  { from: fromStatus, to: body.status, changed_by: actor.userId },
      }).catch(() => {});

      // On finalizado: generate case-level profitability snapshot
      if (body.status === 'finalizado') {
        void generateCaseSnapshot(id).catch(() => {});
      }

      return NextResponse.json({ ok: true, status: body.status });
    }

    // Non-status fields update (note, next_action, due_date)
    const changedAt = new Date().toISOString();
    const updatePayload: Record<string, unknown> = { updated_at: changedAt };
    if (body.priority)    updatePayload.priority    = body.priority;
    if (body.admin_note !== undefined) updatePayload.admin_note  = body.admin_note;
    if (body.next_action !== undefined) updatePayload.next_action = body.next_action;
    if (body.due_date !== undefined)   updatePayload.due_date    = body.due_date;
    if (body.assigned_to !== undefined) updatePayload.assigned_to = body.assigned_to;

    if (Object.keys(updatePayload).length === 1 && updatePayload.updated_at) {
      return NextResponse.json({ error: 'Nada que actualizar' }, { status: 400 });
    }

    let caseUpdate = admin
      .from('cases')
      .update(updatePayload)
      .eq('id', id)
      .eq('client_id', current.client_id);
    caseUpdate = current.company_id
      ? caseUpdate.eq('company_id', current.company_id)
      : caseUpdate.is('company_id', null);
    if (current.tenant_id) caseUpdate = caseUpdate.eq('tenant_id', current.tenant_id);

    const { data: updatedCase, error: updateErr } = await caseUpdate
      .select('service, category, client_id, google_calendar_event_id')
      .single();
    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

    const changedFields = [
      body.next_action !== undefined ? `siguiente acción: ${body.next_action || 'sin definir'}` : null,
      body.due_date !== undefined ? `vencimiento: ${body.due_date || 'sin fecha'}` : null,
      body.priority !== undefined ? `prioridad: ${body.priority}` : null,
      body.assigned_to !== undefined ? 'responsable actualizado' : null,
      body.admin_note !== undefined ? 'nota interna actualizada' : null,
    ].filter(Boolean).join(' · ');
    const changedClient = await getClientInfo(admin, updatedCase.client_id).catch(() => null);
    void notifyAdminCaseActivity({
      kind: body.next_action !== undefined ? 'next_action_changed' : 'case_updated',
      caseId: id,
      service: updatedCase.service ?? updatedCase.category ?? 'Expediente',
      clientName: changedClient?.name ?? null,
      detail: changedFields || 'Datos operativos actualizados',
      eventRef: changedAt,
      occurredAt: changedAt,
    });

    // Background: sync due_date to Google Calendar as a reminder
    if (body.due_date && hasCalendarSA() && updatedCase) {
      const dateOnly = body.due_date.slice(0, 10);
      const clientInfo = await getClientInfo(admin, updatedCase.client_id).catch(() => null);
      upsertCalendarEventSA(
        {
          summary: `⚠️ Vencimiento: ${updatedCase.service ?? updatedCase.category}`,
          description: clientInfo
            ? `Cliente: ${clientInfo.name} (${clientInfo.email})\nExpediente: ${id}`
            : `Expediente: ${id}`,
          date: dateOnly,
          reminderDaysBefore: [7, 1],
        },
        (updatedCase.google_calendar_event_id as string | null) ?? undefined
      ).then((eventId) => {
        if (eventId) {
          let calendarUpdate = admin
            .from('cases')
            .update({ google_calendar_event_id: eventId })
            .eq('id', id)
            .eq('client_id', current.client_id);
          calendarUpdate = current.company_id
            ? calendarUpdate.eq('company_id', current.company_id)
            : calendarUpdate.is('company_id', null);
          if (current.tenant_id) calendarUpdate = calendarUpdate.eq('tenant_id', current.tenant_id);
          calendarUpdate.then(() => null, () => null);
        }
      }).catch((e) => console.error('[cases PATCH] calendar sync:', e));
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[admin/cases/[id] PATCH]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
