import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveDocumentRegistryTiming } from '@/lib/documents/document-provenance';

function source(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('document provenance and chronology', () => {
  it('keeps ordinary uploads on their EXPERT incorporation timestamp', () => {
    const timing = resolveDocumentRegistryTiming({
      id: 'doc-1',
      created_at: '2026-10-07T10:00:00.000Z',
      document_date: null,
      ingestion_source: 'client_portal',
      ingestion_ref: null,
    });

    expect(timing?.eventType).toBe('document.received');
    expect(timing?.occurredAt).toBe('2026-10-07T10:00:00.000Z');
    expect(timing?.metadata.incorporated_at).toBe('2026-10-07T10:00:00.000Z');
  });

  it('dates historical imports by verified document date, not import time', () => {
    const timing = resolveDocumentRegistryTiming({
      id: 'doc-2',
      created_at: '2026-10-07T10:00:00.000Z',
      document_date: '2022-04-15',
      ingestion_source: 'historical_import',
      ingestion_ref: 'drive:manifest-row-42',
    });

    expect(timing?.eventType).toBe('document.historical');
    expect(timing?.occurredAt).toBe('2022-04-15T00:00:00.000Z');
    expect(timing?.sourceKey).toBe('document:doc-2:historical');
    expect(timing?.metadata.ingestion_ref).toBe('drive:manifest-row-42');
    expect(timing?.metadata.incorporated_at).toBe('2026-10-07T10:00:00.000Z');
  });

  it('fails closed when a historical import has no verified document date', () => {
    const timing = resolveDocumentRegistryTiming({
      id: 'doc-3',
      created_at: '2026-10-07T10:00:00.000Z',
      document_date: null,
      ingestion_source: 'historical_import',
    });

    expect(timing).toBeNull();
  });

  it('records explicit ingestion sources at supported entry points', () => {
    const clientRoute = source('app/api/cases/[id]/documents/route.ts');
    const tenantRoute = source('app/api/tenant/cases/[id]/documents/route.ts');
    const emailRoute = source('app/api/admin/correo/attachments/route.ts');

    expect(clientRoute).toContain("ingestion_source: isAdmin ? 'admin_portal' : 'client_portal'");
    expect(tenantRoute).toContain("ingestion_source: 'tenant_portal'");
    expect(emailRoute).toContain("ingestion_source: 'admin_email'");
    expect(emailRoute).not.toContain('ingestion_ref:');
  });

  it('keeps historical imports out of recent KIA surfaces', () => {
    const context = source('lib/ai/kia/kia-context-builder.ts');
    const tools = source('lib/ai/kia/kia-tool-executor.ts');

    expect(context).toContain(".neq('ingestion_source', 'historical_import')");
    expect((tools.match(/\.neq\('ingestion_source', 'historical_import'\)/g) ?? []).length).toBeGreaterThanOrEqual(2);
  });

  it('dates Admin 360 historical documents by verified document date', () => {
    const timeline = source('app/api/admin/clientes/[id]/timeline/route.ts');

    expect(timeline).toContain('document_date');
    expect(timeline).toContain('historical_import');
    expect(timeline).toContain("if (d.ingestion_source === 'historical_import' && !d.document_date) continue");
    expect(timeline).toContain("date: historical ? `${d.document_date}T00:00:00.000Z` : d.created_at");
  });

  it('adds provenance columns without rewriting created_at', () => {
    const migration = source('supabase/migrations/20261007110509_document_provenance.sql');

    expect(migration).toContain('add column if not exists document_date date');
    expect(migration).toContain("add column if not exists ingestion_source text not null default 'unknown'");
    expect(migration).toContain('add column if not exists ingestion_ref text');
    expect(migration).not.toContain('alter column created_at');
  });
});
