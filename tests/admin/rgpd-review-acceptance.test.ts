import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

const migration = source('supabase/migrations/20260924160041_rgpd_professional_review_lifecycle.sql');
const route = source('app/api/admin/rgpd-reviews/[id]/accept/route.ts');
const page = source('app/(protected)/admin/rgpd-revisiones/page.tsx');

describe('RGPD professional review acceptance', () => {
  it('extends the lifecycle and creates an atomic task link', () => {
    expect(migration).toContain("'in_review'");
    expect(migration).toContain("'completed'");
    expect(migration).toContain('review_task_id');
    expect(migration).toContain('create or replace function public.accept_rgpd_review');
    expect(migration).toContain("if v_project.status = 'in_review' and v_project.review_task_id is not null");
    expect(migration).toContain("'rgpd_professional_review'");
  });

  it('restricts the acceptance function to service_role', () => {
    expect(migration).toContain('revoke all on function public.accept_rgpd_review(uuid, uuid) from authenticated');
    expect(migration).toContain('grant execute on function public.accept_rgpd_review(uuid, uuid) to service_role');
  });

  it('requires an admin and the authenticated reviewer', () => {
    expect(route).toContain('await requireAdminClient(request)');
    expect(route).toContain('session.auth.getUser()');
    expect(route).toContain("admin.rpc('accept_rgpd_review'");
    expect(route).toContain('p_reviewer_id: user.id');
  });

  it('shows acceptance only for requested reviews', () => {
    expect(page).toContain("item.status === 'review_requested'");
    expect(page).toContain('AcceptRgpdReviewButton');
    expect(page).toContain("['in_review', 'En revisión']");
    expect(page).toContain("['completed', 'Completados']");
  });
});
