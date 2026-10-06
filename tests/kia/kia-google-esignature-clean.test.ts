import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('KIA Google eSignature clean lifecycle', () => {
  const workflow = source('lib/ai/kia/kia-signature-workflow.ts');
  const definitions = source('lib/ai/kia/kia-tool-definitions.ts');
  const registry = source('lib/ai/kia/kia-tool-registry.ts');
  const executor = source('lib/ai/kia/kia-tool-executor.ts');
  const lifecycleRoute = source('app/api/admin/cases/[id]/signature-actions/[actionId]/route.ts');
  const listRoute = source('app/api/admin/cases/[id]/signature-actions/route.ts');
  const panel = source('components/admin/CaseSignaturePanel.tsx');
  const casePage = source('app/(protected)/admin/expedientes/[id]/page.tsx');

  it('never treats the unsigned source as signed evidence', () => {
    expect(workflow).toContain("event.event_type === 'signature.completed'");
    expect(workflow).toContain('completedPayload.finalDocumentId');
    expect(workflow).toContain("action.state === 'completed' && finalDocumentId");
    expect(workflow).toContain(".neq('state', 'rechazado')");
    expect(workflow).toContain(".is('replaced_by', null)");
    expect(panel).toContain('El documento origen nunca se considera firmado');
  });

  it('requires accessible source and final documents', () => {
    expect(workflow).toContain('!document.file_path && !document.drive_file_id');
    expect(workflow).toContain('!finalDocument.file_path && !finalDocument.drive_file_id');
    expect(workflow).toContain('/api/documents/');
    expect(workflow).toContain('/download?redirect=1');
  });

  it('allows a cancelled request to be prepared again without duplicating active requests', () => {
    expect(workflow).toContain('activeExisting');
    expect(workflow).toContain('retryOrdinal');
    expect(workflow).toContain("['cancelled', 'failed_safe', 'expired']");
    expect(workflow).toContain('alreadyPrepared: true');
  });

  it('persists an auditable lifecycle instead of document metadata shortcuts', () => {
    expect(workflow).toContain('createKiaAdministrativeAction');
    expect(workflow).toContain('transitionKiaAdministrativeAction');
    expect(workflow).toContain("'signature.requested'");
    expect(workflow).toContain("'signature.partially_signed'");
    expect(workflow).toContain("'signature.completed'");
    expect(workflow).not.toContain('signature_final_document_id');
    expect(lifecycleRoute).toContain('recordKiaSignatureLifecycle');
  });

  it('keeps preparation Admin/Owner-only while status remains read-only', () => {
    expect(definitions).toContain('get_case_signature_status');
    expect(definitions).toContain('prepare_signature_request');
    expect(registry).toContain("get_case_signature_status:           policy('R1', 'read',  'documents')");
    expect(registry).toContain("prepare_signature_request:");
    expect(registry).toContain("allowedRoles: [ROLES.ADMIN, ROLES.OWNER]");
    expect(executor).toContain("case 'get_case_signature_status'");
    expect(executor).toContain("case 'prepare_signature_request'");
  });

  it('authorizes staff by tenant and clients by case ownership', () => {
    expect(workflow).toContain('context.actor?.isStaff');
    expect(workflow).toContain(".eq('tenant_id', context.actor.tenantId)");
    expect(workflow).toContain(".eq('client_id', clientId)");
  });

  it('exposes signer-level states and only finalizes with an explicit final document', () => {
    expect(lifecycleRoute).toContain("z.enum(['requested', 'partially_signed', 'completed', 'cancelled'])");
    expect(lifecycleRoute).toContain("status: z.enum(['pending', 'signed', 'declined'])");
    expect(workflow).toContain("if (!finalDocumentId) return fail('La finalización exige el documento firmado final.')");
    expect(panel).toContain('Documento firmado final…');
    expect(panel).toContain('Guardar firmantes');
  });

  it('keeps all Admin lifecycle routes server-scoped to the requested case', () => {
    expect(listRoute).toContain(".eq('case_id', caseId)");
    expect(listRoute).toContain("['admin', 'owner'].includes(profile.role)");
    expect(lifecycleRoute).toContain("['admin', 'owner'].includes(profile.role)");
    expect(lifecycleRoute).toContain('action.case_id !== input.caseId');
  });

  it('surfaces the workflow in the existing Admin case detail', () => {
    expect(casePage).toContain('CaseSignaturePanel');
    expect(casePage).toContain('/signature-actions');
  });
});
