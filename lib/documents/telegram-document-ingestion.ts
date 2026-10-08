import type { getSupabaseAdmin } from '@/lib/integrations/supabase';
import type { TelegramInboundMessage } from '@/lib/integrations/telegram';
import { notifyAdminCaseActivity } from '@/lib/admin/case-admin-notifications';
import {
  buildClientDocumentStoragePath,
  CLIENT_DOCUMENT_MAX_BYTES,
  validateClientDocumentFile,
} from '@/lib/security/uploads';

type AdminClient = ReturnType<typeof getSupabaseAdmin>;

export async function ingestTelegramCaseDocument(input: {
  admin: AdminClient;
  profileId: string;
  tenantId: string | null;
  caseId: string;
  companyId: string | null;
  inbound: TelegramInboundMessage;
  file: File;
}) {
  const media = input.inbound.media;
  if (!media || !['document', 'photo'].includes(media.kind)) {
    throw new Error('telegram_document_media_required');
  }

  const caseQuery = input.admin
    .from('cases')
    .select('id,client_id,company_id,tenant_id,service')
    .eq('id', input.caseId)
    .eq('client_id', input.profileId);
  const { data: caseRow, error: caseError } = await (
    input.tenantId ? caseQuery.eq('tenant_id', input.tenantId) : caseQuery.is('tenant_id', null)
  ).maybeSingle();
  if (caseError) throw caseError;
  if (!caseRow || (caseRow.company_id ?? null) !== input.companyId) {
    throw new Error('telegram_document_scope_mismatch');
  }

  const ingestionRef = [
    'telegram',
    input.inbound.updateId,
    input.inbound.messageId,
    media.fileId,
  ].join(':');

  const { data: existing, error: existingError } = await input.admin
    .from('documents')
    .select('id,original_name,file_path,state')
    .eq('ingestion_source', 'telegram')
    .eq('ingestion_ref', ingestionRef)
    .maybeSingle();
  if (existingError) throw existingError;
  if (existing) return { document: existing, created: false };

  const validation = validateClientDocumentFile(input.file, CLIENT_DOCUMENT_MAX_BYTES);
  if (!validation.ok) {
    const error = new Error(validation.error) as Error & { code?: string };
    error.code = 'telegram_document_invalid';
    throw error;
  }

  const storagePath = buildClientDocumentStoragePath(input.caseId, validation.safeName);
  const buffer = Buffer.from(await input.file.arrayBuffer());
  const { data: uploadData, error: uploadError } = await input.admin.storage
    .from('client-documents')
    .upload(storagePath, buffer, {
      contentType: validation.contentType,
      upsert: false,
    });
  if (uploadError) throw uploadError;

  const { data: document, error: documentError } = await input.admin
    .from('documents')
    .insert({
      company_id: input.companyId,
      owner_type: 'case',
      owner_id: input.caseId,
      kind: 'client_document',
      case_id: input.caseId,
      client_id: input.profileId,
      file_path: uploadData.path,
      original_name: validation.safeName,
      title: validation.safeName,
      mime_type: validation.contentType,
      state: 'pendiente',
      uploaded_by_role: 'client',
      ingestion_source: 'telegram',
      ingestion_ref: ingestionRef,
      client_comment: input.inbound.text?.trim().slice(0, 2000) || null,
    })
    .select('id,original_name,file_path,state,created_at')
    .single();

  if (documentError || !document) {
    await input.admin.storage.from('client-documents').remove([uploadData.path]).catch(() => null);
    throw documentError ?? new Error('telegram_document_insert_failed');
  }

  const { error: auditError } = await input.admin.from('audit_logs').insert({
    actor_id: input.profileId,
    action: 'telegram.document_ingested',
    entity: 'documents',
    entity_id: document.id,
    metadata: {
      case_id: input.caseId,
      company_id: input.companyId,
      telegram_update_id: input.inbound.updateId,
      telegram_message_id: input.inbound.messageId,
      telegram_file_id: media.fileId,
      telegram_media_kind: media.kind,
      ingestion_ref: ingestionRef,
    },
  });
  if (auditError) {
    console.error('[Telegram document] audit log failed:', auditError.message);
  }

  void notifyAdminCaseActivity({
    kind: 'document_uploaded',
    caseId: input.caseId,
    service: caseRow.service ?? 'Expediente',
    clientName: null,
    detail: `Documento recibido por Telegram: ${document.original_name}`,
    eventRef: document.id,
    occurredAt: document.created_at,
  });

  return { document, created: true };
}
