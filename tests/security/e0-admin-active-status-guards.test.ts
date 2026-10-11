import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const protectedRoutes = [
  'app/api/admin/empresas/[id]/holded/route.ts',
  'app/api/admin/empresas/[id]/registro/route.ts',
  'app/api/admin/empresas/[id]/personas/route.ts',
  'app/api/admin/clientes/[id]/subscription-benefits/route.ts',
];

describe('E0-M3-06 privileged route active profile safeguards', () => {
  it.each(protectedRoutes)('%s rejects all non-active profiles', (path) => {
    const src = readFileSync(resolve(process.cwd(), path), 'utf8');
    expect(src).toMatch(/profile\??\.status\s*!==\s*'active'/);
    expect(src).not.toContain("profile.status === 'inactive'");
    expect(src).not.toContain("profile?.status === 'inactive'");
  });
});
