import {
  createHoldedGatewayForIntegration,
  listHoldedDocuments,
  type HoldedReadDocument,
} from '@/lib/integrations/holded/holded-gateway';

export interface MonthlySnapshot {
  month: string;
  sales: number;
  purchases: number;
}

export interface RecentInvoice {
  docNumber: string;
  date: number;
  total: number;
  contact: string;
  status?: string;
}

export interface QuarterSummary {
  year: number;
  quarter: 1 | 2 | 3 | 4;
  salesTotal: number;
  purchasesTotal: number;
  vatRepercutido: number;
  vatSoportado: number;
  vatResult: number;
  salesCount: number;
  purchasesCount: number;
  recentSales: RecentInvoice[];
  recentPurchases: RecentInvoice[];
  monthlyData: MonthlySnapshot[];
  syncedAt: string;
}

const MONTH_LABELS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function quarterToUnix(year: number, quarter: number): { from: number; to: number } {
  const startMonth = (quarter - 1) * 3;
  const start = new Date(Date.UTC(year, startMonth, 1, 0, 0, 0));
  const end   = new Date(Date.UTC(year, startMonth + 3, 0, 23, 59, 59));
  return { from: Math.floor(start.getTime() / 1000), to: Math.floor(end.getTime() / 1000) };
}

function extractVat(doc: HoldedReadDocument): number {
  return Number.isFinite(doc.tax) ? Math.max(0, doc.tax) : Math.max(0, doc.total - doc.subtotal);
}

export async function fetchQuarterData(
  integrationId: string,
  year: number,
  quarter: 1 | 2 | 3 | 4,
): Promise<QuarterSummary> {
  const { from, to } = quarterToUnix(year, quarter);
  const gateway = await createHoldedGatewayForIntegration(integrationId);
  const startDate = new Date(from * 1000).toISOString().slice(0, 10);
  const endDate = new Date(to * 1000).toISOString().slice(0, 10);

  const [salesCandidates, purchaseCandidates] = await Promise.all([
    listHoldedDocuments(gateway, 'sales', { startDate, endDate }).catch((): HoldedReadDocument[] => []),
    gateway.v2
      // v2 purchase tax period follows deduction_date rather than issue date.
      ? listHoldedDocuments(gateway, 'purchase', { maxItems: 2_000 }).catch((): HoldedReadDocument[] => [])
      // v1 has no deduction_date semantic here: preserve the historical quarter-scoped request.
      : listHoldedDocuments(gateway, 'purchase', { startDate, endDate }).catch((): HoldedReadDocument[] => []),
  ]);
  const activeDocument = (d: HoldedReadDocument) =>
    !['cancelled', 'canceled', 'failed'].includes(String(d.status ?? '').toLowerCase());
  const sales = salesCandidates.filter(activeDocument);
  const purchases = purchaseCandidates
    .filter(activeDocument)
    .filter((d) => gateway.v2
      ? d.accountingTimestamp >= from && d.accountingTimestamp <= to
      : true);

  const salesTotal     = sales.reduce((s, d) => s + d.total, 0);
  const purchasesTotal = purchases.reduce((s, d) => s + d.total, 0);
  const vatRepercutido = sales.reduce((s, d) => s + extractVat(d), 0);
  const vatSoportado   = purchases.reduce((s, d) => s + extractVat(d), 0);

  const startMonth = (quarter - 1) * 3;
  const monthlyData: MonthlySnapshot[] = [0, 1, 2].map((offset) => {
    const mi    = startMonth + offset;
    const mFrom = Date.UTC(year, mi, 1, 0, 0, 0) / 1000;
    const mTo   = Date.UTC(year, mi + 1, 0, 23, 59, 59) / 1000;
    return {
      month:     MONTH_LABELS[mi],
      sales:     sales.filter((d) => d.timestamp >= mFrom && d.timestamp <= mTo).reduce((s, d) => s + d.total, 0),
      purchases: purchases.filter((d) => d.accountingTimestamp >= mFrom && d.accountingTimestamp <= mTo).reduce((s, d) => s + d.total, 0),
    };
  });

  return {
    year, quarter,
    salesTotal, purchasesTotal, vatRepercutido, vatSoportado,
    vatResult: vatRepercutido - vatSoportado,
    salesCount: sales.length,
    purchasesCount: purchases.length,
    recentSales: sales.slice(0, 5).map((d) => ({
      docNumber: d.number, date: d.timestamp, total: d.total,
      contact: d.contactName, status: d.status,
    })),
    recentPurchases: purchases.slice(0, 5).map((d) => ({
      docNumber: d.number, date: d.timestamp, total: d.total, contact: d.contactName,
    })),
    monthlyData,
    syncedAt: new Date().toISOString(),
  };
}

export function currentQuarter(now = new Date()): { year: number; quarter: 1 | 2 | 3 | 4 } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Madrid',
    year: 'numeric',
    month: 'numeric',
  }).formatToParts(now);
  const year = Number(parts.find((part) => part.type === 'year')?.value ?? now.getUTCFullYear());
  const month = Number(parts.find((part) => part.type === 'month')?.value ?? (now.getUTCMonth() + 1));
  return {
    year,
    quarter: Math.ceil(month / 3) as 1 | 2 | 3 | 4,
  };
}
