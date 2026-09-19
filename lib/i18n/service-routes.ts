import type { CheckoutLocale } from '@/lib/payments/service-checkout-locale';

const RU_SERVICE_PATHS: Readonly<Record<string, string>> = {
  'nacionalidad-espanola-menor-nacido-en-espana': '/ru/uslugi/grazhdanstvo-ispanii-rebenok-rozhdennyy-v-ispanii',
  'certificado-digital-persona-fisica': '/ru/uslugi/cifrovoi-sertifikat-fizicheskogo-litsa',
  'certificado-digital-entidad': '/ru/uslugi/cifrovoi-sertifikat-organizatsii',
  'pack-certificados-digitales': '/ru/uslugi/paket-cifrovyh-sertifikatov',
  'arraigo-social': '/ru/uslugi/arraigo-social',
};

export function getPublicServicePath(
  service: { slug: string; category: string },
  locale: CheckoutLocale | 'es' | 'ru',
): string {
  if (locale === 'ru') {
    const ruPath = RU_SERVICE_PATHS[service.slug];
    if (ruPath) return ruPath;
  }
  return `/servicios/${service.category}/${service.slug}`;
}

export function getRuServicePath(slug: string): string | null {
  return RU_SERVICE_PATHS[slug] ?? null;
}
