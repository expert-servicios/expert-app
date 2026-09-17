import { describe, expect, it } from 'vitest';
import { resolveKiaSkillAuthorization } from '@/lib/ai/kia/kia-skill-execution';
import { getKiaToolPolicy } from '@/lib/ai/kia/kia-tool-registry';

const dashboardPolicy = {
  channel: 'dashboard' as const,
  requestedNames: [
    'get_client_profile',
    'get_service_registry_item',
    'run_viability_check',
    'run_readiness_check',
    'get_holded_connection_status',
    'classify_document',
    'get_case_status',
    'get_company_status_snapshot',
    'get_accounting_snapshot',
    'get_holded_invoices',
    'get_holded_contacts',
    'get_holded_bank_balance',
    'generate_company_report',
    'extract_invoice_ocr',
  ],
  maxRiskTier: 'R1' as const,
  allowedEffects: ['read'] as const,
  autonomousOnly: true,
};

describe('KIA M6.2 skill authorization', () => {
  it('narrows policy tools to the capabilities declared by the selected skill', () => {
    const resolved = resolveKiaSkillAuthorization({
      taskType: 'viability_reasoning',
      policyAuthorization: { ...dashboardPolicy, allowedEffects: ['read'] },
      policyToolNames: [...dashboardPolicy.requestedNames],
    });

    expect(resolved.skill?.id).toBe('fiscal.viability');
    expect(resolved.toolNames).toContain('get_client_profile');
    expect(resolved.toolNames).toContain('get_case_status');
    expect(resolved.toolNames).not.toContain('get_holded_invoices');
    expect(resolved.toolNames).not.toContain('get_accounting_snapshot');
  });

  it('never restores tools that were absent from the policy allowlist', () => {
    const resolved = resolveKiaSkillAuthorization({
      taskType: 'readiness_reasoning',
      policyAuthorization: {
        channel: 'dashboard',
        requestedNames: ['get_holded_connection_status'],
        maxRiskTier: 'R1',
        allowedEffects: ['read'],
        autonomousOnly: true,
      },
      policyToolNames: ['get_holded_connection_status'],
    });

    expect(resolved.toolNames).toEqual(['get_holded_connection_status']);
  });

  it('keeps the lower policy risk ceiling when it is stricter than the skill', () => {
    const resolved = resolveKiaSkillAuthorization({
      taskType: 'readiness_reasoning',
      policyAuthorization: {
        channel: 'dashboard',
        requestedNames: [...dashboardPolicy.requestedNames],
        maxRiskTier: 'R0',
        allowedEffects: ['read'],
        autonomousOnly: true,
      },
      policyToolNames: [...dashboardPolicy.requestedNames],
    });

    expect(resolved.authorization.maxRiskTier).toBe('R0');
    for (const name of resolved.toolNames) {
      expect(getKiaToolPolicy(name)?.riskTier).toBe('R0');
    }
  });

  it('preserves policy effects and autonomous-only constraints', () => {
    const resolved = resolveKiaSkillAuthorization({
      taskType: 'document_classification',
      policyAuthorization: {
        channel: 'dashboard',
        requestedNames: [...dashboardPolicy.requestedNames],
        maxRiskTier: 'R1',
        allowedEffects: ['read'],
        autonomousOnly: true,
      },
      policyToolNames: [...dashboardPolicy.requestedNames],
    });

    expect(resolved.authorization.allowedEffects).toEqual(['read']);
    expect(resolved.authorization.autonomousOnly).toBe(true);
  });

  it('leaves policy authorization unchanged when no skill matches', () => {
    const policyToolNames = ['get_client_profile', 'get_case_status'];
    const resolved = resolveKiaSkillAuthorization({
      taskType: 'checkout_decision',
      policyAuthorization: {
        channel: 'dashboard',
        requestedNames: policyToolNames,
        maxRiskTier: 'R1',
        allowedEffects: ['read'],
        autonomousOnly: true,
      },
      policyToolNames,
    });

    expect(resolved.skill).toBeNull();
    expect(resolved.toolNames).toEqual(policyToolNames);
    expect(resolved.authorization.requestedNames).toEqual(policyToolNames);
  });
});
