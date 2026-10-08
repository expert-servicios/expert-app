import { KIA_ACCOUNTING_READ_NAMES, executeKiaAccountingRead, type KiaAccountingReadName } from './kia-accounting-v2-reads';
import { absoluteAppUrl } from '@/lib/utils/app-url';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { getAuthorizedBookingEmails } from '@/lib/admin/onboarding-booking-identity';
import { resolveKiaContactContext } from '@/lib/integrations/kia-contact-resolver';
import { getService } from '@/lib/services/service-registry';
import { getServiceOperationalBlueprint } from '@/lib/services/service-operational-blueprints';
import { caseStatusLabel, resolveEffectiveCaseStatus } from '@/lib/cases/case-status';
import { getNationalityMinorAutonomyPolicy } from '@/lib/services/nationality-minor-autonomy';
import { getCurrentRegulatoryValue } from '@/lib/regulatory/regulatory-values';
import { getCurrentRegulatoryRuleset } from '@/lib/regulatory/regulatory-rulesets';
import { resolveCompanyCommercialCoverage } from '@/lib/subscriptions/company-commercial-coverage';
import { getReadinessCheck, calculateReadinessResult } from '@/lib/data/service-readiness-checks';
import { validateKiaToolArguments, type KiaToolCall, type KiaToolResult } from './kia-tool-definitions';
import type { KiaContext } from './kia-context-builder';
import { redactJson, safeErrorMessage } from './kia-redaction';
import {
  createHoldedGatewayForIntegration,
  listHoldedBankAccounts,
  listHoldedContacts,
  listHoldedDocumentType,
  listHoldedDocuments,
} from '@/lib/integrations/holded/holded-gateway';
import { generateCompanyReport } from '@/lib/reports/report-generator';
import { extractInvoiceOcr, type InvoiceMediaType } from './kia-ocr-extractor';
import { executeKiaHoldedLaborTool, type KiaHoldedLaborToolName } from './kia-holded-labor-tools';
import { resolveKiaCompanyHoldedAccess } from './kia-holded-access';
import { executeLaborPayrollDiagnostics } from './kia-labor-payroll-diagnostics';
import { findKiaRelevantServices, getKiaOfficialSources, searchKiaKnowledgeResources } from './kia-knowledge-discovery';
import { loadKiaClientCommunications } from './kia-client-brief';
import { missingKiaCaseDocumentRequirements } from './kia-case-document-gaps';
import { createKiaConfirmedBooking, getKiaBookingAvailability } from '@/lib/booking/kia-booking-operator';
import { materializeRecurringMeetingSeries } from '@/lib/booking/recurring-meeting-series';
import {
  KIA_ADMIN_OFFICE_TOOL_NAMES,
  executeKiaAdminOfficeTool,
  type KiaAdminOfficeToolName,
} from './kia-admin-office-tools';
import {
  ACCOUNTING_TOOL_NAMES,
  executeKiaAccountingTool,
  type KiaAccountingToolName,
} from './kia-accounting-tools';
import {
  getKiaCaseSignatureStatus,
  prepareKiaSignatureRequest,
} from './kia-signature-workflow';

const HOLDED_LABOR_TOOL_NAMES = new Set<KiaHoldedLaborToolName>([
  'get_holded_employees',
  'get_holded_employee_contract',
  'get_holded_payslips',
  'get_holded_salary_records',
]);

