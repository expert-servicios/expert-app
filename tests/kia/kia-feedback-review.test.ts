import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('KIA feedback learning review', () => {
  it('requires admin access and only lists positive complete feedback', () => {
    const api = source('app/api/admin/kia-feedback/route.ts');
    expect(api).toContain("profile?.role === 'admin' || profile?.role === 'owner'");
    expect(api).toContain(".eq('rating', 'positive')");
    expect(api).toContain(".not('user_message', 'is', null)");
    expect(api).toContain(".not('kia_reply', 'is', null)");
  });

  it('lets admin explicitly approve or revoke learning use', () => {
    const api = source('app/api/admin/kia-feedback/route.ts');
    expect(api).toContain('approved_for_learning: parsed.data.approved');
    expect(api).toContain("review_source: 'admin_kia_feedback'");
  });

  it('exposes a dedicated admin review surface', () => {
    expect(source('components/admin/AdminSidebar.tsx')).toContain('/admin/kia-feedback');
    expect(source('components/admin/KiaFeedbackReviewQueue.tsx')).toContain('Aprobar aprendizaje');
    expect(source('app/(protected)/admin/kia-feedback/page.tsx')).toContain('Feedback y aprendizaje');
  });
});
