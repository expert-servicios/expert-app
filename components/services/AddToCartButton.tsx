'use client';

import { ShoppingBag, Check } from 'lucide-react';
import { useCart, type CartItem } from '@/contexts/CartContext';

type AddToCartButtonProps = {
  item      : CartItem;
  label?    : string;
  className?: string;
};

const DEFAULT_CLASS =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#D4A017] px-7 py-3 text-sm font-bold text-[#0D1B2A] shadow-md shadow-[#D4A017]/20 transition hover:bg-[#F2C14E] disabled:cursor-not-allowed disabled:opacity-60';

const NACIONALIDAD_MENOR_SLUG = 'nacionalidad-espanola-menor-nacido-en-espana';
const NACIONALIDAD_MENOR_TASA_KEY = 'mjusticia_790_026_nacionalidad_residencia';

function withMandatoryDisbursements(item: CartItem): CartItem {
  if (item.slug !== NACIONALIDAD_MENOR_SLUG) return item;

  return {
    ...item,
    displayPrice: '250 € + IVA + tasa 104,05 €',
    disbursements: [NACIONALIDAD_MENOR_TASA_KEY],
    disbursementNotice:
      'Incluye tasa obligatoria Ministerio de Justicia 790-026: 104,05 € como suplido separado de los honorarios.',
  };
}

export function AddToCartButton({ item, label = 'Añadir a la cesta', className }: AddToCartButtonProps) {
  const { addItem, items } = useCart();
  const cartItem = withMandatoryDisbursements(item);
  const inCart = items.some(i => i.priceId === cartItem.priceId);

  return (
    <button
      type="button"
      onClick={() => { if (!inCart) addItem(cartItem); }}
      disabled={inCart}
      className={className ?? DEFAULT_CLASS}
    >
      {inCart ? (
        <>
          <Check className="h-4 w-4" />
          En la cesta
        </>
      ) : (
        <>
          <ShoppingBag className="h-4 w-4" />
          {label}
        </>
      )}
    </button>
  );
}
