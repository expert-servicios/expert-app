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
  it.each(protectedRoutes)('%s delegates status and role checks to the shared server gate', (path) => {
    const src = readFileSync(resolve(process.cwd(), path), 'utf8');
    expect(src).toContain("import { requireActiveActor } from '@/lib/auth/active-actor'");
    expect(src).toContain("requireActiveActor(request, ['admin', 'owner'])");
    expect(src).not.toContain("profile.status === 'inactive'");
    expect(src).not.toContain("profile?.status === 'inactive'");
  });
});
