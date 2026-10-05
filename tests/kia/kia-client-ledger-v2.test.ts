import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('KIA client registry v2 retention and client profile', () => {
  const migration = source('supabase/migrations/20261005105000_kia_client_registry_v2_retention_profile.sql');
  const profile = source('lib/ai/kia/kia-client-registry-profile.ts');
  const ledger = source('lib/ai/kia/kia-client-ledger.ts');
  const prompt = source('lib/ai/kia/kia-system-prompt.ts');
  const docs = source('docs/kia-client-ledger.md');

  it('uses a 24-month detailed window and six-year default trace retention', () => {
    expect(migration).toContain("occurred_at + interval '24 months'");
    expect(migration).toContain("occurred_at + interval '6 years'");
    expect(migration).toContain('detail_until');
    expect(migration).toContain('retain_until');
    expect(profile).toContain('CLIENT_REGISTRY_DETAIL_MONTHS = 24');
    expect(profile).toContain('CLIENT_REGISTRY_RETENTION_YEARS = 6');
    expect(ledger).toContain('clientRegistryDetailCutoff');
    expect(ledger).toContain('detail_until');
    expect(ledger).toContain('retain_until');
  });

  it('separates durable structural facts from client-specific operating instructions', () => {
    expect(migration).toContain('create table if not exists public.client_registry_facts');
    expect(migration).toContain('create table if not exists public.client_registry_instructions');
    expect(migration).toContain("verification_status in ('confirmed','needs_review')");
    expect(profile).toContain('recordConfirmedRegistryFact');
    expect(profile).toContain('recordConfirmedRegistryInstruction');
    expect(profile).toContain("verification_status', 'confirmed'");
    expect(profile).toContain("status', 'active'");
    expect(ledger).toContain('structuralFacts');
    expect(ledger).toContain('operationalInstructions');
  });

  it('versions facts/instructions rather than silently overwriting them', () => {
    expect(migration).toContain('superseded_by_fact_id');
    expect(migration).toContain('superseded_by_instruction_id');
    expect(profile).toContain("status: 'superseded'");
    expect(profile).toContain('superseded_by_fact_id');
    expect(profile).toContain('superseded_by_instruction_id');
  });

  it('keeps older history as compact yearly summaries rather than prompt-sized raw history', () => {
    expect(migration).toContain('client_registry_period_summaries');
    expect(profile).toContain('refreshClientRegistryHistoricalSummaries');
    expect(profile).toContain('buildYearSummary');
    expect(ledger).toContain('historicalSummaries');
    expect(docs).toContain('24 meses');
    expect(docs).toContain('6 años');
  });

  it('tells KIA how client-specific instructions rank against live/legal sources', () => {
    expect(prompt).toContain('HECHOS ESTRUCTURALES');
    expect(prompt).toContain('INSTRUCCIONES OPERATIVAS DEL CLIENTE');
    expect(prompt).toContain('24 meses');
    expect(prompt).toContain('no sustituyen la normativa');
  });

  it('keeps the new profile tables browser-denied and server-side only', () => {
    expect(migration).toContain('client_registry_facts_browser_deny');
    expect(migration).toContain('client_registry_instructions_browser_deny');
    expect(migration).toContain('client_registry_period_summaries_browser_deny');
    expect(migration).toContain('revoke all on table public.client_registry_facts from anon, authenticated');
    expect(migration).toContain('grant select, insert, update on table public.client_registry_facts to service_role');
  });
});
