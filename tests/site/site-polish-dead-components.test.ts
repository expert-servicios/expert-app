import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const removedComponents = [
  'components/forms/lead-form.tsx',
  'components/layout/main-header.tsx',
  'components/marketing/categories-section.tsx',
  'components/marketing/hero-section.tsx',
  'components/marketing/private-area-cta.tsx',
  'components/site/featured-services.tsx',
] as const;

describe('site polish dead component cleanup', () => {
  it('keeps retired duplicate components out of the repository', () => {
    for (const relativePath of removedComponents) {
      expect(fs.existsSync(path.resolve(process.cwd(), relativePath))).toBe(false);
    }
  });
});
