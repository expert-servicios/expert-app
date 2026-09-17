import { describe, expect, it } from 'vitest';
import {
  legacyOrderFields,
  requireCreatedOrderId,
  resolveCatalogPaymentBreakdown,
} from '@/lib/payments/non-academy-order';

describe('non-Academy order persistence', () => {
  it('mirrors amount_eur into the legacy amount field and normalizes pack_name', () => {
    expect(legacyOrderFields(90, '  Consulta fiscal  ')).toEqual({
      amount: 90,
      pack_name: 'Consulta fiscal',
    });
  });

  it('uses a safe non-empty fallback for legacy pack_name', () => {
    expect(legacyOrderFields(180, '   ')).toEqual({
      amount: 180,
      pack_name: 'Servicio EXPERT',
    });
  });

  it('separates professional net, VAT and disbursement from the Stripe total', () => {
    expect(resolveCatalogPaymentBreakdown({
      amountTotalCents: 40655,
      revenueAmountCents: '25000',
      disbursementTotalCents: '10405',
      disbursementKeys: 'mjusticia_790_026_nacionalidad_residencia',
      disbursementMandateAccepted: 'true',
    })).toEqual({
      stripeTotalCents: 40655,
      professionalGrossCents: 30250,
      professionalNetCents: 25000,
      professionalVatCents: 5250,
      disbursementTotalCents: 10405,
      disbursementKeys: ['mjusticia_790_026_nacionalidad_residencia'],
      mandateAccepted: true,
    });
  });

  it('preserves ordinary catalog payments with no disbursements', () => {
    expect(resolveCatalogPaymentBreakdown({ amountTotalCents: 10890 })).toEqual({
      stripeTotalCents: 10890,
      professionalGrossCents: 10890,
      professionalNetCents: 10890,
      professionalVatCents: 0,
      disbursementTotalCents: 0,
      disbursementKeys: [],
      mandateAccepted: false,
    });
  });

  it('fails closed when a paid disbursement has no accepted mandate', () => {
    expect(() => resolveCatalogPaymentBreakdown({
      amountTotalCents: 40655,
      revenueAmountCents: '25000',
      disbursementTotalCents: '10405',
      disbursementMandateAccepted: 'false',
    })).toThrow('without an accepted mandate');
  });

  it('fails closed when the disbursement exceeds the collected total', () => {
    expect(() => resolveCatalogPaymentBreakdown({
      amountTotalCents: 10000,
      disbursementTotalCents: '10405',
      disbursementMandateAccepted: 'true',
    })).toThrow('disbursement exceeds catalog payment total');
  });

  it('returns the created order id when persistence succeeded', () => {
    expect(requireCreatedOrderId('quote', null, 'order-123')).toBe('order-123');
  });

  it('throws on database insert errors so Stripe can retry the event', () => {
    expect(() => requireCreatedOrderId('catalog', { message: 'not-null violation' }, null)).toThrow(
      'catalog order insert failed: not-null violation',
    );
  });

  it('throws when Supabase reports no error but returns no order id', () => {
    expect(() => requireCreatedOrderId('quote', null, null)).toThrow(
      'quote order insert returned no id',
    );
  });
});
