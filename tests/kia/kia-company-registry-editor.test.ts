import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('Company 360 editable KIA registry', () => {
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
    expect(panel).toContain('Histórico consolidado');
  });

  it('lets staff version or revoke company-specific facts and instructions', () => {
    expect(route).toContain("kind: z.literal('fact')");
    expect(route).toContain("kind: z.literal('instruction')");
    expect(route).toContain('recordConfirmedRegistryFact');
    expect(route).toContain('recordConfirmedRegistryInstruction');
    expect(route).toContain("status: 'revoked'");
    expect(route).toContain('client_registry.fact_saved');
    expect(route).toContain('client_registry.instruction_saved');
    expect(route).toContain('client_registry.fact_revoked');
    expect(route).toContain('client_registry.instruction_revoked');
  });

  it('keeps company scope authoritative and never accepts subject id from the browser', () => {
    expect(route).toContain("resolveClientRegistrySubject(ctx.admin, { companyId })");
    expect(route).not.toContain('subjectId: z.');
    expect(route).not.toContain('companyId: z.');
    expect(route).toContain(".eq('subject_id', subject.id)");
  });

  it('treats metadata edits as versioned changes too', () => {
    expect(profile).toContain("current.category === (input.category?.trim() || 'general')");
    expect(profile).toContain("current.scope === (input.scope?.trim() || 'general')");
    expect(profile).toContain('Number(current.priority ?? 3)');
    expect(profile).toContain("status: current?.id ? 'staged' : 'active'");
  });

  it('explains that the editor does not mutate canonical business data', () => {
    expect(panel).toContain('no modifican documentos, expedientes, contabilidad ni otras fuentes canónicas');
    expect(panel).toContain('la información anterior no se borra ni se reescribe');
  });
});
