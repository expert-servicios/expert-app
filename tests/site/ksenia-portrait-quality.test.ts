import { describe, expect, it } from 'vitest';
import { readFileSync, statSync } from 'node:fs';

const source = (p: string) => readFileSync(p, 'utf8');

describe('Ksenia approved portrait clarity', () => {
  it('uses optimized approved images and never enlarges the old thumbnail', () => {
    const heroFile = 'public/personal/ksenia-hero-approved.webp';
    const avatarFile = 'public/personal/ksenia-avatar-approved.webp';
    expect(statSync(heroFile).size).toBeGreaterThan(25_000);
    expect(statSync(avatarFile).size).toBeGreaterThan(25_000);
    for (const file of [heroFile, avatarFile]) {
      const header = readFileSync(file);
      expect(header.toString('ascii', 0, 4)).toBe('RIFF');
      expect(header.toString('ascii', 8, 12)).toBe('WEBP');
    }

    for (const lang of ['perfil-ksenia', 'perfil-ksenia-ru']) {
      const homepage = source(`app/(personal)/${lang}/page.tsx`);
      expect(homepage).toContain('src="/personal/ksenia-hero-approved.webp"');
      expect(homepage).toContain('aspect-video');
      expect(homepage).not.toContain('src="/avatars/ksenia-hero-clean.png"');
      expect(homepage).not.toContain('/personal/ksenia-retrato.webp');
    }
    const home = source('app/(personal)/perfil-ksenia/page.tsx');
    const mentoring = source('app/(personal)/mentoria-personal/page.tsx');
    const mentoringRu = source('app/(personal)/mentoria-personal-ru/page.tsx');
    expect(home).toContain('src="/personal/ksenia-avatar-approved.webp"');
    expect(home).toContain('priority sizes=');
    for (const page of [mentoring, mentoringRu]) {
      expect(page).toContain('src="/personal/ksenia-avatar-approved.webp"');
      expect(page).not.toContain('src="/avatars/ksenia-hero-clean.png"');
    }
  });
});
