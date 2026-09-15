import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { hashKiaAdministrativeActionSnapshot } from '@/lib/ai/kia/kia-administrative-action-service';

const migration = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/20260915173000_kia_administrative_action_service.sql'),
  'utf8',
);
const service = readFileSync(
  resolve(process.cwd(), 'lib/ai/kia/kia-administrative-action-service.ts'),
  'utf8',
);

describe('KIA KADM3 transactional action service', () => {
  it('hashes semantically identical object snapshots deterministically', () => {
    const a = hashKiaAdministrativeActionSnapshot({ b: 2, a: { z: true, y: [3, 2, 1] } });
    const b = hashKiaAdministrativeActionSnapshot({ a: { y: [3, 2, 1], z: true }, b: 2 });
    expect(a).toBe(b);
    expect(a).toMatch(/^[a-f0-9]{64}$/);
  });

  it('serializes idempotent creation per tenant/key and creates the initial event atomically', () => {
    expect(migration).toContain('pg_advisory_xact_lock');
    expect(migration).toContain('idempotency_key = p_idempotency_key');
    expect(migration).toContain("'action_created'");
    expect(migration).toContain('insert into public.administrative_action_events');
  });

  it('locks the current action and enforces optimistic row_version', () => {
    expect(migration).toContain('for update;');
    expect(migration).toContain('v_current.row_version <> p_expected_row_version');
    expect(migration).toContain("raise exception 'KIA_ACTION_VERSION_CONFLICT'");
    expect(migration).toContain('row_version = row_version + 1');
  });

  it('duplicates KADM1 transition enforcement in the database fail-closed', () => {
    expect(migration).toContain('kia_administrative_transition_allowed');
    expect(migration).not.toContain("when 'completed' then");
    expect(migration).not.toContain("when 'cancelled' then");
    expect(migration).not.toContain("when 'failed_safe' then");
    expect(migration).not.toContain("when 'expired' then");
    expect(migration).toContain('else false');
    expect(migration).toContain('KIA_ACTION_INVALID_TRANSITION');
  });

  it('uses security invoker, fixed search_path, and service-role-only RPC grants', () => {
    expect(migration).toContain('security invoker');
    expect(migration).toContain('set search_path = public, pg_temp');
    expect(migration).toContain('from public, anon, authenticated');
    expect(migration).toContain('to service_role');
    expect(migration).not.toMatch(/grant execute[^;]*to authenticated/i);
  });

  it('validates in TypeScript before transition and never accepts a caller-provided snapshot hash', () => {
    expect(service).toContain('assertKiaAdministrativeActionTransition(input.current.state, input.toState)');
    expect(service).toContain('const actionSnapshotHash = hashKiaAdministrativeActionSnapshot(input.actionSnapshot)');
    expect(service).not.toContain('actionSnapshotHash?:');
  });
});
