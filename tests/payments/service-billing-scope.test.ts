import { describe, expect, it } from 'vitest';
import { getServiceBillingPolicy, resolveServiceBillingScope } from '@/lib/payments/service-billing-scope';

describe('service billing policy', () => {
  it.each([
    'irpf',
    'modelo-151',
    'arraigo-social',
    'nacionalidad-espanola',
    'nacionalidad-espanola-menor-nacido-en-espana',
    'nie-pasaporte',
    'herencia',
    'alta-autonomo',
    'constitucion-sl',
    'constitucion-sl-circe',
    'nif-socio-extranjero',
    'certificado-digital-persona-fisica',
  ])('classifies %s as strictly personal', (slug) => {
    expect(getServiceBillingPolicy(slug)).toBe('profile_only');
  });

  it.each([
    'certificado-digital-entidad',
    'pack-certificados-digitales',
  ])('classifies %s as company-only', (slug) => {
    expect(getServiceBillingPolicy(slug)).toBe('company_only');
  });

  it.each([
    'modelo-720',
    'holded-pack-starter',
    'holded-migracion-sin-inventario',
    'holded-modulo-formacion',
  ])('keeps %s flexible', (slug) => {
    expect(getServiceBillingPolicy(slug)).toBe('flexible');
  });
});

describe('resolveServiceBillingScope', () => {
  it('keeps a personal procedure on the person even when they manage an active company', () => {
    expect(resolveServiceBillingScope({
      serviceSlugs: ['irpf'],
      clientType: 'empresa',
    })).toEqual({ scope: 'profile', companyId: null });
  });

  it('keeps pre-incorporation services on the person because the company may not exist yet', () => {
    expect(resolveServiceBillingScope({
      serviceSlugs: ['constitucion-sl'],
      clientType: 'particular',
    })).toEqual({ scope: 'profile', companyId: null });
  });

  it('rejects a cart that mixes a personal procedure with a company-only service', () => {
    expect(resolveServiceBillingScope({
      serviceSlugs: [
        'nacionalidad-espanola-menor-nacido-en-espana',
        'certificado-digital-entidad',
      ],
      clientType: 'empresa',
    })).toEqual({ scope: 'mixed_billing_scope', companyId: null });
  });

  it('keeps personal + flexible cart on the person unless a company is explicitly selected', () => {
    expect(resolveServiceBillingScope({
      serviceSlugs: ['irpf', 'holded-pack-starter'],
      clientType: 'empresa',
    })).toEqual({ scope: 'profile', companyId: null });

    expect(resolveServiceBillingScope({
      serviceSlugs: ['irpf', 'holded-pack-starter'],
      explicitCompanyId: '11111111-1111-1111-1111-111111111111',
      clientType: 'empresa',
    })).toEqual({ scope: 'mixed_billing_scope', companyId: null });
  });

  it('uses an explicit company for flexible services', () => {
    expect(resolveServiceBillingScope({
      serviceSlugs: ['holded-pack-starter'],
      explicitCompanyId: '22222222-2222-2222-2222-222222222222',
      clientType: 'empresa',
    })).toEqual({
      scope: 'company',
      companyId: '22222222-2222-2222-2222-222222222222',
    });
  });

  it('never infers company billing from UI context; company profiles must select explicitly', () => {
    expect(resolveServiceBillingScope({
      serviceSlugs: ['modelo-720'],
      clientType: 'empresa',
    })).toEqual({ scope: 'company_required', companyId: null });
  });

  it('allows an autonomo to buy a flexible service without creating a company record', () => {
    expect(resolveServiceBillingScope({
      serviceSlugs: ['holded-pack-starter'],
      clientType: 'autonomo',
    })).toEqual({ scope: 'profile', companyId: null });
  });

  it('requires an entity for a company-only service', () => {
    expect(resolveServiceBillingScope({
      serviceSlugs: ['certificado-digital-entidad'],
      clientType: 'particular',
    })).toEqual({ scope: 'company_required', companyId: null });
  });

  it('requires a linked entity for the bundle and resolves it as one company-scoped checkout', () => {
    expect(resolveServiceBillingScope({
      serviceSlugs: ['pack-certificados-digitales'],
      clientType: 'particular',
    })).toEqual({ scope: 'company_required', companyId: null });

    expect(resolveServiceBillingScope({
      serviceSlugs: ['pack-certificados-digitales'],
      explicitCompanyId: '33333333-3333-3333-3333-333333333333',
      clientType: 'particular',
    })).toEqual({
      scope: 'company',
      companyId: '33333333-3333-3333-3333-333333333333',
    });
  });

  it('requires an entity for a company profile buying a flexible service', () => {
    expect(resolveServiceBillingScope({
      serviceSlugs: ['holded-pack-starter'],
      clientType: 'empresa',
    })).toEqual({ scope: 'company_required', companyId: null });
  });

  it('allows a personal profile to buy a flexible service without company data', () => {
    expect(resolveServiceBillingScope({
      serviceSlugs: ['modelo-720'],
      clientType: 'particular',
    })).toEqual({ scope: 'profile', companyId: null });
  });
});
