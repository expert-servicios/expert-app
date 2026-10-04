import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('active company financial scope', () => {
  it('revalidates profile active_company_id before Holded dashboard lookups', () => {
    for (const path of [
      'app/(protected)/dashboard/integraciones/holded/page.tsx',
      'app/api/integrations/holded/status/route.ts',
      'app/(protected)/dashboard/estado-empresa/page.tsx',
    ]) {
      const file = source(path);
      expect(file).toContain("from('profile_companies')");
      expect(file).toContain("eq('profile_id'");
      expect(file).toContain("eq('company_id'");
    }
  });

  it('revalidates the target client membership before report generation', () => {
    const route = source('app/api/reports/generate/route.ts');
    expect(route).toContain("from('profile_companies')");
    expect(route).toContain(".eq('profile_id', clientId)");
    expect(route).toContain(".eq('company_id', requestedCompanyId)");
    expect(route).toContain('const companyId = membership?.company_id ?? null');
  });
});
