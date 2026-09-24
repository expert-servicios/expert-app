import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WorkError, type WorkAdmin } from '@/lib/ai/kia/work-auth';
import { processWorkInbox } from '@/lib/ai/kia/work-inbox';
import { verifyWorkEvidence } from '@/lib/ai/kia/work-evidence';
vi.mock('@/lib/ai/kia/work-evidence', () => ({ verifyWorkEvidence: vi.fn() }));
const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
function fixture(options: { revoked?: boolean; prior?: boolean; attempts?: number; completeError?: string } = {}) {
  const updates: Array<Record<string, unknown>> = [];
  const event = { schema_version: 1, event_id: id(1), task_id: id(2), run_id: 'run', claim_version: 1,
    occurred_at: new Date().toISOString(), result: 'succeeded', evidence: { type: 'email', id: 1 } };
  const rows: Record<string, unknown> = {
    profiles: { id: id(3), role: 'owner', status: 'active', tenant_id: null },
    cases: { id: id(4), client_id: id(5), company_id: null, tenant_id: null },
    kia_work_connections: { id: id(6), created_by: id(3), case_id: id(4), client_id: id(5), company_id: null,
      tenant_id: null, expires_at: new Date(Date.now()+60000).toISOString(), revoked_at: options.revoked ? 'now' : null,
      task_policies: { [id(2)]: { kind: 'email_sent', target: 'case.update', dependencies: [] } } },
    kia_work_events: options.prior ? { connection_id: id(6), payload_hash: 'hash', result: { result: 'succeeded' } } : null,
  };
  const rpc = vi.fn(async (name: string) => name === 'kia_work_take_results'
    ? { data: [{ event_id: id(1), connection_id: id(6), payload: event, payload_hash: 'hash', attempts: options.attempts ?? 1 }], error: null }
    : { data: { result: 'succeeded' }, error: options.completeError ? { message: options.completeError } : null });
  const admin = { rpc, from: (table: string) => {
    const query = { select() { return this; }, eq() { return this; },
      update(value: Record<string, unknown>) { updates.push(value); return this; },
      maybeSingle: async () => ({ data: rows[table], error: null }),
      single: async () => ({ data: rows[table], error: null }),
      then(resolve: (v: unknown) => unknown) { return Promise.resolve({ error: null }).then(resolve); } };
    return query;
  } } as unknown as WorkAdmin;
  return { admin, rpc, updates };
}
beforeEach(() => { vi.mocked(verifyWorkEvidence).mockReset().mockResolvedValue({}); });
describe('Durable Work result verification', () => {
  it('applies a verified result and records the outcome', async () => {
    const { admin, updates } = fixture();
    expect(await processWorkInbox(admin)).toEqual({ applied: 1, review: 0, retry: 0 });
    expect(updates[0]).toMatchObject({ state: 'applied', result: { result: 'succeeded' } });
  });
  it('recovers completion committed before the inbox acknowledgement was saved', async () => {
    const { admin, rpc } = fixture({ prior: true });
    expect((await processWorkInbox(admin)).applied).toBe(1);
    expect(verifyWorkEvidence).not.toHaveBeenCalled();
    expect(rpc).toHaveBeenCalledTimes(1);
  });
  it('retries transient verification failures without completing the task', async () => {
    const { admin, updates, rpc } = fixture();
    vi.mocked(verifyWorkEvidence).mockRejectedValue(new WorkError('document_unavailable', 503));
    expect((await processWorkInbox(admin)).retry).toBe(1);
    expect(updates[0]).toMatchObject({ state: 'pending', last_error: 'document_unavailable' });
    expect(rpc).toHaveBeenCalledTimes(1);
  });
  it('bounds retries and sends unresolved evidence to review', async () => {
    const { admin, updates } = fixture({ attempts: 5 });
    vi.mocked(verifyWorkEvidence).mockRejectedValue(new WorkError('document_unavailable', 503));
    expect((await processWorkInbox(admin)).review).toBe(1);
    expect(updates[0].state).toBe('review');
  });
  it('does not read evidence after revocation', async () => {
    const { admin, updates } = fixture({ revoked: true });
    expect((await processWorkInbox(admin)).review).toBe(1);
    expect(verifyWorkEvidence).not.toHaveBeenCalled();
    expect(updates[0].last_error).toBe('connection_expired');
  });
  it('does not override stale claims after a human edit', async () => {
    const { admin, updates } = fixture({ completeError: 'work_stale_claim' });
    expect((await processWorkInbox(admin)).review).toBe(1);
    expect(updates[0].last_error).toBe('work_stale_claim');
  });
});
