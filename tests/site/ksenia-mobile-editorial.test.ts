import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
const read = (path: string) => readFileSync(path, 'utf8');
describe('Personal mobile, bilingual FAQ, editorial and measured CTAs', () => {
  it('provides functional mobile nav and a booking CTA in both languages', () => {
    const nav = read('components/personal/KseniaPersonalMobileNav.tsx');
    expect(nav).toContain('aria-expanded={open}');
    expect(nav).toContain('onClick={() => setOpen(value => !value)}');
    expect(nav).toContain('/ru/reservar');
    expect(nav).toContain('/reservar');
    expect(nav).toContain('#lecturas');
    expect(nav).toContain('#preguntas');
    for (const page of ['perfil-ksenia/page.tsx','perfil-ksenia-ru/page.tsx']) {
      const content = read('app/(personal)/' + page);
      expect(content).toContain('KseniaPersonalMobileNav');
      expect(content).toContain('KseniaPersonalFAQ');
      expect(content).toContain('KseniaPersonalEditorialNotes');
    }
  });
  it('shows truthful bilingual informational content without unsupported FAQ rich-result schema', () => {
    const faq = read('components/personal/KseniaPersonalFAQ.tsx');
    const articles = read('components/personal/KseniaPersonalEditorialNotes.tsx');
    expect(faq).toContain('<details');
    expect(faq).toContain('Частые вопросы');
    expect(faq).toContain('Preguntas frecuentes');
    expect(articles).toContain('Автоматизация не отменяет ответственность');
    expect(articles).toContain('Automatizar sin perder la responsabilidad');
    expect(faq).not.toContain('FAQPage');
  });
  it('keeps optional tracking anonymous and disabled without opt-in', () => {
    const layout = read('app/(personal)/layout.tsx');
    const tracker = read('components/personal/KseniaPersonalCTAAnalytics.tsx');
    expect(layout).toContain("process.env.PERSONAL_WEB_ANALYTICS_ENABLED === 'true'");
    expect(tracker).toContain("'personal_cta_click'");
    expect(tracker).not.toContain('localStorage');
    expect(tracker).not.toContain('email');
    expect(tracker).not.toContain('userId');
  });
});
