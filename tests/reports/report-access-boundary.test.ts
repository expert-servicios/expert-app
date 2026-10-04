import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('financial report access boundary', () => {
  it('allows only the report owner or internal EXPERT staff', () => {
    const access = source('lib/reports/report-access.ts');
    expect(access).toContain('userId === reportClientId');
    expect(access).toContain('isStaffRole(profile.role)');
    expect(access).toContain("profile.status !== 'inactive'");
  });

  it('lets internal staff open and export a client report through the same guard', () => {
    for (const path of [
      'app/api/reports/[id]/route.ts',
      'app/api/reports/[id]/pdf/route.ts',
      'app/api/reports/[id]/word/route.ts',
      'app/api/reports/[id]/excel/route.ts',
    ]) {
      expect(source(path)).toContain('canAccessFinancialReport');
      expect(source(path)).not.toContain(".eq('client_id', user.id)");
    }
  });

  it('does not mark a staff inspection as a client view', () => {
    const detail = source('app/api/reports/[id]/route.ts');
    expect(detail).toContain('report.client_id === user.id && !report.viewed_at');
  });

  it('does not trust client-provided generatedBy metadata', () => {
    const route = source('app/api/reports/generate/route.ts');
    const panel = source('components/dashboard/reports/GenerateReportPanel.tsx');
    expect(route).toContain("generatedBy: adminClientId && adminClientId !== user.id ? 'admin' : 'user'");
    expect(panel).not.toContain("generatedBy: 'user'");
  });
});
