import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('service OG layout', () => {
  it('keeps square content clear of the right-hand detail card', () => {
    const source = readFileSync('app/api/services/og/route.tsx', 'utf8');

    expect(source).toContain('getLocalizedServicePresentation(service.slug, lang)');
    expect(source).toContain('service.keyPoints?.find');
    expect(source).toContain('right: isHero ? 620 : 570');
    expect(source).toContain('isHero ? 150 : 110');
    expect(source).not.toContain('const ruCopy');
  });
});
