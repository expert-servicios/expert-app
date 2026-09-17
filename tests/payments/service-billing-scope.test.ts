import { describe, expect, it } from 'vitest';
import { resolveServiceBillingScope } from '@/lib/payments/service-billing-scope';

describe('resolveServiceBillingScope', () => {
  it('forces nationality-minor checkout to the personal profile even with an active company', () => {
    expect(resolveServiceBillingScope({
      serviceSlugs: ['nacionalidad-espanola-menor-nacido-en-espana'],
      activeCompanyId: '11111111-1111-1111-1111-111111111111',
      clientType: 'empresa',
    })).toEqual({ scope: 'profile', companyId: null });
  });

  it('rejects a cart that mixes a personal procedure with another billing scope', () => {
    expect(resolveServiceBillingScope({
      serviceSlugs: [
        'nacionalidad-espanola-menor-nacido-en-espana',
        'holded-pack-starter',
      ],
      activeCompanyId: '11111111-1111-1111-1111-111111111111',
      clientType: 'empresa',
    })).toEqual({ scope: 'mixed_billing_scope', companyId: null });
  });

  it('uses an explicit company for ordinary services', () => {
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

  it('uses the active company for ordinary business services', () => {
    expect(resolveServiceBillingScope({
      serviceSlugs: ['holded-pack-starter'],
      activeCompanyId: '11111111-1111-1111-1111-111111111111',
      clientType: 'empresa',
    })).toEqual({
      scope: 'company',
      companyId: '11111111-1111-1111-1111-111111111111',
    });
  });

  it('requires a company for a business profile with no entity selected', () => {
    expect(resolveServiceBillingScope({
      serviceSlugs: ['holded-pack-starter'],
      clientType: 'autonomo',
    })).toEqual({ scope: 'company_required', companyId: null });
  });

  it('allows an ordinary service to be billed to a personal profile when no company context exists', () => {
    expect(resolveServiceBillingScope({
      serviceSlugs: ['irpf'],
      clientType: 'particular',
    })).toEqual({ scope: 'profile', companyId: null });
  });
});
