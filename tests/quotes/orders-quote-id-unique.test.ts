import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const migration = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/20260919090632_orders_quote_id_unique.sql'),
  'utf8',
);

describe('orders quote id uniqueness', () => {
  it('enforces one quote-origin order per quote without affecting other order sources', () => {
    expect(migration).toContain('create unique index if not exists orders_quote_id_unique_idx');
    expect(migration).toContain('on public.orders (quote_id)');
    expect(migration).toContain("where source = 'quote' and quote_id is not null");
  });
});
