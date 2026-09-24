import { createHash } from 'node:crypto';
import { z } from 'zod';

export const workEvidenceSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('document'), id: z.uuid(), sha256: z.string().regex(/^[a-f0-9]{64}$/) }).strict(),
  z.object({ type: z.literal('email'), id: z.number().int().positive() }).strict(),
  z.object({ type: z.literal('administrative_action'), id: z.uuid() }).strict(),
]);
export const workTaskPolicySchema = z.object({
  kind: z.enum(['document_archived', 'email_sent', 'administrative_action_completed']),
  target: z.string().min(1).max(160),
  dependencies: z.array(z.uuid()).max(30).default([]),
}).strict();
export const workEventSchema = z.object({
  schema_version: z.literal(1),
  event_id: z.uuid(),
  task_id: z.uuid(),
  run_id: z.string().min(1).max(100),
  claim_version: z.number().int().positive(),
  occurred_at: z.iso.datetime({ offset: true }),
  result: z.enum(['succeeded', 'blocked', 'failed', 'cancelled']),
  evidence: workEvidenceSchema.optional(),
  reason: z.string().max(1000).optional(),
}).strict().superRefine((event, ctx) => {
  if (event.result === 'succeeded' && !event.evidence) ctx.addIssue({ code: 'custom', message: 'evidence_required' });
  if (event.result !== 'succeeded' && !event.reason?.trim()) ctx.addIssue({ code: 'custom', message: 'reason_required' });
});
export type WorkEvent = z.infer<typeof workEventSchema>;
export type WorkTaskPolicy = z.infer<typeof workTaskPolicySchema>;

export function digestWorkValue(value: unknown): string {
  function stable(v: unknown): string {
    if (v === null || typeof v !== 'object') return JSON.stringify(v);
    if (Array.isArray(v)) return `[${v.map(stable).join(',')}]`;
    return `{${Object.entries(v as Record<string, unknown>).filter(([, x]) => x !== undefined)
      .sort(([a], [b]) => a.localeCompare(b)).map(([k, x]) => `${JSON.stringify(k)}:${stable(x)}`).join(',')}}`;
  }
  return createHash('sha256').update(stable(value)).digest('hex');
}

export function evidenceMatchesPolicy(policy: WorkTaskPolicy, event: WorkEvent): boolean {
  if (event.result !== 'succeeded') return true;
  const type = { document_archived: 'document', email_sent: 'email', administrative_action_completed: 'administrative_action' }[policy.kind];
  return event.evidence?.type === type;
}
