import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
const read = (file: string) => readFileSync(file, 'utf8');
describe('Personal CTA and independent SEO', () => {
  it('renders local ES/RU appointment, mentoring and contact destinations', () => {
    const section = read('components/personal/KseniaPersonalCTASection.tsx');
    for (const text of ['/reservar', '/ru/reservar', '/mentorias', '/ru/mentorias', '#contacto', '#contact', '#colaborar', '#obratitsya']) expect(section).toContain(text);
    for (const file of ['perfil-ksenia/page.tsx', 'perfil-ksenia-ru/page.tsx', 'mentoria-personal/page.tsx', 'mentoria-personal-ru/page.tsx']) expect(read('app/(personal)/' + file)).toContain('KseniaPersonalCTASection');
  });
  it('does not put EXPERT URLs in the personal sitemap', () => {
    const sitemap = read('app/sitemap.ts');
    const robots = read('app/robots.ts');
    expect(sitemap).toContain("process.env.PERSONAL_SITE_DEPLOYMENT === 'true'");
    expect(sitemap).toContain("const personal = 'https://kseniailicheva.com'");
    expect(sitemap).toContain("personal + '/ru/mentorias'");
    expect(robots).toContain("sitemap: 'https://kseniailicheva.com/sitemap.xml'");
    expect(robots).toContain("sitemap: 'https://expertconsulting.es/sitemap.xml'");
  });
  it('adds reciprocal ES/RU language alternates on editorial home and mentoring pages', () => {
    for (const f of ['app/(personal)/perfil-ksenia/page.tsx', 'app/(personal)/mentoria-personal/page.tsx']) expect(read(f)).toContain('alternates: { canonical:');
    expect(read('app/(personal)/perfil-ksenia/page.tsx')).toContain("ru: personalUrl + '/ru'");
    expect(read('app/(personal)/mentoria-personal/page.tsx')).toContain("ru: personalUrl + '/ru/mentorias'");
  });
});
