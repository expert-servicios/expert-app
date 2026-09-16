import type { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { createHoldedV2Client, type HoldedV2Payslip } from '@/lib/integrations/holded/holded-v2-client';
import type { KiaContext } from './kia-context-builder';
import type { KiaToolResult } from './kia-tool-definitions';
import { resolveKiaCompanyHoldedAccess } from './kia-holded-access';
import { redactJson, safeErrorMessage } from './kia-redaction';

type AdminClient = ReturnType<typeof getSupabaseAdmin>;

type FindingSeverity = 'info' | 'warning' | 'review';
type FindingCategory =
  | 'employee'
  | 'contract'
  | 'schedule'
  | 'salary'
  | 'payslip'
  | 'contribution_bases'
  | 'irpf'
  | 'payment'
  | 'salary_record'
  | 'data_quality';

interface DiagnosticFinding {
  code: string;
  severity: FindingSeverity;
  category: FindingCategory;
  summary: string;
  evidence?: Record<string, unknown>;
}

interface ReadResult<T> {
  value: T | null;
  error: string | null;
}

export async function executeLaborPayrollDiagnostics(
  args: Record<string, unknown>,
  context: KiaContext,
  admin: AdminClient,
): Promise<KiaToolResult> {
  const toolName = 'run_labor_payroll_diagnostics';
  try {
    const employeeId = String(args.employeeId ?? '').trim();
    if (!employeeId) return fail(toolName, 'employeeId is required');

    const accessResult = await resolveKiaCompanyHoldedAccess(admin, context, 'laborEmployeesRead');
    if (!accessResult.ok) return fail(toolName, accessResult.error);
    if (accessResult.access.permissionsEnabled.laborPayrollsRead !== true) {
      return fail(toolName, 'La integración Holded no tiene habilitada la lectura de nóminas para la empresa activa.');
    }

    const client = await createHoldedV2Client(accessResult.access.integrationId);
    const employee = await client.getEmployee(employeeId);

    const [contractRead, payslipsRead, salaryRecordsRead] = await Promise.all([
      capture(() => client.getActiveContract(employeeId)),
      capture(() => client.listPayslips({
        employeeId,
        startDate: typeof args.startDate === 'string' ? args.startDate : undefined,
        endDate: typeof args.endDate === 'string' ? args.endDate : undefined,
        limit: Number(args.limit ?? 50),
      })),
      capture(() => client.listSalaryRecords({
        employeeId,
        startDate: typeof args.startDate === 'string' ? args.startDate : undefined,
        endDate: typeof args.endDate === 'string' ? args.endDate : undefined,
        limit: Number(args.limit ?? 50),
      })),
    ]);

    const findings: DiagnosticFinding[] = [];
    const contract = contractRead.value;
    const payslips = payslipsRead.value?.items ?? [];
    const salaryRecords = salaryRecordsRead.value?.items ?? [];

    if (!contract) {
      findings.push({
        code: 'active_contract_unavailable',
        severity: 'review',
        category: 'contract',
        summary: 'No se pudo obtener un contrato activo para el empleado; revisar documentación contractual antes de concluir.',
        evidence: contractRead.error ? { readError: contractRead.error } : undefined,
      });
    } else {
      if (!contract.startDate) {
        findings.push({ code: 'contract_start_date_missing', severity: 'review', category: 'contract', summary: 'El contrato activo no contiene fecha de inicio.' });
      }
      if (contract.scheduleHours == null) {
        findings.push({ code: 'schedule_hours_missing', severity: 'warning', category: 'schedule', summary: 'Holded no devuelve horas de jornada en el contrato activo.' });
      }
      if (!contract.scheduleMode) {
        findings.push({ code: 'schedule_mode_missing', severity: 'warning', category: 'schedule', summary: 'Holded no devuelve modalidad de jornada en el contrato activo.' });
      }
      if (!contract.workingDays?.length) {
        findings.push({ code: 'working_days_missing', severity: 'warning', category: 'schedule', summary: 'Holded no devuelve días de trabajo en el contrato activo.' });
      }
      if (!(Number(contract.salary) > 0)) {
        findings.push({
          code: 'contract_salary_missing_or_zero',
          severity: 'review',
          category: 'salary',
          summary: 'El salario del contrato activo no está informado o no es positivo.',
          evidence: { salary: contract.salary, salaryInterval: contract.salaryInterval },
        });
      }
      if (contract.salaryPayments == null) {
        findings.push({ code: 'salary_payments_missing', severity: 'warning', category: 'salary', summary: 'No consta el número de pagos salariales en el contrato activo.' });
      }
    }

    if (payslipsRead.error) {
      findings.push({
        code: 'payslips_read_failed',
        severity: 'review',
        category: 'payslip',
        summary: 'No se pudieron leer las nóminas calculadas de Holded para el periodo solicitado.',
        evidence: { readError: payslipsRead.error },
      });
    } else if (payslips.length === 0) {
      findings.push({
        code: 'no_payslips_in_range',
        severity: 'warning',
        category: 'payslip',
        summary: 'No hay nóminas calculadas en Holded para el empleado y periodo consultados.',
      });
    }

    const payslipDiagnostics = payslips.map((payslip) => {
      const contributionBasesAvailable = Object.keys(payslip.contribution_bases ?? {}).length > 0;
      const irpf = detectIrpf(payslip);

      if (payslip.is_draft) {
        findings.push({
          code: 'payslip_is_draft',
          severity: 'warning',
          category: 'payslip',
          summary: `La nómina ${payslip.id} está en borrador; sus importes no deben tratarse como definitivos.`,
          evidence: { payslipId: payslip.id, date: payslip.date },
        });
      }
      if (!(Number(payslip.total_days) > 0)) {
        findings.push({
          code: 'payslip_days_missing_or_zero',
          severity: 'review',
          category: 'data_quality',
          summary: `La nómina ${payslip.id} no contiene un número de días positivo.`,
          evidence: { payslipId: payslip.id, totalDays: payslip.total_days },
        });
      }
      if (!contributionBasesAvailable) {
        findings.push({
          code: 'contribution_bases_missing',
          severity: 'review',
          category: 'contribution_bases',
          summary: `La nómina ${payslip.id} no expone bases de cotización en el payload de Holded.`,
          evidence: { payslipId: payslip.id },
        });
      }
      if (!irpf.identified) {
        findings.push({
          code: 'irpf_not_identified',
          severity: 'warning',
          category: 'irpf',
          summary: `No se ha podido identificar una línea de IRPF/retención en la nómina ${payslip.id}. Esto no implica que la retención sea 0.`,
          evidence: { payslipId: payslip.id },
        });
      }
      if (parseAmount(payslip.payment_pending) > 0) {
        findings.push({
          code: 'payslip_payment_pending',
          severity: 'info',
          category: 'payment',
          summary: `La nómina ${payslip.id} muestra importe pendiente de pago en Holded.`,
          evidence: { payslipId: payslip.id, paymentPending: payslip.payment_pending, paymentStatus: payslip.payment_status },
        });
      }

      return {
        id: payslip.id,
        date: payslip.date,
        periodStart: payslip.period_start,
        periodEnd: payslip.period_end,
        kind: payslip.payslip_kind,
        isDraft: payslip.is_draft,
        totalDays: payslip.total_days,
        netSalary: payslip.net_salary,
        totalCompanyCost: payslip.total_company_cost,
        paymentStatus: payslip.payment_status,
        paymentPending: payslip.payment_pending,
        contributionBasesAvailable,
        contributionBases: payslip.contribution_bases ?? {},
        earnings: payslip.earnings ?? [],
        deductions: payslip.deductions ?? [],
        employerContributions: payslip.employer_contributions ?? [],
        irpf,
      };
    });

    if (salaryRecordsRead.error) {
      findings.push({
        code: 'salary_records_read_failed',
        severity: 'warning',
        category: 'salary_record',
        summary: 'No se pudieron leer los salary-records manuales de Holded. Esto no invalida las nóminas calculadas.',
        evidence: { readError: salaryRecordsRead.error },
      });
    } else if (salaryRecords.length > 0) {
      findings.push({
        code: 'manual_salary_records_present',
        severity: 'info',
        category: 'salary_record',
        summary: 'Existen salary-records manuales en Holded; se mantienen separados de las nóminas calculadas y no se usan como sustituto de ellas.',
        evidence: { count: salaryRecords.length },
      });
    }

    const status = !contract || payslipsRead.error || payslips.length === 0
      ? 'insufficient_data'
      : findings.some((finding) => finding.severity === 'review')
        ? 'review'
        : 'ok';

    return ok(toolName, {
      source: 'holded_api_v2_read_only',
      companyId: accessResult.access.companyId,
      status,
      requiresProfessionalReview: findings.some((finding) => finding.severity === 'review'),
      period: {
        startDate: typeof args.startDate === 'string' ? args.startDate : null,
        endDate: typeof args.endDate === 'string' ? args.endDate : null,
      },
      employee: {
        id: employee.id,
        fullName: employee.full_name,
        code: employee.code,
        jobTitle: employee.job_title,
        terminated: employee.terminated,
      },
      contract: contract ? {
        contractType: contract.contractType,
        contributionType: contract.contributionType ?? null,
        startDate: contract.startDate,
        seniorityDate: contract.seniorityDate ?? null,
        endDate: contract.endDate ?? null,
        jobTitle: contract.jobTitle ?? null,
        professionalCategory: contract.professionalCategory ?? null,
        scheduleHours: contract.scheduleHours ?? null,
        scheduleMode: contract.scheduleMode ?? null,
        workingDays: contract.workingDays ?? null,
        salary: contract.salary,
        salaryInterval: contract.salaryInterval,
        salaryPayments: contract.salaryPayments ?? null,
        extraPayments: employee.current_contract?.salary_extra ?? [],
      } : null,
      payslips: payslipDiagnostics,
      salaryRecords: salaryRecords.map((record) => ({
        id: record.id,
        date: record.date,
        description: record.description,
        isDraft: record.is_draft,
        totalPayable: record.total_payable,
        paymentStatus: record.payment_status,
      })),
      findings,
      caveats: [
        'El diagnóstico compara coherencia y cobertura de los datos disponibles en Holded; no recalcula una nómina legalmente desde cero.',
        'La ausencia de una línea identificable de IRPF o de bases en el payload no equivale a importe cero.',
        'Los salary-records manuales se mantienen separados de las payslips calculadas.',
        'No se realiza ninguna modificación en Holded.',
      ],
    });
  } catch (error) {
    return fail(toolName, safeErrorMessage(error));
  }
}

async function capture<T>(read: () => Promise<T>): Promise<ReadResult<T>> {
  try {
    return { value: await read(), error: null };
  } catch (error) {
    return { value: null, error: safeErrorMessage(error) };
  }
}

function detectIrpf(payslip: HoldedV2Payslip): { identified: boolean; line: Record<string, unknown> | null } {
  const deductions = Array.isArray(payslip.deductions) ? payslip.deductions : [];
  for (const item of deductions) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
    const record = item as Record<string, unknown>;
    const text = Object.values(record)
      .filter((value) => typeof value === 'string')
      .join(' ')
      .toLocaleLowerCase('es');
    if (/\birpf\b|retenci[oó]n|withholding/.test(text)) {
      return { identified: true, line: record };
    }
  }
  return { identified: false, line: null };
}

function parseAmount(value: string | number | null | undefined): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value !== 'string') return 0;
  const normalized = value.trim().replace(/\s/g, '').replace(/\.(?=\d{3}(?:\D|$))/g, '').replace(',', '.');
  const amount = Number(normalized.replace(/[^0-9.-]/g, ''));
  return Number.isFinite(amount) ? amount : 0;
}

function ok(toolName: string, result: Record<string, unknown>): KiaToolResult {
  return { toolName, ok: true, result: redactJson(result) };
}

function fail(toolName: string, error: string): KiaToolResult {
  return { toolName, ok: false, error };
}
