import { randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { hashWorkToken, requireWorkProfessional, WorkError, workEnabled } from '@/lib/ai/kia/work-auth';
import { workTaskPolicySchema } from '@/lib/ai/kia/work-contract';
import { workErrorResponse } from '@/lib/ai/kia/work-http';

const grantSchema = z.object({
  case_id: z.uuid(),
  tasks: z.array(z.object({ id: z.uuid(), policy: workTaskPolicySchema }).strict()).min(1).max(50),
  ttl_hours: z.number().int().min(1).max(24).default(8),
}).strict();

export async function GET(request: NextRequest) {
  try {
    const caseId = z.uuid().safeParse(request.nextUrl.searchParams.get('case_id'));
    if (!caseId.success) throw new WorkError('invalid_case', 400);
    const { admin } = await requireWorkProfessional(request, caseId.data);
    const [inbox, tasks] = await Promise.all([
      admin.from('kia_work_inbox').select('event_id,state,received_at,last_error,payload,result,kia_work_connections!inner(case_id)')
        .eq('kia_work_connections.case_id', caseId.data).order('received_at', { ascending: false }).limit(50),
      admin.from('internal_tasks').select('id,title').eq('case_id', caseId.data),
    ]);
    if (inbox.error || tasks.error) throw new WorkError('inbox_unavailable', 503);
    const titles = new Map((tasks.data ?? []).map(task => [task.id, task.title]));
    return NextResponse.json({ results: (inbox.data ?? []).map(row => ({
      id: row.event_id, state: row.state, received_at: row.received_at,
      title: titles.get(row.payload?.task_id) ?? 'Tarea del expediente',
      outcome: row.result?.result ?? null,
      reason: row.payload?.result === 'succeeded' ? null : row.payload?.reason ?? null,
      requires_review: row.state === 'review',
    })) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return workErrorResponse(error); }
}

export async function POST(request: NextRequest) {
  try {
    if (!workEnabled()) throw new WorkError('connector_disabled', 503);
    const parsed = grantSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) throw new WorkError('invalid_grant', 400);
    const input = parsed.data;
    const { admin, actorId, caseRow } = await requireWorkProfessional(request, input.case_id);
    const ids = input.tasks.map(t => t.id);
    if (new Set(ids).size !== ids.length) throw new WorkError('duplicate_task', 400);
    const dependencies = [...new Set(input.tasks.flatMap(t => t.policy.dependencies))];
    const { data: tasks, error } = await admin.from('internal_tasks').select('id,case_id,client_id,status')
      .in('id', [...new Set([...ids, ...dependencies])]);
    if (error) throw new WorkError('tasks_unavailable', 503);
    for (const id of [...ids, ...dependencies]) {
      const task = tasks?.find(t => t.id === id);
      if (!task || task.case_id !== caseRow.id || task.client_id !== caseRow.client_id) throw new WorkError('task_scope_mismatch', 403);
    }
    // Reject cycles before a connection can strand its own workflow.
    const policies = Object.fromEntries(input.tasks.map(t => [t.id, t.policy]));
    const visiting = new Set<string>(); const visited = new Set<string>();
    const visit = (id: string) => {
      if (visiting.has(id)) throw new WorkError('dependency_cycle', 400);
      if (visited.has(id)) return;
      visiting.add(id); policies[id]?.dependencies.forEach(visit); visiting.delete(id); visited.add(id);
    };
    ids.forEach(visit);
    const token = `kw_${randomBytes(32).toString('base64url')}`;
    const expiresAt = new Date(Date.now() + input.ttl_hours * 3600_000).toISOString();
    const { data, error: insertError } = await admin.from('kia_work_connections').insert({
      case_id: caseRow.id, client_id: caseRow.client_id, company_id: caseRow.company_id,
      tenant_id: caseRow.tenant_id, created_by: actorId, token_hash: hashWorkToken(token),
      task_policies: policies, expires_at: expiresAt,
    }).select('id').single();
    if (insertError || !data) throw new WorkError('grant_failed', 503);
    return NextResponse.json({ id: data.id, token, expires_at: expiresAt }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return workErrorResponse(error); }
}

export async function DELETE(request: NextRequest) {
  try {
    const parsed = z.object({ case_id: z.uuid(), connection_id: z.uuid() }).strict().safeParse(await request.json().catch(() => null));
    if (!parsed.success) throw new WorkError('invalid_request', 400);
    const { admin } = await requireWorkProfessional(request, parsed.data.case_id);
    const { data, error } = await admin.from('kia_work_connections').update({ revoked_at: new Date().toISOString() })
      .eq('id', parsed.data.connection_id).eq('case_id', parsed.data.case_id).select('id').maybeSingle();
    if (error) throw new WorkError('revoke_failed', 503);
    if (!data) throw new WorkError('not_found', 404);
    return NextResponse.json({ revoked: true });
  } catch (error) { return workErrorResponse(error); }
}
