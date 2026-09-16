export type LaborFindingSeverity = 'info' | 'warning' | 'review';
export type LaborFindingCategory = 'employee' | 'contract' | 'schedule' | 'salary' | 'payslip' | 'contribution_bases' | 'irpf' | 'payment' | 'salary_record' | 'data_quality';

export interface LaborDiagnosticFinding {
  code: string;
  severity: LaborFindingSeverity;
  category: LaborFindingCategory;
  summary: string;
  evidence?: Record<string, unknown>;
}

export interface LaborEmployeeSnapshot {
  id: string;
  fullName: string;
  code?: string | null;
  jobTitle?: string | null;
  terminated?: number | null;
  extraPayments?: Array<Record<string, unknown>>;
}

export interface LaborContractSnapshot {
  contractType: number | string;
  contributionType?: string | null;
  startDate: string | null;
  seniorityDate?: string | null;
  endDate?: string | null;
  jobTitle?: string | null;
  professionalCategory?: string | null;
  scheduleHours?: number | null;
  scheduleMode?: string | null;
  workingDays?: string[] | null;
  salary: number | string | null;
  salaryInterval?: string | null;
  salaryPayments?: number | null;
}

export interface LaborPayslipSnapshot {
  id: string;
  date: string;
  periodStart?: string | null;
  periodEnd?: string | null;
  kind?: string | null;
  isDraft: boolean;
  totalDays: number;
  netSalary?: string | number | null;
  totalCompanyCost?: string | number | null;
  paymentStatus?: string | null;
  paymentPending?: string | number | null;
  contributionBases?: unknown;
  earnings?: unknown;
  deductions?: unknown;
  employerContributions?: unknown;
}

export interface LaborSalaryRecordSnapshot {
  id: string;
  date: string;
  description?: string | null;
  isDraft: boolean;
  totalPayable?: string | number | null;
  paymentStatus?: string | null;
}

export interface LaborPayrollSnapshot {
  source: string;
  companyId?: string | null;
  period?: { startDate?: string | null; endDate?: string | null };
  employee: LaborEmployeeSnapshot;
  contract: LaborContractSnapshot | null;
  contractReadError?: string | null;
  payslips: LaborPayslipSnapshot[];
  payslipsReadError?: string | null;
  salaryRecords: LaborSalaryRecordSnapshot[];
  salaryRecordsReadError?: string | null;
}

export interface LaborPayrollDiagnosticResult {
  source: string;
  companyId: string | null;
  status: 'ok' | 'review' | 'insufficient_data';
  requiresProfessionalReview: boolean;
  period: { startDate: string | null; endDate: string | null };
  employee: LaborEmployeeSnapshot;
  contract: (LaborContractSnapshot & { extraPayments: Array<Record<string, unknown>> }) | null;
  payslips: Array<LaborPayslipSnapshot & {
    contributionBasesAvailable: boolean;
    contributionBases: Record<string, unknown>;
    earnings: unknown[];
    deductions: unknown[];
    employerContributions: unknown[];
    irpf: { identified: boolean; line: Record<string, unknown> | null };
  }>;
  salaryRecords: LaborSalaryRecordSnapshot[];
  findings: LaborDiagnosticFinding[];
  caveats: string[];
}

