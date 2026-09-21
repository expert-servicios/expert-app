import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  'supabase/migrations/20260921171500_index_high_value_foreign_keys.sql',
  'utf8',
);

describe('high-value foreign key indexes', () => {
  it('indexes only the two audited FK columns', () => {
    expect(migration).toContain(
      'create index if not exists leads_owner_id_idx\n  on public.leads (owner_id);',
    );
    expect(migration).toContain(
      'create index if not exists whatsapp_conversations_client_id_idx\n  on public.whatsapp_conversations (client_id);',
    );
  });

  it('does not modify data or add unrelated indexes', () => {
    expect(migration).not.toMatch(/\b(insert|update|delete|truncate)\b/i);
    expect((migration.match(/create index if not exists/g) ?? []).length).toBe(2);
  });
});
