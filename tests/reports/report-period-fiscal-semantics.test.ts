import { describe, expect, it } from 'vitest';
import {
  holdedDocumentVat,
  resolveReportPeriod,
} from '@/lib/reports/report-generator';
import type { HoldedReadDocument } from '@/lib/integrations/holded/holded-gateway';

function doc(overrides: Partial<HoldedReadDocument> = {}): HoldedReadDocument {
  return {
    id: 'd1',
    number: 'F-1',
    date: '2026-10-01',
    timestamp: Date.parse('2026-10-01T00:00:00Z') / 1000,
    dueDate: null,
    accountingDate: '2026-10-01',
    accountingTimestamp: Date.parse('2026-10-01T00:00:00Z') / 1000,
    total: 121,
    subtotal: 100,
    tax: 21,
    currency: 'EUR',
    status: 'approved',
    contactId: null,
    contactName: 'Cliente',
    paymentsPending: 0,
    isDraft: false,
    ...overrides,
  };
}

describe('company report fiscal semantics', () => {
  it('resolves a quarter into exact UTC boundaries', () => {
    expect(resolveReportPeriod('Q4 2026')).toEqual({
      label: 'Q4 2026',
      year: 2026,
      quarter: 4,
      startDate: '2026-10-01',
      endDate: '2026-12-31',
      fromTimestamp: Date.parse('2026-10-01T00:00:00Z') / 1000,
      toTimestamp: Date.parse('2026-12-31T23:59:59Z') / 1000,
    });
  });

  it('rejects labels that cannot be used to scope accounting data', () => {
    expect(() => resolveReportPeriod('octubre 2026')).toThrow('Periodo inválido');
    expect(() => resolveReportPeriod('Q5 2026')).toThrow('Periodo inválido');
  });

  it('uses the tax recorded by Holded instead of assuming a flat 21 percent', () => {
    expect(holdedDocumentVat(doc({ total: 110, subtotal: 100, tax: 10 }))).toBe(10);
    expect(holdedDocumentVat(doc({ total: 104, subtotal: 100, tax: 4 }))).toBe(4);
  });

  it('falls back to total minus subtotal only when tax is absent', () => {
    expect(holdedDocumentVat(doc({ total: 110, subtotal: 100, tax: undefined as unknown as number }))).toBe(10);
    expect(holdedDocumentVat(doc({ total: 121, subtotal: 100, tax: null as unknown as number }))).toBe(21);
  });
});
