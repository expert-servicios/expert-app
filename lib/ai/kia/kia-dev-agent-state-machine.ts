/**
 * Pure EXPERT KIA Dev Agent state machine.
 *
 * This code is inert until a separately authorized durable queue exists.
 * Principals and policy must be independently authenticated by the caller.
 * No database writes, GitHub API calls, Codex calls or timers.
 */
export type DevAgentRequestState =
  | 'draft'
  | 'awaiting_review'
  | 'approved'
  | 'dispatching'
  | 'running'
  | 'patch_pending_review'
  | 'rejected'
  | 'cancelled'
  | 'expired'
  | 'failed'
  | 'completed';

export type DevAgentPrincipal =
  | { kind: 'human'; id: string; role: string; active: boolean; tenantId: string | null }
  | { kind: 'broker'; verified: boolean }
  | { kind: 'runner'; verified: boolean };

export type DevAgentAction =
  | { kind: 'submit' }
  | { kind: 'approve'; digest: string; validUntil: string }
  | { kind: 'reject' }
  | { kind: 'cancel' }
  | { kind: 'expire' }
  | { kind: 'claim' }
  | { kind: 'start'; providerRunId: string }
  | { kind: 'patch_ready'; patchDigest: string }
  | { kind: 'complete' }
  | { kind: 'fail' };

export type DevAgentMachinePolicy = {
  /** Trusted versioned manifest, checkpoint, and current source ref; never chat-supplied. */
  taskId: string;
  taskStatus: 'sandbox-approved' | 'suspended';
  manifestSha: string;
  headSha: string;
  checkpoint: string;
  /** Runtime gates, independently resolved from the execution broker. */
  executionEnabled: boolean;
  environmentEnabled: boolean;
  protectedRunner: boolean;
  spendBudgetApproved: boolean;
};

export type DevAgentRequestSnapshot = {
  id: string;
  state: DevAgentRequestState;
  version: number;
  createdBy: string;
  tenantId: string | null;
  taskId: string;
  manifestSha: string;
  headSha: string;
  checkpoint: string;
  requestDigest: string;
  expiresAt: string;
  reviewedBy: string | null;
  approvedDigest: string | null;
  approvalExpiresAt: string | null;
  providerRunId: string | null;
  patchDigest: string | null;
};

export type DevAgentTransitionContext = {
  /** Trusted server time supplied for deterministic replay and tests. */
  now: string;
  /** A database CAS is still required; this is only a pure preflight check. */
  expectedVersion: number;
  principal: DevAgentPrincipal;
  policy: DevAgentMachinePolicy;
};

export type DevAgentTransitionResult = {
  request: DevAgentRequestSnapshot;
  event: {
    kind: DevAgentAction['kind'];
    from: DevAgentRequestState;
    to: DevAgentRequestState;
    version: number;
    occurredAt: string;
  };
};

export type DevAgentTransitionErrorCode =
  | 'invalid_snapshot'
  | 'version_conflict'
  | 'invalid_time'
  | 'invalid_transition'
  | 'forbidden'
  | 'stale_policy'
  | 'disabled'
  | 'approval_invalid'
  | 'not_expired'
  | 'invalid_evidence';

export class DevAgentTransitionError extends Error {
  constructor(public readonly code: DevAgentTransitionErrorCode) {
    super(code);
    this.name = 'DevAgentTransitionError';
  }
}

const ALLOWED: Record<DevAgentAction['kind'], DevAgentRequestState[]> = {
  submit: ['draft'],
  approve: ['awaiting_review'],
  reject: ['awaiting_review'],
  cancel: ['draft', 'awaiting_review', 'approved'],
  expire: ['draft', 'awaiting_review', 'approved'],
  claim: ['approved'],
  start: ['dispatching'],
  patch_ready: ['running'],
  complete: ['patch_pending_review'],
  fail: ['dispatching', 'running', 'patch_pending_review'],
};

const TARGET: Record<DevAgentAction['kind'], DevAgentRequestState> = {
  submit: 'awaiting_review',
  approve: 'approved',
  reject: 'rejected',
  cancel: 'cancelled',
  expire: 'expired',
  claim: 'dispatching',
  start: 'running',
  patch_ready: 'patch_pending_review',
  complete: 'completed',
  fail: 'failed',
};

const SHA256 = /^[a-f0-9]{64}$/;
const SHA1 = /^[a-f0-9]{40}$/;
const MAX_APPROVAL_MS = 60 * 60 * 1000;

function timestamp(value: string): number {
  const time = Date.parse(value);
  if (!Number.isFinite(time) || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,3})?Z$/.test(value) ||
      new Date(time).toISOString() !== new Date(value).toISOString()) {
    throw new DevAgentTransitionError('invalid_time');
  }
  return time;
}

function requireHuman(principal: DevAgentPrincipal, request: DevAgentRequestSnapshot): string {
  if (principal.kind !== 'human' || !principal.active ||
      (principal.role !== 'owner' && principal.role !== 'admin') ||
      principal.tenantId !== request.tenantId ||
      !principal.id || principal.id.length > 128) {
    throw new DevAgentTransitionError('forbidden');
  }
  return principal.id;
}

