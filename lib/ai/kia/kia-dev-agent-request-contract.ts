// Pure, fail-closed draft contract. No DB access, GitHub tokens, dispatch, or write side effects.
import { createHash } from 'node:crypto';
import manifest from '@/config/kia-dev-agent-tasks.json';

type Actor = {
  userId: string | null;
  role: string | null;
  isStaff: boolean;
  tenantId?: string | null;
};

export type KiaDevAgentRequestPreview = {
  protocolVersion: 1;
  taskId: string;
  status: 'blocked';
  reason: 'actor_not_authorized' | 'task_not_found' | 'task_not_approved' | 'agent_disabled' | 'manual_review_required';
  reviewFingerprint: string | null;
  requestedCheckpoint: string | null;
  canQueue: false;
  queued: false;
  canDispatch: false;
  persisted: false;
  approvalState: 'not_requested';
  requiresHumanReview: true;
};

export function buildKiaDevAgentRequestPreview(input: {
  taskId: string;
  actor: Actor | null | undefined;
}): KiaDevAgentRequestPreview {
  const actor = input.actor;
  const authorized = actor?.isStaff === true
    && (actor.role === 'admin' || actor.role === 'owner')
    && typeof actor.userId === 'string'
    && actor.userId.length > 0
    && actor.userId.length <= 128;
  const task = authorized ? manifest.tasks.find((item) => item.id === input.taskId) : undefined;
  const reason: KiaDevAgentRequestPreview['reason'] = !authorized
    ? 'actor_not_authorized'
    : !task
      ? 'task_not_found'
      : task.status !== 'sandbox-approved'
        ? 'task_not_approved'
        : manifest.executionEnabled !== true
          ? 'agent_disabled'
          : 'manual_review_required';
  // Deterministic preflight fingerprint is NOT an idempotency lock or a durable queue item.
  const reviewFingerprint = authorized && task
    ? createHash('sha256')
      .update(JSON.stringify([1, 'kia-admin', actor.userId, actor.tenantId ?? null,
        task.id, task.requiredCheckpoint, task.status, manifest.version]))
      .digest('hex').slice(0, 32)
    : null;
  return {
    protocolVersion: 1,
    taskId: input.taskId,
    status: 'blocked',
    reason,
    reviewFingerprint,
    requestedCheckpoint: task?.requiredCheckpoint ?? null,
    canQueue: false,
    queued: false,
    canDispatch: false,
    persisted: false,
    approvalState: 'not_requested',
    requiresHumanReview: true,
  };
}
