import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
const proposal=readFileSync('docs/kia-web-persistence-proposed-schema-2026-10-10.md','utf8');
describe('KIA web persistence architecture guardrails',()=>{
  it('keeps browser sessions separate from clients and retains no cookie secret',()=>{
    expect(proposal).toContain('token_hash text not null unique');
    expect(proposal).toContain('lead_id uuid null');
    expect(proposal).toContain('does **not** equal a personal identity');
    expect(proposal).not.toContain('grant select on public.kia_public_web_sessions to anon');
  });
  it('requires RLS, limited roles and idempotency',()=>{
    expect(proposal).toContain('alter table public.kia_public_web_sessions enable row level security;');
    expect(proposal).toContain('alter table public.kia_public_web_messages enable row level security;');
    expect(proposal).toContain('revoke all on public.kia_public_web_sessions from anon, authenticated, public;');
    expect(proposal).toContain('revoke all on public.kia_public_web_messages from anon, authenticated, public;');
    expect(proposal).toContain('unique (session_id, client_message_id, role)');
  });
});
