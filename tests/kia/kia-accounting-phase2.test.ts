import { describe, expect, it } from 'vitest';
import {
  getKiaToolPolicy,
  isKiaToolAuthorized,
  resolveKiaToolDefinitions,
} from '@/lib/ai/kia/kia-tool-registry';
import { getKiaToolDefinition } from '@/lib/ai/kia/kia-tool-definitions';
import { resolveKiaSkillAuthorization } from '@/lib/ai/kia/kia-skill-execution';

describe('KIA Accounting phase 2 authorization', () => {
  it('registers accounting reads as autonomous R1 reads', () => {
    for (const name of [
      'get_accounts_receivable',
      'get_accounts_payable',
      'get_overdue_invoices',
      'get_unreconciled_transactions',
    ]) {
      expect(getKiaToolDefinition(name)).not.toBeNull();
      expect(getKiaToolPolicy(name)).toMatchObject({
        riskTier: 'R1',
        effect: 'read',
        capability: 'accounting_read',
        requiresHumanApproval: false,
      });
      expect(isKiaToolAuthorized(name, {
        channel: 'dashboard',
        requestedNames: [name],
        maxRiskTier: 'R1',
        allowedEffects: ['read'],
        autonomousOnly: true,
      })).toBe(true);
    }
  });

  it('keeps reminder and credit-note drafts outside autonomous execution', () => {
    expect(getKiaToolPolicy('draft_payment_reminder')).toMatchObject({
      riskTier: 'R1',
      effect: 'draft',
      capability: 'accounting_write',
      requiresHumanApproval: true,
    });
    expect(getKiaToolPolicy('draft_credit_note')).toMatchObject({
      riskTier: 'R2',
      effect: 'draft',
      capability: 'accounting_write',
      requiresHumanApproval: true,
    });

    const visible = resolveKiaToolDefinitions({
      channel: 'dashboard',
      requestedNames: [
        'get_accounts_receivable',
        'draft_payment_reminder',
        'draft_credit_note',
      ],
      maxRiskTier: 'R2',
      allowedEffects: ['read', 'draft'],
      autonomousOnly: true,
    }).map((tool) => tool.name);

    expect(visible).toEqual(['get_accounts_receivable']);
  });

  it('allows a review flow to expose drafts only when policy explicitly allows them', () => {
    expect(isKiaToolAuthorized('draft_payment_reminder', {
      channel: 'admin',
      requestedNames: ['draft_payment_reminder'],
      maxRiskTier: 'R1',
      allowedEffects: ['draft'],
      autonomousOnly: false,
    })).toBe(true);

    expect(isKiaToolAuthorized('draft_credit_note', {
      channel: 'admin',
      requestedNames: ['draft_credit_note'],
      maxRiskTier: 'R1',
      allowedEffects: ['draft'],
      autonomousOnly: false,
    })).toBe(false);

    expect(isKiaToolAuthorized('draft_credit_note', {
      channel: 'admin',
      requestedNames: ['draft_credit_note'],
      maxRiskTier: 'R2',
      allowedEffects: ['draft'],
      autonomousOnly: false,
    })).toBe(true);
  });

  it('narrows accounting skill to accounting capabilities without granting drafts in autonomous mode', () => {
    const policyToolNames = [
      'get_holded_invoices',
      'get_accounting_snapshot',
      'get_accounts_receivable',
      'get_accounts_payable',
      'get_overdue_invoices',
      'get_unreconciled_transactions',
      'draft_payment_reminder',
      'draft_credit_note',
      'get_case_status',
    ];

    const resolved = resolveKiaSkillAuthorization({
      taskType: 'accounting_anomaly_review',
      policyAuthorization: {
        channel: 'dashboard',
        requestedNames: policyToolNames,
        maxRiskTier: 'R2',
        allowedEffects: ['read', 'draft'],
        autonomousOnly: true,
      },
      policyToolNames,
    });

    expect(resolved.skill?.id).toBe('accounting.operations');
    expect(resolved.toolNames).toContain('get_accounts_receivable');
    expect(resolved.toolNames).toContain('get_unreconciled_transactions');
    expect(resolved.toolNames).not.toContain('draft_payment_reminder');
    expect(resolved.toolNames).not.toContain('draft_credit_note');
    expect(resolved.toolNames).not.toContain('get_case_status');
  });
});
