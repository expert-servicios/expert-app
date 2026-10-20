import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const read = (path: string) => readFileSync(path, 'utf8');

describe('Separate Ksenia personal site', () => {
  it('routes only the personal hosts homepage into its editorial page', () => {
    const config = read('next.config.ts');
    expect(config).toContain("value: 'kseniailicheva.com'");
    expect(config).toContain("value: 'www.kseniailicheva.com'");
    expect(config).toContain("destination: '/perfil-ksenia'");
  });

  it('retains standalone personal metadata and professional links', () => {
    const page = read('app/(personal)/perfil-ksenia/page.tsx');
    expect(page).toContain("metadataBase: new URL(personalUrl)");
    expect(page).toContain('https://expertconsulting.es');
    expect(page).toContain('KSENIA_SOCIAL_PROFILES.map(profile => profile.url)');
    expect(read('lib/personal/ksenia-social-profiles.ts')).toContain('https://www.linkedin.com/in/ksenia-ilicheva/');
    expect(page).toContain('src="/personal/ksenia-hero-approved.webp"');
    expect(page).toContain('/personal/ksenia-avatar-approved.webp');
    expect(page).toContain('/branding/expert-approved/horizontal-claro.webp');
    expect(page).toContain('/personal/ksenia-favicon.png');
  });

  it('does not turn the personal homepage into a transactional storefront', () => {
    const page = read('app/(personal)/perfil-ksenia/page.tsx');
    for (const unavailable of ['SharedHomeServices', 'CartSidebar', 'KiaPublicWidget', 'Stripe', 'Planes mensuales']) {
      expect(page).not.toContain(unavailable);
    }
  });
});
