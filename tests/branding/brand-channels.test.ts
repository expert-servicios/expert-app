import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
const read = (path: string) => readFileSync(path, 'utf8');
describe('Brand identity across channels', () => {
  it('uses EXPERT push branding by default and KIA avatar for KIA-origin push', () => {
    expect(read('public/sw.js')).toContain("data.source === 'kia'");
    expect(read('public/sw.js')).toContain('/avatars/kia/kia-bienvenida.webp');
    expect(read('lib/integrations/push.ts')).toContain("source?: 'expert' | 'kia'");
  });
  it('uses approved EXPERT artwork in all transactional email shells', () => {
    for (const path of ['lib/email/templates.ts','lib/email/onboarding-templates.ts','lib/email/service-payment-ru.ts','lib/email/subscription-custom-template.ts']) {
      expect(read(path)).toContain('/branding/expert-approved/horizontal-oscuro.png');
    }
    expect(read('app/api/services/viabilidad/route.ts')).not.toContain('https://expertconsulting.es/logo.png');
  });
  it('keeps an accessible, motion-aware loading component', () => {
    const component = read('components/brand/ExpertLoading.tsx');
    expect(component).toContain('motion-safe:animate-pulse');
    expect(component).toContain('/branding/expert-approved/isotipo-claro.webp');
    expect(component).toContain('role="status"');
  });
});
