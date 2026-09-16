import { createHash, randomBytes } from 'node:crypto';
import type { getSupabaseAdmin } from '@/lib/integrations/supabase';
import type { KiaAdministrativeActionSnapshot } from './kia-administrative-action';

type AdminClient = ReturnType<typeof getSupabaseAdmin>;

export type KiaAdministrativeApprovalType =
  | 'review'
  | 'final_approval'
  | 'user_auth_resume'
  | 'manual_takeover';

export type KiaAdministrativeApprovalDecision =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'revoked'
  | 'expired';

type ApprovalRow = {
  id: string;
  action_id: string;
  tenant_id: string;
  approval_type: KiaAdministrativeApprovalType;
  decision: KiaAdministrativeApprovalDecision;
  requested_from?: string | null;
  decided_by?: string | null;
  action_snapshot_hash: string;
  expires_at: string;
  decided_at?: string | null;
  consumed_at?: string | null;
  created_at: string;
};

export interface KiaAdministrativeApproval {
  id: string;
  actionId: string;
  tenantId: string;
  approvalType: KiaAdministrativeApprovalType;
  decision: KiaAdministrativeApprovalDecision;
  requestedFrom?: string | null;
  decidedBy?: string | null;
  actionSnapshotHash: string;
  expiresAt: string;
  decidedAt?: string | null;
  consumedAt?: string | null;
  createdAt: string;
}

export interface RequestKiaAdministrativeApprovalInput {
  supabase: AdminClient;
  action: KiaAdministrativeActionSnapshot;
  approvalType: KiaAdministrativeApprovalType;
  requestedFrom?: string | null;
  expiresAt: string;
  metadata?: Record<string, unknown>;
}

export interface ConsumeKiaAdministrativeApprovalInput {
  supabase: AdminClient;
  action: KiaAdministrativeActionSnapshot;
  approvalType: KiaAdministrativeApprovalType;
  token: string;
  decidedBy: string;
  actorType?: 'user' | 'professional' | 'kia' | 'system' | 'connector';
  actorId?: string | null;
  correlationId?: string | null;
}

export function generateKiaAdministrativeApprovalToken(): string {
  return randomBytes(32).toString('base64url');
}

export function hashKiaAdministrativeApprovalToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function requestKiaAdministrativeApproval(
  input: RequestKiaAdministrativeApprovalInput,
): Promise<{ approval: KiaAdministrativeApproval; token: string }> {
  validateApprovalRequestState(input.action, input.approvalType);
  const expiresAtMs = new Date(input.expiresAt).getTime();
  if (!Number.isFinite(expiresAtMs) || expiresAtMs <= Date.now()) {
    throw new Error('Invalid KIA administrative approval expiry');
  }

  const token = generateKiaAdministrativeApprovalToken();
  const tokenHash = hashKiaAdministrativeApprovalToken(token);
  const { data, error } = await input.supabase.rpc('kia_request_administrative_approval', {
    p_action_id: input.action.id,
    p_approval_type: input.approvalType,
    p_requested_from: input.requestedFrom ?? null,
    p_token_hash: tokenHash,
    p_expires_at: input.expiresAt,
    p_metadata: input.metadata ?? {},
  });
  if (error) throw error;
  return { approval: mapApprovalRow(singleApprovalRow(data)), token };
}

export async function consumeKiaAdministrativeApproval(
  input: ConsumeKiaAdministrativeApprovalInput,
): Promise<KiaAdministrativeApproval> {
  validateApprovalRequestState(input.action, input.approvalType);
  if (!input.token.trim()) throw new Error('Missing KIA administrative approval token');
  if (!input.decidedBy.trim()) throw new Error('Missing KIA administrative approval decision actor');

  const { data, error } = await input.supabase.rpc('kia_consume_administrative_approval', {
    p_action_id: input.action.id,
    p_approval_type: input.approvalType,
    p_token_hash: hashKiaAdministrativeApprovalToken(input.token),
    p_decided_by: input.decidedBy,
    p_actor_type: input.actorType ?? 'user',
    p_actor_id: input.actorId ?? null,
    p_correlation_id: input.correlationId ?? null,
  });
  if (error) throw error;
  return mapApprovalRow(singleApprovalRow(data));
}

function validateApprovalRequestState(
  action: KiaAdministrativeActionSnapshot,
  approvalType: KiaAdministrativeApprovalType,
): void {
  if (approvalType === 'user_auth_resume' && action.state !== 'awaiting_user_auth') {
    throw new Error('KIA user-auth approval requires awaiting_user_auth state');
  }
  if (approvalType === 'final_approval' && action.state !== 'awaiting_final_approval') {
    throw new Error('KIA final approval requires awaiting_final_approval state');
  }
}

function singleApprovalRow(data: unknown): ApprovalRow {
  const row = Array.isArray(data) ? data[0] : data;
  if (!row || typeof row !== 'object') throw new Error('KIA administrative approval RPC returned no row');
  return row as ApprovalRow;
}

function mapApprovalRow(row: ApprovalRow): KiaAdministrativeApproval {
  return {
    id: row.id,
    actionId: row.action_id,
    tenantId: row.tenant_id,
    approvalType: row.approval_type,
    decision: row.decision,
    requestedFrom: row.requested_from ?? null,
    decidedBy: row.decided_by ?? null,
    actionSnapshotHash: row.action_snapshot_hash,
    expiresAt: row.expires_at,
    decidedAt: row.decided_at ?? null,
    consumedAt: row.consumed_at ?? null,
    createdAt: row.created_at,
  };
}
