import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('Admin Company 360 and explicit memberships', () => {
  it('builds Company 360 from company-scoped operational data', () => {
    const route = source('app/api/admin/empresas/[id]/route.ts');
    const page = source('app/(protected)/admin/empresas/[id]/page.tsx');

    expect(route).toContain(".eq('company_id', id)");
    expect(route).toContain(".from('cases')");
    expect(route).toContain(".from('internal_tasks')");
    expect(route).toContain(".from('documents')");
    expect(route).toContain(".from('client_integrations')");
    expect(page).toContain('Personas vinculadas');
    expect(page).toContain('Operación de la entidad');
    expect(page).toContain('/integraciones');
  });

  it('links and unlinks clients explicitly with audit trail', () => {
    const route = source('app/api/admin/empresas/[id]/personas/route.ts');

    expect(route).toContain("z.enum(['owner', 'admin', 'member'])");
    expect(route).toContain(".from('profile_companies')");
    expect(route).toContain("profile.role !== 'client'");
    expect(route).toContain("action: 'company.admin_person_linked'");
    expect(route).toContain("action: 'company.admin_person_unlinked'");
    expect(route).toContain('active_company_replaced_with');
  });

  it('does not fuzzy-link people automatically', () => {
    const route = source('app/api/admin/empresas/[id]/personas/route.ts');
    const page = source('app/(protected)/admin/empresas/[id]/page.tsx');

    expect(route).not.toContain('similarity(');
    expect(route).not.toContain('levenshtein');
    expect(page).toContain('EXPERT no fusiona ni vincula personas automáticamente');
    expect(page).toContain('Vincular');
  });

  it('routes company search and directory results to Company 360', () => {
    const directory = source('app/api/admin/directorio/route.ts');
    const search = source('app/api/admin/search/route.ts');
    const companies = source('app/(protected)/admin/empresas/page.tsx');

    expect(directory).toContain('href: `/admin/empresas/${company.id}`');
    expect(search).toContain('href: `/admin/empresas/${company.id}`');
    expect(companies).toContain('Company 360');
    expect(companies).toContain('/integraciones');
  });

  it('keeps browsing separate from changing the client active company', () => {
    const companyPage = source('app/(protected)/admin/empresas/[id]/page.tsx');
    const membershipRoute = source('app/api/admin/empresas/[id]/personas/route.ts');

    expect(companyPage).not.toContain("update({ active_company_id");
    expect(membershipRoute).toContain('if (!profile.active_company_id)');
    expect(membershipRoute).toContain("profile?.active_company_id === companyId");
  });
});
