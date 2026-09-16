import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  getKiaToolsForCapability,
  getKiaToolPolicy,
  isKiaToolSafeForAutonomousExecution,
  resolveKiaToolDefinitions,
} from '@/lib/ai/kia/kia-tool-registry';
import { validateKiaToolArguments } from '@/lib/ai/kia/kia-tool-definitions';

function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('KIA Holded labor tools', () => {
  it('keeps labor tools in a dedicated read-only capability', () => {
    expect(getKiaToolsForCapability('holded_hr_read')).toEqual([
      'get_holded_employees',
      'get_holded_employee_contract',
      'get_holded_payslips',
      'get_holded_salary_records',
      'run_labor_payroll_diagnostics',
    ]);

    for (const name of getKiaToolsForCapability('holded_hr_read')) {
      const policy = getKiaToolPolicy(name);
      expect(policy?.effect).toBe('read');
      expect(policy?.riskTier).toBe('R1');
      expect(policy?.requiresHumanApproval).toBe(false);
      expect(isKiaToolSafeForAutonomousExecution(name)).toBe(true);
    }
  });

  it('makes labor tools available through the authoritative registry', () => {
    const tools = resolveKiaToolDefinitions({
      channel: 'dashboard',
      requestedNames: ['get_holded_employees', 'get_holded_payslips', 'run_labor_payroll_diagnostics'],
      maxRiskTier: 'R1',
      allowedEffects: ['read'],
      autonomousOnly: true,
    });
    expect(tools.map((tool) => tool.name)).toEqual([
      'get_holded_employees',
      'get_holded_payslips',
      'run_labor_payroll_diagnostics',
    ]);
  });

  it('does not accept companyId as a labor tool argument', () => {
    expect(() => validateKiaToolArguments('get_holded_employees', { companyId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' })).toThrow();
    expect(() => validateKiaToolArguments('get_holded_employee_contract', { employeeId: 'emp-1', companyId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' })).toThrow();
    expect(() => validateKiaToolArguments('run_labor_payroll_diagnostics', { employeeId: 'emp-1', companyId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' })).toThrow();
  });

  it('requires an active company and permissions_enabled at the Holded boundary', () => {
    const access = source('lib/ai/kia/kia-holded-access.ts');
    expect(access).toContain('const companyId = context.company?.id ?? null');
    expect(access).toContain(".eq('company_id', companyId)");
    expect(access).toContain(".eq('status', 'active')");
    expect(access).toContain('permissions_enabled');
    expect(access).toContain('permissionsEnabled[requiredPermission] !== true');
    expect(access).not.toContain(".eq('client_id'");
  });

  it('uses the v2 read client and keeps payslips separate from salary records', () => {
    const labor = source('lib/ai/kia/kia-holded-labor-tools.ts');
    expect(labor).toContain('createHoldedV2Client(access.integrationId)');
    expect(labor).toContain('client.listPayslips');
    expect(labor).toContain('client.listSalaryRecords');
    expect(labor).not.toMatch(/\.(create|update|delete|post|put)\w*\(/i);
  });

  it('delegates payroll reasoning to a pure defensive engine', () => {
    const diagnostic = source('lib/ai/kia/kia-labor-payroll-diagnostics.ts');
    const engine = source('lib/ai/kia/kia-labor-payroll-engine.ts');
    expect(diagnostic).toContain("resolveKiaCompanyHoldedAccess(admin, context, 'laborEmployeesRead')");
    expect(diagnostic).toContain('permissionsEnabled.laborPayrollsRead !== true');
    expect(diagnostic).toContain('client.getEmployee(employeeId)');
    expect(diagnostic).toContain('client.getActiveContract(employeeId)');
    expect(diagnostic).toContain('client.listPayslips');
    expect(diagnostic).toContain('client.listSalaryRecords');
    expect(diagnostic).toContain('analyzeLaborPayrollSnapshot');
    expect(diagnostic).toContain("source: 'holded_api_v2_read_only'");
    expect(engine).toContain('detectIrpf');
    expect(engine).toContain('Array.isArray(payslip.deductions)');
    expect(engine).toContain('isPlainRecord(payslip.contributionBases)');
    expect(diagnostic).not.toMatch(/\.(create|update|delete|post|put)\w*\(/i);
    expect(engine).not.toMatch(/\.(create|update|delete|post|put)\w*\(/i);
  });

  it('removes client fallback from existing KIA Holded data tools', () => {
    const executor = source('lib/ai/kia/kia-tool-executor.ts');
    expect(executor).toContain('resolveKiaCompanyHoldedAccess(admin, context)');
    expect(executor).not.toContain('findHoldedIntegrationId');
    expect(executor).not.toContain("query.eq('client_id', clientId)");
  });
});
