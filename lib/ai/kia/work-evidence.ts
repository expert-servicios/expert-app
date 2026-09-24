import { createHash } from 'node:crypto';
import { WorkError, type WorkAdmin } from './work-auth';
import { evidenceMatchesPolicy, type WorkEvent, type WorkTaskPolicy } from './work-contract';

// Evidence is resolved from EXPERT; text supplied by a worker is never proof.
export async function verifyWorkEvidence(admin: WorkAdmin, caseId: string, clientId: string,
  policy: WorkTaskPolicy, event: WorkEvent) {
  if (!evidenceMatchesPolicy(policy, event)) throw new WorkError('evidence_type_mismatch');
  if (event.result !== 'succeeded') return {};
  const evidence = event.evidence!;
  if (evidence.type === 'document') {
    const { data: doc, error } = await admin.from('documents')
      .select('id,case_id,client_id,file_path,checklist_item_key,state,replaced_by,updated_at')
      .eq('id', evidence.id).maybeSingle();
    if (error) throw new WorkError('evidence_unavailable', 503);
    if (!doc || doc.case_id !== caseId || doc.client_id !== clientId || doc.replaced_by
      || doc.state === 'rechazado' || doc.checklist_item_key !== policy.target || !doc.file_path) {
      throw new WorkError('document_not_verified');
    }
    const { data: file, error: downloadError } = await admin.storage.from('client-documents').download(doc.file_path);
    if (downloadError || !file) throw new WorkError('document_unavailable', 503);
    if (file.size > 10 * 1024 * 1024) throw new WorkError('document_too_large');
    const digest = createHash('sha256').update(Buffer.from(await file.arrayBuffer())).digest('hex');
    if (digest !== evidence.sha256) throw new WorkError('document_hash_mismatch');
    return { type: evidence.type, id: doc.id, updated_at: doc.updated_at, sha256: digest };
  }
  if (evidence.type === 'email') {
    const { data: email, error } = await admin.from('email_events')
      .select('id,event_type,status,resend_id,metadata,updated_at').eq('id', evidence.id).maybeSingle();
    if (error) throw new WorkError('evidence_unavailable', 503);
    if (!email || !['sent', 'delivered'].includes(email.status) || !email.resend_id
      || email.metadata?.case_id !== caseId || email.metadata?.task_id !== event.task_id
      || email.event_type !== policy.target) throw new WorkError('email_not_verified');
    return { type: evidence.type, id: email.id, updated_at: email.updated_at, provider_id: email.resend_id };
  }
  const { data: action, error } = await admin.from('administrative_actions')
    .select('id,case_id,state,row_version').eq('id', evidence.id).maybeSingle();
  if (error) throw new WorkError('evidence_unavailable', 503);
  if (!action || action.id !== policy.target || action.case_id !== caseId || action.state !== 'completed') {
    throw new WorkError('administrative_action_not_verified');
  }
  return { type: evidence.type, id: action.id, row_version: action.row_version };
}
