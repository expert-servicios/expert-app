import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const paths = [
  'app/api/admin/team/route.ts',
  'app/api/admin/directorio/route.ts',
  'app/api/admin/empresas/[id]/route.ts',
];

describe('E0-M3-06 second privileged route batch', () => {
  it.each(paths)('%s delegates auth to requireActiveActor', (path) => {
    const source = readFileSync(path, 'utf8');
    expect(source).toContain("import { requireActiveActor } from '@/lib/auth/active-actor';");
    expect(source).toContain("requireActiveActor(request, ['admin', 'owner'])");
    expect(source).not.toContain("profile.status === 'inactive'");
    expect(source).not.toContain("profile?.status === 'inactive'");
    expect(source).not.toContain('createServerSupabaseClient(request)');
  });
});
