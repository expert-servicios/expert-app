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
    companyId: z.string().uuid().optional(),
    includeAnomalies: z.boolean().default(true),
    periods: z.number().int().min(1).max(4).default(1),
  }).strict(),
  // ── Holded accounting/data tools (active company integration) ─────────────
  get_holded_invoices: z.object({
    docType: z.enum(['invoice', 'salesreceipt', 'purchase', 'creditnote']).default('invoice'),
    limit: z.number().int().min(1).max(20).default(10),
    since: z.string().optional(),
  }).strict(),
  get_holded_contacts: z.object({
    query: z.string().max(100).optional(),
    limit: z.number().int().min(1).max(20).default(10),
  }).strict(),
  get_holded_bank_balance: z.object({
    limit: z.number().int().min(1).max(10).default(5),
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
    period: z.string().optional(),
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
  get_user_orders: z.object({
    caseId: z.string().uuid().optional(),
    limit: z.number().int().min(1).max(20).default(10),
  }).strict(),
  get_user_subscriptions: z.object({
    companyId: z.string().uuid().optional(),
    limit: z.number().int().min(1).max(20).default(10),
  }).strict(),
  get_case_tasks: z.object({
    caseId: z.string().uuid(),
    limit: z.number().int().min(1).max(50).default(20),
  }).strict(),
  get_case_documents: z.object({
    caseId: z.string().uuid(),
    limit: z.number().int().min(1).max(50).default(20),
  }).strict(),
  get_case_timeline: z.object({
    caseId: z.string().uuid(),
    limit: z.number().int().min(1).max(50).default(25),
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
  create_internal_task: 'Draft an internal task for backend/admin review.',
  generate_checkout_gate_link: 'Generate a protected /contratar link; does not create Stripe checkout.',
  generate_profile_link: 'Generate secure profile/login link.',
  generate_holded_connection_link: 'Generate secure Holded connection panel link.',
  get_company_status_snapshot: 'Return safe company/accounting snapshot summary if available.',
  get_accounting_snapshot: 'Return full accounting period snapshots and open anomalies for a company. Use when the user asks about financial data, quarterly results, IVA, cash flow, or accounting anomalies. Requires companyId in context.',
  get_holded_invoices: 'List recent Holded invoices or purchases for the active company. Requires active company-scoped Holded integration.',
  get_holded_contacts: 'Search or list Holded contacts for the active company. Requires active company-scoped Holded integration.',
  get_holded_bank_balance: 'Return Holded treasury account balances for the active company. Requires active company-scoped Holded integration.',
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
  get_user_orders: 'List recent orders/payments for the authenticated user, optionally scoped to one case. Read-only and safe for payment-status questions.',
  get_user_subscriptions: 'List active/recent EXPERT subscriptions for the authenticated user or active company. Read-only.',
  get_case_tasks: 'List operational tasks for one case owned by the authenticated user.',
  get_case_documents: 'List documents for one case owned by the authenticated user.',
  get_case_timeline: 'Return a compact operational timeline for one case from case updates, tasks, documents and email events.',
  search_knowledge_resources: 'Search EXPERT blog articles and knowledge-base documents. Use to share a relevant guide or article with the user. Returns canonical public links.',
  get_official_sources: 'Return official source links from the canonical EXPERT Regulatory Registry for a service or topic. Use when the user wants to verify information independently.',
  find_relevant_services: 'Find EXPERT services for a concrete unmet need. Use only after answering the question and only when the user explicitly lacks something necessary, asks EXPERT to handle it, or clearly intends to contract. Do not use for mere topic affinity or when the user asks to do it themselves.',
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
