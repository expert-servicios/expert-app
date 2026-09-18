import { describe, expect, it } from 'vitest';
import {
  getRequiredServiceDisbursementKeys,
  validateRequestedServiceDisbursements,
  type ServiceCheckoutItem,
} from '@/lib/integrations/service-checkout';

const nationalityService: ServiceCheckoutItem = {
  priceId: 'price_nationality',
  name: 'Nacionalidad española para menor nacido en España',
  slug: 'nacionalidad-espanola-menor-nacido-en-espana',
  category: 'extranjeria-nacionalidad',
  unitAmount: 25000,
};

const ordinaryService: ServiceCheckoutItem = {
  priceId: 'price_irpf',
  name: 'IRPF',
  slug: 'irpf',
  category: 'fiscal',
  unitAmount: 9000,
};

const TAX_KEY = 'mjusticia_790_026_nacionalidad_residencia';

describe('server-side service disbursement policy', () => {
  it('derives the mandatory 790-026 disbursement from the nationality service', () => {
    expect(getRequiredServiceDisbursementKeys([nationalityService])).toEqual([TAX_KEY]);
  });

  it('keeps the mandatory disbursement even when the client sends no disbursement keys', () => {
    const required = getRequiredServiceDisbursementKeys([nationalityService]);
    expect(required).toEqual([TAX_KEY]);
    expect(validateRequestedServiceDisbursements(required, [])).toEqual({ valid: true });
  });

  it('accepts the client echoing the expected mandatory disbursement key', () => {
    const required = getRequiredServiceDisbursementKeys([nationalityService]);
    expect(validateRequestedServiceDisbursements(required, [TAX_KEY])).toEqual({ valid: true });
  });

  it('rejects attaching the nationality fee to an unrelated service', () => {
    const required = getRequiredServiceDisbursementKeys([ordinaryService]);
    expect(required).toEqual([]);
    expect(validateRequestedServiceDisbursements(required, [TAX_KEY])).toEqual({
      valid: false,
      unexpectedKey: TAX_KEY,
    });
  });

  it('does not add a disbursement to an ordinary service', () => {
    expect(getRequiredServiceDisbursementKeys([ordinaryService])).toEqual([]);
  });
});
