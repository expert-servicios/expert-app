import type { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { createHoldedV2Client } from '@/lib/integrations/holded/holded-v2-client';
import type { KiaContext } from './kia-context-builder';
import type { KiaToolResult } from './kia-tool-definitions';
import { resolveKiaCompanyHoldedAccess } from './kia-holded-access';
import { analyzeLaborPayrollSnapshot } from './kia-labor-payroll-engine';
import { redactJson, safeErrorMessage } from './kia-redaction';

type AdminClient = ReturnType<typeof getSupabaseAdmin>;

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

    const result = analyzeLaborPayrollSnapshot({
      source: 'holded_api_v2_read_only',
      companyId: accessResult.access.companyId,
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
        extraPayments: Array.isArray(employee.current_contract?.salary_extra) ? employee.current_contract.salary_extra : [],
      },
      contract: contractRead.value ? {
        contractType: contractRead.value.contractType,
        contributionType: contractRead.value.contributionType ?? null,
        startDate: contractRead.value.startDate,
        seniorityDate: contractRead.value.seniorityDate ?? null,
        endDate: contractRead.value.endDate ?? null,
        jobTitle: contractRead.value.jobTitle ?? null,
        professionalCategory: contractRead.value.professionalCategory ?? null,
        scheduleHours: contractRead.value.scheduleHours ?? null,
        scheduleMode: contractRead.value.scheduleMode ?? null,
        workingDays: Array.isArray(contractRead.value.workingDays) ? contractRead.value.workingDays : null,
        salary: contractRead.value.salary,
        salaryInterval: contractRead.value.salaryInterval,
        salaryPayments: contractRead.value.salaryPayments ?? null,
      } : null,
      contractReadError: contractRead.error,
      payslips: (payslipsRead.value?.items ?? []).map((payslip) => ({
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
        contributionBases: payslip.contribution_bases,
        earnings: payslip.earnings,
        deductions: payslip.deductions,
        employerContributions: payslip.employer_contributions,
      })),
      payslipsReadError: payslipsRead.error,
      salaryRecords: (salaryRecordsRead.value?.items ?? []).map((record) => ({
        id: record.id,
        date: record.date,
        description: record.description,
        isDraft: record.is_draft,
        totalPayable: record.total_payable,
        paymentStatus: record.payment_status,
      })),
      salaryRecordsReadError: salaryRecordsRead.error,
    });

    return ok(toolName, result as unknown as Record<string, unknown>);
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

function ok(toolName: string, result: Record<string, unknown>): KiaToolResult {
  return { toolName, ok: true, result: redactJson(result) };
}

function fail(toolName: string, error: string): KiaToolResult {
  return { toolName, ok: false, error };
}
