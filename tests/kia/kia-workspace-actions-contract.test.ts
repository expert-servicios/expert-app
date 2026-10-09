import { describe, expect, it } from 'vitest';
import { classifyWorkspaceAction, WORKSPACE_ACTION_CATALOG, workspaceActionCodes, workspaceActionStates } from '@/lib/ai/kia/workspace-actions/contract';

const base = {
  action: 'profile.contact.update',
  target: { kind: 'profile', id: '11111111-1111-4111-8111-111111111111' },
  companyId: null,
  changes: { phone: '600000000' },
  expectedVersion: null,
  summary: 'Actualizar teléfono',
  origin: { surface: 'client', inboxItemId: null },
};

describe('KIA Work phase-0 contract', () => {
  it('all actions remain disabled until server-side executors and approvals exist', () => {
    expect(Object.values(WORKSPACE_ACTION_CATALOG).every(item => item.enabled === false)).toBe(true);
    expect(Object.keys(WORKSPACE_ACTION_CATALOG)).toHaveLength(workspaceActionCodes.length);
  });
  it('validates a scoped proposal without granting execution', () => {
    const result = classifyWorkspaceAction(base);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.executionEnabled).toBe(false);
      expect(result.approval).toBe('confirm_in_chat');
    }
  });
  it('rejects model-supplied actor and arbitrary action names', () => {
    expect(classifyWorkspaceAction({ ...base, actorId: 'admin' }).ok).toBe(false);
    expect(classifyWorkspaceAction({ ...base, action: 'database.run_sql' }).ok).toBe(false);
  });
  it('rejects cross-surface execution and target-type mismatches', () => {
    expect(classifyWorkspaceAction({ ...base, origin: { surface: 'admin', inboxItemId: null } }).ok).toBe(false);
    expect(classifyWorkspaceAction({ ...base, target: { kind: 'company', id: base.target.id } }).ok).toBe(false);
  });
  it('requires explicit approval classes for sensitive effects', () => {
    expect(WORKSPACE_ACTION_CATALOG['inbox.reply.send'].approval).toBe('explicit_external');
    expect(WORKSPACE_ACTION_CATALOG['billing.invoice.issue'].approval).toBe('professional');
    expect(workspaceActionStates).toContain('waiting_approval');
    expect(workspaceActionStates).toContain('partially_completed');
  });
});
