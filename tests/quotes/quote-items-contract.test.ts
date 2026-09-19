import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const migration = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/20260919080700_quote_items_contract.sql'),
  'utf8',
);

describe('quote_items contractual model', () => {
  it('is additive and does not backfill or rewrite historical quotes', () => {
    expect(migration).toContain('create table if not exists public.quote_items');
    expect(migration).toContain('quote_id uuid not null references public.quotes(id) on delete cascade');
    expect(migration).not.toMatch(/\binsert\s+into\s+public\.quote_items/i);
    expect(migration).not.toMatch(/\bupdate\s+public\.quotes/i);
    expect(migration).not.toMatch(/\balter\s+table\s+public\.quotes/i);
  });

  it('stores immutable pricing and quantity snapshots', () => {
    expect(migration).toContain('service_slug text not null');
    expect(migration).toContain('stripe_price_id text');
    expect(migration).toContain('quantity integer not null');
    expect(migration).toContain('unit_amount_cents bigint not null');
    expect(migration).toContain("tax_behavior text not null default 'exclusive'");
    expect(migration).toContain('quote_items_quantity_positive');
    expect(migration).toContain('quote_items_unit_amount_nonnegative');
    expect(migration).toContain('quote_items_quote_position_unique');
  });

  it('keeps writes server-side and reads scoped through the parent quote', () => {
    expect(migration).toContain('revoke all on table public.quote_items from public, anon, authenticated');
    expect(migration).toContain('grant select on table public.quote_items to authenticated');
    expect(migration).toContain('grant select, insert, update, delete on table public.quote_items to service_role');
    expect(migration).toContain('q.client_id = auth.uid()');
    expect(migration).toContain('q.tenant_id = public.auth_tenant_id()');
  });
});