function requireService(principal: DevAgentPrincipal, kind: 'broker' | 'runner'): void {
  if (principal.kind !== kind || principal.verified !== true) {
    throw new DevAgentTransitionError('forbidden');
  }
}

function requirePolicy(request: DevAgentRequestSnapshot, policy: DevAgentMachinePolicy): void {
  if (policy.taskId !== request.taskId || policy.manifestSha !== request.manifestSha ||
      policy.headSha !== request.headSha || policy.checkpoint !== request.checkpoint ||
      policy.taskStatus !== 'sandbox-approved') {
    throw new DevAgentTransitionError('stale_policy');
  }
}

function requireExecutionGates(policy: DevAgentMachinePolicy): void {
  if (policy.executionEnabled !== true || policy.environmentEnabled !== true ||
      policy.protectedRunner !== true || policy.spendBudgetApproved !== true) {
    throw new DevAgentTransitionError('disabled');
  }
}

/**
 * All state changes require a new version. Production callers must perform an
 * atomic DB update WHERE id AND version match and insert an append-only event
 * in the same transaction. This function does NOT persist or dispatch anything.
 */
export function transitionDevAgentRequest(
  request: Readonly<DevAgentRequestSnapshot>,
  action: Readonly<DevAgentAction>,
  context: Readonly<DevAgentTransitionContext>,
): DevAgentTransitionResult {
  if (!Number.isSafeInteger(request.version) || request.version < 0 ||
      !request.id || !request.createdBy || !SHA256.test(request.requestDigest) ||
      !SHA256.test(request.manifestSha) || !SHA1.test(request.headSha)) {
    throw new DevAgentTransitionError('invalid_snapshot');
  }
  if (context.expectedVersion !== request.version) {
    throw new DevAgentTransitionError('version_conflict');
  }
  if (!ALLOWED[action.kind].includes(request.state)) {
    throw new DevAgentTransitionError('invalid_transition');
  }

  const now = timestamp(context.now);
  const expires = timestamp(request.expiresAt);
  const next: DevAgentRequestSnapshot = { ...request };
  const isServiceAction = action.kind === 'expire' || action.kind === 'claim'
    || action.kind === 'start' || action.kind === 'patch_ready' || action.kind === 'fail';
  if (isServiceAction) {
    requireService(context.principal, action.kind === 'start' || action.kind === 'patch_ready' ? 'runner' : 'broker');
  } else {
    requireHuman(context.principal, request);
  }

  if (action.kind !== 'cancel' && action.kind !== 'reject' &&
      action.kind !== 'expire' && action.kind !== 'fail') {
    requirePolicy(request, context.policy);
  }

  if (action.kind === 'expire') {
    const reviewExpired = request.state === 'approved' && request.approvalExpiresAt !== null &&
      timestamp(request.approvalExpiresAt) <= now;
    if (now < expires && !reviewExpired) throw new DevAgentTransitionError('not_expired');
  } else if (action.kind === 'submit' || action.kind === 'approve' || action.kind === 'claim') {
    if (now >= expires) throw new DevAgentTransitionError('approval_invalid');
  }

  switch (action.kind) {
    case 'approve': {
      const reviewer = requireHuman(context.principal, request);
      const approvalExpiry = timestamp(action.validUntil);
      if (reviewer === request.createdBy || action.digest !== request.requestDigest ||
          approvalExpiry <= now || approvalExpiry > now + MAX_APPROVAL_MS ||
          approvalExpiry > expires || request.reviewedBy !== null ||
          request.approvedDigest !== null || request.approvalExpiresAt !== null) {
        throw new DevAgentTransitionError('approval_invalid');
      }
      next.reviewedBy = reviewer;
      next.approvedDigest = action.digest;
      next.approvalExpiresAt = action.validUntil;
      break;
    }
    case 'claim':
      requireExecutionGates(context.policy);
      if (request.approvedDigest !== request.requestDigest ||
          !request.reviewedBy || request.reviewedBy === request.createdBy ||
          !request.approvalExpiresAt || now >= timestamp(request.approvalExpiresAt)) {
        throw new DevAgentTransitionError('approval_invalid');
      }
      break;
    case 'start':
      requireExecutionGates(context.policy);
      if (!/^[0-9]{1,20}$/.test(action.providerRunId) || request.providerRunId !== null) {
        throw new DevAgentTransitionError('invalid_evidence');
      }
      next.providerRunId = action.providerRunId;
      break;
    case 'patch_ready':
      if (!request.providerRunId || request.patchDigest !== null ||
          !SHA256.test(action.patchDigest)) {
        throw new DevAgentTransitionError('invalid_evidence');
      }
      next.patchDigest = action.patchDigest;
      break;
    case 'complete': {
      const reviewer = requireHuman(context.principal, request);
      if (reviewer === request.createdBy || reviewer === request.reviewedBy ||
          !request.providerRunId || !request.patchDigest) {
        throw new DevAgentTransitionError('approval_invalid');
      }
      break;
    }
    default:
      break;
  }

  next.state = TARGET[action.kind];
  next.version = request.version + 1;
  return {
    request: next,
    event: {
      kind: action.kind,
      from: request.state,
      to: next.state,
      version: next.version,
      occurredAt: context.now,
    },
  };
}
