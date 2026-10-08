import { z } from 'zod';

export interface KiaToolDefinition {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
  strict?: boolean;
}

export interface KiaToolCall {
  id?: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface KiaToolResult {
  toolName: string;
  ok: boolean;
  result?: Record<string, unknown>;
  error?: string;
}

const emptyObjectSchema = z.object({}).strict();
const holdedLaborPageSchema = {
  limit: z.number().int().min(1).max(100).default(20),
  cursor: z.string().min(1).optional(),
};

const calendarDateSchema = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00Z`);
    return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  }, 'Invalid calendar date');

export const kiaToolValidators = {
  resolve_contact_context: z.object({
    phone: z.string().optional(),
    email: z.string().email().optional(),
    clientId: z.string().uuid().optional(),
    leadId: z.string().uuid().optional(),
  }).strict(),
  get_client_profile: z.object({
    clientId: z.string().uuid(),
  }).strict(),
  get_service_registry_item: z.object({
    serviceSlug: z.string().min(1),
  }).strict(),
  get_service_operational_blueprint: z.object({
    serviceSlug: z.string().min(1),
  }).strict(),
  get_regulatory_value: z.object({
    valueKey: z.string().min(1).max(120),
    onDate: z.string().optional(),
  }).strict(),
  get_regulatory_ruleset: z.object({
    rulesetKey: z.string().min(1).max(160),
    onDate: z.string().optional(),
  }).strict(),
  run_viability_check: z.object({
    serviceSlug: z.string().min(1),
    answers: z.record(z.string(), z.unknown()).default({}),
  }).strict(),
  run_readiness_check: z.object({
    serviceSlug: z.string().min(1),
    answers: z.record(z.string(), z.union([z.string(), z.array(z.string())])).default({}),
  }).strict(),
  get_holded_connection_status: z.object({
    clientId: z.string().uuid().optional(),
    companyId: z.string().uuid().optional(),
  }).strict(),
  create_next_best_action: z.object({
    title: z.string().min(1),
    reason: z.string().min(1),
    priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
    clientId: z.string().uuid().optional(),
    companyId: z.string().uuid().optional(),
    caseId: z.string().uuid().optional(),
  }).strict(),
  classify_document: z.object({
    documentId: z.string().uuid().optional(),
    fileName: z.string().optional(),
    textPreview: z.string().max(2000).optional(),
  }).strict(),
  get_case_status: z.object({
    caseId: z.string().uuid().optional(),
    clientId: z.string().uuid().optional(),
  }).strict(),
  create_internal_task: z.object({
    title: z.string().min(1),
    description: z.string().max(2000).optional(),
    priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
    clientId: z.string().uuid().optional(),
    caseId: z.string().uuid().optional(),
  }).strict(),
  generate_checkout_gate_link: z.object({
    serviceSlug: z.string().min(1),
    source: z.string().default('kia'),
  }).strict(),
  generate_profile_link: z.object({
    next: z.string().default('/dashboard/perfil'),
  }).strict(),
  generate_holded_connection_link: z.object({
    next: z.string().default('/dashboard/integraciones/holded'),
  }).strict(),
  get_company_status_snapshot: z.object({
    companyId: z.string().uuid().optional(),
  }).strict(),
  get_accounting_snapshot: z.object({
    includeAnomalies: z.boolean().default(true),
    periods: z.number().int().min(1).max(4).default(1),
  }).strict(),
  // ── Holded accounting/data tools (active company integration) ─────────────
  get_holded_invoices: z.object({
    docType: z.enum(['invoice', 'salesreceipt', 'purchase', 'creditnote']).default('invoice'),
    limit: z.number().int().min(1).max(20).default(10),
    since: calendarDateSchema.optional(),
  }).strict(),
  get_holded_contacts: z.object({
    query: z.string().max(100).optional(),
    limit: z.number().int().min(1).max(20).default(10),
  }).strict(),
  get_holded_chart_of_accounts: z.object({ limit: z.number().int().min(1).max(100).default(30), cursor: z.string().min(1).optional() }).strict(),
  get_holded_ledger_entries: z.object({ startDate: calendarDateSchema, endDate: calendarDateSchema, limit: z.number().int().min(1).max(100).default(30), cursor: z.string().min(1).optional() }).strict(),
  get_holded_bank_balance: z.object({
    limit: z.number().int().min(1).max(10).default(5),
  }).strict(),
  // ── KIA Accounting controller tools ───────────────────────────────────────
  get_accounts_receivable: z.object({
    limit: z.number().int().min(1).max(50).default(20),
    includeNotDue: z.boolean().default(true),
  }).strict(),
  get_accounts_payable: z.object({
    limit: z.number().int().min(1).max(50).default(20),
    includeNotDue: z.boolean().default(true),
  }).strict(),
  get_overdue_invoices: z.object({
    side: z.enum(['receivable', 'payable', 'both']).default('receivable'),
    limit: z.number().int().min(1).max(50).default(20),
  }).strict(),
  get_unreconciled_transactions: z.object({
    limit: z.number().int().min(1).max(50).default(20),
  }).strict(),
  prepare_payment_reminder: z.object({
    invoiceId: z.string().trim().min(1).max(200),
    tone: z.enum(['gentle', 'firm', 'formal']).default('gentle'),
    lang: z.enum(['es', 'ru']).default('es'),
  }).strict(),
  prepare_journal_entry_proposal: z.object({
    date: calendarDateSchema,
    reason: z.string().trim().min(3).max(500),
    evidenceRefs: z.array(z.string().trim().min(1).max(1024)).min(1).max(20),
    lines: z.array(z.object({
      account: z.string().regex(/^\d{3,12}$/),
      debitCents: z.number().int().nonnegative(),
      creditCents: z.number().int().nonnegative(),
      explanation: z.string().max(500).optional(),
    }).strict()).min(2).max(100),
  }).strict(),
  prepare_credit_note_proposal: z.object({
    invoiceId: z.string().trim().min(1).max(200),
    reason: z.string().trim().min(3).max(500),
    amount: z.number().positive().optional(),
    lang: z.enum(['es', 'ru']).default('es'),
  }).strict(),
  // ── Holded labor v2 tools — company comes only from authorized KiaContext ─
  get_holded_employees: z.object({
    search: z.string().max(100).optional(),
    ...holdedLaborPageSchema,
  }).strict(),
  get_holded_employee_contract: z.object({
    employeeId: z.string().min(1).max(200),
  }).strict(),
  get_holded_payslips: z.object({
    employeeId: z.string().min(1).max(200).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    kind: z.string().max(100).optional(),
    isDraft: z.boolean().optional(),
    ...holdedLaborPageSchema,
  }).strict(),
  get_holded_salary_records: z.object({
    employeeId: z.string().min(1).max(200).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    ...holdedLaborPageSchema,
  }).strict(),
  run_labor_payroll_diagnostics: z.object({
    employeeId: z.string().min(1).max(200),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    limit: z.number().int().min(1).max(100).default(50),
  }).strict(),
  generate_company_report: z.object({
    reportType: z.enum(['empresa_status']).default('empresa_status'),
    period: z.string().trim().regex(/^Q[1-4]\s+\d{4}$/i).optional(),
    lang: z.enum(['es', 'ru']).default('es'),
  }).strict(),
  extract_invoice_ocr: z.object({
    mediaUrl: z.string().url(),
    mediaType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']),
  }).strict(),
  create_kia_decision_log: emptyObjectSchema,
  get_user_expedientes: z.object({
    status: z.enum(['activos', 'finalizados', 'todos']).default('activos'),
    limit: z.number().int().min(1).max(20).default(10),
  }).strict(),
  get_user_companies: z.object({
    limit: z.number().int().min(1).max(10).default(5),
  }).strict(),
  get_user_pending_docs: z.object({
    caseId: z.string().uuid().optional(),
  }).strict(),
  get_user_quotes: z.object({
    limit: z.number().int().min(1).max(20).default(10),
  }).strict(),
  get_user_orders: z.object({
    caseId: z.string().uuid().optional(),
    limit: z.number().int().min(1).max(20).default(10),
  }).strict(),
  get_user_subscription_status: emptyObjectSchema,
  get_user_subscriptions: z.object({
    companyId: z.string().uuid().optional(),
    limit: z.number().int().min(1).max(20).default(10),
  }).strict(),
  get_case_tasks: z.object({
    caseId: z.string().uuid(),
    limit: z.number().int().min(1).max(50).default(20),
  }).strict(),
  get_case_signature_status: z.object({
    caseId: z.string().uuid(),
  }).strict(),
  prepare_signature_request: z.object({
    caseId: z.string().uuid(),
    documentId: z.string().uuid(),
    signatureLevel: z.enum(['simple', 'advanced', 'qualified']).default('simple'),
    signers: z.array(z.object({
      name: z.string().trim().min(1).max(200),
      email: z.string().email().optional().nullable(),
    }).strict()).min(1).max(20),
  }).strict(),
  get_case_documents: z.object({
    caseId: z.string().uuid(),
    limit: z.number().int().min(1).max(50).default(20),
  }).strict(),
  get_case_timeline: z.object({
    caseId: z.string().uuid(),
    limit: z.number().int().min(1).max(50).default(25),
  }).strict(),
  get_client_communications: z.object({
    query: z.string().max(200).optional(),
    channel: z.enum(['all','email','whatsapp','kia']).default('all'),
    limit: z.number().int().min(1).max(50).default(20),
  }).strict(),
  search_knowledge_resources: z.object({
    query: z.string().min(2).max(300),
    type: z.enum(['blog','doc','all']).default('all'),
    category: z.string().max(100).optional(),
    serviceSlug: z.string().max(160).optional(),
    limit: z.number().int().min(1).max(10).default(5),
  }).strict(),
  get_official_sources: z.object({
    serviceSlug: z.string().max(160).optional(),
    topic: z.string().max(120).optional(),
    limit: z.number().int().min(1).max(10).default(5),
  }).strict(),
  find_relevant_services: z.object({
    query: z.string().min(2).max(300),
    category: z.string().max(100).optional(),
    limit: z.number().int().min(1).max(3).default(2),
  }).strict(),
  get_user_onboarding_appointments: z.object({
    kind: z.enum(['all', 'onboarding', 'formacion-holded']).default('all'),
    limit: z.number().int().min(1).max(20).default(10),
  }).strict(),
  get_booking_availability: z.object({
    serviceKey: z.enum(['consulta-inicial', 'demo-holded', 'academy-admision']).default('consulta-inicial'),
    days: z.number().int().min(1).max(14).default(7),
  }).strict(),
  get_admin_inbox_summary: z.object({
    unreadOnly: z.boolean().default(true),
    limit: z.number().int().min(1).max(30).default(12),
  }).strict(),
  get_admin_agenda: z.object({
    days: z.number().int().min(1).max(14).default(7),
    limit: z.number().int().min(1).max(30).default(15),
  }).strict(),
  get_admin_pending_tasks: z.object({
    days: z.number().int().min(0).max(60).default(14),
    limit: z.number().int().min(1).max(30).default(15),
  }).strict(),
  get_admin_attention_queue: z.object({
    limitPerSection: z.number().int().min(1).max(10).default(5),
  }).strict(),
  create_booking_meeting: z.object({
    serviceKey: z.enum(['consulta-inicial', 'demo-holded', 'academy-admision']),
    startIso: z.string().datetime({ offset: true }),
    attendeeName: z.string().trim().min(2).max(100),
    attendeeEmail: z.string().email().max(200),
    attendeePhone: z.string().trim().max(30).optional(),
    notes: z.string().trim().max(500).optional(),
  }).strict(),
  upsert_recurring_meeting_series: z.object({
    sourceKey: z.string().trim().min(3).max(180),
    title: z.string().trim().min(3).max(180),
    attendeeName: z.string().trim().min(2).max(120),
    attendeeEmail: z.string().email().max(200),
    attendeePhone: z.string().trim().max(30).optional(),
    clientId: z.string().uuid().optional(),
    companyId: z.string().uuid().optional(),
    leadId: z.string().uuid().optional(),
    serviceKey: z.enum([
      'consulta-inicial',
      'demo-holded',
      'onboarding',
      'formacion-holded',
      'mentoria-mensual',
      'seguimiento-mensual-empresa',
      'seguimiento-mensual-autonomo',
      'academy-admision',
    ]),
    durationMinutes: z.number().int().min(15).max(240),
    dayOfMonth: z.number().int().min(1).max(28),
    localTime: z.string().regex(/^([01]\\d|2[0-3]):[0-5]\\d$/),
    startMonth: z.string().regex(/^\\d{4}-\\d{2}-01$/),
    monthsAhead: z.number().int().min(1).max(24).default(12),
    conflictPolicy: z.enum(['next_available_weekday', 'manual_review']).default('next_available_weekday'),
  }).strict(),
} satisfies Record<string, z.ZodTypeAny>;

type ToolName = keyof typeof kiaToolValidators;

function toJsonSchema(schema: z.ZodTypeAny): Record<string, unknown> {
  const jsonSchema = z.toJSONSchema(schema);
  return JSON.parse(JSON.stringify(jsonSchema)) as Record<string, unknown>;
}

const TOOL_DESCRIPTIONS: Record<ToolName, string> = {
  resolve_contact_context: 'Resolve whether the contact is a lead, client, or unknown.',
  get_client_profile: 'Get safe profile readiness flags for a registered client.',
  get_service_registry_item: 'Get service flow, readiness, viability and checkout metadata.',
  get_service_operational_blueprint: 'Get the canonical operational requirements, document checklist, case steps, task plan and escalation rules for a service.',
  get_regulatory_value: 'Read one canonical official operational value from the EXPERT Regulatory Registry, such as SMI, MEI, IPC or legal/tax interest, with validity metadata.',
  get_regulatory_ruleset: 'Read one versioned official regulatory table or rule set from the EXPERT Regulatory Registry, such as RETA brackets, IRNR deadlines, withholding periods or regional tax rules.',
  run_viability_check: 'Evaluate a service viability check with provided answers.',
  run_readiness_check: 'Evaluate a readiness check with provided answers.',
  get_holded_connection_status: 'Return Holded connection status without API keys.',
  create_next_best_action: 'Draft a next best action for backend/admin review.',
  classify_document: 'Classify a document using safe metadata or text preview.',
  get_case_status: 'Return status of one case or recent client cases.',
  get_case_signature_status: 'Read the auditable signature lifecycle for one authorized case. Only completed actions with explicit final-document evidence are returned as signed.',
  prepare_signature_request: 'Prepare an Admin/Owner-only Google eSignature action for an accessible current document. Creates a review item but never sends a signature request externally.',
  create_internal_task: 'Draft an internal task for backend/admin review.',
  generate_checkout_gate_link: 'Generate a protected /contratar link; does not create Stripe checkout.',
  generate_profile_link: 'Generate secure profile/login link.',
  generate_holded_connection_link: 'Generate secure Holded connection panel link.',
  get_company_status_snapshot: 'Return safe company/accounting snapshot summary if available.',
  get_accounting_snapshot: 'Return full accounting period snapshots and open anomalies for the already-authorized active company. The company scope comes only from KiaContext.',
  get_holded_invoices: 'List recent Holded invoices or purchases for the active company. Requires active company-scoped Holded integration.',
  get_holded_contacts: 'Search or list Holded contacts for the active company. Requires active company-scoped Holded integration.',
  get_holded_chart_of_accounts: 'Read a paginated list of accounting accounts for the authorized company through Holded v2; admin only, no writes.',
  get_holded_ledger_entries: 'Read paginated ledger entries within an explicit period for the authorized company through Holded v2; admin only, no writes.',
  get_holded_bank_balance: 'Return Holded treasury account balances for the active company. Requires active company-scoped Holded integration.',
  get_accounts_receivable: 'Return customer invoices with outstanding balances for the active company, derived from Holded invoice data. Read-only.',
  get_accounts_payable: 'Return supplier purchase invoices with outstanding balances for the active company, derived from Holded purchase data. Read-only.',
  get_overdue_invoices: 'Return overdue receivable/payable documents for the active company. Read-only; due status is derived conservatively from available Holded fields.',
  get_unreconciled_transactions: 'Return bank movements that remain pending or partially reconciled in Holded treasury data. Read-only.',
  prepare_payment_reminder: 'Prepare an admin-only payment reminder for one outstanding Holded invoice. Does not send email or mutate Holded.',
  prepare_journal_entry_proposal: 'Validate an admin-only proposed journal entry with balanced debits and credits; never posts to Holded.',
  prepare_credit_note_proposal: 'Prepare an admin-only credit-note proposal linked to one issued Holded invoice. Does not create or modify any Holded document.',
  get_holded_employees: 'List or search Holded employees for the already-authorized active company. Read-only; never changes employee data.',
  get_holded_employee_contract: 'Read one Holded employee and their active contract for the already-authorized active company. Read-only.',
  get_holded_payslips: 'List calculated Holded payroll payslips for the already-authorized active company. Keeps payslips separate from salary records.',
  get_holded_salary_records: 'List Holded manual salary accounting records for the already-authorized active company. Keeps salary records separate from calculated payslips.',
  run_labor_payroll_diagnostics: 'Build a structured read-only payroll diagnostic for one employee from Holded employee, active contract, calculated payslips, contribution bases, IRPF evidence, payment state and separate salary records. Does not recalculate or modify payroll.',
  generate_company_report: 'Generate a visual company status report (IVA, cash flow, anomalies, bank balances) and return a link the client can open. Requires active Holded integration.',
  extract_invoice_ocr: 'Extract structured invoice data (vendor, amount, VAT, date, invoice number) from an image using GPT-4o vision. Use when user sends a photo of an invoice or receipt.',
  create_kia_decision_log: 'Persist a Kia decision log. Usually executed by backend automatically.',
  get_user_expedientes: 'List the authenticated user\'s own cases (expedientes). Use when the user asks "mis expedientes", "mis trámites", "qué tengo pendiente", or any question about their own cases. Returns status, service name, and ID.',
  get_user_companies: 'List the authenticated user\'s own companies. Use when the user asks "mis empresas", "mis sociedades", or questions about their company data.',
  get_user_pending_docs: 'List documents pending upload or review for the authenticated user. Use when the user asks "qué documentos me piden", "documentos pendientes", or similar.',
  get_user_quotes: 'List recent quotes for the authenticated user and already-authorized active company, including status, amount and expiry. Read-only; never creates checkout or mutates payment state.',
  get_user_orders: 'List recent orders/payments for the authenticated user, optionally scoped to one case. Read-only and safe for payment-status questions.',
  get_user_subscription_status: 'Return canonical subscription coverage for the already-authorized active company, including plan, status, validity, scope and excluded services. Takes no client/company identifiers.',
  get_user_subscriptions: 'List active/recent EXPERT subscriptions for the authenticated user or active company. Read-only.',
  get_case_tasks: 'List operational tasks for one case owned by the authenticated user.',
  get_case_documents: 'List documents for one case owned by the authenticated user.',
  get_case_timeline: 'Return a compact operational timeline for one case from case updates, tasks, documents and email events.',
  get_client_communications: 'Search the authenticated client communication history across sent/received email, KIA conversations and linked WhatsApp. Use when recent context is insufficient or the user refers to an older message.',
  search_knowledge_resources: 'Search EXPERT blog articles and knowledge-base documents. Use to share a relevant guide or article with the user. Returns canonical public links.',
  get_official_sources: 'Return official source links from the canonical EXPERT Regulatory Registry for a service or topic. Use when the user wants to verify information independently.',
  find_relevant_services: 'Find EXPERT services for a concrete unmet need. Use only after answering the question and only when the user explicitly lacks something necessary, asks EXPERT to handle it, or clearly intends to contract. Do not use for mere topic affinity or when the user asks to do it themselves.',
  get_user_onboarding_appointments: 'Read onboarding and Holded training appointments for the authenticated user and already-authorized active company. Read-only; never books, cancels or reschedules.',
  get_booking_availability: 'Read real EXPERT availability from the active Google Calendar booking stack for public meeting types. Use before proposing meeting times.',
  get_admin_inbox_summary: 'Admin-only read tool for recent synchronized EXPERT inbox threads, scoped to the current client/company when present.',
  get_admin_agenda: 'Admin-only read tool for upcoming EXPERT appointments, scoped to the current client/company when present.',
  get_admin_pending_tasks: 'Admin-only read tool for pending, upcoming and overdue EXPERT internal tasks, scoped to the current client/company when present.',
  get_admin_attention_queue: 'Admin-only read tool that combines unread email, upcoming appointments and pending tasks into a compact attention queue.',
  create_booking_meeting: 'Create a public EXPERT meeting only after the user explicitly confirms the exact numeric date and time in their latest message. Backend rechecks availability and confirmation before writing Calendar/Meet.',
  upsert_recurring_meeting_series: 'Admin-only: create or update an EXPERT recurring meeting series and materialize the future appointment horizon in Calendar/Meet with individual reschedule links.',
};

export const KIA_TOOL_DEFINITIONS: KiaToolDefinition[] = (Object.keys(kiaToolValidators) as ToolName[]).map((name) => ({
  name,
  description: TOOL_DESCRIPTIONS[name],
  input_schema: toJsonSchema(kiaToolValidators[name]),
  strict: true,
}));

export function getKiaToolDefinition(name: string): KiaToolDefinition | null {
  return KIA_TOOL_DEFINITIONS.find((tool) => tool.name === name) ?? null;
}

export function validateKiaToolArguments(name: string, args: Record<string, unknown>): Record<string, unknown> {
  const validator = kiaToolValidators[name as ToolName];
  if (!validator) throw new Error(`Unsupported Kia tool: ${name}`);
  return validator.parse(args) as Record<string, unknown>;
}
