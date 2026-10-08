import { describe, expect, it } from 'vitest';
import { getKiaToolDefinition, validateKiaToolArguments } from '@/lib/ai/kia/kia-tool-definitions';
import { getKiaToolPolicy, isKiaToolAuthorized } from '@/lib/ai/kia/kia-tool-registry';
import { KIA_ACCOUNTING_READ_NAMES } from '@/lib/ai/kia/kia-accounting-v2-reads';

describe('KIA accounting v2 reads', () => {
  it('exposes only read effects for admin', () => {
    for (const name of KIA_ACCOUNTING_READ_NAMES) {
      expect(getKiaToolDefinition(name)).not.toBeNull();
      expect(getKiaToolPolicy(name)).toMatchObject({ riskTier: 'R1', effect: 'read' });
      expect(isKiaToolAuthorized(name, { channel: 'admin', requestedNames: [name], maxRiskTier: 'R1', allowedEffects: ['read'], autonomousOnly: true })).toBe(true);
      expect(isKiaToolAuthorized(name, { channel: 'dashboard', requestedNames: [name], maxRiskTier: 'R1', allowedEffects: ['read'], autonomousOnly: true })).toBe(false);
    }
  });
  it('requires valid explicit date range and limits', () => {
    expect(() => validateKiaToolArguments('get_holded_ledger_entries', { startDate: '2026-01-01', endDate: '2026-12-31' })).not.toThrow();
    expect(() => validateKiaToolArguments('get_holded_ledger_entries', { startDate: '2026-02-30', endDate: '2026-12-31' })).toThrow();
    expect(() => validateKiaToolArguments('get_holded_chart_of_accounts', { companyId: 'another-tenant' })).toThrow();
  });
});
