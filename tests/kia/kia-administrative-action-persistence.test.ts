import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/20260915171500_kia_administrative_actions_core.sql'),
  'utf8',
);

describe('KIA administrative action persistence schema', () => {
  it('creates the three auditable KADM2 core tables', () => {
    expect(migration).toContain('create table if not exists public.administrative_actions');
    expect(migration).toContain('create table if not exists public.administrative_action_events');
    expect(migration).toContain('create table if not exists public.administrative_action_approvals');
  });

  it('keeps lifecycle states aligned with KADM1', () => {
    for (const state of [
      'draft','prepared','needs_review','approved','queued','claimed','running',
      'awaiting_user_auth','awaiting_final_approval','verifying','completed','blocked',
      'cancelled','failed_safe','expired','manual_takeover',
    ]) {
      expect(migration).toContain(`'${state}'`);
    }
  });

  it('stores only approval token hashes and binds approvals to snapshot hashes', () => {
    expect(migration).toContain('token_hash text not null');
    expect(migration).toContain('action_snapshot_hash text not null');
    expect(migration).not.toContain('token_plaintext');
    expect(migration).not.toContain('approval_token text');
  });

  it('keeps events append-only for service_role and blocks browser roles explicitly', () => {
    expect(migration).toContain('grant select, insert on table public.administrative_action_events to service_role');
    expect(migration).not.toContain('grant select, insert, update on table public.administrative_action_events to service_role');
    expect(migration).toContain('administrative_action_events_deny_browser');
    expect(migration).toContain('administrative_actions_deny_browser');
    expect(migration).toContain('administrative_action_approvals_deny_browser');
  });

  it('does not grant delete on any administrative core table', () => {
    expect(migration).not.toMatch(/grant[^;]*delete[^;]*administrative_/i);
  });
});
