import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('DGM internal accounting rebuild context', () => {
  const contextBuilder = source('lib/ai/kia/kia-context-builder.ts');
  const companyLedger = source('lib/ai/kia/kia-company-ledger.ts');
  const migration = source('supabase/migrations/20261005100500_kia_client_registry_company_subjects.sql');
  const playbook = source('docs/clients/dgm-accounting-rebuild-2025-2026.md');
  const learningLoop = source('docs/kia-operator-learning-loop.md');

  it('uses a company-scoped registry subject before a portal user exists', () => {
    expect(migration).toContain('client_registry_subjects_company_uidx');
    expect(migration).toContain('company_id uuid references public.companies');
    expect(contextBuilder).toContain('loadClientRegistryContext');
    expect(contextBuilder).not.toContain('internalNotes: string | null');
    expect(companyLedger).toContain('reconcileCompanyRegistry');
    expect(companyLedger).toContain("eventType: 'company.registered'");
    expect(companyLedger).toContain("eventType: 'company.operational_controls'");
  });

  it('keeps DGM internal until accounting is validated', () => {
    expect(playbook).toContain('INTERNAL ONLY');
    expect(playbook).toContain('no crear usuario');
    expect(playbook).toContain('no enviar correos automáticos ni manuales al titular');
    expect(playbook).toContain('advisor_managed');
    expect(playbook).toContain('auditoría read-only');
  });

  it('separates company-specific facts from global KIA learning', () => {
    expect(playbook).toContain('Contexto específico DGM — NO globalizar');
    expect(learningLoop).toContain('What remains company-scoped');
    expect(learningLoop).toContain('What is promoted globally');
  });
});
