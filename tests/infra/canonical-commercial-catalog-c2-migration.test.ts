import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const migrationPath = resolve(
  process.cwd(),
  'supabase',
  'migrations',
  '20260918175830_canonical_commercial_catalog_c2.sql',
);

const sql = readFileSync(migrationPath, 'utf8').toLowerCase();

const canonicalTables = [
  'catalog_services',
  'service_contents',
  'commercial_offers',
  'service_aliases',
  'service_channel_configs',
  'stripe_price_bindings',
  'meta_catalog_items',
  'meta_catalog_sets',
  'meta_sync_jobs',
  'meta_api_logs',
];

describe('canonical commercial catalog C2 migration contract', () => {
  it('creates every canonical table and keeps C2 structure-only', () => {
    for (const table of canonicalTables) {
      expect(sql).toContain(`create table public.${table}`);
    }

    expect(sql).not.toMatch(/\binsert\s+into\b/);
    expect(sql).not.toMatch(/\bupdate\s+public\./);
    expect(sql).not.toMatch(/\bdelete\s+from\b/);
  });

  it('does not alter, rename, drop, truncate, or write the legacy services table', () => {
    expect(sql).not.toMatch(/alter\s+table\s+public\.services\b/);
    expect(sql).not.toMatch(/drop\s+table\s+(if\s+exists\s+)?public\.services\b/);
    expect(sql).not.toMatch(/truncate\s+(table\s+)?public\.services\b/);
    expect(sql).not.toMatch(/insert\s+into\s+public\.services\b/);
    expect(sql).not.toMatch(/update\s+public\.services\b/);
    expect(sql).not.toMatch(/delete\s+from\s+public\.services\b/);
    expect(sql).not.toMatch(/rename\s+to\s+services\b/);
  });

  it('keeps every C2 table server-only during shadow mode', () => {
    for (const table of canonicalTables) {
      expect(sql).toContain(`alter table public.${table} enable row level security`);
      expect(sql).toContain(`public.${table}`);
    }

    expect(sql).toContain('from public, anon, authenticated');
    expect(sql).toContain('to service_role');
    expect(sql).not.toMatch(/create\s+policy[\s\S]*?\bto\s+(anon|authenticated)\b/);
  });

  it('keeps economic truth separated from Stripe and Meta projections', () => {
    expect(sql).toContain('create table public.commercial_offers');
    expect(sql).toContain('create table public.stripe_price_bindings');
    expect(sql).toContain('create table public.meta_catalog_items');
    expect(sql).toContain("currency text not null default 'eur'");
    expect(sql).toContain('amount_cents bigint');

    const catalogServiceBlock = sql.split('create table public.catalog_services')[1]?.split(');')[0] ?? '';
    expect(catalogServiceBlock).not.toContain('stripe_price_id');
    expect(catalogServiceBlock).not.toContain('amount_cents');
  });

  it('blocks economic overrides in per-channel editorial config', () => {
    for (const key of [
      'price',
      'amount',
      'amount_cents',
      'currency',
      'vat_treatment',
      'price_mode',
      'billing_mode',
    ]) {
      expect(sql).toContain(`'${key}'`);
    }
  });

  it('does not store obvious Meta or Stripe secrets', () => {
    expect(sql).not.toMatch(/access_token\s+text/);
    expect(sql).not.toMatch(/app_secret\s+text/);
    expect(sql).not.toMatch(/authorization_header\s+text/);
    expect(sql).not.toMatch(/stripe_secret\s+text/);
  });
});
