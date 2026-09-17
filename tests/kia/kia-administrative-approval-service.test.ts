import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  generateKiaAdministrativeApprovalToken,
  hashKiaAdministrativeApprovalToken,
} from '@/lib/ai/kia/kia-administrative-approval-service';

const migration = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/20260915174500_kia_administrative_approval_service.sql'),
  'utf8',
);
const service = readFileSync(
  resolve(process.cwd(), 'lib/ai/kia/kia-administrative-approval-service.ts'),
  'utf8',
);

describe('KIA KADM4 administrative approvals', () => {
  it('generates opaque tokens and hashes them as SHA-256 hex', () => {
    const token = generateKiaAdministrativeApprovalToken();
    expect(token.length).toBeGreaterThan(30);
    expect(hashKiaAdministrativeApprovalToken(token)).toMatch(/^[a-f0-9]{64}$/);
    expect(hashKiaAdministrativeApprovalToken(token)).not.toBe(token);
  });

  it('stores only token hashes and binds approvals to the current snapshot hash', () => {
    expect(migration).toContain('p_token_hash text');
    expect(migration).toContain('v_action.action_snapshot_hash');
    expect(migration).toContain('KIA_APPROVAL_SNAPSHOT_MISMATCH');
    expect(service).not.toContain('p_token: input.token');
  });

  it('binds approvals to the exact action row version and state to prevent replay', () => {
    expect(migration).toContain("'action_row_version', v_action.row_version");
    expect(migration).toContain("'action_state', v_action.state");
    expect(migration).toContain('KIA_APPROVAL_ACTION_VERSION_MISMATCH');
    expect(migration).toContain("(a.metadata ->> 'action_row_version') = v_current.row_version::text");
    expect(migration).toContain("(a.metadata ->> 'action_state') = v_current.state");
  });

  it('enforces expiry, expected approver, and one-time consumption', () => {
    expect(migration).toContain("v_approval.decision <> 'pending'");
    expect(migration).toContain('v_approval.consumed_at is not null');
    expect(migration).toContain('KIA_APPROVAL_ALREADY_USED');
    expect(migration).toContain('KIA_APPROVAL_EXPIRED');
    expect(migration).toContain('KIA_APPROVAL_WRONG_APPROVER');
    expect(migration).toContain("decision = 'approved'");
    expect(migration).toContain('consumed_at = now()');
  });

  it('requires consumed approval before resuming protected waiting states', () => {
    expect(migration).toContain("v_current.state in ('awaiting_user_auth','awaiting_final_approval')");
    expect(migration).toContain("a.decision = 'approved'");
    expect(migration).toContain('a.consumed_at is not null');
    expect(migration).toContain('a.action_snapshot_hash = v_current.action_snapshot_hash');
    expect(migration).toContain('KIA_ACTION_APPROVAL_REQUIRED');
  });

  it('keeps approval RPCs server-side only with fixed search_path', () => {
    expect(migration).toContain('security invoker');
    expect(migration).toContain('set search_path = public, pg_temp');
    expect(migration).toContain('from public, anon, authenticated');
    expect(migration).not.toMatch(/grant execute[^;]*to authenticated/i);
  });

  it('validates state before requesting or consuming protected approval types', () => {
    expect(service).toContain("approvalType === 'user_auth_resume' && action.state !== 'awaiting_user_auth'");
    expect(service).toContain("approvalType === 'final_approval' && action.state !== 'awaiting_final_approval'");
  });
});
