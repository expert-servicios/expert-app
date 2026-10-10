import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const sql = readFileSync('supabase/migrations/20261010102630_kia_public_web_sessions_messages.sql', 'utf8');

describe('KIA public web persistence schema security contract', () => {
  it('creates isolated session and turn tables, without direct browser access', () => {
    expect(sql).toContain('create table public.kia_public_web_sessions');
    expect(sql).toContain('create table public.kia_public_web_messages');
    expect(sql).toContain('token_hash text not null unique');
    expect(sql).toContain('alter table public.kia_public_web_sessions enable row level security');
    expect(sql).toContain('alter table public.kia_public_web_messages enable row level security');
    expect(sql).toContain('from public, anon, authenticated');
    expect(sql).toContain('to service_role');
    expect(sql).not.toMatch(/create policy/i);
  });

  it('preserves turn idempotency and ensures messages are removed with a session', () => {
    expect(sql).toContain('unique (session_id, client_message_id, role)');
    expect(sql).toContain('on delete cascade');
    expect(sql).toContain("role in ('user', 'assistant')");
    expect(sql).toContain('char_length(btrim(body)) between 1 and 4000');
  });

  it('restricts session expiration and requires explicit CRM linkage', () => {
    expect(sql).toContain("expires_at <= created_at + interval '8 days'");
    expect(sql).toContain('references public.leads(id) on delete set null');
    expect(sql).toContain('lead_id is not null');
    expect(sql).not.toMatch(/\bcreate trigger\b/i);
    expect(sql).not.toMatch(/\bcreate function\b/i);
  });
});
