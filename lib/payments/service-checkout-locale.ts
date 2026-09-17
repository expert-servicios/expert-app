export type CheckoutLocale = 'es' | 'ru';

const RUSSIAN_CHECKOUT_SERVICE_SLUGS = new Set([
  'nacionalidad-espanola-menor-nacido-en-espana',
]);

export function resolveServiceCheckoutLocale(
  serviceSlugs: string[],
  requestedLocale: CheckoutLocale,
): CheckoutLocale {
  if (
    requestedLocale === 'ru'
    && serviceSlugs.length === 1
    && RUSSIAN_CHECKOUT_SERVICE_SLUGS.has(serviceSlugs[0])
  ) {
    return 'ru';
  }

  return 'es';
}
