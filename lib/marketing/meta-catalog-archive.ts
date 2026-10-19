import type { CategorySlug, Service } from '../utils/catalog';
import { parseServicePrice } from './meta-catalog-pricing';

// Meta-only feed eligibility note (clarified by Direction 2026-10-19):
// These are components included in subscription plans, not retired offerings.
// Keep their standalone Meta feed entries paused while sale scope and eligibility
// are reviewed. This filter NEVER removes monthly subscriptions from the
// EXPERT website, its active plans, Stripe, or the canonical commercial offer.
export const SUBSCRIPTION_ONLY_SLUGS = new Set([
  'contabilidad-mensual',
  'impuestos-trimestrales',
  'baja-cese-actividad',
  'cuentas-anuales',
]);

// Ksenia (2026-09-22): "Constitución de SL por CIRCE" is a guided/formación
// offer, not a full gestoría service — Meta category only, the live site's
// own categoria (and URL) is untouched.
export const CATEGORY_OVERRIDES: Record<string, CategorySlug> = {
  'constitucion-sl-circe': 'formacion',
};

/** True only for the legacy Meta-feed/card subset; not for the EXPERT public service catalog. */
export function isArchivedService(service: Service): boolean {
  return SUBSCRIPTION_ONLY_SLUGS.has(service.slug) || parseServicePrice(service.price).priceMode === 'quote';
}

export type MonthlyPlan = {
  slug: string;
  name: string;
  description: string;
  landingPath: string;
  amountCents: number | null;
};

// The 3 plans with a real, fixed monthly price (from
// lib/data/kia-knowledge/monthly-plans.ts). "Plan Personalizado" is
// Presupuesto/quote-only, so it's archived like any other no-price item.
export const MONTHLY_PLANS: MonthlyPlan[] = [
  {
    slug: 'plan-supervision',
    name: 'Plan Supervisión',
    description: 'Revisión mensual básica de Holded, alertas y soporte para quien lleva su contabilidad por su cuenta.',
    landingPath: '/planes/supervision',
    amountCents: 4900,
  },
  {
    slug: 'plan-avanzado',
    name: 'Plan Avanzado',
    description: 'Revisión mensual, cierre trimestral y preparación/presentación de impuestos básicos según alcance.',
    landingPath: '/planes/avanzado',
    amountCents: 9900,
  },
  {
    slug: 'plan-colaborativo',
    name: 'Plan Colaborativo',
    description: 'Revisión y validación mensual por EXPERT, informes, alertas de anomalías y soporte prioritario 24h.',
    landingPath: '/planes/colaborativo',
    amountCents: 19900,
  },
];
