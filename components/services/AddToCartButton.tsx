'use client';

import { useEffect } from 'react';
import { ShoppingBag, Check } from 'lucide-react';
import { useCart, type CartItem } from '@/contexts/CartContext';

type AddToCartButtonProps = {
  item        : CartItem;
  label?      : string;
  inCartLabel?: string;
  className?  : string;
};

const DEFAULT_CLASS =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#D4A017] px-7 py-3 text-sm font-bold text-[#0D1B2A] shadow-md shadow-[#D4A017]/20 transition hover:bg-[#F2C14E] disabled:cursor-not-allowed disabled:opacity-60';

const DEFAULT_LABEL = 'Añadir a la cesta';
const NACIONALIDAD_MENOR_SLUG = 'nacionalidad-espanola-menor-nacido-en-espana';
const NACIONALIDAD_MENOR_TASA_KEY = 'mjusticia_790_026_nacionalidad_residencia';
const NACIONALIDAD_MENOR_DISPLAY_PRICE = '302,50 € honorarios + 104,05 € tasa';
const NACIONALIDAD_MENOR_LABEL = 'Contratar — 302,50 € + tasa 104,05 €';
const NACIONALIDAD_MENOR_NOTICE =
  'Incluye tasa obligatoria Ministerio de Justicia 790-026: 104,05 € como suplido separado de los honorarios.';

const CLIENT_COPY_REPLACEMENTS = new Map([
  [
    'Tasa administrativa 790-026: 104,05 € no incluida',
    'Tasa administrativa 790-026: 104,05 € incluida como suplido obligatorio',
  ],
  [
    'El pago corresponde exclusivamente a los honorarios profesionales por la preparación y presentación del expediente. La tasa administrativa del Ministerio de Justicia, actualmente 104,05 €, no está incluida y se abonará aparte.',
    'Al contratar se pagan los honorarios profesionales y la tasa obligatoria 790-026. La tasa se cobra como suplido para abonarla en nombre y por cuenta del cliente; no forma parte de la base de honorarios.',
  ],
  [
    'No. La tasa administrativa del Ministerio de Justicia, actualmente 104,05 €, se paga aparte.',
    'Sí. Al contratar este servicio se cobran los honorarios profesionales y, además, la tasa oficial 790-026 de 104,05 € como suplido. La tasa no forma parte de nuestros honorarios ni de la base imponible del servicio; se abona en nombre y por cuenta del cliente.',
  ],
  [
    'Sí, podemos gestionarla en nombre del cliente cuando el expediente esté preparado, avisando previamente y cumplimentando los datos a nombre del menor solicitante.',
    'Sí. En este servicio la tasa se incluye al contratar como suplido obligatorio, previa autorización del cliente, y se abona a nombre de la menor solicitante.',
  ],
  [
    'Instrucciones para el pago de la tasa administrativa 790-026',
    'Gestión del pago de la tasa administrativa 790-026 como suplido, con justificante a nombre de la menor solicitante',
  ],
  [
    'Cuando el expediente está preparado, indicamos cómo abonar la tasa oficial del Ministerio de Justicia.',
    'Al contratar el servicio se incluyen los honorarios y la tasa oficial obligatoria. EXPERT abona la tasa 790-026 como suplido en nombre y por cuenta del cliente.',
  ],
  [
    'Tasa administrativa del Ministerio de Justicia: 104,05 €',
    'La tasa 790-026 se incluye como suplido obligatorio y no forma parte de los honorarios',
  ],
  [
    'Contratar — 250 € + IVA',
    NACIONALIDAD_MENOR_LABEL,
  ],
]);

function withMandatoryDisbursements(item: CartItem): CartItem {
  if (item.slug !== NACIONALIDAD_MENOR_SLUG) return item;

  return {
    ...item,
    displayPrice: item.displayPrice || NACIONALIDAD_MENOR_DISPLAY_PRICE,
    disbursements: [...new Set([...(item.disbursements ?? []), NACIONALIDAD_MENOR_TASA_KEY])],
    disbursementNotice: item.disbursementNotice ?? NACIONALIDAD_MENOR_NOTICE,
  };
}

function rewriteVisibleClientCopy() {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];

  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (node.nodeType === Node.TEXT_NODE) nodes.push(node as Text);
  }

  for (const node of nodes) {
    let value = node.nodeValue ?? '';
    for (const [from, to] of CLIENT_COPY_REPLACEMENTS) {
      value = value.replaceAll(from, to);
    }
    node.nodeValue = value;
  }
}

export function AddToCartButton({ item, label = DEFAULT_LABEL, inCartLabel = 'En la cesta', className }: AddToCartButtonProps) {
  const { addItem, items } = useCart();
  const cartItem = withMandatoryDisbursements(item);
  const inCart = items.some(i => i.priceId === cartItem.priceId);
  const isNacionalidadMenor = cartItem.slug === NACIONALIDAD_MENOR_SLUG;
  const buttonLabel = isNacionalidadMenor && label === DEFAULT_LABEL ? NACIONALIDAD_MENOR_LABEL : label;

  useEffect(() => {
    if (!isNacionalidadMenor) return;
    rewriteVisibleClientCopy();
  }, [isNacionalidadMenor]);

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
          {inCartLabel}
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
