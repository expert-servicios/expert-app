import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const source = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');

describe('Russian public footer', () => {
  const layout = source('app/(localized)/ru/layout.tsx');
  const genericPage = source('components/i18n/RuPublicPage.tsx');
  const footer = source('components/i18n/RuSiteFooter.tsx');

  it('is mounted once at the shared /ru layout level', () => {
    expect(layout).toContain("import { RuSiteFooter } from '@/components/i18n/RuSiteFooter'");
    expect(layout).toContain('<RuSiteFooter />');
    expect(genericPage).not.toContain('<footer');
  });

  it('keeps Russian navigation and public contact routes in the shared footer', () => {
    expect(footer).toContain('Главная');
    expect(footer).toContain('Услуги');
    expect(footer).toContain('Консультация');
    expect(footer).toContain('Юридическая информация');
    expect(footer).toContain('EXPERT_IDENTITY.publicEmail');
    expect(footer).toContain('EXPERT_IDENTITY.phoneDisplay');
  });
});
