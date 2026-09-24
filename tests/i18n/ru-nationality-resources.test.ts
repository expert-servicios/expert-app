import { describe, expect, it } from 'vitest';
import { RU_NATIONALITY_RESOURCES, getRuNationalityResource } from '@/lib/i18n/ru-nationality-resources';

describe('Russian nationality resources', () => {
  it('keeps knowledge guides and blog articles aligned with Spanish resources', () => {
    expect(RU_NATIONALITY_RESOURCES.filter((item) => item.kind === 'docs')).toHaveLength(4);
    expect(RU_NATIONALITY_RESOURCES.filter((item) => item.kind === 'blog')).toHaveLength(4);
    expect(RU_NATIONALITY_RESOURCES.every((item) => item.esPath.startsWith(item.kind === 'docs' ? '/docs/' : '/blog/'))).toBe(true);
  });

  it('keeps the current mandatory disbursement wording in the main Russian guide', () => {
    const guide = getRuNationalityResource('docs', 'grazhdanstvo-ispanii-rebenok-rozhdennyy-v-ispanii');
    expect(guide).toBeDefined();
    const content = JSON.stringify(guide);
    expect(content).toContain('104,05 €');
    expect(content).toContain('suplido');
    expect(content).toContain('790-026');
  });

  it('returns no resource for an unknown slug', () => {
    expect(getRuNationalityResource('blog', 'missing')).toBeUndefined();
  });
});
