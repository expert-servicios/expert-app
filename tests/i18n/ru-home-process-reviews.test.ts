import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('ES/RU homepage sections', () => {
  it('shares the same four-step process component', () => {
    const es = readFileSync('app/(public)/page.tsx', 'utf8');
    const ru = readFileSync('components/i18n/RuPublicPage.tsx', 'utf8');
    expect(es).toContain('<SharedServiceProcess />');
    expect(ru).toContain('<SharedServiceProcess locale="ru" />');
  });
  it('localizes review cards on Russian home without altering review approvals', () => {
    const ru = readFileSync('components/i18n/RuPublicPage.tsx', 'utf8');
    const reviews = readFileSync('components/site/reviews-preview.tsx', 'utf8');
    expect(ru).toContain('<ReviewsPreview locale="ru" />');
    expect(reviews).toContain("eq('status', 'approved')");
    expect(reviews).toContain('comment_translations?.[locale]');
  });
});