import { services as catalogServices } from '@/lib/utils/catalog';
import { toStripeAscii } from '@/lib/integrations/stripe';

export type ServiceCheckoutItem = {
  priceId: string;
  name: string;
  slug: string;
  category: string;
  unitAmount: number;
};

export type ServiceDisbursementItem = {
  key: string;
  name: string;
  unitAmount: number;
  beneficiary: string;
  officialModel: string;
  taxable: false;
  revenueAffecting: false;
};

export const SERVICE_DISBURSEMENT_KEYS = [
  'mjusticia_790_026_nacionalidad_residencia',
] as const;

export type ServiceDisbursementKey = (typeof SERVICE_DISBURSEMENT_KEYS)[number];

function parseUnitAmount(price?: string): number | null {
  if (!price) return null;
  const match = price.match(/[\d.,]+/);
  if (!match) return null;
  // Strip Spanish thousands dots (dot followed by exactly 3 digits: "1.199" → "1199")
  // then normalise decimal comma to dot ("1.199,50" → "1199.50")
  const cleaned = match[0]
    .replace(/\.(\d{3})/g, '$1')
    .replace(',', '.');
  const amount = Number.parseFloat(cleaned);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return Math.round(amount * 100);
}

function buildServiceCheckouts() {
  const checkouts = new Map<string, ServiceCheckoutItem>();

  for (const service of catalogServices) {
    if (!service.stripePriceId) continue;

    const unitAmount = parseUnitAmount(service.price);
    if (!unitAmount) continue;

    checkouts.set(service.stripePriceId, {
      priceId: service.stripePriceId,
      name: service.name,
      slug: service.slug,
      category: service.categoria,
      unitAmount,
    });
  }

  return checkouts;
}

const SERVICE_CHECKOUTS = buildServiceCheckouts();

const SERVICE_DISBURSEMENTS = new Map<ServiceDisbursementKey, ServiceDisbursementItem>([
  ['mjusticia_790_026_nacionalidad_residencia', {
    key             : 'mjusticia_790_026_nacionalidad_residencia',
    name            : 'Suplido tasa Ministerio de Justicia 790-026',
    unitAmount      : 10405,
    beneficiary     : 'Ministerio de Justicia',
    officialModel   : '790-026',
    taxable         : false,
    revenueAffecting: false,
  }],
]);

export function getServiceCheckoutByPriceId(priceId: string): ServiceCheckoutItem | null {
  return SERVICE_CHECKOUTS.get(priceId) ?? null;
}

export function getServiceDisbursementByKey(key: string): ServiceDisbursementItem | null {
  if (!SERVICE_DISBURSEMENT_KEYS.includes(key as ServiceDisbursementKey)) return null;
  return SERVICE_DISBURSEMENTS.get(key as ServiceDisbursementKey) ?? null;
}

export function getServiceCheckoutLineItem(item: ServiceCheckoutItem) {
  return {
    quantity  : 1,
    price_data: {
      currency    : 'eur',
      unit_amount : item.unitAmount,
      tax_behavior: 'exclusive' as const,
      product_data: {
        name    : toStripeAscii(item.name),
        metadata: {
          line_type          : 'service_fee',
          revenue_affecting  : 'true',
          service_slug       : item.slug,
          service_category   : item.category,
          configured_price_id: item.priceId,
        },
      },
    },
  };
}

export function getServiceDisbursementCheckoutLineItem(item: ServiceDisbursementItem) {
  return {
    quantity  : 1,
    price_data: {
      currency    : 'eur',
      unit_amount : item.unitAmount,
      tax_behavior: 'exclusive' as const,
      product_data: {
        name    : toStripeAscii(item.name),
        // Stripe Tax non-taxable tax code. The line is collected by Stripe,
        // but EXPERT treats it as a client disbursement, not professional revenue.
        tax_code: 'txcd_00000000',
        metadata: {
          line_type        : 'disbursement',
          revenue_affecting: 'false',
          taxable          : 'false',
          disbursement_key : item.key,
          beneficiary      : toStripeAscii(item.beneficiary),
          official_model   : item.officialModel,
        },
      },
    },
  };
}

export function getServiceCheckoutMetadata(
  items: ServiceCheckoutItem[],
  disbursements: ServiceDisbursementItem[] = [],
) {
  const isCart = items.length > 1;
  const revenueAmountCents = items.reduce((sum, item) => sum + item.unitAmount, 0);
  const disbursementAmountCents = disbursements.reduce((sum, item) => sum + item.unitAmount, 0);

  return {
    product_type             : isCart ? 'cart' : 'service',
    service_slug             : isCart ? '' : items[0].slug,
    service_name             : isCart ? 'Pedido de servicios EXPERT' : toStripeAscii(items[0].name),
    service_slugs            : items.map((item) => item.slug).join(',').slice(0, 499),
    service_names            : toStripeAscii(items.map((item) => item.name).join(', ')),
    disbursement_keys        : disbursements.map((item) => item.key).join(',').slice(0, 499),
    disbursement_total_cents : String(disbursementAmountCents),
    revenue_amount_cents     : String(revenueAmountCents),
    checkout_total_net_cents : String(revenueAmountCents + disbursementAmountCents),
    contains_disbursements   : disbursements.length > 0 ? 'true' : 'false',
  };
}
