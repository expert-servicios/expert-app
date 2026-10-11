import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const routes = [
  'app/api/admin/cases/[id]/signature-actions/route.ts',
  'app/api/admin/cases/[id]/signature-actions/[actionId]/route.ts',
];

describe('E0 signature lifecycle privilege guard', () => {
  it.each(routes)('%s requires centrally verified active staff', (path) => {
    const source = readFileSync(path, 'utf8');
    expect(source).toContain("requireActiveActor(request, ['admin', 'owner'])");
    expect(source).not.toContain("profile.status === 'inactive'");
    expect(source).not.toContain('createServerSupabaseClient(request)');
  });
});
