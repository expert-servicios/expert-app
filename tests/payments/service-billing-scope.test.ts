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

  it('classifies entity certificate as company-only', () => {
    expect(getServiceBillingPolicy('certificado-digital-entidad')).toBe('company_only');
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
      activeCompanyId: '11111111-1111-1111-1111-111111111111',
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
      activeCompanyId: '11111111-1111-1111-1111-111111111111',
      clientType: 'empresa',
    })).toEqual({ scope: 'mixed_billing_scope', companyId: null });
  });

  it('rejects personal + flexible cart when the flexible item resolves to a company', () => {
    expect(resolveServiceBillingScope({
      serviceSlugs: ['irpf', 'holded-pack-starter'],
      activeCompanyId: '11111111-1111-1111-1111-111111111111',
      clientType: 'empresa',
    })).toEqual({ scope: 'mixed_billing_scope', companyId: null });
  });

  it('uses an explicit company for flexible services', () => {
    expect(resolveServiceBillingScope({
      serviceSlugs: ['holded-pack-starter'],
      explicitCompanyId: '22222222-2222-2222-2222-222222222222',
      activeCompanyId: '11111111-1111-1111-1111-111111111111',
      clientType: 'empresa',
    })).toEqual({
      scope: 'company',
      companyId: '22222222-2222-2222-2222-222222222222',
    });
  });

  it('uses the active company for a flexible service when one is selected', () => {
    expect(resolveServiceBillingScope({
      serviceSlugs: ['modelo-720'],
      activeCompanyId: '11111111-1111-1111-1111-111111111111',
      clientType: 'empresa',
    })).toEqual({
      scope: 'company',
      companyId: '11111111-1111-1111-1111-111111111111',
    });
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
