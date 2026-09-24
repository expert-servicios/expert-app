import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireWorkConnection, WorkError } from '@/lib/ai/kia/work-auth';
import { workErrorResponse, workRpcError } from '@/lib/ai/kia/work-http';
import { digestWorkValue, workEventSchema } from '@/lib/ai/kia/work-contract';
import { processWorkInbox } from '@/lib/ai/kia/work-inbox';

export async function GET(request: NextRequest) {
  try {
    const { admin, connection, caseRow } = await requireWorkConnection(request);
    const { data, error } = await admin.from('internal_tasks')
      .select('id,title,description,status,updated_at').eq('case_id', caseRow.id).eq('client_id', caseRow.client_id)
      .in('id', Object.keys(connection.task_policies));
    if (error) throw new WorkError('tasks_unavailable', 503);
    return NextResponse.json({ case: caseRow, tasks: data?.map(t => ({ ...t, policy: connection.task_policies[t.id] })),
      boundaries: { browser: 'chrome', human_control: ['certificate', 'signature', 'payment', 'final_submission'] } },
    { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return workErrorResponse(error); }
}

export async function POST(request: NextRequest) {
  try {
    const { admin, connection } = await requireWorkConnection(request);
    const body = await request.json().catch(() => null);
    const parsed = z.object({ task_id: z.uuid(), run_id: z.string().min(1).max(100) }).strict().safeParse(body);
    if (!parsed.success) throw new WorkError('invalid_claim', 400);
    const { data, error } = await admin.rpc('kia_work_claim', {
      p_connection: connection.id, p_task: parsed.data.task_id, p_run: parsed.data.run_id,
    });
    if (error) throw workRpcError(error);
    return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return workErrorResponse(error); }
}

export async function PATCH(request: NextRequest) {
  try {
    const { admin, connection } = await requireWorkConnection(request);
    const parsed = workEventSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) throw new WorkError('invalid_event', 400);
    const event = parsed.data;
    const hash = digestWorkValue(event);
    const { data: prior, error: priorError } = await admin.from('kia_work_events')
      .select('connection_id,payload_hash,result').eq('event_id', event.event_id).maybeSingle();
    if (priorError) throw new WorkError('ledger_unavailable', 503);
    if (prior) {
      if (prior.connection_id !== connection.id || prior.payload_hash !== hash) throw new WorkError('event_conflict');
      return NextResponse.json(prior.result, { headers: { 'Cache-Control': 'no-store' } });
    }
    const { error } = await admin.rpc('kia_work_receive', {
      p_connection: connection.id, p_event: event, p_hash: hash,
    });
    if (error) throw workRpcError(error);
    await processWorkInbox(admin, event.event_id);
    const receipt = await admin.from('kia_work_inbox').select('state,result,last_error').eq('event_id', event.event_id)
      .eq('connection_id', connection.id).single();
    if (receipt.error) throw new WorkError('inbox_unavailable', 503);
    return NextResponse.json(receipt.data.state === 'applied' ? receipt.data.result : {
      event_id: event.event_id, state: receipt.data.state, error: receipt.data.last_error,
    }, { status: receipt.data.state === 'applied' ? 200 : receipt.data.state === 'review' ? 409 : 202,
      headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return workErrorResponse(error); }
}
