import { createHash } from 'node:crypto';
import type { getSupabaseAdmin } from '@/lib/integrations/supabase';
import {
  assertKiaAdministrativeActionTransition,
  validateKiaAdministrativeActionSnapshot,
  type KiaAdministrativeActionEffect,
  type KiaAdministrativeActionRisk,
  type KiaAdministrativeActionSnapshot,
  type KiaAdministrativeActionState,
} from './kia-administrative-action';

type AdminClient = ReturnType<typeof getSupabaseAdmin>;

type AdministrativeActionRow = {
  id: string;
  tenant_id: string;
  company_id?: string | null;
  case_id?: string | null;
  requested_by: string;
  assigned_professional_id?: string | null;
  capability: string;
  organism: string;
  action_type: string;
  state: KiaAdministrativeActionState;
  risk: KiaAdministrativeActionRisk;
  effect: KiaAdministrativeActionEffect;
  requires_user_auth: boolean;
  requires_final_approval: boolean;
  action_snapshot_hash: string;
  row_version: number;
  created_at: string;
  updated_at: string;
};

export interface CreateKiaAdministrativeActionInput {
  supabase: AdminClient;
  tenantId: string;
  companyId?: string | null;
  caseId?: string | null;
  requestedBy: string;
  assignedProfessionalId?: string | null;
  capability: string;
  organism: string;
  actionType: string;
  risk: KiaAdministrativeActionRisk;
  effect: KiaAdministrativeActionEffect;
  requiresUserAuth?: boolean;
  requiresFinalApproval?: boolean;
  actionSnapshot: Record<string, unknown>;
  idempotencyKey?: string | null;
  actorType?: 'user' | 'professional' | 'kia' | 'system' | 'connector';
  actorId?: string | null;
  correlationId?: string | null;
}

export interface TransitionKiaAdministrativeActionInput {
  supabase: AdminClient;
  current: KiaAdministrativeActionSnapshot & { rowVersion: number };
  toState: KiaAdministrativeActionState;
  actorType: 'user' | 'professional' | 'kia' | 'system' | 'connector';
  actorId?: string | null;
  eventType?: string;
  correlationId?: string | null;
  payload?: Record<string, unknown>;
}

export function hashKiaAdministrativeActionSnapshot(snapshot: Record<string, unknown>): string {
  return createHash('sha256').update(stableStringify(snapshot)).digest('hex');
}

export async function createKiaAdministrativeAction(
  input: CreateKiaAdministrativeActionInput,
): Promise<KiaAdministrativeActionSnapshot & { rowVersion: number }> {
  const actionSnapshotHash = hashKiaAdministrativeActionSnapshot(input.actionSnapshot);
  const candidate: KiaAdministrativeActionSnapshot = {
    id: 'pending',
    tenantId: input.tenantId,
    companyId: input.companyId ?? null,
    caseId: input.caseId ?? null,
    requestedBy: input.requestedBy,
    assignedProfessionalId: input.assignedProfessionalId ?? null,
    capability: input.capability,
    organism: input.organism,
    actionType: input.actionType,
    state: 'draft',
    risk: input.risk,
    effect: input.effect,
    requiresUserAuth: input.requiresUserAuth ?? false,
    requiresFinalApproval: input.requiresFinalApproval ?? false,
    actionSnapshotHash,
    approvalTokenExpiresAt: null,
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
  };
  const validationErrors = validateKiaAdministrativeActionSnapshot(candidate);
  if (validationErrors.length > 0) {
    throw new Error(`Invalid KIA administrative action: ${validationErrors.join(',')}`);
  }

  const { data, error } = await input.supabase.rpc('kia_create_administrative_action', {
    p_tenant_id: input.tenantId,
    p_company_id: input.companyId ?? null,
    p_case_id: input.caseId ?? null,
    p_requested_by: input.requestedBy,
    p_assigned_professional_id: input.assignedProfessionalId ?? null,
    p_capability: input.capability,
    p_organism: input.organism,
    p_action_type: input.actionType,
    p_risk: input.risk,
    p_effect: input.effect,
    p_requires_user_auth: input.requiresUserAuth ?? false,
    p_requires_final_approval: input.requiresFinalApproval ?? false,
    p_action_snapshot: input.actionSnapshot,
    p_action_snapshot_hash: actionSnapshotHash,
    p_idempotency_key: normalizeOptional(input.idempotencyKey),
    p_actor_type: input.actorType ?? 'kia',
    p_actor_id: input.actorId ?? null,
    p_correlation_id: input.correlationId ?? null,
  });
  if (error) throw error;
  return mapActionRow(singleRpcRow(data));
}

export async function transitionKiaAdministrativeAction(
  input: TransitionKiaAdministrativeActionInput,
): Promise<KiaAdministrativeActionSnapshot & { rowVersion: number }> {
  assertKiaAdministrativeActionTransition(input.current.state, input.toState);

  const { data, error } = await input.supabase.rpc('kia_transition_administrative_action', {
    p_action_id: input.current.id,
    p_expected_row_version: input.current.rowVersion,
    p_to_state: input.toState,
    p_actor_type: input.actorType,
    p_actor_id: input.actorId ?? null,
    p_event_type: normalizeOptional(input.eventType) ?? 'state_transition',
    p_correlation_id: input.correlationId ?? null,
    p_payload: input.payload ?? {},
  });
  if (error) throw error;
  return mapActionRow(singleRpcRow(data));
}

function singleRpcRow(data: unknown): AdministrativeActionRow {
  const row = Array.isArray(data) ? data[0] : data;
  if (!row || typeof row !== 'object') throw new Error('KIA administrative action RPC returned no row');
  return row as AdministrativeActionRow;
}

function mapActionRow(row: AdministrativeActionRow): KiaAdministrativeActionSnapshot & { rowVersion: number } {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    companyId: row.company_id ?? null,
    caseId: row.case_id ?? null,
    requestedBy: row.requested_by,
    assignedProfessionalId: row.assigned_professional_id ?? null,
    capability: row.capability,
    organism: row.organism,
    actionType: row.action_type,
    state: row.state,
    risk: row.risk,
    effect: row.effect,
    requiresUserAuth: Boolean(row.requires_user_auth),
    requiresFinalApproval: Boolean(row.requires_final_approval),
    actionSnapshotHash: row.action_snapshot_hash,
    approvalTokenExpiresAt: null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    rowVersion: row.row_version,
  };
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, item]) => item !== undefined)
    .sort(([a], [b]) => a.localeCompare(b));
  return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`).join(',')}}`;
}

function normalizeOptional(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}
