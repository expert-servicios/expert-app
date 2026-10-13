import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { localizePublicShellHref, localizePublicShellText } from '@/lib/i18n/public-shell-copy';

const source = (file: string) => fs.readFileSync(path.join(process.cwd(), file), 'utf8');

describe('Russian public footer shared with Spanish', () => {
  const layout = source('app/(localized)/ru/layout.tsx');
  const genericPage = source('components/i18n/RuPublicPage.tsx');
  const footer = source('components/site/footer.tsx');

  it('mounts the localized shared footer once at /ru layout level', () => {
    expect(layout).toContain("import { Footer } from '@/components/site/footer'");
    expect(layout).toContain('<Footer locale="ru" />');
    expect(layout).not.toContain('<RuSiteFooter />');
    expect(genericPage).not.toContain('<footer');
  });

  it('retains contact, legal and navigation in the shared footer', () => {
    expect(footer).toContain('info@expertconsulting.es');
    expect(footer).toContain('tel:+34669045528');
    expect(footer).toContain('label(link.label)');
    expect(localizePublicShellText('ru', 'Inicio')).toBe('Главная');
    expect(localizePublicShellText('ru', 'Servicios')).toBe('Услуги');
    expect(localizePublicShellText('ru', 'Aviso legal')).toBe('Правовая информация');
    expect(localizePublicShellHref('ru', '/servicios')).toBe('/ru/uslugi');
  });
});
