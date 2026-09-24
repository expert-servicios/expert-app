import { services } from '@/lib/utils/catalog';

export type QuoteLineRequest = {
  serviceSlug: string;
  quantity: number;
};

export type QuoteLineSnapshot = {
  serviceSlug: string;
  stripePriceId: string | null;
  description: string;
  quantity: number;
  unitAmountCents: number;
  currency: 'EUR';
  taxBehavior: 'exclusive';
  position: number;
  metadata: Record<string, unknown>;
};

export type QuoteLineCatalogItem = {
  slug: string;
  name: string;
  category: string;
  unitAmountCents: number;
  stripePriceId: string | null;
  minQuantity: number;
  maxQuantity: number;
  quantityLabel: string;
};

type QuantityRule = {
  min: number;
  max: number;
  label: string;
};

const QUANTITY_RULES: Readonly<Record<string, QuantityRule>> = {
  'holded-migracion-laboral': {
    min: 5,
    max: 500,
    label: 'empleados',
  },
};

function parseFixedUnitAmount(price?: string): number | null {
  if (!price) return null;
  const normalized = price.trim();
  if (/^(desde|consultar)/i.test(normalized)) return null;

  const match = normalized.match(/[\d.,]+/);
  if (!match) return null;

  const numeric = match[0]
    .replace(/\.(\d{3})/g, '$1')
    .replace(',', '.');
  const amount = Number.parseFloat(numeric);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return Math.round(amount * 100);
}

function catalogItemForServiceSlug(slug: string): QuoteLineCatalogItem | null {
  const service = services.find((item) => item.slug === slug);
  if (!service) return null;
  const quoteOnly = Object.prototype.hasOwnProperty.call(QUANTITY_RULES, slug);
  if (!service.stripePriceId && !quoteOnly) return null;

  const unitAmountCents = parseFixedUnitAmount(service.price);
  if (!unitAmountCents) return null;

  const rule = QUANTITY_RULES[slug] ?? { min: 1, max: 1, label: 'unidad' };

  return {
    slug: service.slug,
    name: service.name,
    category: service.categoria,
    unitAmountCents,
    stripePriceId: service.stripePriceId ?? null,
    minQuantity: rule.min,
    maxQuantity: rule.max,
    quantityLabel: rule.label,
  };
}

export function getQuoteLineCatalog(): QuoteLineCatalogItem[] {
  return services
    .map((service) => catalogItemForServiceSlug(service.slug))
    .filter((item): item is QuoteLineCatalogItem => Boolean(item));
}

export function resolveQuoteLineSnapshots(
  requests: QuoteLineRequest[],
): QuoteLineSnapshot[] {
  if (requests.length === 0) {
    throw new Error('El presupuesto debe contener al menos una línea.');
  }
  if (requests.length > 20) {
    throw new Error('El presupuesto no puede contener más de 20 líneas.');
  }

  const seen = new Set<string>();

  return requests.map((request, position) => {
    if (seen.has(request.serviceSlug)) {
      throw new Error(`Servicio duplicado en el presupuesto: ${request.serviceSlug}`);
    }
    seen.add(request.serviceSlug);

    const item = catalogItemForServiceSlug(request.serviceSlug);
    if (!item) {
      throw new Error(`Servicio no disponible para presupuesto estructurado: ${request.serviceSlug}`);
    }

    if (!Number.isInteger(request.quantity)) {
      throw new Error(`La cantidad de ${item.name} debe ser un número entero.`);
    }
    if (request.quantity < item.minQuantity || request.quantity > item.maxQuantity) {
      const range = item.minQuantity === item.maxQuantity
        ? `${item.minQuantity}`
        : `entre ${item.minQuantity} y ${item.maxQuantity}`;
      throw new Error(`La cantidad de ${item.name} debe ser ${range}.`);
    }

    return {
      serviceSlug: item.slug,
      stripePriceId: item.stripePriceId,
      description: item.name,
      quantity: request.quantity,
      unitAmountCents: item.unitAmountCents,
      currency: 'EUR',
      taxBehavior: 'exclusive',
      position,
      metadata: {
        category: item.category,
        quantity_label: item.quantityLabel,
        source: 'catalog_snapshot',
      },
    };
  });
}

export function quoteLineTotalCents(lines: QuoteLineSnapshot[]): number {
  return lines.reduce(
    (total, line) => total + line.unitAmountCents * line.quantity,
    0,
  );
}
