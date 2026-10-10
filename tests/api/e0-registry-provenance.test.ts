import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('E0 registry provenance cannot be asserted from client payload', () => {
  it('never elevates _registryOfficial browser claims to verified database metadata', () => {
    const route = read('app/api/companies/route.ts');
    expect(route).toContain('const registryOfficial = false;');
    expect(route).not.toContain('Boolean(d._registryOfficial && d._registrySource)');
    expect(route).toContain('registry_verified_at: registryOfficial ?');
    expect(route).toContain('registry_locked_fields: registryLocks');
  });

  it('does not interpret a submitted source name as server attestation', () => {
    const route = read('app/api/company/associate/route.ts');
    expect(route).toContain('const officialRegistry = false;');
    expect(route).not.toContain('isOfficialRegistrySource(normalizedPayload.source)');
    expect(route).toContain('userConfirmed');
  });

  it('does not lock onboarding fields or claim certification based on public lookup suggestions', () => {
    const ui = read('components/dashboard/company/CompanyDataLookup.tsx');
    expect(ui).toContain('officialRegistry: false,');
    expect(ui).not.toContain("officialRegistry: suggestion.source === 'registradores_opendata'");
    expect(ui).toContain('una sugerencia no equivale a una certificación registral');
  });
});
