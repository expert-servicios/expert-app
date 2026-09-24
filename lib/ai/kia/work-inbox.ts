import { authorizeWorkCase, WorkError, type WorkAdmin } from './work-auth';
import { workEventSchema, workTaskPolicySchema } from './work-contract';
import { verifyWorkEvidence } from './work-evidence';
import { workRpcError } from './work-http';

export async function processWorkInbox(admin: WorkAdmin, eventId?: string) {
  const { data: rows, error } = await admin.rpc('kia_work_take_results', { p_limit: eventId ? 1 : 10, p_event: eventId ?? null });
  if (error) throw new WorkError('inbox_unavailable', 503);
  let applied = 0; let review = 0; let retry = 0;
  const deadline = Date.now() + 45_000;
  for (const row of rows ?? []) {
    if (Date.now() >= deadline) break; // Unprocessed leases become available again after two minutes.
    let update: Record<string, unknown>;
    try {
      const { data: connection, error: scopeError } = await admin.from('kia_work_connections').select('*').eq('id', row.connection_id).single();
      if (scopeError) throw new WorkError('authorization_unavailable', 503);
      if (!connection || connection.revoked_at || Date.parse(connection.expires_at) <= Date.now()) throw new WorkError('connection_expired');
      const { caseRow } = await authorizeWorkCase(admin, connection.created_by, connection.case_id);
      if (caseRow.client_id !== connection.client_id || caseRow.company_id !== connection.company_id || caseRow.tenant_id !== connection.tenant_id) throw new WorkError('scope_changed');
      const { data: prior, error: ledgerError } = await admin.from('kia_work_events').select('connection_id,payload_hash,result').eq('event_id', row.event_id).maybeSingle();
      if (ledgerError) throw new WorkError('ledger_unavailable', 503);
      let result;
      if (prior) {
        if (prior.connection_id !== row.connection_id || prior.payload_hash !== row.payload_hash) throw new WorkError('event_conflict');
        result = prior.result;
      } else {
        const event = workEventSchema.parse(row.payload);
        const policy = workTaskPolicySchema.parse(connection.task_policies[event.task_id]);
        const witness = await verifyWorkEvidence(admin, connection.case_id, connection.client_id, policy, event);
        const completed = await admin.rpc('kia_work_complete', { p_connection: connection.id, p_event: event, p_hash: row.payload_hash, p_witness: witness });
        if (completed.error) throw workRpcError(completed.error);
        result = completed.data;
      }
      update = { state: 'applied', result, last_error: null, locked_until: null };
      applied++;
    } catch (error) {
      const transient = error instanceof WorkError && error.status === 503 && row.attempts < 5;
      update = { state: transient ? 'pending' : 'review', locked_until: null,
        available_at: new Date(Date.now() + Math.min(2 ** row.attempts, 8) * 30_000).toISOString(),
        last_error: error instanceof WorkError ? error.code : 'verification_failed' };
      if (transient) retry++; else review++;
    }
    // A recovered worker cannot overwrite a newer worker's decision.
    const saved = await admin.from('kia_work_inbox').update(update).eq('event_id', row.event_id)
      .eq('attempts', row.attempts).eq('state', 'processing');
    if (saved.error) throw new WorkError('inbox_audit_unavailable', 503);
  }
  return { applied, review, retry };
}
