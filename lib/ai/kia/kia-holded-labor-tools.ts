import type { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { createHoldedV2Client } from '@/lib/integrations/holded/holded-v2-client';
import type { KiaContext } from './kia-context-builder';
import type { KiaToolResult } from './kia-tool-definitions';
import { resolveKiaCompanyHoldedAccess } from './kia-holded-access';
import { redactJson, safeErrorMessage } from './kia-redaction';

type AdminClient = ReturnType<typeof getSupabaseAdmin>;

export type KiaHoldedLaborToolName =
  | 'get_holded_employees'
  | 'get_holded_employee_contract'
  | 'get_holded_payslips'
  | 'get_holded_salary_records';

export async function executeKiaHoldedLaborTool(
  toolName: KiaHoldedLaborToolName,
  args: Record<string, unknown>,
  context: KiaContext,
  admin: AdminClient,
): Promise<KiaToolResult> {
  try {
    const requiredPermission = toolName === 'get_holded_employees' || toolName === 'get_holded_employee_contract'
      ? 'laborEmployeesRead'
      : 'laborPayrollsRead';
    const accessResult = await resolveKiaCompanyHoldedAccess(admin, context, requiredPermission);
    if (!accessResult.ok) return fail(toolName, accessResult.error);

    const { access } = accessResult;
    const client = await createHoldedV2Client(access.integrationId);

    if (toolName === 'get_holded_employees') {
      const page = await client.listEmployees({
        search: typeof args.search === 'string' ? args.search : undefined,
        limit: Number(args.limit ?? 20),
        cursor: typeof args.cursor === 'string' ? args.cursor : undefined,
      });
      return ok(toolName, {
        companyId: access.companyId,
        count: page.items.length,
        cursor: page.cursor,
        hasMore: page.has_more,
        employees: page.items.map((employee) => ({
          id: employee.id,
          fullName: employee.full_name,
          code: employee.code,
          email: employee.email,
          jobTitle: employee.job_title,
          terminated: employee.terminated,
          currentContract: employee.current_contract ? {
            id: employee.current_contract.id,
            type: employee.current_contract.type,
            startDate: employee.current_contract.start_date,
            endDate: employee.current_contract.end_date,
            jobTitle: employee.current_contract.job_title,
            scheduleHours: employee.current_contract.schedule_hours,
            scheduleMode: employee.current_contract.schedule_mode,
            workingDays: employee.current_contract.working_days,
            salary: employee.current_contract.salary,
            salaryInterval: employee.current_contract.salary_interval,
            salaryPayments: employee.current_contract.salary_payments,
          } : null,
        })),
      });
    }

    if (toolName === 'get_holded_employee_contract') {
      const employeeId = String(args.employeeId ?? '').trim();
      const [employee, contract] = await Promise.all([
        client.getEmployee(employeeId),
        client.getActiveContract(employeeId),
      ]);
      return ok(toolName, {
        companyId: access.companyId,
        employee: {
          id: employee.id,
          fullName: employee.full_name,
          code: employee.code,
          jobTitle: employee.job_title,
          terminated: employee.terminated,
        },
        contract: {
          contractType: contract.contractType,
          contributionType: contract.contributionType ?? null,
          royalDecree: contract.royalDecree ?? null,
          startDate: contract.startDate,
          seniorityDate: contract.seniorityDate ?? null,
          endDate: contract.endDate ?? null,
          jobTitle: contract.jobTitle ?? null,
          professionalCategory: contract.professionalCategory ?? null,
          scheduleHours: contract.scheduleHours ?? null,
          scheduleMode: contract.scheduleMode ?? null,
          workingDays: contract.workingDays ?? null,
          probationPeriodDays: contract.probationPeriodDays ?? null,
          vacationDays: contract.vacationDays ?? null,
          workModality: contract.workModality ?? null,
          salary: contract.salary,
          salaryInterval: contract.salaryInterval,
          salaryPayments: contract.salaryPayments ?? null,
        },
      });
    }

    if (toolName === 'get_holded_payslips') {
      const page = await client.listPayslips({
        employeeId: typeof args.employeeId === 'string' ? args.employeeId : undefined,
        startDate: typeof args.startDate === 'string' ? args.startDate : undefined,
        endDate: typeof args.endDate === 'string' ? args.endDate : undefined,
        kind: typeof args.kind === 'string' ? args.kind : undefined,
        isDraft: typeof args.isDraft === 'boolean' ? args.isDraft : undefined,
        limit: Number(args.limit ?? 20),
        cursor: typeof args.cursor === 'string' ? args.cursor : undefined,
      });
      return ok(toolName, {
        companyId: access.companyId,
        count: page.items.length,
        cursor: page.cursor,
        hasMore: page.has_more,
        payslips: page.items.map((payslip) => ({
          id: payslip.id,
          employeeId: payslip.employee_id,
          employeeName: payslip.employee_name,
          kind: payslip.payslip_kind,
          date: payslip.date,
          periodStart: payslip.period_start,
          periodEnd: payslip.period_end,
          totalDays: payslip.total_days,
          description: payslip.description,
          isDraft: payslip.is_draft,
          netSalary: payslip.net_salary,
          totalCompanyCost: payslip.total_company_cost,
          paymentTotal: payslip.payment_total,
          paymentPending: payslip.payment_pending,
          paymentStatus: payslip.payment_status,
          earnings: payslip.earnings ?? [],
          deductions: payslip.deductions ?? [],
          employerContributions: payslip.employer_contributions ?? [],
          contributionBases: payslip.contribution_bases ?? {},
        })),
      });
    }

    const page = await client.listSalaryRecords({
      employeeId: typeof args.employeeId === 'string' ? args.employeeId : undefined,
      startDate: typeof args.startDate === 'string' ? args.startDate : undefined,
      endDate: typeof args.endDate === 'string' ? args.endDate : undefined,
      limit: Number(args.limit ?? 20),
      cursor: typeof args.cursor === 'string' ? args.cursor : undefined,
    });
    return ok(toolName, {
      companyId: access.companyId,
      count: page.items.length,
      cursor: page.cursor,
      hasMore: page.has_more,
      salaryRecords: page.items.map((record) => ({
        id: record.id,
        employeeId: record.employee_id,
        employeeName: record.employee_name,
        date: record.date,
        description: record.description,
        isDraft: record.is_draft,
        totalPayable: record.total_payable,
        paymentTotal: record.payment_total,
        paymentPending: record.payment_pending,
        paymentStatus: record.payment_status,
        lines: record.lines ?? [],
      })),
    });
  } catch (error) {
    return fail(toolName, safeErrorMessage(error));
  }
}

function ok(toolName: string, result: Record<string, unknown>): KiaToolResult {
  return { toolName, ok: true, result: redactJson(result) };
}

function fail(toolName: string, error: string): KiaToolResult {
  return { toolName, ok: false, error };
}