export function analyzeLaborPayrollSnapshot(snapshot: LaborPayrollSnapshot): LaborPayrollDiagnosticResult {
  const findings: LaborDiagnosticFinding[] = [];
  const contract = snapshot.contract;

  if (!contract) {
    findings.push({
      code: 'active_contract_unavailable', severity: 'review', category: 'contract',
      summary: 'No se pudo obtener un contrato activo para el empleado; revisar documentación contractual antes de concluir.',
      evidence: snapshot.contractReadError ? { readError: snapshot.contractReadError } : undefined,
    });
  } else {
    if (!contract.startDate) findings.push({ code: 'contract_start_date_missing', severity: 'review', category: 'contract', summary: 'El contrato activo no contiene fecha de inicio.' });
    if (contract.scheduleHours == null) findings.push({ code: 'schedule_hours_missing', severity: 'warning', category: 'schedule', summary: 'La fuente no devuelve horas de jornada en el contrato activo.' });
    if (!contract.scheduleMode) findings.push({ code: 'schedule_mode_missing', severity: 'warning', category: 'schedule', summary: 'La fuente no devuelve modalidad de jornada en el contrato activo.' });
    if (!contract.workingDays?.length) findings.push({ code: 'working_days_missing', severity: 'warning', category: 'schedule', summary: 'La fuente no devuelve días de trabajo en el contrato activo.' });
    if (!(Number(contract.salary) > 0)) findings.push({
      code: 'contract_salary_missing_or_zero', severity: 'review', category: 'salary',
      summary: 'El salario del contrato activo no está informado o no es positivo.',
      evidence: { salary: contract.salary, salaryInterval: contract.salaryInterval ?? null },
    });
    if (contract.salaryPayments == null) findings.push({ code: 'salary_payments_missing', severity: 'warning', category: 'salary', summary: 'No consta el número de pagos salariales en el contrato activo.' });
  }

  if (snapshot.payslipsReadError) {
    findings.push({ code: 'payslips_read_failed', severity: 'review', category: 'payslip', summary: 'No se pudieron leer las nóminas calculadas para el periodo solicitado.', evidence: { readError: snapshot.payslipsReadError } });
  } else if (snapshot.payslips.length === 0) {
    findings.push({ code: 'no_payslips_in_range', severity: 'warning', category: 'payslip', summary: 'No hay nóminas calculadas para el empleado y periodo consultados.' });
  }

  const payslips = snapshot.payslips.map((payslip) => {
    const contributionBases = isPlainRecord(payslip.contributionBases) ? payslip.contributionBases : {};
    const earnings = Array.isArray(payslip.earnings) ? payslip.earnings : [];
    const deductions = Array.isArray(payslip.deductions) ? payslip.deductions : [];
    const employerContributions = Array.isArray(payslip.employerContributions) ? payslip.employerContributions : [];
    const contributionBasesAvailable = Object.keys(contributionBases).length > 0;
    const irpf = detectIrpf(deductions);

    if (payslip.isDraft) findings.push({ code: 'payslip_is_draft', severity: 'warning', category: 'payslip', summary: `La nómina ${payslip.id} está en borrador; sus importes no deben tratarse como definitivos.`, evidence: { payslipId: payslip.id, date: payslip.date } });
    if (!(Number(payslip.totalDays) > 0)) findings.push({ code: 'payslip_days_missing_or_zero', severity: 'review', category: 'data_quality', summary: `La nómina ${payslip.id} no contiene un número de días positivo.`, evidence: { payslipId: payslip.id, totalDays: payslip.totalDays } });
    if (!contributionBasesAvailable) findings.push({ code: 'contribution_bases_missing', severity: 'review', category: 'contribution_bases', summary: `La nómina ${payslip.id} no expone bases de cotización en la fuente de datos.`, evidence: { payslipId: payslip.id } });
    if (!irpf.identified) findings.push({ code: 'irpf_not_identified', severity: 'warning', category: 'irpf', summary: `No se ha podido identificar una línea de IRPF/retención en la nómina ${payslip.id}. Esto no implica que la retención sea 0.`, evidence: { payslipId: payslip.id } });
    if (parseAmount(payslip.paymentPending) > 0) findings.push({ code: 'payslip_payment_pending', severity: 'info', category: 'payment', summary: `La nómina ${payslip.id} muestra importe pendiente de pago.`, evidence: { payslipId: payslip.id, paymentPending: payslip.paymentPending, paymentStatus: payslip.paymentStatus ?? null } });

    return { ...payslip, contributionBasesAvailable, contributionBases, earnings, deductions, employerContributions, irpf };
  });

  if (snapshot.salaryRecordsReadError) {
    findings.push({ code: 'salary_records_read_failed', severity: 'warning', category: 'salary_record', summary: 'No se pudieron leer los salary-records manuales. Esto no invalida las nóminas calculadas.', evidence: { readError: snapshot.salaryRecordsReadError } });
  } else if (snapshot.salaryRecords.length > 0) {
    findings.push({ code: 'manual_salary_records_present', severity: 'info', category: 'salary_record', summary: 'Existen salary-records manuales; se mantienen separados de las nóminas calculadas y no se usan como sustituto de ellas.', evidence: { count: snapshot.salaryRecords.length } });
  }

  const status: LaborPayrollDiagnosticResult['status'] = !contract || snapshot.payslipsReadError || snapshot.payslips.length === 0
    ? 'insufficient_data'
    : findings.some((finding) => finding.severity === 'review') ? 'review' : 'ok';

  return {
    source: snapshot.source,
    companyId: snapshot.companyId ?? null,
    status,
    requiresProfessionalReview: findings.some((finding) => finding.severity === 'review'),
    period: { startDate: snapshot.period?.startDate ?? null, endDate: snapshot.period?.endDate ?? null },
    employee: snapshot.employee,
    contract: contract ? { ...contract, extraPayments: snapshot.employee.extraPayments ?? [] } : null,
    payslips,
    salaryRecords: snapshot.salaryRecords,
    findings,
    caveats: [
      'El diagnóstico compara coherencia y cobertura de los datos disponibles; no recalcula una nómina legalmente desde cero.',
      'La ausencia de una línea identificable de IRPF o de bases en la fuente no equivale a importe cero.',
      'Los salary-records manuales se mantienen separados de las payslips calculadas.',
      'El motor es analítico y no realiza modificaciones en el sistema origen.',
    ],
  };
}

function detectIrpf(deductions: unknown[]): { identified: boolean; line: Record<string, unknown> | null } {
  for (const item of deductions) {
    if (!isPlainRecord(item)) continue;
    const text = Object.values(item).filter((value) => typeof value === 'string').join(' ').toLocaleLowerCase('es');
    if (/\birpf\b|retenci[oó]n|withholding/.test(text)) return { identified: true, line: item };
  }
  return { identified: false, line: null };
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function parseAmount(value: string | number | null | undefined): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value !== 'string') return 0;
  const normalized = value.trim().replace(/\s/g, '').replace(/\.(?=\d{3}(?:\D|$))/g, '').replace(',', '.');
  const amount = Number(normalized.replace(/[^0-9.-]/g, ''));
  return Number.isFinite(amount) ? amount : 0;
}
