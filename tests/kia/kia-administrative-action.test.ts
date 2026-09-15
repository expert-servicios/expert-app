import { describe, expect, it } from 'vitest';
import {
  assertKiaAdministrativeActionTransition,
  canTransitionKiaAdministrativeAction,
  isKiaAdministrativeActionTerminal,
  stateAllowsExecution,
  stateRequiresUserPresence,
  validateKiaAdministrativeActionSnapshot,
  type KiaAdministrativeActionSnapshot,
} from '@/lib/ai/kia/kia-administrative-action';

function action(overrides: Partial<KiaAdministrativeActionSnapshot> = {}): KiaAdministrativeActionSnapshot {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    tenantId: '22222222-2222-2222-2222-222222222222',
    companyId: '33333333-3333-3333-3333-333333333333',
    caseId: null,
    requestedBy: '44444444-4444-4444-4444-444444444444',
    assignedProfessionalId: null,
    capability: 'administration.aeat.read',
    organism: 'aeat',
    actionType: 'read_tax_status',
    state: 'draft',
    risk: 'R1',
    effect: 'read',
    requiresUserAuth: false,
    requiresFinalApproval: false,
    actionSnapshotHash: 'sha256:abc123',
    approvalTokenExpiresAt: null,
    createdAt: '2026-09-15T14:00:00.000Z',
    updatedAt: '2026-09-15T14:00:00.000Z',
    ...overrides,
  };
}

describe('KIA administrative action state machine', () => {
  it('allows the normal prepare-review-approve-queue-run-verify-complete path', () => {
    const path = [
      ['draft', 'prepared'],
      ['prepared', 'needs_review'],
      ['needs_review', 'approved'],
      ['approved', 'queued'],
      ['queued', 'claimed'],
      ['claimed', 'running'],
      ['running', 'verifying'],
      ['verifying', 'completed'],
    ] as const;

    for (const [from, to] of path) {
      expect(canTransitionKiaAdministrativeAction(from, to)).toBe(true);
      expect(() => assertKiaAdministrativeActionTransition(from, to)).not.toThrow();
    }
  });

  it('rejects unsafe jumps and transitions out of terminal states', () => {
    expect(canTransitionKiaAdministrativeAction('draft', 'running')).toBe(false);
    expect(canTransitionKiaAdministrativeAction('completed', 'running')).toBe(false);
    expect(() => assertKiaAdministrativeActionTransition('approved', 'completed')).toThrow(
      'Invalid KIA administrative action transition: approved -> completed',
    );
  });

  it('marks only final outcomes as terminal', () => {
    for (const state of ['completed', 'cancelled', 'failed_safe', 'expired'] as const) {
      expect(isKiaAdministrativeActionTerminal(state)).toBe(true);
    }
    expect(isKiaAdministrativeActionTerminal('blocked')).toBe(false);
    expect(isKiaAdministrativeActionTerminal('manual_takeover')).toBe(false);
  });

  it('requires user presence only for auth and final approval pauses', () => {
    expect(stateRequiresUserPresence('awaiting_user_auth')).toBe(true);
    expect(stateRequiresUserPresence('awaiting_final_approval')).toBe(true);
    expect(stateRequiresUserPresence('running')).toBe(false);
  });

  it('restricts executable states', () => {
    expect(stateAllowsExecution('claimed')).toBe(true);
    expect(stateAllowsExecution('running')).toBe(true);
    expect(stateAllowsExecution('manual_takeover')).toBe(true);
    expect(stateAllowsExecution('queued')).toBe(false);
    expect(stateAllowsExecution('verifying')).toBe(false);
  });

  it('requires immutable action snapshot identity and high-risk final approvals', () => {
    expect(validateKiaAdministrativeActionSnapshot(action())).toEqual([]);

    expect(validateKiaAdministrativeActionSnapshot(action({
      actionSnapshotHash: '',
      risk: 'R2',
      requiresFinalApproval: true,
    }))).toEqual([
      'missing_action_snapshot_hash',
      'final_approval_requires_high_risk',
    ]);
  });

  it('rejects R0 actions that claim to require user authentication', () => {
    expect(validateKiaAdministrativeActionSnapshot(action({
      risk: 'R0',
      requiresUserAuth: true,
    }))).toContain('user_auth_inconsistent_with_r0');
  });
});
