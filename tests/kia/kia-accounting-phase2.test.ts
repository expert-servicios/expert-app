import { describe, expect, it } from 'vitest';
import {
  getKiaToolPolicy,
  isKiaToolAuthorized,
} from '@/lib/ai/kia/kia-tool-registry';
import { getKiaToolDefinition } from '@/lib/ai/kia/kia-tool-definitions';
import {
  defaultAccountingDocumentRange,
  holdedOutstandingAmount,
  holdedUnreconciledMovementAmount,
  isExpertGlobalHoldedContext,
  isHoldedDocumentOverdue,
  isHoldedDocumentPaid,
  isIssuedHoldedDocument,
  totalsByCurrency,
} from '@/lib/ai/kia/kia-accounting-tools';
import type { KiaContext } from '@/lib/ai/kia/kia-context-builder';

describe('KIA Accounting phase 2 authorization', () => {
  it('registers accounting reads as autonomous R1 reads', () => {
    for (const name of [
      'get_accounts_receivable',
      'get_accounts_payable',
      'get_overdue_invoices',
      'get_unreconciled_transactions',
    ]) {
      expect(getKiaToolDefinition(name)).not.toBeNull();
      expect(getKiaToolPolicy(name)).toMatchObject({
        riskTier: 'R1',
        effect: 'read',
        capability: 'accounting_read',
        requiresHumanApproval: false,
      });
      expect(isKiaToolAuthorized(name, {
        channel: 'dashboard',
        requestedNames: [name],
        maxRiskTier: 'R1',
        allowedEffects: ['read'],
        autonomousOnly: true,
      })).toBe(true);
    }
  });
});

describe('KIA Accounting Holded document semantics', () => {
  it('preserves explicit zero pending balance and payment totals', () => {
    const paid = { status: 1, total: 121, paymentsTotal: 121, paymentsPending: 0 };
    expect(holdedOutstandingAmount(paid)).toBe(0);
    expect(isHoldedDocumentPaid(paid)).toBe(true);

    const partial = { status: 1, total: 121, paymentsTotal: 100, paymentsPending: 21 };
    expect(holdedOutstandingAmount(partial)).toBe(21);
    expect(isHoldedDocumentPaid(partial)).toBe(false);
  });

  it('excludes drafts from receivable/payable semantics', () => {
    const draft = { status: 0, total: 500, paymentsPending: 500 };
    expect(isIssuedHoldedDocument(draft)).toBe(false);
    expect(holdedOutstandingAmount(draft)).toBe(0);
    expect(isHoldedDocumentPaid(draft)).toBe(false);
  });

  it('does not mark a document overdue during its due date in Madrid', () => {
    const due = Date.parse('2026-10-03T00:00:00Z') / 1000;
    const doc = { status: 1, total: 100, paymentsPending: 100, dueDate: due };
    expect(isHoldedDocumentOverdue(doc, Date.parse('2026-10-03T20:00:00Z'))).toBe(false);
    expect(isHoldedDocumentOverdue(doc, Date.parse('2026-10-04T01:00:00Z'))).toBe(true);
  });

  it('returns only the remaining amount for partially reconciled bank movements', () => {
    expect(holdedUnreconciledMovementAmount({
      status: 'partial',
      amount: 1500,
      reconciledAmount: 1000,
    })).toBe(500);
    expect(holdedUnreconciledMovementAmount({
      status: 'partial',
      amount: -1500,
      reconciled_amount: 1000,
    })).toBe(-500);
    expect(holdedUnreconciledMovementAmount({
      status: 'pending',
      amount: 250,
      reconciledAmount: 0,
    })).toBe(250);
    expect(holdedUnreconciledMovementAmount({
      status: 'forced_reconciled',
      amount: 250,
      reconciledAmount: 0,
    })).toBe(0);
  });

  it('groups outstanding totals by currency without cross-currency addition', () => {
    expect(totalsByCurrency([
      { outstanding: 100, currency: 'EUR' },
      { outstanding: 25.5, currency: 'EUR' },
      { outstanding: 100, currency: 'USD' },
    ])).toEqual({ EUR: 125.5, USD: 100 });
  });

  it('uses an explicit previous-year-to-now Holded document range', () => {
    expect(defaultAccountingDocumentRange(new Date('2026-10-03T12:00:00Z'))).toEqual({
      starttmp: String(Date.UTC(2025, 0, 1) / 1000),
      endtmp: String(Date.parse('2026-10-03T12:00:00Z') / 1000),
    });
  });
});

describe('KIA Accounting EXPERT global Holded boundary', () => {
  const baseContext = {
    company: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'EXPERT',
      taxId: 'B44991776',
      hasMonthlyPlan: false,
      coverageSource: 'none',
      coveragePlanName: null,
      coveragePrimaryCompanyId: null,
      coveragePrimaryCompanyName: null,
      coverageScope: null,
      holdedConnected: true,
      holdedPermissions: {},
      holdedPermissionsDetected: {},
      holdedPermissionsEnabled: {},
    },
  } as unknown as KiaContext;

  it('recognizes EXPERT by canonical legal tax id', () => {
    expect(isExpertGlobalHoldedContext(baseContext)).toBe(true);
  });

  it('does not route another company to the EXPERT global credential', () => {
    expect(isExpertGlobalHoldedContext({
      ...baseContext,
      company: { ...baseContext.company!, taxId: 'B54920509' },
    })).toBe(false);
  });
});
