import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
describe('Explicit identity/company linkage entry point', () => {
  it('uses existing Company 360 membership management rather than creating identities', () => {
    const directory = readFileSync('app/(protected)/admin/directorio/page.tsx','utf8');
    const company = readFileSync('app/(protected)/admin/empresas/[id]/page.tsx','utf8');
    const api = readFileSync('app/api/admin/empresas/[id]/personas/route.ts','utf8');
    expect(directory).toContain('Gestionar vínculos');
    expect(directory).toContain("item.kind === 'company'");
    expect(directory).toContain('href={`${item.href}#personas`}');
    expect(company).toContain('id="personas"');
    expect(company).toContain("window.location.hash === '#personas'");
    expect(company).toContain('/personas');
    expect(api).toContain(".from('profile_companies')");
    expect(api).toContain("['admin', 'owner'].includes(profile.role)");
    expect(api).toContain('company.admin_person_linked');
    expect(directory).not.toContain('auth.admin.createUser');
  });
});
