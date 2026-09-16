import { describe, expect, it } from 'vitest';
import { analyzeLaborPayrollSnapshot, type LaborPayrollSnapshot } from '@/lib/ai/kia/kia-labor-payroll-engine';

const WORKER_PATTERNS = [
  { alias: 'W01', contractType: 289, scheduleHours: 10, irpf: false },
  { alias: 'W02', contractType: 200, scheduleHours: 10, irpf: false },
  { alias: 'W03', contractType: 200, scheduleHours: 40, irpf: true },
  { alias: 'W04', contractType: 289, scheduleHours: 10, irpf: false },
  { alias: 'W05', contractType: 289, scheduleHours: 30, irpf: false },
  { alias: 'W06', contractType: 189, scheduleHours: 40, irpf: true },
  { alias: 'W07', contractType: 200, scheduleHours: 12, irpf: false },
  { alias: 'W08', contractType: 100, scheduleHours: 40, irpf: true },
  { alias: 'W09', contractType: 200, scheduleHours: 8, irpf: false },
  { alias: 'W10', contractType: 200, scheduleHours: 30, irpf: false },
  { alias: 'W11', contractType: 300, scheduleHours: 10, irpf: false },
] as const;

function snapshotFor(pattern: typeof WORKER_PATTERNS[number]): LaborPayrollSnapshot {
  return {
    source: 'synthetic_readiness_matrix',
    companyId: null,
    period: { startDate: '2026-08-01', endDate: '2026-08-31' },
    employee: {
      id: pattern.alias,
      fullName: pattern.alias,
      code: pattern.alias,
      jobTitle: 'Synthetic role',
      terminated: 0,
      extraPayments: [{ mode: 'prorated' }],
    },
    contract: {
      contractType: pattern.contractType,
      contributionType: 'RG',
      startDate: '2025-01-01',
      seniorityDate: '2024-01-01',
      endDate: null,
      jobTitle: 'Synthetic role',
      professionalCategory: 'Synthetic category',
      scheduleHours: pattern.scheduleHours,
      scheduleMode: 'weekly',
      workingDays: ['configured'],
      salary: 900,
      salaryInterval: 'monthly',
      salaryPayments: 12,
    },
    payslips: [{
      id: `${pattern.alias}-payslip`,
      date: '2026-08-31',
      periodStart: '2026-08-01',
      periodEnd: '2026-08-31',
      kind: 'ordinary',
      isDraft: false,
      totalDays: 30,
      netSalary: 800,
      totalCompanyCost: 1200,
      paymentStatus: 'PAID',
      paymentPending: 0,
      contributionBases: { common: 1000, unemployment_training: 1000 },
      earnings: [{ concept: 'BASE', amount: 900 }, { concept: 'EXTRAS', amount: 100 }],
      deductions: pattern.irpf
        ? [{ concept: 'SOCIAL_SECURITY', amount: 60 }, { concept: 'IRPF withholding', amount: 100 }]
        : [{ concept: 'SOCIAL_SECURITY', amount: 60 }],
      employerContributions: [{ concept: 'SOCIAL_SECURITY', amount: 200 }],
    }],
    salaryRecords: [],
  };
}

describe('HLAB readiness matrix', () => {
  it('covers exactly eleven anonymized worker patterns', () => {
    expect(WORKER_PATTERNS).toHaveLength(11);
    expect(new Set(WORKER_PATTERNS.map((item) => item.alias)).size).toBe(11);
  });

  it.each(WORKER_PATTERNS)('$alias remains diagnostic-safe for contract $contractType', (pattern) => {
    const result = analyzeLaborPayrollSnapshot(snapshotFor(pattern));
    expect(result.status).toBe('ok');
    expect(result.requiresProfessionalReview).toBe(false);
    expect(result.payslips).toHaveLength(1);
    expect(result.payslips[0]?.contributionBasesAvailable).toBe(true);
    expect(result.payslips[0]?.irpf.identified).toBe(pattern.irpf);
    expect(result.salaryRecords).toEqual([]);
  });

  it('keeps calculated payslips and manual salary records separate', () => {
    const snapshot = snapshotFor(WORKER_PATTERNS[0]);
    snapshot.salaryRecords = [{ id: 'manual-1', date: '2026-08-31', description: 'Manual accounting record', isDraft: false, totalPayable: 800, paymentStatus: 'PAID' }];
    const result = analyzeLaborPayrollSnapshot(snapshot);
    expect(result.payslips).toHaveLength(1);
    expect(result.salaryRecords).toHaveLength(1);
    expect(result.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'manual_salary_records_present', category: 'salary_record' }),
    ]));
  });

  it('fails closed when contribution bases are absent', () => {
    const snapshot = snapshotFor(WORKER_PATTERNS[0]);
    snapshot.payslips[0]!.contributionBases = null;
    const result = analyzeLaborPayrollSnapshot(snapshot);
    expect(result.status).toBe('review');
    expect(result.requiresProfessionalReview).toBe(true);
    expect(result.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'contribution_bases_missing', severity: 'review' }),
    ]));
  });

  it('does not crash on malformed array-shaped Holded fields', () => {
    const snapshot = snapshotFor(WORKER_PATTERNS[0]);
    snapshot.payslips[0]!.deductions = { unexpected: true };
    snapshot.payslips[0]!.earnings = 'unexpected';
    snapshot.payslips[0]!.employerContributions = 123;
    const result = analyzeLaborPayrollSnapshot(snapshot);
    expect(result.status).toBe('ok');
    expect(result.payslips[0]?.deductions).toEqual([]);
    expect(result.payslips[0]?.earnings).toEqual([]);
    expect(result.payslips[0]?.employerContributions).toEqual([]);
    expect(result.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'irpf_not_identified', severity: 'warning' }),
    ]));
  });

  it('returns insufficient_data when the active contract cannot be read', () => {
    const snapshot = snapshotFor(WORKER_PATTERNS[0]);
    snapshot.contract = null;
    snapshot.contractReadError = 'synthetic read failure';
    const result = analyzeLaborPayrollSnapshot(snapshot);
    expect(result.status).toBe('insufficient_data');
    expect(result.requiresProfessionalReview).toBe(true);
    expect(result.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'active_contract_unavailable', severity: 'review' }),
    ]));
  });

  it('marks draft payroll as non-definitive without converting it into a hard failure', () => {
    const snapshot = snapshotFor(WORKER_PATTERNS[0]);
    snapshot.payslips[0]!.isDraft = true;
    const result = analyzeLaborPayrollSnapshot(snapshot);
    expect(result.status).toBe('ok');
    expect(result.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'payslip_is_draft', severity: 'warning' }),
    ]));
  });

  it('marks pending payment separately from payroll correctness', () => {
    const snapshot = snapshotFor(WORKER_PATTERNS[0]);
    snapshot.payslips[0]!.paymentPending = '125,50';
    const result = analyzeLaborPayrollSnapshot(snapshot);
    expect(result.status).toBe('ok');
    expect(result.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'payslip_payment_pending', severity: 'info', category: 'payment' }),
    ]));
  });
});
