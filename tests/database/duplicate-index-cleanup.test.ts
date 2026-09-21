import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  'supabase/migrations/20260921163000_cleanup_duplicate_indexes.sql',
  'utf8',
);

describe('duplicate index cleanup migration', () => {
  it('drops only the audited redundant index copies', () => {
    const dropped = [
      'idx_cases_due_date',
      'idx_cases_status',
      'idx_auditor_reviews_created',
      'idx_auditor_rule_results_review',
      'leads_phone_unique_idx',
      'idx_whatsapp_conv_needs_review',
    ];

    for (const name of dropped) {
      expect(migration).toContain(`drop index if exists public.${name};`);
    }
  });

  it('preserves the surviving audited indexes', () => {
    const survivors = [
      'cases_due_date_idx',
      'cases_status_idx',
      'kia_auditor_reviews_created_at_idx',
      'kia_auditor_rule_results_review_idx',
      'leads_phone_unique',
      'idx_wa_conv_needs_rev',
    ];

    for (const name of survivors) {
      expect(migration).not.toContain(`drop index if exists public.${name};`);
    }
  });
});
