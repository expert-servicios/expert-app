import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('KIA Google eSignature workflow', () => {
  const defs = source('lib/ai/kia/kia-tool-definitions.ts');
  const registry = source('lib/ai/kia/kia-tool-registry.ts');
  const executor = source('lib/ai/kia/kia-tool-executor.ts');
  const prompt = source('lib/ai/kia/prompts/kia-client-flow.ts');
  const email = source('app/api/cron/kia-email-agent/route.ts');
  const blueprint = source('lib/services/service-operational-blueprints.ts');
  const runbook = source('docs/kia-google-esignature.md');

  it('exposes signature status as autonomous read-only evidence', () => {
    expect(defs).toContain('get_case_signature_status');
    expect(registry).toContain("get_case_signature_status:          policy('R0', 'read',  'documents')");
    expect(executor).toContain("case 'get_case_signature_status'");
    expect(executor).toContain("google_esignature_request_api: 'manual_only'");
  });

  it('keeps signed-document download behind the existing EXPERT authorization route', () => {
    expect(executor).toContain('/api/documents/${doc.id}/download?redirect=1');
    expect(executor).not.toContain('drive.google.com/file/d/${doc.drive_file_id}');
  });

  it('never claims Google eSignature was sent without persisted evidence', () => {
    expect(prompt).toContain('No afirmes "solicitud de firma enviada" salvo que exista evidencia persistida del envío');
    expect(prompt).toContain('requiere intervención humana');
    expect(runbook).toContain('KIA NO puede afirmar que la solicitud fue enviada');
  });

  it('distinguishes simple eSignature from recognized-certificate signing', () => {
    expect(prompt).toContain('cuando la norma exige certificado electrónico reconocido');
    expect(runbook).toContain('Firma con certificado reconocido');
    expect(runbook).toContain('AutoFirma');
  });

  it('lets the email agent read signature state', () => {
    expect(email).toContain("'get_case_signature_status'");
  });

  it('keeps the legacy task key while making evidence provider-neutral', () => {
    expect(blueprint).toContain("key: 'archive_docusign_completion_certificate'");
    expect(blueprint).toContain('Legacy task key retained for compatibility');
    expect(blueprint).toContain('Para Google eSignature, conservar el PDF final con su página de auditoría');
  });
});
