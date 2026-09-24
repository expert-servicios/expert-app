import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { digestWorkValue, workEventSchema } from '@/lib/ai/kia/work-contract';
import { verifyWorkEvidence } from '@/lib/ai/kia/work-evidence';
import type { WorkAdmin } from '@/lib/ai/kia/work-auth';
import { appendKiaSignature } from '@/lib/email/kia-signature';

const event = { schema_version: 1 as const, event_id: '00000000-0000-4000-8000-000000000001',
  task_id: '00000000-0000-4000-8000-000000000002', run_id: 'test', claim_version: 1,
  occurred_at: new Date().toISOString(), result: 'succeeded' as const };
function adminWith(row: unknown, bytes = 'document') {
  const query = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue({ data: row, error: null }) };
  const download = vi.fn().mockResolvedValue({ data: new Blob([bytes]), error: null });
  return { admin: { from: () => query, storage: { from: () => ({ download }) } } as unknown as WorkAdmin, download };
}
describe('Work evidence boundary', () => {
  it('serializes event retries and clears stale next_action after the final successful task', () => {
    const migration = readFileSync(
      resolve(process.cwd(), 'supabase/migrations/20260924093629_kia_work_case_orchestration.sql'),
      'utf8',
    );
    expect(migration).toContain("pg_advisory_xact_lock(hashtextextended(p_event->>'event_id', 0))");
    expect(migration).toContain("if p_event->>'result'='succeeded' then");
    expect(migration).not.toContain("p_event->>'result'='succeeded' and jsonb_array_length(next_tasks)>0");
    expect(migration).toContain("set next_action=next_tasks->0->>'title'");
  });

  it('requires evidence for success and reasons for incomplete work', () => {
    expect(workEventSchema.safeParse(event).success).toBe(false);
    expect(workEventSchema.safeParse({ ...event, result: 'blocked', reason: 'Esperando firma' }).success).toBe(true);
    expect(workEventSchema.safeParse({ ...event, result: 'blocked', reason: ' ' }).success).toBe(false);
    expect(workEventSchema.safeParse({ ...event, result: 'blocked', reason: 'Firma', approved: true }).success).toBe(false);
  });
  it('hashes semantically identical events identically, and detects changed content', () => {
    expect(digestWorkValue({ b: 2, a: { d: 4, c: 3 } })).toBe(digestWorkValue({ a: { c: 3, d: 4 }, b: 2 }));
    expect(digestWorkValue(event)).not.toBe(digestWorkValue({ ...event, task_id: 'different' }));
  });
  it('rejects an email sent for another task even in the same case', async () => {
    const { admin } = adminWith({ id: 1, status: 'sent', resend_id: 'provider', event_type: 'case.update', metadata: { case_id: 'case', task_id: 'other' } });
    await expect(verifyWorkEvidence(admin, 'case', 'client', { kind: 'email_sent', target: 'case.update', dependencies: [] },
      { ...event, evidence: { type: 'email', id: 1 } })).rejects.toThrow('email_not_verified');
  });
  it('accepts a provider-accepted message tied to the authorized task', async () => {
    const { admin } = adminWith({ id: 1, status: 'sent', resend_id: 'provider', event_type: 'case.update', metadata: { case_id: 'case', task_id: event.task_id } });
    await expect(verifyWorkEvidence(admin, 'case', 'client', { kind: 'email_sent', target: 'case.update', dependencies: [] },
      { ...event, evidence: { type: 'email', id: 1 } })).resolves.toMatchObject({ id: 1, provider_id: 'provider' });
  });
  it('does not download another client’s document', async () => {
    const { admin, download } = adminWith({ id: event.event_id, case_id: 'case', client_id: 'other', file_path: 'private', checklist_item_key: 'birth' });
    await expect(verifyWorkEvidence(admin, 'case', 'client', { kind: 'document_archived', target: 'birth', dependencies: [] },
      { ...event, evidence: { type: 'document', id: event.event_id, sha256: 'a'.repeat(64) } })).rejects.toThrow('document_not_verified');
    expect(download).not.toHaveBeenCalled();
  });
  it('rejects a hash that does not describe the stored file', async () => {
    const { admin } = adminWith({ id: event.event_id, case_id: 'case', client_id: 'client', file_path: 'private', checklist_item_key: 'birth' });
    await expect(verifyWorkEvidence(admin, 'case', 'client', { kind: 'document_archived', target: 'birth', dependencies: [] },
      { ...event, evidence: { type: 'document', id: event.event_id, sha256: 'a'.repeat(64) } })).rejects.toThrow('document_hash_mismatch');
  });
  it('cannot treat approval or an in-progress filing as completed', async () => {
    const { admin } = adminWith({ id: event.event_id, case_id: 'case', state: 'approved', row_version: 1 });
    await expect(verifyWorkEvidence(admin, 'case', 'client', { kind: 'administrative_action_completed', target: event.event_id, dependencies: [] },
      { ...event, evidence: { type: 'administrative_action', id: event.event_id } })).rejects.toThrow('administrative_action_not_verified');
  });
  it('does not add KIA identity to human messages and adds it only once to KIA mail', () => {
    expect(appendKiaSignature('Human')).toBe('Human');
    const html = appendKiaSignature('<body>Hello</body>', { kia_author: true, preferred_language: 'ru' });
    expect(html).toContain('ИИ-помощница');
    expect(html).toContain('info@expertconsulting.es');
    expect(appendKiaSignature(html, { kia_author: true })).toBe(html);
  });
});
