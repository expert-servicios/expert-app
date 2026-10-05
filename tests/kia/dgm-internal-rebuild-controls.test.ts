import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('DGM internal accounting rebuild controls', () => {
  const context = source('lib/ai/kia/kia-context-builder.ts');
  const emailAgent = source('app/api/cron/kia-email-agent/route.ts');
  const gates = source('supabase/migrations/20261005094500_company_operational_controls_dgm.sql');
  const playbook = source('docs/clients/dgm-accounting-rebuild-2025-2026.md');

  it('keeps company internal notes staff-only', () => {
    expect(context).toContain('includeInternalNotes = false');
    expect(context).toContain('loadCompany(admin, clientId, resolvedCompanyId, staffCompanyScope)');
    expect(context).toContain('internalNotes: includeInternalNotes');
  });

  it('exposes operational gates to KIA context', () => {
    expect(context).toContain('externalCommunicationBlocked');
    expect(context).toContain('portalActivationBlocked');
    expect(context).toContain('accountingWriteBlocked');
    expect(context).toContain("company_operational_controls");
  });

  it('blocks autonomous email when company communication is gated', () => {
    expect(emailAgent).toContain('externalCommunicationBlocked');
    expect(emailAgent).toContain("company_external_communication_blocked");
    expect(emailAgent).toContain("company_operational_controls");
  });

  it('starts DGM fully internal and read-only', () => {
    expect(gates).toContain('external_communication_blocked');
    expect(gates).toContain('portal_activation_blocked');
    expect(gates).toContain('accounting_write_blocked');
    expect(playbook).toContain('INTERNAL ONLY · NO CLIENT ACCESS · NO EXTERNAL EMAIL · ACCOUNTING READ-ONLY');
    expect(playbook).toContain('advisor_managed');
    expect(playbook).toContain('5 viviendas');
  });
});
