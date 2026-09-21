export type OrderInsertError = { message?: string | null } | null | undefined;

export type CatalogPaymentBreakdown = {
  stripeTotalCents: number;
  professionalGrossCents: number;
  professionalNetCents: number;
  disbursementTotalCents: number;
  disbursementKeys: string[];
  mandateAccepted: boolean;
};

function parseMetadataCents(value?: string | null): number | null {
  if (value == null || value === '') return null;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isSafeInteger(parsed) || parsed < 0) return null;
  return parsed;
}

// Catalog checkout sessions can bundle a client disbursement (suplido)
// collected by Stripe alongside professional revenue. The disbursement is
// never professional income, so it must be excluded from orders.amount_eur
// and, downstream, from the Holded invoice amount that reads it back.
export function resolveCatalogPaymentBreakdown(input: {
  amountTotalCents: number;
  revenueAmountCents?: string | null;
  disbursementTotalCents?: string | null;
  disbursementKeys?: string | null;
  disbursementMandateAccepted?: string | null;
}): CatalogPaymentBreakdown {
  if (!Number.isSafeInteger(input.amountTotalCents) || input.amountTotalCents < 0) {
    throw new Error('[stripe webhook] invalid catalog payment total; manual review required');
  }

  const disbursementTotalCents = parseMetadataCents(input.disbursementTotalCents) ?? 0;
  if (disbursementTotalCents > input.amountTotalCents) {
    throw new Error('[stripe webhook] disbursement exceeds catalog payment total; manual review required');
  }

  const professionalGrossCents = input.amountTotalCents - disbursementTotalCents;
  const professionalNetCents = parseMetadataCents(input.revenueAmountCents) ?? professionalGrossCents;
  if (professionalNetCents > professionalGrossCents) {
    throw new Error('[stripe webhook] catalog revenue metadata exceeds professional gross; manual review required');
  }

  const disbursementKeys = (input.disbursementKeys ?? '')
    .split(',')
    .map((key) => key.trim())
    .filter(Boolean);
  const mandateAccepted = input.disbursementMandateAccepted === 'true';

  if (disbursementTotalCents > 0 && !mandateAccepted) {
    throw new Error('[stripe webhook] paid catalog session contains a disbursement without an accepted mandate; manual review required');
  }

  return {
    stripeTotalCents: input.amountTotalCents,
    professionalGrossCents,
    professionalNetCents,
    disbursementTotalCents,
    disbursementKeys,
    mandateAccepted,
  };
}

export function legacyOrderFields(amountEur: number, packName?: string | null) {
  return {
    amount: amountEur,
    pack_name: packName?.trim() || 'Servicio EXPERT',
  };
}

export function requireCreatedOrderId(
  context: 'quote' | 'catalog',
  error: OrderInsertError,
  orderId?: string | null,
): string {
  if (error) {
    throw new Error(
      `[stripe webhook] ${context} order insert failed: ${error.message ?? 'unknown database error'}`,
    );
  }

  if (!orderId) {
    throw new Error(`[stripe webhook] ${context} order insert returned no id`);
  }

  return orderId;
}
