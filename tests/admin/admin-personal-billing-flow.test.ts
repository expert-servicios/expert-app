import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('admin personal-first billing flow', () => {
  it('allows admin onboarding to create a person without a company record', () => {
    const invite = source('app/api/admin/users/invite/route.ts');
    expect(invite).toContain("z.enum(['particular', 'empresa', 'autonomo'])");
    expect(invite).toContain("entityType !== 'particular'");
    expect(invite).toContain('const shouldCreateEntity');
  });

  it('exposes particular as a first-class option in admin onboarding', () => {
    const page = source('app/(protected)/admin/onboarding/page.tsx');
    expect(page).toContain("entityType: 'particular' | 'empresa' | 'autonomo'");
    expect(page).toContain("value: 'particular'");
    expect(page).toContain("serviceSlug: item?.serviceSlug");
    expect(page).toContain('Los planes mensuales requieren una entidad fiscal vinculada');
  });

  it('resolves one-off quote recipient from service policy or explicit billing scope', () => {
    const route = source('app/api/admin/quotes/route.ts');
    expect(route).toContain("const policies = policySlugs.map(getServiceBillingPolicy)");
    expect(route).toContain("billingScope: z.enum(['profile', 'company']).optional()");
    expect(route).toContain("const forceProfile = servicePolicy === 'profile_only' || billingScope === 'profile'");
    expect(route).toContain("const forceCompany = servicePolicy === 'company_only' || billingScope === 'company'");
    expect(route).toContain("const resolvedBillingScope = companyId ? 'company' : 'profile'");
    expect(route).toContain("...(companyId ? { company_id: companyId } : {})");
  });

  it('keeps quote company_id nullable while preserving company inheritance when selected', () => {
    const route = source('app/api/admin/quotes/route.ts');
    expect(route).toContain('company_id: companyId');
    expect(route).toContain("billing_scope: resolvedBillingScope");
    expect(route).toContain("companyId, billingScope: resolvedBillingScope");
  });

  it('forces free-form admin quotes to choose the invoice recipient explicitly', () => {
    const modal = source('components/admin/NuevaCotizacionModal.tsx');
    expect(modal).toContain("useState<'profile' | 'company'>('profile')");
    expect(modal).toContain('Destinatario de factura');
    expect(modal).toContain('Persona / autónomo');
    expect(modal).toContain('Sociedad / entidad');
    expect(modal).toContain("billingScope === 'company' ? companyId : undefined");
  });

  it('maps admin catalog entries to canonical service slugs for billing policy', () => {
    const catalog = source('lib/utils/admin-catalog.ts');
    expect(catalog).toContain("serviceSlug: 'irpf'");
    expect(catalog).toContain("serviceSlug: 'impuesto-sociedades'");
    expect(catalog).toContain("serviceSlug: 'nacionalidad-espanola-menor-nacido-en-espana'");
    expect(catalog).toContain("serviceSlug: 'constitucion-sl'");
  });
});
