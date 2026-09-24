import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

const migration = source('supabase/migrations/20260924162200_rgpd_review_completion.sql');
const route = source('app/api/admin/rgpd-reviews/[id]/complete/route.ts');
const detail = source('app/(protected)/admin/rgpd-revisiones/[id]/page.tsx');
const queue = source('app/(protected)/admin/rgpd-revisiones/page.tsx');

describe('RGPD professional review completion', () => {
  it('keeps conclusions separate from the original payload', () => {
    expect(migration).toContain('add column if not exists review_summary text');
    expect(migration).toContain("set status = 'completed'");
    expect(migration).toContain('review_summary = v_summary');
    expect(migration).not.toContain('payload =');
  });

  it('completes the linked internal task atomically', () => {
    expect(migration).toContain('v_project.review_task_id');
    expect(migration).toContain("set status = 'completada'");
    expect(migration).toContain('review_completed_at = now()');
    expect(migration).toContain('rgpd_review_reviewer_mismatch');
  });

  it('restricts completion RPC to service_role and authenticated admin route', () => {
    expect(migration).toContain('grant execute on function public.complete_rgpd_review(uuid, uuid, text) to service_role');
    expect(route).toContain('await requireAdminClient(request)');
    expect(route).toContain('session.auth.getUser()');
    expect(route).toContain("admin.rpc('complete_rgpd_review'");
  });

  it('renders completion only in review and links the queue to detail', () => {
    expect(detail).toContain("project.status === 'in_review'");
    expect(detail).toContain('CompleteRgpdReviewForm');
    expect(detail).toContain('Conclusiones profesionales');
    expect(queue).toContain("href={'/admin/rgpd-revisiones/' + item.id}");
  });
});