export async function executeKiaToolCall(toolCall: KiaToolCall, context: KiaContext): Promise<KiaToolResult> {
  try {
    const args = validateKiaToolArguments(toolCall.name, toolCall.arguments);
    const admin = getSupabaseAdmin();

    if (KIA_ADMIN_OFFICE_TOOL_NAMES.has(toolCall.name as KiaAdminOfficeToolName)) {
      return executeKiaAdminOfficeTool(toolCall.name as KiaAdminOfficeToolName, args, context, admin);
    }

    if (KIA_ACCOUNTING_READ_NAMES.has(toolCall.name as KiaAccountingReadName)) {
      return executeKiaAccountingRead(toolCall.name as KiaAccountingReadName, args, context);
    }

    if (ACCOUNTING_TOOL_NAMES.has(toolCall.name as KiaAccountingToolName)) {
      return executeKiaAccountingTool(toolCall.name as KiaAccountingToolName, args, context);
    }

    if (toolCall.name === 'run_labor_payroll_diagnostics') {
      return executeLaborPayrollDiagnostics(args, context, admin);
    }

    if (HOLDED_LABOR_TOOL_NAMES.has(toolCall.name as KiaHoldedLaborToolName)) {
      return executeKiaHoldedLaborTool(toolCall.name as KiaHoldedLaborToolName, args, context, admin);
    }

    switch (toolCall.name) {
      case 'resolve_contact_context': {
        const phone = typeof args.phone === 'string' ? args.phone : context.contact.phone;
        if (!phone) return ok(toolCall.name, { status: context.contact.status });
        const resolved = await resolveKiaContactContext(admin, phone);
        return ok(toolCall.name, {
          status: resolved.status,
          clientId: resolved.clientId,
          leadId: resolved.leadId,
          profileCompleted: resolved.profileCompleted,
          billingReady: resolved.billingReady,
          openCases: resolved.openCases.length,
        });
      }
      case 'get_client_profile':
        return ok(toolCall.name, { profile: context.profile, clientId: args.clientId });
      case 'get_service_registry_item': {
        const service = getService(String(args.serviceSlug));
        return ok(toolCall.name, service ? {
          slug: service.slug,
          name: service.name,
          flowType: service.flowType,
          hasCheckout: service.hasCheckout,
          hasReadiness: service.hasReadiness,
          requiresHolded: service.requiresHoldedApi || service.requiresHoldedLicense,
          hasOperationalBlueprint: Boolean(getServiceOperationalBlueprint(service.slug)),
        } : { found: false });
      }
      case 'get_service_operational_blueprint': {
        const blueprint = getServiceOperationalBlueprint(String(args.serviceSlug));
        if (!blueprint) return ok(toolCall.name, { found: false });
        return ok(toolCall.name, {
          found: true,
          slug: blueprint.slug,
          name: blueprint.canonicalName,
          category: blueprint.category,
          requirements: blueprint.requirements,
          documents: blueprint.documents,
          steps: blueprint.steps,
          tasks: blueprint.tasks,
          userSummary: blueprint.kia.userSummary,
          adminSummary: blueprint.kia.adminSummary,
          escalationRules: blueprint.kia.escalationRules,
          automationPolicy: getNationalityMinorAutonomyPolicy(blueprint.slug),
        });
      }
      case 'get_regulatory_value': {
        const onDate = typeof args.onDate === 'string' && args.onDate
          ? new Date(`${args.onDate}T12:00:00Z`)
          : new Date();
        if (Number.isNaN(onDate.getTime())) return fail(toolCall.name, 'onDate no es una fecha válida.');
        const value = await getCurrentRegulatoryValue(String(args.valueKey), onDate);
        return ok(toolCall.name, value ? { found: true, value } : { found: false });
      }
      case 'get_regulatory_ruleset': {
        const onDate = typeof args.onDate === 'string' && args.onDate
          ? new Date(`${args.onDate}T12:00:00Z`)
          : new Date();
        if (Number.isNaN(onDate.getTime())) return fail(toolCall.name, 'onDate no es una fecha válida.');
        const ruleset = await getCurrentRegulatoryRuleset(String(args.rulesetKey), onDate);
        return ok(toolCall.name, ruleset ? { found: true, ruleset } : { found: false });
      }

      case 'run_readiness_check': {
        const check = getReadinessCheck(String(args.serviceSlug));
        if (!check) return ok(toolCall.name, { found: false });
        const answers = args.answers as Record<string, string | string[]>;
        const result = calculateReadinessResult(check, answers);
        return ok(toolCall.name, { readiness: result });
      }
      case 'run_viability_check':
        return ok(toolCall.name, {
          status: 'schema_only',
          message: 'Viability execution remains in existing backend flow; use run_viability nextAction.',
        });
      case 'get_holded_connection_status':
        return ok(toolCall.name, {
          status: context.company?.holdedConnected ? 'active' : 'missing',
          permissions: context.company?.holdedPermissions ?? {},
        });
      case 'generate_checkout_gate_link':
        return ok(toolCall.name, {
          url: absoluteAppUrl(`/contratar?service=${encodeURIComponent(String(args.serviceSlug))}&source=${encodeURIComponent(String(args.source ?? 'kia'))}`),
          createsStripeCheckout: false,
        });
      case 'generate_profile_link':
        return ok(toolCall.name, { url: loginUrl(String(args.next ?? '/dashboard/perfil')) });
      case 'generate_holded_connection_link':
        return ok(toolCall.name, { url: loginUrl(String(args.next ?? '/dashboard/integraciones/holded')) });
      case 'get_case_status':
        return ok(toolCall.name, { cases: context.cases });
      case 'classify_document':
        return ok(toolCall.name, {
          status: 'schema_only',
          message: 'Document classification is handled by document classifier task; no mutation executed.',
        });
      case 'create_next_best_action':
      case 'create_internal_task':
        return ok(toolCall.name, {
          status: 'draft_only',
          draft: redactJson(args),
          requiresAdminConfirmation: true,
        });
      case 'get_company_status_snapshot':
        return ok(toolCall.name, context.accounting);

      case 'get_accounting_snapshot': {
        const companyId = context.company?.id ?? null;
        if (!companyId) return fail(toolCall.name, 'No hay una empresa activa y autorizada en el contexto de KIA.');

        const periods = args.periods as number;
        const includeAnomalies = args.includeAnomalies as boolean;

        const { data: snapshots, error: snapshotErr } = await admin
          .from('accounting_period_snapshots')
          .select('id, company_id, period_label, period_start, period_end, revenue, expenses, net_result, vat_balance, created_at')
          .eq('company_id', companyId)
          .order('created_at', { ascending: false })
          .limit(periods);

        if (snapshotErr) return fail(toolCall.name, 'Error consultando snapshots contables.');

        const result: Record<string, unknown> = {
          hasSnapshot: Boolean(snapshots.length),
          snapshots,
        };

        if (includeAnomalies) {
          const { data: anomalyRows, error: anomalyErr } = await admin
            .from('accounting_anomalies')
            .select('id, anomaly_type, severity, description, status, created_at')
            .eq('company_id', companyId)
            .in('status', ['open', 'pending'])
            .order('severity', { ascending: false })
            .limit(20);

          if (anomalyErr) return fail(toolCall.name, 'Error consultando anomalías contables.');

          const anomalies = anomalyRows as Array<Record<string, unknown>>;
          result.anomalyCount = anomalies.length;
          result.criticalAnomalyCount = anomalies.filter((a) => a.severity === 'critical').length;
          result.anomalies = anomalies;
        }

        return ok(toolCall.name, result);
      }

      case 'extract_invoice_ocr': {
        const mediaUrl = String(args.mediaUrl ?? '');
        const mediaType = String(args.mediaType ?? 'image/jpeg') as InvoiceMediaType;
        if (!mediaUrl) return fail(toolCall.name, 'mediaUrl is required');
        const openAiKey = process.env.OPENAI_API_KEY?.trim();
        if (!openAiKey) return fail(toolCall.name, 'OpenAI not configured (OPENAI_API_KEY missing)');
        const ocrResult = await extractInvoiceOcr({ mediaUrl, mediaType, openAiApiKey: openAiKey });
        return ok(toolCall.name, ocrResult as unknown as Record<string, unknown>);
      }
      case 'create_kia_decision_log':
        return ok(toolCall.name, { status: 'handled_by_backend' });

      case 'get_holded_invoices':
      case 'get_holded_contacts':
      case 'get_holded_bank_balance': {
        const docType = toolCall.name === 'get_holded_invoices'
          ? String(args.docType ?? 'invoice')
          : null;
        const requiredPermission =
          toolCall.name === 'get_holded_contacts'
            ? 'contacts'
            : toolCall.name === 'get_holded_bank_balance'
              ? 'bankAccounts'
              : docType === 'purchase'
                ? 'purchaseInvoices'
                : 'salesInvoices';
        const access = await resolveKiaCompanyHoldedAccess(admin, context, requiredPermission);
        if (!access.ok) {
          return fail(toolCall.name, `${access.error} Usa generate_holded_connection_link si necesitas vincular Holded.`);
        }
        const gateway = await createHoldedGatewayForIntegration(access.access.integrationId);

        if (toolCall.name === 'get_holded_invoices') {
          const limit = Number(args.limit ?? 10);
          const startDate = typeof args.since === 'string' ? args.since : undefined;
          const supportedDocType = docType as 'invoice' | 'purchase' | 'salesreceipt' | 'creditnote';
          const docs = supportedDocType === 'invoice' || supportedDocType === 'purchase'
            ? await listHoldedDocuments(
                gateway,
                supportedDocType === 'purchase' ? 'purchase' : 'sales',
                { maxItems: limit, startDate },
              )
            : await listHoldedDocumentType(gateway, supportedDocType, { maxItems: limit, startDate });
          return ok(toolCall.name, {
            count: docs.length,
            documents: docs.map((d) => ({
              id: d.id,
              number: d.number,
              date: d.date,
              contact: d.contactName,
              total: d.total,
              currency: d.currency,
              dueDate: d.dueDate,
              status: d.status,
              paymentsPending: d.paymentsPending,
            })),
            apiVersion: gateway.metadata.apiVersion,
          });
        }

        if (toolCall.name === 'get_holded_contacts') {
          const limit = Number(args.limit ?? 10);
          const contacts = await listHoldedContacts(gateway, {
            search: typeof args.query === 'string' ? args.query : undefined,
            maxItems: limit,
          });
          return ok(toolCall.name, {
            count: contacts.length,
            contacts,
            apiVersion: gateway.metadata.apiVersion,
          });
        }

        const limit = Number(args.limit ?? 5);
        const accounts = await listHoldedBankAccounts(gateway, limit);
        return ok(toolCall.name, {
          count: accounts.length,
          accounts,
          apiVersion: gateway.metadata.apiVersion,
        });
      }

      case 'generate_company_report': {
        const clientId = context.contact?.clientId;
        if (!clientId) return fail(toolCall.name, 'No se puede generar el informe sin un cliente identificado.');

        const companyId = (context.company as Record<string, unknown> | null)?.id as string | null ?? null;
        const access = await resolveKiaCompanyHoldedAccess(admin, context);
        if (!access.ok) {
          return fail(toolCall.name, `${access.error} Usa generate_holded_connection_link para vincular Holded primero.`);
        }

        try {
          const result = await generateCompanyReport({
            clientId,
            companyId,
            integrationId: access.access.integrationId,
            period: typeof args.period === 'string' ? args.period : undefined,
            lang: (args.lang as 'es' | 'ru') ?? 'es',
            generatedBy: 'kia',
          });
          return ok(toolCall.name, {
            reportId: result.reportId,
            reportUrl: result.reportUrl,
            title: result.title,
            period: result.period,
            message: `Informe generado correctamente para el periodo ${result.period}.`,
          });
        } catch (err) {
          return fail(toolCall.name, `Error generando el informe: ${safeErrorMessage(err)}`);
        }
      }

      case 'get_user_expedientes': {
        const clientId = context.contact?.clientId;
        if (!clientId) return fail(toolCall.name, 'No hay usuario identificado.');
        const companyId = context.company?.id ?? null;
        const statusFilter = String(args.status ?? 'activos');
        const limit = Number(args.limit ?? 10);

        let query = admin
          .from('cases')
          .select('id, service, service_id, category, status, state, next_action, priority, due_date, opened_at, company_id')
          .eq('client_id', clientId);
        if (companyId) query = query.eq('company_id', companyId);
        if (statusFilter === 'activos') {
          query = query.neq('status', 'finalizado');
        } else if (statusFilter === 'finalizados') {
          query = query.eq('status', 'finalizado');
        }
        const { data, error } = await query.order('opened_at', { ascending: false }).limit(limit);
        if (error) return fail(toolCall.name, 'Error consultando expedientes.');

        type CaseRow = { id: string; service: string; service_id: string | null; category: string | null; status: string; state: string | null; next_action: string | null; priority: string; due_date: string | null; opened_at: string; company_id: string | null };
        const rows = (data ?? []) as CaseRow[];
        const locale = context.contact.language === 'ru' ? 'ru' : 'es';
        return ok(toolCall.name, {
          count: rows.length,
          company_id: companyId,
          expedientes: rows.map((c) => ({
            id: c.id,
            servicio: c.service,
            servicio_slug: c.service_id,
            categoria: c.category,
            estado: caseStatusLabel(resolveEffectiveCaseStatus(c.status, c.state), locale),
            estado_raw: resolveEffectiveCaseStatus(c.status, c.state),
            siguiente_paso: c.next_action,
            prioridad: c.priority,
            vencimiento: c.due_date,
            fecha_apertura: c.opened_at,
            url: `/dashboard/expedientes/${c.id}`,
          })),
        });
      }

      case 'get_user_companies': {
        const clientId = context.contact?.clientId;
        if (!clientId) return fail(toolCall.name, 'No hay usuario identificado.');
        const limit = Number(args.limit ?? 5);
        const { data, error } = await admin
          .from('profile_companies')
          .select('role, company:companies(id, razon_social, nombre_comercial, cif_nif, forma_juridica)')
          .eq('profile_id', clientId)
          .limit(limit);
        if (error) return fail(toolCall.name, 'Error consultando empresas.');
        const rows = (data ?? []) as unknown as Array<{ role: string; company: Record<string, unknown> | null }>;
        return ok(toolCall.name, {
          count: rows.length,
          empresas: rows.map((r) => {
            const c = Array.isArray(r.company) ? r.company[0] : r.company;
            return {
              id: (c as Record<string, unknown>)?.id,
              nombre: (c as Record<string, unknown>)?.nombre_comercial ?? (c as Record<string, unknown>)?.razon_social,
              cif_nif: (c as Record<string, unknown>)?.cif_nif,
              forma_juridica: (c as Record<string, unknown>)?.forma_juridica,
              rol: r.role,
            };
          }),
        });
      }

      case 'get_user_pending_docs': {
        const clientId = context.contact?.clientId;
        if (!clientId) return fail(toolCall.name, 'No hay usuario identificado.');
        const companyId = context.company?.id ?? null;
        const caseId = typeof args.caseId === 'string' ? args.caseId : undefined;
        let query = admin
          .from('documents')
          .select('id, original_name, state, case_id, created_at, company_id')
          .eq('client_id', clientId)
          .eq('state', 'pendiente')
          .neq('kind', 'internal')
          .neq('ingestion_source', 'historical_import');
        if (companyId) query = query.eq('company_id', companyId);
        if (caseId) query = query.eq('case_id', caseId);
        const { data, error } = await query.order('created_at', { ascending: false }).limit(10);
        if (error) return fail(toolCall.name, 'Error consultando documentos.');
        const rows = (data ?? []) as Array<{ id: string; original_name: string | null; state: string; case_id: string | null; created_at: string; company_id: string | null }>;
        return ok(toolCall.name, {
          pending_count: rows.length,
          company_id: companyId,
          documentos: rows.map((d) => ({
            id: d.id,
            nombre: d.original_name,
            expediente_id: d.case_id,
          })),
        });
      }

      case 'get_user_quotes': {
        const clientId = context.contact?.clientId;
        const companyId = context.company?.id ?? null;
        if (!clientId) return fail(toolCall.name, 'No hay usuario identificado.');
        if (!companyId) return fail(toolCall.name, 'No hay una empresa activa y autorizada en el contexto de KIA.');

        const { data, error } = await admin
          .from('quotes')
          .select('id,title,status,amount_eur,currency,expires_at,created_at,updated_at')
          .eq('client_id', clientId)
          .eq('company_id', companyId)
          .order('created_at', { ascending: false })
          .limit(Number(args.limit ?? 10));

        if (error) return fail(toolCall.name, 'Error consultando presupuestos.');

        const now = Date.now();
        return ok(toolCall.name, {
          count: (data ?? []).length,
          quotes: (data ?? []).map((row) => ({
            id: row.id,
            title: row.title,
            status: row.status,
            amount_eur: row.amount_eur,
            currency: row.currency ?? 'EUR',
            expires_at: row.expires_at,
            expired: Boolean(row.expires_at && new Date(row.expires_at).getTime() < now),
            payment_pending: ['sent', 'accepted'].includes(String(row.status)),
            created_at: row.created_at,
            updated_at: row.updated_at,
          })),
        });
      }

      case 'get_user_orders': {
        const clientId = context.contact?.clientId;
        if (!clientId) return fail(toolCall.name, 'No hay usuario identificado.');
        const caseId = typeof args.caseId === 'string' ? args.caseId : undefined;
        const limit = Number(args.limit ?? 10);

        if (caseId) {
          const { data: ownedCase } = await admin.from('cases').select('id').eq('id', caseId).eq('client_id', clientId).maybeSingle();
          if (!ownedCase) return fail(toolCall.name, 'Expediente no autorizado.');
        }

        let byClient = admin
          .from('orders')
          .select('id,pack_name,amount_eur,amount,currency,status,source,service_slugs,case_id,company_id,created_at,metadata')
          .eq('client_id', clientId);
        if (caseId) byClient = byClient.eq('case_id', caseId);

        let byUser = admin
          .from('orders')
          .select('id,pack_name,amount_eur,amount,currency,status,source,service_slugs,case_id,company_id,created_at,metadata')
          .eq('user_id', clientId);
        if (caseId) byUser = byUser.eq('case_id', caseId);

        const [clientRows, userRows] = await Promise.all([
          byClient.order('created_at', { ascending: false }).limit(limit),
          byUser.order('created_at', { ascending: false }).limit(limit),
        ]);
        if (clientRows.error || userRows.error) return fail(toolCall.name, 'Error consultando pagos.');

        const merged = [...(clientRows.data ?? []), ...(userRows.data ?? [])];
        const unique = [...new Map(merged.map((row) => [row.id, row])).values()]
          .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
          .slice(0, limit);

        return ok(toolCall.name, {
          count: unique.length,
          orders: unique.map((row) => ({
            id: row.id,
            concepto: row.pack_name ?? row.service_slugs,
            importe_eur: row.amount_eur ?? row.amount,
            moneda: row.currency ?? 'EUR',
            estado: row.status,
            fuente: row.source,
            expediente_id: row.case_id,
            fecha: row.created_at,
          })),
        });
      }

      case 'get_user_subscription_status': {
        const clientId = context.contact?.clientId;
        const companyId = context.company?.id ?? null;
        if (!clientId) return fail(toolCall.name, 'No hay usuario identificado.');
        if (!companyId) return fail(toolCall.name, 'No hay una empresa activa y autorizada en el contexto de KIA.');

        const coverage = await resolveCompanyCommercialCoverage(admin, clientId, companyId);
        return ok(toolCall.name, {
          covered: coverage.covered,
          source: coverage.source,
          plan: coverage.planName,
          status: coverage.subscriptionStatus,
          coverage_scope: coverage.coverageScope,
          valid_from: coverage.validFrom,
          valid_until: coverage.validUntil,
          excluded_services: coverage.excludedServices,
          included_via_primary_company: coverage.source === 'included_entity'
            ? {
                company_name: coverage.primaryCompanyName,
              }
            : null,
        });
      }

      case 'get_user_subscriptions': {
        const clientId = context.contact?.clientId;
        if (!clientId) return fail(toolCall.name, 'No hay usuario identificado.');
        const requestedCompanyId = typeof args.companyId === 'string' ? args.companyId : undefined;
        const companyId = requestedCompanyId ?? context.company?.id ?? null;
        const limit = Number(args.limit ?? 10);

        if (companyId) {
          const { data: membership } = await admin
            .from('profile_companies')
            .select('company_id')
            .eq('profile_id', clientId)
            .eq('company_id', companyId)
            .maybeSingle();
          if (!membership) return fail(toolCall.name, 'Empresa no autorizada.');
        }

        let query = admin
          .from('subscriptions')
          .select('id,plan_name,plan_slug,status,company_id,current_period_start,current_period_end,canceled_at,cancel_at_period_end,trial_status,trial_end,created_at')
          .eq('client_id', clientId);
        if (companyId) query = query.eq('company_id', companyId);

        const { data, error } = await query.order('created_at', { ascending: false }).limit(limit);
        if (error) return fail(toolCall.name, 'Error consultando suscripciones.');
        return ok(toolCall.name, {
          count: (data ?? []).length,
          subscriptions: (data ?? []).map((row) => ({
            id: row.id,
            plan: row.plan_name ?? row.plan_slug,
            estado: row.status,
            empresa_id: row.company_id,
            periodo_desde: row.current_period_start,
            periodo_hasta: row.current_period_end,
            cancelacion_programada: row.cancel_at_period_end,
            cancelada_en: row.canceled_at,
            prueba_estado: row.trial_status,
            prueba_hasta: row.trial_end,
          })),
        });
      }

      case 'get_case_tasks': {
        const clientId = context.contact?.clientId;
        const caseId = String(args.caseId);
        if (!clientId) return fail(toolCall.name, 'No hay usuario identificado.');
        const { data: ownedCase } = await admin.from('cases').select('id').eq('id', caseId).eq('client_id', clientId).maybeSingle();
        if (!ownedCase) return fail(toolCall.name, 'Expediente no autorizado.');
        const { data, error } = await admin
          .from('internal_tasks')
          .select('id,title,status,priority,due_date,completed_at,created_at,updated_at,metadata')
          .eq('case_id', caseId)
          .eq('client_id', clientId)
          .order('created_at', { ascending: false })
          .limit(Number(args.limit ?? 20));
        if (error) return fail(toolCall.name, 'Error consultando tareas.');
        return ok(toolCall.name, { tasks: data ?? [] });
      }

      case 'get_case_signature_status': {
        const result = await getKiaCaseSignatureStatus(admin, context, String(args.caseId));
        return result.ok ? ok(toolCall.name, result) : fail(toolCall.name, result.error);
      }

      case 'prepare_signature_request': {
        const result = await prepareKiaSignatureRequest(admin, context, {
          caseId: String(args.caseId),
          documentId: String(args.documentId),
          signatureLevel: args.signatureLevel as 'simple' | 'advanced' | 'qualified',
          signers: args.signers as Array<{ name: string; email?: string | null }>,
        });
        return result.ok ? ok(toolCall.name, result) : fail(toolCall.name, result.error);
      }

      case 'get_case_documents': {
        const clientId = context.contact?.clientId;
        const caseId = String(args.caseId);
        if (!clientId) return fail(toolCall.name, 'No hay usuario identificado.');
        const { data: ownedCase, error: caseError } = await admin.from('cases')
          .select('id,docs_checklist,received_documents_json').eq('id', caseId).eq('client_id', clientId).maybeSingle();
        if (caseError || !ownedCase) return fail(toolCall.name, 'Expediente no autorizado.');
        const { data, error } = await admin
          .from('documents')
          .select('id,original_name,title,doc_type,kind,state,checklist_item_key,checklist_item_label,file_path,created_at,updated_at')
          .eq('case_id', caseId)
          .eq('client_id', clientId)
          .neq('kind', 'internal')
          .is('replaced_by', null)
          .order('created_at', { ascending: false })
          .limit(1001);
        if (error) return fail(toolCall.name, 'Error consultando documentos.');
        if ((data ?? []).length > 1000) return fail(toolCall.name, 'Demasiados documentos para verificar el checklist.');
        const active = (data ?? []).filter((doc) => doc.state !== 'rechazado');
        const missingRequirements = missingKiaCaseDocumentRequirements(
          ownedCase.docs_checklist, active, ownedCase.received_documents_json,
        );
        return ok(toolCall.name, {
          missing_requirements: missingRequirements,
          checklist_available: Array.isArray(ownedCase.docs_checklist) && ownedCase.docs_checklist.length > 0,
          documents: active.slice(0, Math.min(Math.max(Number(args.limit ?? 20), 1), 100)).map((doc) => ({
            id: doc.id,
            original_name: doc.original_name,
            title: doc.title,
            doc_type: doc.doc_type,
            kind: doc.kind,
            state: doc.state,
            checklist_item_label: doc.checklist_item_label,
            created_at: doc.created_at,
            updated_at: doc.updated_at,
            case_url: `/dashboard/expedientes/${caseId}`,
            download_url: doc.file_path
              ? `/api/documents/${doc.id}/download?redirect=1`
              : null,
          })),
        });
      }

      case 'get_case_timeline': {
        const clientId = context.contact?.clientId;
        const caseId = String(args.caseId);
        if (!clientId) return fail(toolCall.name, 'No hay usuario identificado.');
        const { data: ownedCase } = await admin
          .from('cases')
          .select('id,service,state,status,next_action,opened_at,updated_at,closed_at')
          .eq('id', caseId)
          .eq('client_id', clientId)
          .maybeSingle();
        if (!ownedCase) return fail(toolCall.name, 'Expediente no autorizado.');

        const limit = Number(args.limit ?? 25);
        const [tasks, docs, emails] = await Promise.all([
          admin.from('internal_tasks').select('id,title,status,created_at,completed_at,updated_at').eq('case_id', caseId).eq('client_id', clientId).order('created_at', { ascending: false }).limit(limit),
          admin.from('documents').select('id,original_name,title,state,created_at,updated_at').eq('case_id', caseId).eq('client_id', clientId).neq('kind', 'internal').neq('ingestion_source', 'historical_import').order('created_at', { ascending: false }).limit(limit),
          admin.from('email_events').select('id,event_type,subject,status,created_at').contains('metadata', { case_id: caseId }).order('created_at', { ascending: false }).limit(limit),
        ]);

        const events = [
          { type: 'case_opened', at: ownedCase.opened_at, label: `Expediente abierto: ${ownedCase.service}` },
          { type: 'case_updated', at: ownedCase.updated_at, label: `Estado: ${ownedCase.state ?? ownedCase.status}` },
          ...(ownedCase.closed_at ? [{ type: 'case_closed', at: ownedCase.closed_at, label: 'Expediente cerrado' }] : []),
          ...(tasks.data ?? []).map((row) => ({ type: 'task', at: row.completed_at ?? row.updated_at ?? row.created_at, label: `${row.title} · ${row.status}` })),
          ...(docs.data ?? []).map((row) => ({ type: 'document', at: row.updated_at ?? row.created_at, label: `${row.original_name ?? row.title ?? 'Documento'} · ${row.state}` })),
          ...(emails.data ?? []).map((row) => ({ type: 'email', at: row.created_at, label: `${row.subject ?? row.event_type} · ${row.status}` })),
        ].filter((event) => Boolean(event.at))
          .sort((a, b) => String(b.at).localeCompare(String(a.at)))
          .slice(0, limit);

        return ok(toolCall.name, {
          case: {
            id: ownedCase.id,
            servicio: ownedCase.service,
            estado: ownedCase.state ?? ownedCase.status,
            siguiente_paso: ownedCase.next_action,
          },
          events,
        });
      }

      case 'get_client_communications': {
        const clientId = context.contact?.clientId;
        if (!clientId) return fail(toolCall.name, 'No hay usuario identificado.');
        const communications = await loadKiaClientCommunications({
          admin,
          clientId,
          email: context.contact.email,
          query: typeof args.query === 'string' ? args.query : undefined,
          channel: (args.channel as 'all' | 'email' | 'whatsapp' | 'kia') ?? 'all',
          limit: Number(args.limit ?? 20),
        });
        return ok(toolCall.name, { communications });
      }

      case 'search_knowledge_resources':
        return ok(toolCall.name, {
          resources: searchKiaKnowledgeResources({
            query: String(args.query),
            type: args.type as 'blog' | 'doc' | 'all',
            category: typeof args.category === 'string' ? args.category : undefined,
            serviceSlug: typeof args.serviceSlug === 'string' ? args.serviceSlug : undefined,
            limit: Number(args.limit ?? 5),
          }),
        });

      case 'get_official_sources':
        return ok(toolCall.name, {
          sources: await getKiaOfficialSources({
            admin,
            serviceSlug: typeof args.serviceSlug === 'string' ? args.serviceSlug : undefined,
            topic: typeof args.topic === 'string' ? args.topic : undefined,
            limit: Number(args.limit ?? 5),
          }),
        });

      case 'find_relevant_services':
        return ok(toolCall.name, {
          services: findKiaRelevantServices({
            query: String(args.query),
            category: typeof args.category === 'string' ? args.category : undefined,
            limit: Number(args.limit ?? 2),
          }),
        });

      case 'get_user_onboarding_appointments': {
        const clientId = context.contact?.clientId;
        const companyId = context.company?.id ?? null;
        if (!clientId) return fail(toolCall.name, 'No hay usuario identificado.');
        if (!companyId) return fail(toolCall.name, 'No hay una empresa activa y autorizada en el contexto de KIA.');

        const kind = String(args.kind ?? 'all');
        const types = kind === 'all'
          ? ['onboarding', 'formacion-holded', 'formacion']
          : kind === 'formacion-holded'
            ? ['formacion-holded', 'formacion']
            : [kind];
        const limit = Number(args.limit ?? 10);
        const selectColumns = 'id,email,client_id,company_id,appointment_type,appointment_date,appointment_end,status,service,meeting_url,booking_provider,created_at';

        const { data: scopedData, error: scopedError } = await admin
          .from('appointments')
          .select(selectColumns)
          .eq('client_id', clientId)
          .eq('company_id', companyId)
          .in('appointment_type', types)
          .order('appointment_date', { ascending: false })
          .limit(limit);

        if (scopedError) return fail(toolCall.name, 'Error consultando onboarding/formación.');

        // Legacy rows created before entity-scoped appointments keep null entity IDs.
        // They are discoverable only through emails already authorized for this
        // authenticated client/company and are never rewritten or re-attributed here.
        const authorizedEmails = await getAuthorizedBookingEmails(
          admin,
          clientId,
          companyId,
          context.contact?.email,
        );
        const legacyResults = await Promise.all(authorizedEmails.map(async (email) => {
          const { data, error } = await admin
            .from('appointments')
            .select(selectColumns)
            .is('client_id', null)
            .is('company_id', null)
            .ilike('email', email)
            .in('appointment_type', types)
            .order('appointment_date', { ascending: false })
            .limit(limit);
          if (error) throw error;
          return data ?? [];
        }));

        const rows = [...(scopedData ?? []), ...legacyResults.flat()]
          .filter((row, index, all) => all.findIndex((candidate) => candidate.id === row.id) === index)
          .sort((a, b) => {
            const aTime = a.appointment_date ? new Date(a.appointment_date).getTime() : 0;
            const bTime = b.appointment_date ? new Date(b.appointment_date).getTime() : 0;
            return bTime - aTime;
          })
          .slice(0, limit);

        const now = Date.now();
        return ok(toolCall.name, {
          count: rows.length,
          appointments: rows.map((row) => {
            const startsAtMs = row.appointment_date ? new Date(row.appointment_date).getTime() : Number.NaN;
            const endsAtMs = row.appointment_end ? new Date(row.appointment_end).getTime() : startsAtMs;
            const canJoin = row.status === 'confirmed'
              && Number.isFinite(endsAtMs)
              && endsAtMs > now;

            return {
              id: row.id,
              type: row.appointment_type,
              service: row.service,
              status: row.status,
              starts_at: row.appointment_date,
              ends_at: row.appointment_end,
              meeting_url: row.meeting_url,
              provider: row.booking_provider,
              next_action: canJoin
                ? 'join_scheduled_meeting'
                : row.status === 'pending_calendar'
                  ? 'wait_for_calendar_confirmation'
                  : row.status === 'cancelled'
                    ? 'book_new_slot_if_needed'
                    : null,
            };
          }),
        });
      }

      case 'get_booking_availability':
        return ok(toolCall.name, await getKiaBookingAvailability({
          serviceKey: String(args.serviceKey),
          days: Number(args.days ?? 7),
        }));

      case 'upsert_recurring_meeting_series': {
        const sourceKey = String(args.sourceKey);
        const attendeeEmail = String(args.attendeeEmail).trim().toLowerCase();
        const payload = {
          source_key: sourceKey,
          title: String(args.title),
          attendee_name: String(args.attendeeName),
          attendee_email: attendeeEmail,
          attendee_phone: typeof args.attendeePhone === 'string' ? args.attendeePhone : null,
          client_id: typeof args.clientId === 'string' ? args.clientId : null,
          company_id: typeof args.companyId === 'string' ? args.companyId : null,
          lead_id: typeof args.leadId === 'string' ? args.leadId : null,
          service_key: String(args.serviceKey),
          duration_minutes: Number(args.durationMinutes),
          day_of_month: Number(args.dayOfMonth),
          local_time: `${String(args.localTime)}:00`,
          timezone: 'Europe/Madrid',
          months_ahead: Number(args.monthsAhead ?? 12),
          start_month: String(args.startMonth),
          weekend_policy: 'next_weekday',
          conflict_policy: String(args.conflictPolicy ?? 'next_available_weekday'),
          active: true,
          created_by: 'kia-admin',
          updated_at: new Date().toISOString(),
        };
        const { data: series, error } = await admin
          .from('recurring_meeting_series')
          .upsert(payload, { onConflict: 'source_key' })
          .select('id,source_key,title,service_key,duration_minutes,day_of_month,local_time,months_ahead')
          .single();
        if (error || !series) throw error ?? new Error('recurring_series_upsert_failed');
        const materialized = await materializeRecurringMeetingSeries(admin);
        return ok(toolCall.name, { series, materialized });
      }

      case 'create_booking_meeting': {
        const attendeeEmail = String(args.attendeeEmail).trim().toLowerCase();
        if (context.contact.email && context.contact.email.toLowerCase() !== attendeeEmail) {
          return fail(toolCall.name, 'El email de la reserva no coincide con el contacto de la conversación.');
        }
        const booking = await createKiaConfirmedBooking({
          serviceKey: String(args.serviceKey),
          startIso: String(args.startIso),
          attendeeName: String(args.attendeeName),
          attendeeEmail,
          attendeePhone: typeof args.attendeePhone === 'string' ? args.attendeePhone : context.contact.phone,
          notes: typeof args.notes === 'string' ? args.notes : null,
          clientId: context.contact.clientId,
          companyId: context.company?.id ?? null,
          leadId: context.contact.leadId,
          confirmationMessage: context.latestMessage ?? '',
          contextMessages: context.conversation.recentMessages,
        });
        return ok(toolCall.name, booking);
      }

      default:
        return fail(toolCall.name, `Tool not allowed: ${toolCall.name}`);
    }
  } catch (error) {
    return fail(toolCall.name, safeErrorMessage(error));
  }
}

function loginUrl(nextPath: string): string {
  return absoluteAppUrl(`/auth/login?next=${encodeURIComponent(nextPath)}`);
}

function ok(toolName: string, result: Record<string, unknown>): KiaToolResult {
  return { toolName, ok: true, result: redactJson(result) };
}

function fail(toolName: string, error: string): KiaToolResult {
  return { toolName, ok: false, error };
}
