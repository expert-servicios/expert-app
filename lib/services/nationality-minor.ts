export const NATIONALITY_MINOR_SERVICE = {
  slug: 'nacionalidad-espanola-menor-nacido-en-espana',
  category: 'extranjeria-nacionalidad',
  stripePriceId: 'price_1TZXomLeYwwgvux4bTuqVZcU',
  professionalNetCents: 25000,
  vatRate: 0.21,
  professionalGrossCents: 30250,
  officialFeeCents: 10405,
  totalCents: 40655,
  disbursementKey: 'mjusticia_790_026_nacionalidad_residencia',
} as const;

export function formatEuroCents(cents: number, locale: 'es-ES' | 'ru-RU' = 'es-ES') {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}
