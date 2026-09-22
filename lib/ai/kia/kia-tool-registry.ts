import type { KiaChannel } from './kia-output-schema';
import { KIA_TOOL_DEFINITIONS, type KiaToolDefinition } from './kia-tool-definitions';

export type KiaToolRiskTier = 'R0' | 'R1' | 'R2' | 'R3' | 'R4' | 'R5';
export type KiaToolEffect = 'read' | 'draft' | 'write' | 'external_action';
export type KiaToolCapability =
  | 'identity'
  | 'client_data'
  | 'case_management'
  | 'documents'
  | 'holded_read'
  | 'holded_hr_read'
  | 'reporting'
  | 'checkout'
  | 'navigation'
  | 'internal_operations'
  | 'administration'
  | 'regulatory'
  | 'knowledge'
  | 'service_discovery';

export interface KiaToolPolicy {
  name: string;
  riskTier: KiaToolRiskTier;
  effect: KiaToolEffect;
  capability: KiaToolCapability;
  requiresHumanApproval: boolean;
  allowedChannels: KiaChannel[];
  description?: string;
}

export interface KiaToolAuthorizationContext {
  channel: KiaChannel;
  requestedNames?: string[];
  maxRiskTier?: KiaToolRiskTier;
  allowedEffects?: KiaToolEffect[];
  autonomousOnly?: boolean;
}

const RISK_RANK: Record<KiaToolRiskTier, number> = { R0: 0, R1: 1, R2: 2, R3: 3, R4: 4, R5: 5 };

const POLICY_BY_TOOL: Record<string, Omit<KiaToolPolicy, 'name' | 'description'>> = {
  resolve_contact_context:            policy('R0', 'read',  'identity'),
  get_client_profile:                 policy('R0', 'read',  'client_data'),
  get_service_registry_item:          policy('R0', 'read',  'client_data'),
  get_service_operational_blueprint:   policy('R0', 'read',  'case_management'),
  get_regulatory_value:                 policy('R0', 'read',  'regulatory'),
  get_regulatory_ruleset:               policy('R0', 'read',  'regulatory'),
  run_viability_check:                policy('R1', 'read',  'client_data'),
  run_readiness_check:                policy('R1', 'read',  'client_data'),
  get_holded_connection_status:       policy('R0', 'read',  'holded_read'),
  create_next_best_action:            policy('R1', 'draft', 'internal_operations', true),
  classify_document:                  policy('R1', 'read',  'documents'),
  get_case_status:                    policy('R0', 'read',  'case_management'),
  create_internal_task:               policy('R1', 'draft', 'internal_operations', true),
  generate_checkout_gate_link:        policy('R1', 'read',  'checkout'),
  generate_profile_link:              policy('R0', 'read',  'navigation'),
  generate_holded_connection_link:    policy('R0', 'read',  'navigation'),
  get_company_status_snapshot:        policy('R0', 'read',  'reporting'),
  get_accounting_snapshot:            policy('R1', 'read',  'reporting'),
  get_holded_invoices:                policy('R1', 'read',  'holded_read'),
  get_holded_contacts:                policy('R1', 'read',  'holded_read'),
  get_holded_bank_balance:            policy('R1', 'read',  'holded_read'),
  get_holded_employees:               policy('R1', 'read',  'holded_hr_read'),
  get_holded_employee_contract:       policy('R1', 'read',  'holded_hr_read'),
  get_holded_payslips:                policy('R1', 'read',  'holded_hr_read'),
  get_holded_salary_records:          policy('R1', 'read',  'holded_hr_read'),
  run_labor_payroll_diagnostics:      policy('R1', 'read',  'holded_hr_read'),
  generate_company_report:            policy('R1', 'read',  'reporting'),
  extract_invoice_ocr:                policy('R1', 'read',  'documents'),
  create_kia_decision_log:            policy('R0', 'write', 'internal_operations'),
  get_user_expedientes:               policy('R0', 'read',  'case_management'),
  get_user_companies:                 policy('R0', 'read',  'client_data'),
  get_user_pending_docs:              policy('R0', 'read',  'documents'),
  search_knowledge_resources:          policy('R0', 'read',  'knowledge'),
  get_official_sources:                policy('R0', 'read',  'regulatory'),
  find_relevant_services:              policy('R0', 'read',  'service_discovery'),
};

function policy(
  riskTier: KiaToolRiskTier,
  effect: KiaToolEffect,
  capability: KiaToolCapability,
  requiresHumanApproval = false,
): Omit<KiaToolPolicy, 'name' | 'description'> {
  return {
    riskTier,
    effect,
    capability,
    requiresHumanApproval,
    allowedChannels: ['waba', 'telegram', 'admin', 'email', 'dashboard', 'document'],
  };
}

export function getKiaToolPolicy(name: string): KiaToolPolicy | null {
  const tool = KIA_TOOL_DEFINITIONS.find((item) => item.name === name);
  const configured = POLICY_BY_TOOL[name];
  if (!tool || !configured) return null;
  return { name, description: tool.description, ...configured };
}

export function getKiaToolRegistry(): Array<KiaToolDefinition & KiaToolPolicy> {
  return KIA_TOOL_DEFINITIONS.flatMap((tool) => {
    const policyEntry = getKiaToolPolicy(tool.name);
    return policyEntry ? [{ ...tool, ...policyEntry }] : [];
  });
}

export function getKiaToolsForCapability(capability: KiaToolCapability): string[] {
  return getKiaToolRegistry().filter((tool) => tool.capability === capability).map((tool) => tool.name);
}

export function isKiaToolSafeForAutonomousExecution(name: string): boolean {
  const tool = getKiaToolPolicy(name);
  if (!tool) return false;
  return tool.effect === 'read'
    && (tool.riskTier === 'R0' || tool.riskTier === 'R1')
    && !tool.requiresHumanApproval;
}

export function resolveKiaToolDefinitions(context: KiaToolAuthorizationContext): KiaToolDefinition[] {
  const requested = context.requestedNames?.length ? new Set(context.requestedNames) : null;
  const maxRiskRank = RISK_RANK[context.maxRiskTier ?? 'R1'];
  const allowedEffects = context.allowedEffects ? new Set(context.allowedEffects) : null;

  return getKiaToolRegistry()
    .filter((tool) => !requested || requested.has(tool.name))
    .filter((tool) => tool.allowedChannels.includes(context.channel))
    .filter((tool) => RISK_RANK[tool.riskTier] <= maxRiskRank)
    .filter((tool) => !allowedEffects || allowedEffects.has(tool.effect))
    .filter((tool) => !context.autonomousOnly || isKiaToolSafeForAutonomousExecution(tool.name))
    .map(({ name, description, input_schema, strict }) => ({ name, description, input_schema, strict }));
}

export function isKiaToolAuthorized(name: string, context: KiaToolAuthorizationContext): boolean {
  if (context.requestedNames?.length && !context.requestedNames.includes(name)) return false;
  return resolveKiaToolDefinitions({ ...context, requestedNames: [name] }).some((tool) => tool.name === name);
}

export function assertKiaToolRegistryComplete(): void {
  const missing = KIA_TOOL_DEFINITIONS.map((tool) => tool.name).filter((name) => !POLICY_BY_TOOL[name]);
  if (missing.length > 0) throw new Error(`KIA tools missing policy metadata: ${missing.join(', ')}`);
}
