'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

export type CartLocale = 'es' | 'ru';

export interface CartItem {
  priceId      : string;
  name         : string;
  displayPrice : string;
  slug         : string;
  category     : string;
  locale?      : CartLocale;
  disbursements?: string[];
  disbursementNotice?: string;
  contentOrigin?: string;
  itemType?    : 'service' | 'subscription';
  quantity?    : number;
  billingInterval?: 'month' | 'year';
  href?        : string;
}

interface CartContextValue {
  items    : CartItem[];
  addItem  : (item: CartItem) => void;
  removeItem: (priceId: string) => void;
  setQuantity: (priceId: string, quantity: number) => void;
  clearCart: () => void;
  isOpen   : boolean;
  open     : () => void;
  close    : () => void;
  toggle   : () => void;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = 'expert_cart_v1';

export function collectCartDisbursements(items: CartItem[]) {
  return [...new Set(items.flatMap(item => item.disbursements ?? []))];
}

export function resolveCartLocale(items: CartItem[]): CartLocale {
  return items.length > 0 && items.every(item => item.locale === 'ru') ? 'ru' : 'es';
}

export function collectCartContentOrigins(items: CartItem[]) {
  return [...new Set(
    items
      .map((item) => item.contentOrigin?.trim())
      .filter((value): value is string => Boolean(value))
  )];
}

export function buildCartCheckoutPayload(items: CartItem[], disbursementMandateAccepted = false, companyId?: string) {
  const disbursements = collectCartDisbursements(items);
  const contentOrigins = collectCartContentOrigins(items);

  const hasSubscriptions = cartContainsSubscriptions(items);

  return {
    priceIds: items.flatMap(i => Array.from({ length: Math.max(1, i.quantity ?? 1) }, () => i.priceId)),
    ...(hasSubscriptions ? {
      items: items.map(i => ({
        priceId: i.priceId,
        quantity: Math.max(1, i.quantity ?? 1),
        itemType: i.itemType ?? 'service',
        ...(i.billingInterval ? { billingInterval: i.billingInterval } : {}),
      })),
    } : {}),
    locale: resolveCartLocale(items),
    ...(contentOrigins.length > 0 ? { contentOrigins } : {}),
    ...(companyId ? { companyId } : {}),
    ...(disbursements.length > 0
      ? { disbursements, disbursementMandateAccepted }
      : {}),
  };
}

export function cartContainsDisbursements(items: CartItem[]) {
  return collectCartDisbursements(items).length > 0;
}

export function cartContainsSubscriptions(items: CartItem[]) {
  return items.some(item => item.itemType === 'subscription');
}

export function getCartCheckoutEndpoint(items: CartItem[]) {
  return cartContainsSubscriptions(items)
    ? '/api/subscriptions/cart-checkout'
    : '/api/services/checkout';
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items,    setItems]    = useState<CartItem[]>([]);
  const [isOpen,   setIsOpen]   = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage once on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw) as CartItem[]); // eslint-disable-line react-hooks/set-state-in-effect
    } catch { /* ignore */ }
    setHydrated(true);
  }, []);

  // Persist on change
  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const addItem = useCallback((item: CartItem) => {
    setItems(prev => {
      const index = prev.findIndex(i => i.priceId === item.priceId);
      if (index < 0) return [...prev, { ...item, quantity: Math.max(1, item.quantity ?? 1) }];
      if ((item.itemType ?? prev[index].itemType ?? 'service') !== 'subscription') return prev;
      return prev.map((current, currentIndex) =>
        currentIndex === index
          ? { ...current, quantity: Math.min(20, Math.max(1, current.quantity ?? 1) + Math.max(1, item.quantity ?? 1)) }
          : current
      );
    });
    setIsOpen(true);
  }, []);

  const removeItem = useCallback((priceId: string) => {
    setItems(prev => prev.filter(i => i.priceId !== priceId));
  }, []);

  const setQuantity = useCallback((priceId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems(prev => prev.filter(i => i.priceId !== priceId));
      return;
    }
    setItems(prev => prev.map(item =>
      item.priceId === priceId
        ? { ...item, quantity: Math.min(20, Math.max(1, quantity)) }
        : item
    ));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);
  const open      = useCallback(() => setIsOpen(true),  []);
  const close     = useCallback(() => setIsOpen(false), []);
  const toggle    = useCallback(() => setIsOpen(v => !v), []);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, setQuantity, clearCart, isOpen, open, close, toggle }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
