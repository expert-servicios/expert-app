'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { buildCartCheckoutPayload, cartContainsDisbursements, collectCartDisbursements, resolveCartLocale, useCart } from '@/contexts/CartContext';
import { QuickProfileGate } from '@/components/cart/QuickProfileGate';
import { CompanyCheckoutGate } from '@/components/cart/CompanyCheckoutGate';
import { getPublicServicePath } from '@/lib/i18n/service-routes';

const COPY = {
  es: {
    dialog: 'Cesta de servicios',
    title: 'Tu cesta',
    close: 'Cerrar cesta',
    empty: 'Tu cesta está vacía',
    emptyHint: 'Añade servicios desde las páginas de cada área',
    viewServices: 'Ver servicios',
    remove: 'Eliminar',
    paymentNote: 'El importe final, los impuestos y el desglose se confirman en la pasarela de pago Stripe.',
    disbursementNote: ' Los suplidos obligatorios se cobran separados de los honorarios y no forman parte de la base del servicio.',
    mandate: 'Confirmo que autorizo a EXPERT / Ksenia Ilicheva a abonar la tasa oficial indicada en nombre y por cuenta del cliente. Entiendo que este importe es un suplido y no forma parte de los honorarios profesionales.',
    mandateRequired: 'Debes aceptar expresamente el mandato de suplido antes de continuar.',
    checkoutError: 'No hemos podido iniciar el pago.',
    loading: 'Redirigiendo...',
    checkout: 'Tramitar pedido',
    fullCart: 'Ver cesta completa →',
  },
  ru: {
    dialog: 'Корзина услуг',
    title: 'Ваша корзина',
    close: 'Закрыть корзину',
    empty: 'Корзина пуста',
    emptyHint: 'Добавьте нужную услугу со страницы услуги',
    viewServices: 'Вернуться к услугам',
    remove: 'Удалить',
    paymentNote: 'Итоговая сумма, налоги и подробная разбивка подтверждаются в платёжной форме Stripe.',
    disbursementNote: ' Обязательная государственная пошлина взимается отдельно от профессиональных услуг как suplido и не входит в базу вознаграждения.',
    mandate: 'Подтверждаю, что поручаю EXPERT / Ksenia Ilicheva оплатить указанную государственную пошлину от имени и за счёт клиента. Понимаю, что эта сумма является suplido и не относится к профессиональному вознаграждению.',
    mandateRequired: 'Перед продолжением необходимо прямо подтвердить поручение на оплату пошлины как suplido.',
    checkoutError: 'Не удалось перейти к оплате.',
    loading: 'Переходим к оплате...',
    checkout: 'Перейти к оплате',
    fullCart: 'Вернуться к услуге →',
  },
} as const;

