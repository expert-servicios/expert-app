import { describe, expect, it } from 'vitest';
import { analyzeLaborPayrollSnapshot } from '@/lib/ai/kia/kia-labor-payroll-engine';

describe('KIA labor payroll real-case regression (anonymized)', () => {
  it('classifies the August 2026 partial-time payroll pattern without treating missing IRPF as zero', () => {
    const result = analyzeLaborPayrollSnapshot({
      source: 'anonymized_real_case_regression',
      companyId: null,
      period: { startDate: '2026-08-01', endDate: '2026-08-31' },
      employee: {
        id: 'employee-a',
        fullName: 'Employee A',
        code: 'EMP-A',
        jobTitle: 'Auxiliar limpieza',
        terminated: 0,
        extraPayments: [{ mode: 'prorated', count: 3 }],
      },
      contract: {
        contractType: 289,
        contributionType: 'RG',
        startDate: '2022-02-01',
        seniorityDate: '2022-02-01',
        endDate: null,
        jobTitle: 'Auxiliar limpieza',
        professionalCategory: 'Nivel 6',
        scheduleHours: 10,
        scheduleMode: 'weekly',
        workingDays: ['configured'],
        salary: 317.2,
        salaryInterval: 'monthly',
        salaryPayments: 12,
      },
      payslips: [{
        id: 'payslip-2026-08',
        date: '2026-08-31',
        periodStart: '2026-08-01',
        periodEnd: '2026-08-31',
        kind: 'nomina_ordinaria',
        isDraft: false,
        totalDays: 30,
        netSalary: '370.08',
        totalCompanyCost: '523.05',
        paymentStatus: 'PAID',
        paymentPending: '0',
        contributionBases: {
          common_contingencies: '395.81',
          unemployment_training: '395.81',
          irpf_base: '395.81',
        },
        earnings: [
          { concept: 'SALARIO BASE', amount: '317.20' },
          { concept: 'PRORRATA PAGAS EXTRAS', amount: '78.61' },
        ],
        deductions: [
          { concept: 'DTO. CONT. COMUNES', rate: '4.85%', amount: '19.20' },
          { concept: 'DTO. BASE ACCIDENT', rate: '1.65%', amount: '6.53' },
        ],
        employerContributions: [
          { concept: 'CONTINGENCIAS COMUNES + MEI', amount: '96.38' },
          { concept: 'AT Y EP', amount: '5.94' },
          { concept: 'DESEMPLEO', amount: '21.76' },
          { concept: 'FORMACION PROFESIONAL', amount: '2.37' },
          { concept: 'FOGASA', amount: '0.79' },
        ],
      }],
      salaryRecords: [],
    });

    expect(result.status).toBe('ok');
    expect(result.requiresProfessionalReview).toBe(false);
    expect(result.payslips[0]?.contributionBasesAvailable).toBe(true);
    expect(result.payslips[0]?.irpf.identified).toBe(false);
    expect(result.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'irpf_not_identified', severity: 'warning', category: 'irpf' }),
    ]));
    expect(result.findings).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'contribution_bases_missing' }),
    ]));
    expect(result.findings).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'payslip_payment_pending' }),
    ]));
  });

  it('escalates to review when the same case loses contribution bases', () => {
    const result = analyzeLaborPayrollSnapshot({
      source: 'anonymized_real_case_regression',
      employee: { id: 'employee-a', fullName: 'Employee A' },
      contract: {
        contractType: 289,
        startDate: '2022-02-01',
        scheduleHours: 10,
        scheduleMode: 'weekly',
        workingDays: ['configured'],
        salary: 317.2,
        salaryInterval: 'monthly',
        salaryPayments: 12,
      },
      payslips: [{
        id: 'payslip-2026-08',
        date: '2026-08-31',
        isDraft: false,
        totalDays: 30,
        netSalary: '370.08',
        paymentPending: '0',
        contributionBases: {},
        deductions: [],
      }],
      salaryRecords: [],
    });

    expect(result.status).toBe('review');
    expect(result.requiresProfessionalReview).toBe(true);
    expect(result.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'contribution_bases_missing', severity: 'review' }),
      expect.objectContaining({ code: 'irpf_not_identified', severity: 'warning' }),
    ]));
  });
});
