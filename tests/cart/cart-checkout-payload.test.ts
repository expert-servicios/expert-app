import { describe, expect, it } from 'vitest';
import {
  buildCartCheckoutPayload,
  type CartItem,
} from '@/contexts/CartContext';

const serviceWithDisbursement: CartItem = {
  priceId: 'price_test',
  name: 'Nacionalidad española menor nacido en España',
  displayPrice: '302,50 € honorarios + 104,05 € tasa',
  slug: 'nacionalidad-espanola-menor-nacido-en-espana',
  category: 'extranjeria-nacionalidad',
  disbursements: ['mjusticia_790_026_nacionalidad_residencia'],
};

describe('cart checkout payload', () => {
  it('does not imply acceptance for a disbursement', () => {
    expect(buildCartCheckoutPayload([serviceWithDisbursement])).toEqual({
      priceIds: ['price_test'],
      disbursements: ['mjusticia_790_026_nacionalidad_residencia'],
      disbursementMandateAccepted: false,
    });
  });

  it('only marks the mandate accepted after explicit consent', () => {
    expect(buildCartCheckoutPayload([serviceWithDisbursement], true)).toEqual({
      priceIds: ['price_test'],
      disbursements: ['mjusticia_790_026_nacionalidad_residencia'],
      disbursementMandateAccepted: true,
    });
  });

  it('does not add mandate metadata to ordinary services', () => {
    const ordinary: CartItem = {
      ...serviceWithDisbursement,
      priceId: 'price_ordinary',
      disbursements: undefined,
    };

    expect(buildCartCheckoutPayload([ordinary], true)).toEqual({
      priceIds: ['price_ordinary'],
    });
  });
});