export function CartSidebar() {
  const pathname = usePathname();
  const { items, removeItem, clearCart, isOpen, close } = useCart();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [needsCompany, setNeedsCompany] = useState(false);
  const [disbursementMandateAccepted, setDisbursementMandateAccepted] = useState(false);
  const hasDisbursements = cartContainsDisbursements(items);
  const disbursements = collectCartDisbursements(items);
  const locale = items.length === 0 && pathname.startsWith('/ru/') ? 'ru' : resolveCartLocale(items);
  const t = COPY[locale];
  const loginNextPath = locale === 'ru' ? '/carrito?lang=ru' : '/carrito';

  const itemHref = (item: { category: string; slug: string; locale?: 'es' | 'ru' }) =>
    getPublicServicePath(item, item.locale ?? locale);

  const goToCheckoutUrl = (url: string) => {
    clearCart();
    window.location.href = url;
  };

  const handleCheckout = async (companyId?: string) => {
    if (items.length === 0) return;
    if (hasDisbursements && !disbursementMandateAccepted) {
      setError(t.mandateRequired);
      return;
    }
    setLoading(true);
    setError(null);
    setNeedsProfile(false);
    if (!companyId) setNeedsCompany(false);
    try {
      const res  = await fetch('/api/services/checkout', {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify(buildCartCheckoutPayload(items, disbursementMandateAccepted, companyId)),
      });
      const data = await res.json() as { url?: string; error?: string; requiresAuth?: boolean; code?: string };
      if (res.status === 401 || data.requiresAuth) {
        window.location.href = `/auth/login?next=${encodeURIComponent(loginNextPath)}&lang=${locale}`;
        return;
      }
      if (res.status === 409 && data.code === 'profile_required') {
        setNeedsProfile(true);
        setNeedsCompany(false);
        return;
      }
      if (res.status === 409 && data.code === 'company_required') {
        setNeedsCompany(true);
        setNeedsProfile(false);
        return;
      }
      if (data.url) {
        goToCheckoutUrl(data.url);
        return;
      }
      setError(locale === 'ru' ? t.checkoutError : (data.error ?? t.checkoutError));
    } catch {
      setError(t.checkoutError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        className={[
          'fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm transition-opacity duration-300',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        ].join(' ')}
        onClick={close}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-label={t.dialog}
        aria-modal="true"
        className={[
          'fixed right-0 top-0 z-[90] flex h-full w-full max-w-sm flex-col bg-white shadow-2xl transition-transform duration-300',
          isOpen ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
      >
        <div className="flex items-center justify-between border-b border-[#D4A017]/20 bg-[#0D1B2A] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="h-5 w-5 text-[#D4A017]" />
            <h2 className="font-serif text-lg font-bold text-white">{t.title}</h2>
            {items.length > 0 && (
              <span className="rounded-full bg-[#D4A017] px-2 py-0.5 text-xs font-bold text-[#0D1B2A]">
                {items.length}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={close}
            aria-label={t.close}
            className="rounded-full p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <ShoppingBag className="h-12 w-12 text-[#D4A017]/30" />
              <p className="font-semibold text-[#0D1B2A]">{t.empty}</p>
              <p className="text-sm text-[#23364D]/60">{t.emptyHint}</p>
              <button
                type="button"
                onClick={close}
                className="mt-2 rounded-xl bg-[#D4A017] px-5 py-2.5 text-sm font-bold text-[#0D1B2A] transition hover:bg-[#F2C14E]"
              >
                {t.viewServices}
              </button>
            </div>
          ) : (
            <ul className="space-y-3">
              {items.map(item => (
                <li key={item.priceId} className="rounded-2xl border border-[#D4A017]/20 bg-[#F8F6F1] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <Link
                        href={itemHref(item)}
                        onClick={close}
                        className="text-sm font-semibold text-[#0D1B2A] leading-snug hover:text-[#D4A017] transition"
                      >
                        {item.name}
                      </Link>
                      <p className="mt-1 text-sm font-bold text-[#D4A017]">{item.displayPrice}</p>
                      {item.disbursementNotice && (
                        <p className="mt-2 rounded-lg border border-[#D4A017]/25 bg-white px-3 py-2 text-[11px] leading-5 text-[#23364D]/70">
                          {item.disbursementNotice}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.priceId)}
                      aria-label={`${t.remove} ${item.name}`}
                      className="shrink-0 rounded-lg p-1.5 text-[#23364D]/40 transition hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="space-y-3 border-t border-[#D4A017]/20 p-5">
            <p className="text-xs leading-relaxed text-[#23364D]/60">
              {t.paymentNote}
              {hasDisbursements ? t.disbursementNote : ''}
            </p>
            {hasDisbursements && (
              <label className="flex items-start gap-2.5 rounded-xl border border-[#D4A017]/30 bg-[#F8F6F1] p-3 text-xs leading-5 text-[#23364D]">
                <input
                  type="checkbox"
                  checked={disbursementMandateAccepted}
                  onChange={(event) => {
                    setDisbursementMandateAccepted(event.target.checked);
                    if (event.target.checked) setError(null);
                  }}
                  className="mt-1 h-4 w-4 shrink-0 accent-[#D4A017]"
                />
                <span>{t.mandate}</span>
              </label>
            )}
            {error && <p role="alert" aria-live="assertive" className="text-xs font-semibold text-red-700">{error}</p>}
            {needsCompany ? (
              <CompanyCheckoutGate
                locale={locale}
                loading={loading}
                returnPath={locale === 'ru' ? '/carrito?lang=ru' : '/carrito'}
                onContinue={(companyId) => { void handleCheckout(companyId); }}
              />
            ) : needsProfile ? (
              <QuickProfileGate
                priceIds={items.map(i => i.priceId)}
                disbursements={disbursements}
                disbursementMandateAccepted={disbursementMandateAccepted}
                locale={locale}
                loginNextPath={loginNextPath}
                onCompanyRequired={() => { setNeedsProfile(false); setNeedsCompany(true); }}
                onCheckoutUrl={goToCheckoutUrl}
              />
            ) : (
              <button
                type="button"
                onClick={() => { void handleCheckout(); }}
                disabled={loading || (hasDisbursements && !disbursementMandateAccepted)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#D4A017] py-3 text-sm font-bold text-[#0D1B2A] shadow-md shadow-[#D4A017]/20 transition hover:bg-[#F2C14E] disabled:opacity-60"
              >
                <ArrowRight className="h-4 w-4" />
                {loading ? t.loading : t.checkout}
              </button>
            )}
            <Link
              href={locale === 'ru' ? '/carrito?lang=ru' : '/carrito'}
              onClick={close}
              className="block text-center text-sm font-medium text-[#23364D] transition hover:text-[#D4A017]"
            >
              {t.fullCart}
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
