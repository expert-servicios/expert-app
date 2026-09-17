import { describe, expect, it } from 'vitest';
import {
  getServiceCheckoutMetadata,
  getServiceDisbursementByKey,
  getServiceDisbursementCheckoutLineItem,
  type ServiceCheckoutItem,
} from '@/lib/integrations/service-checkout';

describe('service checkout disbursements', () => {
  it('resolves the Ministerio de Justicia 790-026 disbursement as non-revenue', () => {
    const disbursement = getServiceDisbursementByKey('mjusticia_790_026_nacionalidad_residencia');

    expect(disbursement).toMatchObject({
      unitAmount      : 10405,
      beneficiary     : 'Ministerio de Justicia',
      officialModel   : '790-026',
      taxable         : false,
      revenueAffecting: false,
    });
  });

  it('rejects unknown disbursement keys', () => {
    expect(getServiceDisbursementByKey('unknown')).toBeNull();
  });

  it('creates a nontaxable Stripe line item with disbursement metadata', () => {
    const disbursement = getServiceDisbursementByKey('mjusticia_790_026_nacionalidad_residencia');
    expect(disbursement).not.toBeNull();

    const lineItem = getServiceDisbursementCheckoutLineItem(disbursement!);

    expect(lineItem.price_data.unit_amount).toBe(10405);
    expect(lineItem.price_data.product_data.tax_code).toBe('txcd_00000000');
    expect(lineItem.price_data.product_data.metadata).toMatchObject({
      line_type        : 'disbursement',
      revenue_affecting: 'false',
      taxable          : 'false',
      official_model   : '790-026',
    });
  });

  it('separates revenue and disbursement totals in checkout metadata', () => {
    const service: ServiceCheckoutItem = {
      priceId   : 'price_test',
      name      : 'Servicio profesional',
      slug      : 'servicio-profesional',
      category  : 'extranjeria-nacionalidad',
      unitAmount: 25000,
    };
    const disbursement = getServiceDisbursementByKey('mjusticia_790_026_nacionalidad_residencia');
    expect(disbursement).not.toBeNull();

    const metadata = getServiceCheckoutMetadata([service], [disbursement!]);

    expect(metadata.revenue_amount_cents).toBe('25000');
    expect(metadata.disbursement_total_cents).toBe('10405');
    expect(metadata.checkout_total_net_cents).toBe('35405');
    expect(metadata.contains_disbursements).toBe('true');
    expect(metadata.disbursement_keys).toBe('mjusticia_790_026_nacionalidad_residencia');
  });
});
