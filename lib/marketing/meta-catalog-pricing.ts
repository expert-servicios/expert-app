export type CommercialPriceMode = 'fixed' | 'from' | 'quote';
export type VatTreatment = 'plus_vat' | 'vat_included' | 'exempt' | 'outside_scope' | 'manual_review';

export type ParsedServicePrice = {
  priceMode: CommercialPriceMode;
  amountCents: number | null;
  currency: 'EUR';
  vatTreatment: VatTreatment;
  /** Free-text qualifier captured after a "/", e.g. "trimestre", "empleado". Not a DB column. */
  perUnit: string | null;
  warnings: string[];
};

const PRICE_PATTERN = /^(Desde\s+)?([\d.,]+)\s*€\s*\+\s*IVA(?:\s*\/\s*(.+))?$/i;

/**
 * Parses the free-text `Service.price` strings used across the public catalog
 * ("150 € + IVA", "Desde 80 € + IVA / modelo", "Consultar") into the
 * structured shape the `commercial_offers` C2 table expects.
 */
export function parseServicePrice(raw: string | undefined | null): ParsedServicePrice {
  const value = raw?.trim();

  if (!value || value.toLowerCase() === 'consultar') {
    return {
      priceMode: 'quote',
      amountCents: null,
      currency: 'EUR',
      vatTreatment: 'manual_review',
      perUnit: null,
      warnings: value ? [] : ['missing_price'],
    };
  }

  const match = value.match(PRICE_PATTERN);
  if (!match) {
    return {
      priceMode: 'quote',
      amountCents: null,
      currency: 'EUR',
      vatTreatment: 'manual_review',
      perUnit: null,
      warnings: [`unparsed_price_format:${value}`],
    };
  }

  const [, fromPrefix, numeric, unit] = match;
  const normalized = numeric.replace(/\./g, '').replace(',', '.');
  const amount = Number(normalized);

  if (!Number.isFinite(amount)) {
    return {
      priceMode: 'quote',
      amountCents: null,
      currency: 'EUR',
      vatTreatment: 'manual_review',
      perUnit: null,
      warnings: [`unparsed_price_format:${value}`],
    };
  }

  const perUnit = unit?.trim() || null;
  const warnings: string[] = [];
  if (perUnit) warnings.push(`per_unit_pricing:${perUnit}`);

  return {
    priceMode: fromPrefix ? 'from' : 'fixed',
    amountCents: Math.round(amount * 100),
    currency: 'EUR',
    vatTreatment: 'plus_vat',
    perUnit,
    warnings,
  };
}
