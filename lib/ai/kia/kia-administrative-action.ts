export const KIA_ADMINISTRATIVE_ACTION_STATES = [
  'draft',
  'prepared',
  'needs_review',
  'approved',
  'queued',
  'claimed',
  'running',
  'awaiting_user_auth',
  'awaiting_final_approval',
  'verifying',
  'completed',
  'blocked',
  'cancelled',
  'failed_safe',
  'expired',
  'manual_takeover',
] as const;

export type KiaAdministrativeActionState = (typeof KIA_ADMINISTRATIVE_ACTION_STATES)[number];

export const KIA_ADMINISTRATIVE_ACTION_RISKS = ['R0', 'R1', 'R2', 'R3', 'R4', 'R5'] as const;
export type KiaAdministrativeActionRisk = (typeof KIA_ADMINISTRATIVE_ACTION_RISKS)[number];

export const KIA_ADMINISTRATIVE_ACTION_EFFECTS = [
  'read',
  'draft',
  'write',
  'external_action',
] as const;
export type KiaAdministrativeActionEffect = (typeof KIA_ADMINISTRATIVE_ACTION_EFFECTS)[number];

export interface KiaAdministrativeActionSnapshot {
  id: string;
  tenantId: string;
  companyId?: string | null;
  caseId?: string | null;
  requestedBy: string;
  assignedProfessionalId?: string | null;
  capability: string;
  organism: string;
  actionType: string;
  state: KiaAdministrativeActionState;
  risk: KiaAdministrativeActionRisk;
  effect: KiaAdministrativeActionEffect;
  requiresUserAuth: boolean;
  requiresFinalApproval: boolean;
  actionSnapshotHash: string;
  approvalTokenExpiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

const TERMINAL_STATES = new Set<KiaAdministrativeActionState>([
  'completed',
  'cancelled',
  'failed_safe',
  'expired',
]);

const ALLOWED_TRANSITIONS: Record<KiaAdministrativeActionState, KiaAdministrativeActionState[]> = {
  draft: ['prepared', 'cancelled', 'blocked'],
  prepared: ['needs_review', 'approved', 'cancelled', 'blocked'],
  needs_review: ['prepared', 'approved', 'cancelled', 'blocked'],
  approved: ['queued', 'expired', 'cancelled', 'blocked'],
  queued: ['claimed', 'expired', 'cancelled', 'blocked'],
  claimed: ['running', 'manual_takeover', 'failed_safe', 'cancelled', 'blocked'],
  running: [
    'awaiting_user_auth',
    'awaiting_final_approval',
    'verifying',
    'manual_takeover',
    'failed_safe',
    'blocked',
    'cancelled',
  ],
  awaiting_user_auth: ['running', 'manual_takeover', 'failed_safe', 'expired', 'cancelled', 'blocked'],
  awaiting_final_approval: ['running', 'manual_takeover', 'failed_safe', 'expired', 'cancelled', 'blocked'],
  verifying: ['completed', 'manual_takeover', 'failed_safe', 'blocked'],
  completed: [],
  blocked: ['prepared', 'needs_review', 'approved', 'queued', 'manual_takeover', 'cancelled'],
  cancelled: [],
  failed_safe: [],
  expired: [],
  manual_takeover: ['running', 'verifying', 'completed', 'cancelled', 'failed_safe'],
};

export function isKiaAdministrativeActionTerminal(state: KiaAdministrativeActionState): boolean {
  return TERMINAL_STATES.has(state);
}

export function canTransitionKiaAdministrativeAction(
  from: KiaAdministrativeActionState,
  to: KiaAdministrativeActionState,
): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function assertKiaAdministrativeActionTransition(
  from: KiaAdministrativeActionState,
  to: KiaAdministrativeActionState,
): void {
  if (!canTransitionKiaAdministrativeAction(from, to)) {
    throw new Error(`Invalid KIA administrative action transition: ${from} -> ${to}`);
  }
}

export function stateRequiresUserPresence(state: KiaAdministrativeActionState): boolean {
  return state === 'awaiting_user_auth' || state === 'awaiting_final_approval';
}

export function stateAllowsExecution(state: KiaAdministrativeActionState): boolean {
  return state === 'claimed' || state === 'running' || state === 'manual_takeover';
}

export function validateKiaAdministrativeActionSnapshot(
  action: KiaAdministrativeActionSnapshot,
): string[] {
  const errors: string[] = [];

  if (!action.id) errors.push('missing_id');
  if (!action.tenantId) errors.push('missing_tenant');
  if (!action.requestedBy) errors.push('missing_requester');
  if (!action.capability) errors.push('missing_capability');
  if (!action.organism) errors.push('missing_organism');
  if (!action.actionType) errors.push('missing_action_type');
  if (!action.actionSnapshotHash) errors.push('missing_action_snapshot_hash');

  if (action.requiresUserAuth && action.risk === 'R0') {
    errors.push('user_auth_inconsistent_with_r0');
  }

  if (action.requiresFinalApproval && !['R4', 'R5'].includes(action.risk)) {
    errors.push('final_approval_requires_high_risk');
  }

  if (action.approvalTokenExpiresAt) {
    const expires = new Date(action.approvalTokenExpiresAt).getTime();
    if (Number.isNaN(expires)) errors.push('invalid_approval_expiry');
  }

  return errors;
}
