import type { CheckoutLocale } from '@/lib/payments/service-checkout-locale';
import { getRuServicePath as getLocalizedRuServicePath } from '@/lib/services/service-localized-content';

export function getPublicServicePath(
  service: { slug: string; category: string },
  locale: CheckoutLocale | 'es' | 'ru',
): string {
  if (locale === 'ru') {
    const ruPath = getLocalizedRuServicePath(service.slug);
    if (ruPath) return ruPath;
  }
  return `/servicios/${service.category}/${service.slug}`;
}

export function getRuServicePath(slug: string): string | null {
  return getLocalizedRuServicePath(slug) ?? null;
}
