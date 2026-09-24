import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('case document workflow security', () => {
  const migration = source('supabase/migrations/20260919071707_case_document_workflow.sql');
  const documentsRoute = source('app/api/cases/[id]/documents/route.ts');
  const reviewRoute = source('app/api/cases/[id]/document-review/route.ts');

  it('binds client note access to the authenticated client and owned case', () => {
    expect(migration).toContain('client_id = auth.uid()');
    expect(migration).toContain('c.id = case_document_notes.case_id');
    expect(migration).toContain('c.client_id = auth.uid()');
    expect(migration).toContain('(updated_by is null or updated_by = auth.uid())');
    expect(migration).toContain('revoke all on table public.case_document_notes from public, anon');
  });

  it('allows null company attribution only for the explicit personal nationality service', () => {
    expect(documentsRoute).toContain(
      "const PERSONAL_DOCUMENT_SERVICE_IDS = new Set(['nacionalidad-espanola-menor-nacido-en-espana'])",
    );
    expect(documentsRoute).toContain('const personalDocumentScope = Boolean(');
    expect(documentsRoute).toMatch(/const companyId = personalDocumentScope\s*\?\s*null/);
    expect(documentsRoute).toContain("code: 'case_company_required'");
  });

  it('persists the Admin task before confirming the case review transition', () => {
    const taskLookup = reviewRoute.indexOf(".from('internal_tasks')");
    const caseUpdate = reviewRoute.indexOf(".from('cases')\n      .update({");
    expect(taskLookup).toBeGreaterThan(-1);
    expect(caseUpdate).toBeGreaterThan(taskLookup);
    expect(reviewRoute).toContain(".update(casePatch)");
    expect(reviewRoute).toContain("return NextResponse.json({ error: 'No se pudo preparar la tarea de revisión' }");
    expect(reviewRoute).toContain("return NextResponse.json({ error: 'No se pudo actualizar la tarea de revisión' }");
    expect(reviewRoute).toContain("return NextResponse.json({ error: 'No se pudo crear la tarea de revisión' }");
    expect(reviewRoute).toContain('const shouldMoveToReview');
    expect(reviewRoute).toContain("effectiveStatus === 'nuevo' || effectiveStatus === 'pendiente_cliente'");
  });
});
