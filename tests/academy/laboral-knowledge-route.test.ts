import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(path, 'utf8');

describe('Laboral knowledge route rendering contract', () => {
  it('keeps the hybrid public/student route explicitly dynamic', () => {
    const page = read('app/(public)/docs/laboral/[slug]/page.tsx');

    expect(page).toContain("export const dynamic = 'force-dynamic'");
    expect(page).not.toContain('generateStaticParams');
    expect(page).toContain('getActiveEnrollment(PROGRAM_SLUG)');
  });
});
