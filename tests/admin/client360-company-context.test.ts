import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('Client 360 company context', () => {
  it('uses a URL companyId as Admin browsing context without mutating client preference', () => {
    const bar = source('app/(protected)/admin/clientes/[id]/Client360ContextBar.tsx');

    expect(bar).toContain("searchParams.get('companyId')");
    expect(bar).toContain("router.replace");
    expect(bar).toContain('Contexto Admin');
    expect(bar).toContain('no modifica la entidad activa del portal del cliente');
    expect(bar).not.toContain("update({ active_company_id");
  });

  it('preserves companyId through Client 360 navigation', () => {
    const nav = source('app/(protected)/admin/clientes/[id]/ClientOperationsNav.tsx');

    expect(nav).toContain("searchParams.get('companyId')");
    expect(nav).toContain('childHref');
    expect(nav).toContain('adminHref');
    expect(nav).toContain("query.set('companyId', companyId)");
  });

  it('scopes recurring operations server-side and rejects foreign entities', () => {
    const route = source('app/api/admin/clientes/[id]/operations/route.ts');

    expect(route).toContain("searchParams.get('companyId')");
    expect(route).toContain("!companyIds.includes(requestedCompanyId)");
    expect(route).toContain("La entidad seleccionada no pertenece a este cliente");
    expect(route).toContain("row.company_id === requestedCompanyId");
    expect(route).toContain('scopedStripeInvoices');
    expect(route).toContain('selectedCompanyId: requestedCompanyId');
  });

  it('inherits entity context in documents, communications, fiscal and Holded', () => {
    const docs = source('app/(protected)/admin/clientes/[id]/documentos/page.tsx');
    const comms = source('app/(protected)/admin/clientes/[id]/comunicaciones/page.tsx');
    const fiscal = source('app/(protected)/admin/clientes/[id]/obligaciones/page.tsx');
    const holded = source('app/(protected)/admin/clientes/[id]/integraciones/ClientHoldedAdminPanel.tsx');

    expect(docs).toContain("searchParams.get('companyId')");
    expect(comms).toContain("searchParams.get('companyId')");
    expect(fiscal).toContain("requestedCompanyId = searchParams.get('companyId')");
    expect(fiscal).toContain('visibleObligations');
    expect(holded).toContain("requestedCompanyId = searchParams.get('companyId')");
  });

  it('keeps the selected company in onboarding actions', () => {
    const cockpit = source('app/(protected)/admin/clientes/[id]/ClientOnboardingCockpit.tsx');
    expect(cockpit).toContain("requestedCompanyId = searchParams.get('companyId')");
    expect(cockpit).toContain('activeCompany.id');
    expect(cockpit).toContain('companyId=');
  });
});
