import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

const route = source('app/api/rgpd/projects/[id]/route.ts');
const ui = source('components/tools/RgpdAccountSave.tsx');

describe('RGPD client professional result', () => {
  it('returns professional conclusions only through an owner-authenticated snapshot route', () => {
    expect(route).toContain('supabase.auth.getUser()');
    expect(route).toContain(".eq('user_id', user.id)");
    expect(route).toContain('review_summary');
    expect(route).toContain('review_completed_at');
  });

  it('only offers result viewing for completed versions', () => {
    expect(ui).toContain("project.status === 'completed'");
    expect(ui).toContain('Ver resultado');
    expect(ui).toContain('Conclusiones profesionales');
  });

  it('does not expose internal task or reviewer metadata in the client UI', () => {
    expect(ui).not.toContain('review_task_id');
    expect(ui).not.toContain('reviewer_id');
    expect(ui).not.toContain('internal_tasks');
  });
});
