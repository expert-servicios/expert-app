import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('DGM internal accounting rebuild controls', () => {
  const context = source('lib/ai/kia/kia-context-builder.ts');
  const emailAgent = source('app/api/cron/kia-email-agent/route.ts');
  const gates = source('supabase/migrations/20261005075737_company_operational_controls_dgm.sql');
  const playbook = source('docs/clients/dgm-accounting-rebuild-2025-2026.md');

  it('keeps company history in the client registry rather than companies.notes', () => {
    expect(context).toContain('loadClientRegistryContext');
    expect(context).not.toContain('internalNotes: string | null');
    expect(context).not.toContain("select('id, razon_social, nombre_comercial, cif_nif, notes')");
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
    expect(emailAgent).toContain("result.context.company?.externalCommunicationBlocked");
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
