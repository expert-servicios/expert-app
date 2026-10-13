import { describe, expect, it } from 'vitest';
import { localizePublicShellHref, localizePublicShellText } from '@/lib/i18n/public-shell-copy';
import fs from 'node:fs';
describe('public shell parity', () => {
  it('preserves Spanish and maps only existing Russian routes', () => {
    expect(localizePublicShellHref('es','/servicios')).toBe('/servicios');
    expect(localizePublicShellHref('ru','/servicios')).toBe('/ru/uslugi');
    expect(localizePublicShellHref('ru','/contacto')).toBe('/contacto');
  });
  it('keeps proper nouns and translates public menu labels', () => {
    expect(localizePublicShellText('ru','Holded')).toBe('Holded');
    expect(localizePublicShellText('ru','Servicios')).toBe('Услуги');
  });
  it('uses shared header, footer, language switcher and KIA without duplicated page header', () => {
    const layout = fs.readFileSync('app/(localized)/ru/layout.tsx','utf8');
    const page = fs.readFileSync('components/i18n/RuPublicPage.tsx','utf8');
    expect(layout).toContain('<Header locale="ru" />');
    expect(layout).toContain('<Footer locale="ru" />');
    expect(layout).toContain('<KiaPublicWidget />');
    expect(layout).toContain('<LanguageSwitcher');
    expect(page).not.toContain('<header className=');
  });
});