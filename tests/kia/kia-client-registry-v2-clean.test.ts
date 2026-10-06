import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('KIA Client Registry v2 clean boundaries', () => {
  const migration = source('supabase/migrations/20261006082354_kia_client_registry_v2_clean_20261006.sql');
  const profile = source('lib/ai/kia/kia-client-registry-profile.ts');
  const ledger = source('lib/ai/kia/kia-client-ledger.ts');
  const prompt = source('lib/ai/kia/kia-system-prompt.ts');

  it('keeps 24 months of detail and six years of standard trace retention', () => {
    expect(migration).toContain("occurred_at + interval '24 months'");
    expect(migration).toContain("occurred_at + interval '6 years'");
    expect(profile).toContain('CLIENT_REGISTRY_DETAIL_MONTHS = 24');
    expect(profile).toContain('CLIENT_REGISTRY_RETENTION_YEARS = 6');
    expect(profile).toContain("retention_class.eq.legal_hold");
    expect(profile).toContain("eq('retention_class', 'standard')");
  });

  it('scopes historical summaries by company and case', () => {
    expect(migration).toContain('company_id uuid references public.companies');
    expect(migration).toContain('case_id uuid references public.cases');
    expect(migration).toContain('client_registry_period_summaries_scope_uidx');
    expect(profile).toContain("summariesQuery.eq('case_id', scope.caseId)");
    expect(profile).toContain("summariesQuery.eq('company_id', scope.companyId).is('case_id', null)");
    expect(ledger).toContain('companyId: input.companyId ?? null');
    expect(ledger).toContain('caseId: input.caseId ?? null');
  });

  it('requires provenance before a fact or instruction can become confirmed', () => {
    expect(migration).toContain('client_registry_provenance_required');
    expect(profile).toContain('requireProvenance');
    expect(profile).toContain('client_registry_provenance_required');
    expect(migration).toContain("verification_status <> 'confirmed'");
  });

  it('replaces facts and instructions atomically in database functions', () => {
    expect(migration).toContain('replace_client_registry_fact');
    expect(migration).toContain('replace_client_registry_instruction');
    expect(migration).toContain('for update');
    expect(migration).toContain('get diagnostics v_updated = row_count');
    expect(profile).toContain("admin.rpc('replace_client_registry_fact'");
    expect(profile).toContain("admin.rpc('replace_client_registry_instruction'");
  });

  it('keeps the profile tables server-side only', () => {
    expect(migration).toContain('revoke all on table public.client_registry_facts from anon, authenticated');
    expect(migration).toContain('revoke all on table public.client_registry_instructions from anon, authenticated');
    expect(migration).toContain('client_registry_period_summaries_browser_deny');
    expect(migration).toContain('grant execute on function public.replace_client_registry_fact');
  });

  it('preserves KIA precedence rules for registry memory', () => {
    expect(prompt).toContain('HECHOS ESTRUCTURALES');
    expect(prompt).toContain('INSTRUCCIONES OPERATIVAS DEL CLIENTE');
    expect(prompt).toContain('no sustituyen la normativa');
    expect(prompt).toContain('24 meses');
  });
});
