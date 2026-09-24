import { randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { hashWorkToken, requireWorkProfessional, WorkError, workEnabled } from '@/lib/ai/kia/work-auth';
import { workTaskPolicySchema } from '@/lib/ai/kia/work-contract';
import { workErrorResponse } from '@/lib/ai/kia/work-http';
import { processWorkInbox } from '@/lib/ai/kia/work-inbox';

const grantSchema = z.object({
  case_id: z.uuid(),
  tasks: z.array(z.object({ id: z.uuid(), policy: workTaskPolicySchema }).strict()).min(1).max(50),
  ttl_hours: z.number().int().min(1).max(24).default(8),
}).strict();

const reconcileSchema = z.object({
  case_id: z.uuid(),
  event_id: z.uuid(),
  action: z.literal('retry_verification'),
}).strict();

function taskKey(task: { metadata?: unknown }) {
  const metadata = task.metadata && typeof task.metadata === 'object' ? task.metadata as Record<string, unknown> : {};
  return typeof metadata.task_key === 'string' ? metadata.task_key : null;
}

function dependencyKeys(task: { metadata?: unknown }) {
  const metadata = task.metadata && typeof task.metadata === 'object' ? task.metadata as Record<string, unknown> : {};
  return Array.isArray(metadata.depends_on) ? metadata.depends_on.filter((item): item is string => typeof item === 'string') : [];
}

export async function GET(request: NextRequest) {
  try {
    const caseId = z.uuid().safeParse(request.nextUrl.searchParams.get('case_id'));
    if (!caseId.success) throw new WorkError('invalid_case', 400);
    const { admin, caseRow } = await requireWorkProfessional(request, caseId.data);
    const [inbox, tasks, connections, documents, actions, emailEvents] = await Promise.all([
      admin.from('kia_work_inbox').select('event_id,state,received_at,last_error,payload,result,kia_work_connections!inner(case_id)')
        .eq('kia_work_connections.case_id', caseId.data).order('received_at', { ascending: false }).limit(50),
      admin.from('internal_tasks').select('id,title,description,status,metadata,created_at').eq('case_id', caseId.data)
        .order('created_at', { ascending: true }),
      admin.from('kia_work_connections').select('id,expires_at,revoked_at,created_at,task_policies')
        .eq('case_id', caseId.data).order('created_at', { ascending: false }).limit(20),
      admin.from('documents').select('checklist_item_key,checklist_item_label')
        .eq('case_id', caseId.data).eq('client_id', caseRow.client_id).is('replaced_by', null).neq('state', 'rechazado'),
      admin.from('administrative_actions').select('id,capability,action_type,state,requires_user_auth,requires_final_approval')
        .eq('case_id', caseId.data).order('created_at', { ascending: false }).limit(50),
      admin.from('email_events').select('event_type,subject,status,created_at').eq('metadata->>case_id', caseId.data)
        .order('created_at', { ascending: false }).limit(50),
    ]);
    if (inbox.error || tasks.error || connections.error || documents.error || actions.error || emailEvents.error) {
      throw new WorkError('inbox_unavailable', 503);
    }

    const allTasks = tasks.data ?? [];
    const titles = new Map<string, string>();
    const byKey = new Map<string, (typeof allTasks)[number]>();
    for (const task of allTasks) {
      titles.set(task.id, task.title);
      const key = taskKey(task);
      if (key) byKey.set(key, task);
    }
    const taskOptions = allTasks.map(task => {
      const depKeys = dependencyKeys(task);
      const dependencies = depKeys.flatMap(key => {
        const dependency = byKey.get(key);
        return dependency ? [dependency] : [];
      });
      const unresolvedDependency = depKeys.some(key => !byKey.has(key));
      const blockedBy = dependencies.filter(dep => dep.status !== 'completada').map(dep => dep.title);
      const explicitWorkflow = dependencyKeys(task).length > 0 || Boolean(taskKey(task));
      const currentStep = task.status === 'en_progreso' || task.title === caseRow.next_action;
      return {
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        task_key: taskKey(task),
        dependencies: dependencies.map(dep => ({ id: dep.id, title: dep.title, status: dep.status })),
        delegatable: ['pendiente', 'en_progreso'].includes(task.status) && !unresolvedDependency && blockedBy.length === 0
          && (explicitWorkflow || currentStep),
        blocked_by: blockedBy,
        blocked_reason: unresolvedDependency ? 'Hay dependencias del workflow que no se pueden resolver.' : null,
      };
    });

    const documentTargets = new Map<string, string>();
    for (const doc of documents.data ?? []) {
      if (doc.checklist_item_key) documentTargets.set(doc.checklist_item_key, doc.checklist_item_label ?? doc.checklist_item_key);
    }
    const emailTargets = [...new Map((emailEvents.data ?? []).map(row => [row.event_type, row.subject || row.event_type])).entries()]
      .map(([value, label]) => ({ value, label }));
    const actionTargets = (actions.data ?? []).map(action => ({
      value: action.id,
      label: `${action.action_type} · ${action.capability}`,
      state: action.state,
      human_gate: Boolean(action.requires_user_auth || action.requires_final_approval),
    }));

    return NextResponse.json({
      results: (inbox.data ?? []).map(row => ({
        id: row.event_id, state: row.state, received_at: row.received_at,
        title: titles.get(row.payload?.task_id) ?? 'Tarea del expediente',
        outcome: row.result?.result ?? null,
        reason: row.payload?.result === 'succeeded' ? null : row.payload?.reason ?? null,
        error_code: row.last_error ?? null,
        requires_review: row.state === 'review',
      })),
      tasks: taskOptions,
      connections: (connections.data ?? []).map(connection => ({
        id: connection.id,
        expires_at: connection.expires_at,
        revoked_at: connection.revoked_at,
        created_at: connection.created_at,
        task_ids: Object.keys(connection.task_policies ?? {}),
        active: !connection.revoked_at && Date.parse(connection.expires_at) > Date.now(),
      })),
      evidence: {
        documents: [...documentTargets.entries()].map(([value, label]) => ({ value, label })),
        emails: emailTargets,
        administrative_actions: actionTargets,
      },
    }, { headers: { 'Cache-Control': 'no-store' } });
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

    const { data: caseTasks, error } = await admin.from('internal_tasks').select('id,case_id,client_id,status,title,metadata')
      .eq('case_id', caseRow.id).eq('client_id', caseRow.client_id);
    if (error) throw new WorkError('tasks_unavailable', 503);
    const scopedTasks = caseTasks ?? [];
    const byId = new Map<string, (typeof scopedTasks)[number]>();
    const byTaskKey = new Map<string, (typeof scopedTasks)[number]>();
    for (const task of scopedTasks) {
      byId.set(task.id, task);
      const key = taskKey(task);
      if (key) byTaskKey.set(key, task);
    }

    const [documentEvidence, actionEvidence, emailEvidence] = await Promise.all([
      admin.from('documents').select('checklist_item_key')
        .eq('case_id', caseRow.id).eq('client_id', caseRow.client_id).is('replaced_by', null).neq('state', 'rechazado'),
      admin.from('administrative_actions').select('id').eq('case_id', caseRow.id),
      admin.from('email_events').select('event_type').eq('metadata->>case_id', caseRow.id),
    ]);
    if (documentEvidence.error || actionEvidence.error || emailEvidence.error) throw new WorkError('evidence_unavailable', 503);
    const documentTargets = new Set(documentEvidence.data?.map(row => row.checklist_item_key).filter(Boolean) ?? []);
    const actionTargets = new Set(actionEvidence.data?.map(row => row.id) ?? []);
    const emailTargets = new Set(emailEvidence.data?.map(row => row.event_type) ?? []);

    const policies: Record<string, unknown> = {};
    for (const requested of input.tasks) {
      const task = byId.get(requested.id);
      if (!task || !['pendiente', 'en_progreso'].includes(task.status)) throw new WorkError('work_task_not_available', 409);
      const depKeys = dependencyKeys(task);
      const explicitWorkflow = depKeys.length > 0 || Boolean(taskKey(task));
      const currentStep = task.status === 'en_progreso' || task.title === caseRow.next_action;
      if (!explicitWorkflow && !currentStep) throw new WorkError('work_task_not_delegatable', 409);
      const dependencies = depKeys.map(key => {
        const dependency = byTaskKey.get(key);
        if (!dependency) throw new WorkError('dependency_unresolved', 409);
        return dependency;
      });
      if (dependencies.some(dep => dep.status !== 'completada')) throw new WorkError('work_dependencies_pending', 409);

      const policy = requested.policy;
      if (policy.kind === 'document_archived' && !documentTargets.has(policy.target)) throw new WorkError('invalid_evidence_target', 400);
      if (policy.kind === 'administrative_action_completed' && !actionTargets.has(policy.target)) throw new WorkError('invalid_evidence_target', 400);
      if (policy.kind === 'email_sent' && !emailTargets.has(policy.target)) throw new WorkError('invalid_evidence_target', 400);
      policies[task.id] = { ...policy, dependencies: dependencies.map(dep => dep.id) };
    }

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

export async function PATCH(request: NextRequest) {
  try {
    if (!workEnabled()) throw new WorkError('connector_disabled', 503);
    const parsed = reconcileSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) throw new WorkError('invalid_request', 400);
    const { admin } = await requireWorkProfessional(request, parsed.data.case_id);
    const { data: row, error } = await admin.from('kia_work_inbox').select('event_id,state,connection_id')
      .eq('event_id', parsed.data.event_id).maybeSingle();
    if (error) throw new WorkError('inbox_unavailable', 503);
    if (!row || row.state !== 'review') throw new WorkError('review_not_available', 409);
    const { data: connection, error: connectionError } = await admin.from('kia_work_connections').select('case_id')
      .eq('id', row.connection_id).maybeSingle();
    if (connectionError) throw new WorkError('authorization_unavailable', 503);
    if (!connection || connection.case_id !== parsed.data.case_id) throw new WorkError('not_found', 404);

    const reset = await admin.from('kia_work_inbox').update({
      state: 'pending', attempts: 0, available_at: new Date().toISOString(), locked_until: null, last_error: null, result: null,
    }).eq('event_id', row.event_id).eq('state', 'review');
    if (reset.error) throw new WorkError('inbox_audit_unavailable', 503);
    await processWorkInbox(admin, row.event_id);
    const { data: refreshed, error: refreshedError } = await admin.from('kia_work_inbox')
      .select('state,last_error,result').eq('event_id', row.event_id).single();
    if (refreshedError) throw new WorkError('inbox_unavailable', 503);
    return NextResponse.json(refreshed, { headers: { 'Cache-Control': 'no-store' } });
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
