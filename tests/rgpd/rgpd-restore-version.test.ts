import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

const route = source('app/api/rgpd/projects/[id]/route.ts');
const ui = source('components/tools/RgpdAccountSave.tsx');

describe('RGPD saved version restore', () => {
  it('requires authentication and exact ownership in the API', () => {
    expect(route).toContain('supabase.auth.getUser()');
    expect(route).toContain(".eq('user_id', user.id)");
    expect(route).toContain(".eq('id', id)");
  });

  it('requires explicit confirmation before replacing local workspace data', () => {
    expect(ui).toContain('window.confirm');
    expect(ui).toContain('reemplazará el trabajo RGPD');
  });

  it('restores only the known local RGPD keys', () => {
    expect(ui).toContain('expert-rgpd-company-profile-v1');
    expect(ui).toContain('expert-rgpd-treatments-v1');
    expect(ui).toContain('expert-rgpd-provider-inventory-v1');
    expect(ui).toContain('expert-rgpd-retention-matrix-v1');
    expect(ui).toContain('expert-rgpd-implementation-progress-v1');
  });
});
