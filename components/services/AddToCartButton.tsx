'use client';

import { usePathname } from 'next/navigation';
import { ShoppingBag, Check } from 'lucide-react';
import { useCart, type CartItem } from '@/contexts/CartContext';
import { NATIONALITY_MINOR_SERVICE } from '@/lib/services/nationality-minor';

type AddToCartButtonProps = {
  item        : CartItem;
  label?      : string;
  inCartLabel?: string;
  className?  : string;
};

const DEFAULT_CLASS =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#D4A017] px-7 py-3 text-sm font-bold text-[#0D1B2A] shadow-md shadow-[#D4A017]/20 transition hover:bg-[#F2C14E] disabled:cursor-not-allowed disabled:opacity-60';

const DEFAULT_LABEL = 'Añadir a la cesta';
const NACIONALIDAD_MENOR_SLUG = NATIONALITY_MINOR_SERVICE.slug;
const NACIONALIDAD_MENOR_TASA_KEY = NATIONALITY_MINOR_SERVICE.disbursementKey;
const NACIONALIDAD_MENOR_DISPLAY_PRICE = '302,50 € honorarios + 104,05 € tasa';
const NACIONALIDAD_MENOR_LABEL = 'Contratar — 302,50 € + tasa 104,05 €';
const NACIONALIDAD_MENOR_NOTICE =
  'Incluye tasa obligatoria Ministerio de Justicia 790-026: 104,05 € como suplido separado de los honorarios.';

function withMandatoryDisbursements(item: CartItem): CartItem {
  if (item.slug !== NACIONALIDAD_MENOR_SLUG) return item;

  return {
    ...item,
    displayPrice: NACIONALIDAD_MENOR_DISPLAY_PRICE,
    disbursements: [...new Set([...(item.disbursements ?? []), NACIONALIDAD_MENOR_TASA_KEY])],
    disbursementNotice: item.disbursementNotice ?? NACIONALIDAD_MENOR_NOTICE,
  };
}

export function AddToCartButton({ item, label = DEFAULT_LABEL, inCartLabel, className }: AddToCartButtonProps) {
  const pathname = usePathname();
  const { addItem, items } = useCart();
  const isRussianPage = pathname.startsWith('/ru/');
  const cartItem = {
    ...withMandatoryDisbursements(item),
    locale: item.locale ?? (isRussianPage ? 'ru' as const : 'es' as const),
  };
  const inCart = items.some(i => i.priceId === cartItem.priceId);
  const isNacionalidadMenor = cartItem.slug === NACIONALIDAD_MENOR_SLUG;
  const buttonLabel = isNacionalidadMenor && label === DEFAULT_LABEL ? NACIONALIDAD_MENOR_LABEL : label;
  const resolvedInCartLabel = inCartLabel ?? (isRussianPage ? 'В корзине' : 'En la cesta');


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
          {resolvedInCartLabel}
        </>
      ) : (
        <>
          <ShoppingBag className="h-4 w-4" />
          {buttonLabel}
        </>
      )}
    </button>
  );
}
