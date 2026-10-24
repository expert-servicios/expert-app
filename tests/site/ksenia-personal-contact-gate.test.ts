import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const read = (path: string) => readFileSync(path, 'utf8');

describe('Personal lead form readiness', () => {
  it('requires real CRM and anti-spam configuration before showing an active form', () => {
    const gate = read('components/personal/KseniaPersonalContactGate.tsx');
    for (const key of [
      'NEXT_PUBLIC_RECAPTCHA_SITE_KEY',
      'RECAPTCHA_SECRET_KEY',
      'NEXT_PUBLIC_SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
    ]) expect(gate).toContain(key);
    expect(gate).toContain('if (enabled) return <KseniaPersonalContactForm');
    expect(gate).toContain('mailto:soy@kseniailicheva.com');
  });

  it('uses the gate in all four public personal ES/RU forms', () => {
    for (const file of [
      'app/(personal)/perfil-ksenia/page.tsx',
      'app/(personal)/perfil-ksenia-ru/page.tsx',
      'app/(personal)/mentoria-personal/page.tsx',
      'app/(personal)/mentoria-personal-ru/page.tsx',
    ]) {
      expect(read(file)).toContain('KseniaPersonalContactGate');
    }
  });
});
