import fs from 'node:fs';
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
  buildPaymentReminderDraft,
  buildCreditNoteProposal,
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


describe('KIA Accounting phase 2B preparation safety', () => {
  it('exposes preparation tools only in Admin and keeps them read-only', () => {
    for (const name of ['prepare_payment_reminder', 'prepare_credit_note_proposal']) {
      expect(getKiaToolDefinition(name)).not.toBeNull();
      expect(getKiaToolPolicy(name)).toMatchObject({
        riskTier: 'R1',
        effect: 'read',
        capability: 'accounting_read',
        requiresHumanApproval: false,
      });
      expect(isKiaToolAuthorized(name, {
        channel: 'admin',
        requestedNames: [name],
        maxRiskTier: 'R1',
        allowedEffects: ['read'],
        autonomousOnly: true,
      })).toBe(true);
      expect(isKiaToolAuthorized(name, {
        channel: 'dashboard',
        requestedNames: [name],
        maxRiskTier: 'R1',
        allowedEffects: ['read'],
        autonomousOnly: true,
      })).toBe(false);
    }
  });

  it('preserves invoice currency in payment-reminder drafts', () => {
    const invoice = {
      id: 'inv-1',
      number: 'F-2026-10',
      date: 1_790_000_000,
      dueDate: 1_790_000_000,
      contact: 'Cliente Test',
      total: 250,
      outstanding: 125.5,
      currency: 'USD',
      status: 1,
      overdue: true,
    };
    const draft = buildPaymentReminderDraft({ invoice, tone: 'firm', lang: 'es' });
    expect(draft.subject).toContain('F-2026-10');
    expect(draft.body).toContain('125,50 USD');
  });

  it('creates a credit-note proposal without claiming a Holded mutation', () => {
    const invoice = {
      id: 'inv-2',
      number: 'F-2026-11',
      date: 1_790_000_000,
      dueDate: null,
      contact: 'Cliente Test',
      total: 500,
      outstanding: 500,
      currency: 'EUR',
      status: 1,
      overdue: false,
    };
    const proposal = buildCreditNoteProposal({
      invoice,
      reason: 'Corrección parcial',
      amount: 100,
      lang: 'es',
    });
    expect(proposal).toMatchObject({
      proposalType: 'credit_note',
      documentType: 'creditnote',
      proposedAmount: 100,
      requiresHumanApproval: true,
      holdedMutated: false,
    });
  });
});


describe('KIA Accounting v1 Holded compatibility contracts', () => {
  const client = fs.readFileSync('lib/integrations/holded/holded-client.ts', 'utf8');
  const gateway = fs.readFileSync('lib/integrations/holded/holded-gateway.ts', 'utf8');
  const accounting = fs.readFileSync('lib/ai/kia/kia-accounting-tools.ts', 'utf8');

  it('uses the documented v1 treasury endpoint and timestamp query names', () => {
    expect(client).toContain("get<unknown>('/treasury')");
    expect(client).toContain("qs.set('starttmp', String(dateFrom))");
    expect(client).toContain("qs.set('endtmp', String(dateTo))");
    expect(client).not.toContain("get<unknown>('/treasury/accounts')");
  });

  it('caps v2 invoice and purchase pages at 100 but keeps bank movement pages at 200', () => {
    expect(gateway).toContain('limit: Math.min(100, maxItems - items.length)');
    expect(gateway).toContain("status: params.pendingOnly ? ['pending', 'partial'] : undefined");
    expect(gateway).toContain('limit: Math.min(200, maxItems - items.length)');
  });

  it('preserves unknown pending balances and v1 movement linkage', () => {
    expect(gateway).toContain('paymentsPending: number | null');
    expect(gateway).toContain('rawPaymentsPending === null || rawPaymentsPending === undefined');
    expect(gateway).toContain('documentId: movement.documentId');
    expect(gateway).toContain('invoiceId:');
    expect(gateway).toContain('matchId:');
  });

  it('returns transaction currency and validates credit notes in integer cents', () => {
    expect(accounting).toContain("currency: String(movement.currency ?? 'EUR').toUpperCase()");
    expect(accounting).toContain('Math.round(amount * 100) > Math.round(found.invoice.total * 100)');
  });
});
