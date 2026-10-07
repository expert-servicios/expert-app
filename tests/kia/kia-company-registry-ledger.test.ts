import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('KIA company registry ledger', () => {
  const ledger = source('lib/ai/kia/kia-client-ledger.ts');
  const companyLedger = source('lib/ai/kia/kia-company-ledger.ts');
  const cron = source('app/api/cron/kia-client-ledger/route.ts');
  const migration = source('supabase/migrations/20261005080633_kia_client_registry_company_subjects.sql');
  const context = source('lib/ai/kia/kia-context-builder.ts');
  const documentProvenance = source('lib/documents/document-provenance.ts');

  it('supports a company-only subject before a portal user exists', () => {
    expect(migration).toContain('add column if not exists company_id');
    expect(migration).toContain('client_registry_subjects_company_uidx');
    expect(ledger).toContain("if (companyId)");
    expect(ledger).toContain(".eq('company_id', companyId)");
    expect(ledger).toContain("lifecycle_stage: 'client'");
  });

  it('reconciles company operational history into append-only events', () => {
    for (const marker of [
      'company.registered',
      'company.operational_controls',
      'task.created',
      'integration.registered',
      'case.opened',
      'appointment.booked',
      'email.inbound',
      'email.outbound',
    ]) expect(companyLedger).toContain(marker);
    expect(documentProvenance).toContain("eventType: 'document.received'");
    expect(documentProvenance).toContain("eventType: 'document.historical'");
    expect(companyLedger).toContain('recordClientRegistryEvent');
    expect(companyLedger).toContain('reconcileClientRegistry');
  });

  it('adds active companies to the scheduled registry reconciliation', () => {
    expect(cron).toContain('company_cursor');
    expect(cron).toContain("from('companies')");
    expect(cron).toContain('reconcileCompanyRegistry');
    expect(cron).toContain('companyCursor');
  });

  it('loads the registry into KIA company context rather than company notes', () => {
    expect(context).toContain('loadClientRegistryContext');
    expect(context).toContain('companyId: resolvedCompanyId');
    expect(context).not.toContain('internalNotes: string | null');
  });
});
