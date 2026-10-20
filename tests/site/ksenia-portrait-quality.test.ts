import { describe, expect, it } from 'vitest';
import { readFileSync, statSync } from 'node:fs';

const source = (p: string) => readFileSync(p,'utf8');
describe('Ksenia portrait clarity', () => {
  it('sources full resolution approved portraits and never stretches thumbnail to hero', () => {
    expect(statSync('public/avatars/ksenia-hero-clean.png').size).toBeGreaterThan(100_000);
    expect(statSync('public/avatars/ksenia-avatar.png').size).toBeGreaterThan(100_000);
    const home = source('app/(personal)/perfil-ksenia/page.tsx');
    const mentoring = source('app/(personal)/mentoria-personal/page.tsx');
    for(const page of [home,mentoring]) {
      expect(page).toContain('/avatars/ksenia-hero-clean.png');
      expect(page).not.toContain('/personal/ksenia-retrato.webp');
    }
    expect(home).toContain('priority sizes=');
    expect(home).toContain('/avatars/ksenia-avatar.png');
  });
});
