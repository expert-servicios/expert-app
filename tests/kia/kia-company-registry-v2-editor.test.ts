import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('Company 360 KIA Registry v2 editor', () => {
  const page = source('app/(protected)/admin/empresas/[id]/page.tsx');
  const panel = source('app/(protected)/admin/empresas/[id]/CompanyRegistryPanel.tsx');
  const route = source('app/api/admin/empresas/[id]/registro/route.ts');
  const profile = source('lib/ai/kia/kia-client-registry-profile.ts');

  it('surfaces the registry inside Company 360', () => {
    expect(page).toContain("import { CompanyRegistryPanel } from './CompanyRegistryPanel'");
    expect(page).toContain('<CompanyRegistryPanel companyId={id} />');
    expect(panel).toContain('Hoja Registral KIA');
    expect(panel).toContain('Hechos estructurales');
    expect(panel).toContain('Instrucciones operativas');
    expect(panel).toContain('Timeline verificada');
  });

  it('derives subject/company scope on server instead of trusting browser ids', () => {
    expect(route).toContain("resolveClientRegistrySubject(ctx.admin, { companyId })");
    expect(route).not.toContain('subjectId: z.');
    expect(route).not.toContain('companyId: z.');
    expect(route).toContain(".eq('company_id', companyId)");
    expect(route).toContain(".is('case_id', null)");
  });

  it('uses atomic profile writers with auditable provenance', () => {
    expect(route).toContain('recordConfirmedRegistryFact');
    expect(route).toContain('recordConfirmedRegistryInstruction');
    expect(route).toContain('admin-company360:');
    expect(profile).toContain("admin.rpc('replace_client_registry_fact'");
    expect(profile).toContain("admin.rpc('replace_client_registry_instruction'");
  });

  it('supports explicit revocation without deleting history', () => {
    expect(route).toContain("status: 'revoked'");
    expect(route).toContain('client_registry.fact_revoked');
    expect(route).toContain('client_registry.instruction_revoked');
    expect(panel).toContain('la información anterior no se borra ni se reescribe');
  });

  it('does not mutate canonical business data', () => {
    expect(panel).toContain('no modifican documentos, expedientes, contabilidad ni otras fuentes canónicas');
  });
});
