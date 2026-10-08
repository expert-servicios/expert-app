import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

const route = source('app/api/webhooks/telegram/route.ts');
const ingestion = source('lib/documents/telegram-document-ingestion.ts');
const uploads = source('lib/security/uploads.ts');

describe('Telegram Operations 360 canonical attachments', () => {
  it('requires verified case ownership before touching canonical documents', () => {
    expect(ingestion).toContain(".eq('id', input.caseId)");
    expect(ingestion).toContain(".eq('client_id', input.profileId)");
    expect(ingestion).toContain("telegram_document_scope_mismatch");
    expect(ingestion.indexOf("telegram_document_scope_mismatch"))
      .toBeLessThan(ingestion.indexOf(".from('client-documents')"));
  });

  it('uses the same upload validation and private canonical bucket as EXPERT', () => {
    expect(ingestion).toContain('validateClientDocumentFile(input.file, CLIENT_DOCUMENT_MAX_BYTES)');
    expect(ingestion).toContain('buildClientDocumentStoragePath(input.caseId, validation.safeName)');
    expect(ingestion).toContain(".from('client-documents')");
    expect(uploads).toContain('export const CLIENT_DOCUMENT_MAX_BYTES = 10 * 1024 * 1024');
  });

  it('persists explicit Telegram provenance and prevents duplicate ingestion', () => {
    expect(ingestion).toContain("ingestion_source', 'telegram'");
    expect(ingestion).toContain(".eq('ingestion_ref', ingestionRef)");
    expect(ingestion).toContain("ingestion_source: 'telegram'");
    expect(ingestion).toContain('ingestion_ref: ingestionRef');
    expect(ingestion).toContain("'telegram.document_ingested'");
    expect(ingestion).toContain('telegram_update_id');
    expect(ingestion).toContain('telegram_message_id');
    expect(ingestion).toContain('telegram_file_id');
  });

  it('does not infer a case from an attachment and only downloads after context resolution', () => {
    expect(route).toContain("reason: 'telegram_document_case_required'");
    expect(route).toContain('ingestTelegramCaseDocument');
    expect(route).not.toContain("reason: 'unsupported_media'");
    const documentBranch = route.indexOf("if (inbound.media?.kind === 'document' || inbound.media?.kind === 'photo')");
    const documentDownload = route.indexOf('const file = await downloadTelegramMedia(inbound.media)', documentBranch);
    expect(route.indexOf('caseContext = await loadTelegramCaseContext'))
      .toBeLessThan(documentBranch);
    expect(documentBranch).toBeLessThan(documentDownload);
  });

  it('keeps unverified prospects away from document ingestion', () => {
    expect(route.indexOf('if (!identity) {'))
      .toBeLessThan(route.indexOf('ingestTelegramCaseDocument({'));
    expect(route).toContain('Para consultar expedientes o usar información privada, vincula tu identidad');
  });

  it('queues the archived document into normal KIA conversation context after successful ingestion', () => {
    expect(route).toContain('[Documento recibido en expediente:');
    expect(route).toContain('Documento recibido y archivado correctamente en tu expediente EXPERT.');
    expect(ingestion).toContain("kind: 'client_document'");
    expect(ingestion).toContain("state: 'pendiente'");
    expect(ingestion).toContain("uploaded_by_role: 'client'");
  });

  it('notifies Admin without making notification part of the canonical write transaction', () => {
    expect(ingestion).toContain('void notifyAdminCaseActivity({');
    expect(ingestion).toContain("kind: 'document_uploaded'");
    expect(ingestion).toContain('Documento recibido por Telegram:');
  });
});
