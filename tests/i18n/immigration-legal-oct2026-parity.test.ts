import { describe, expect, it } from 'vitest';
import {
  IMMIGRATION_REVIEWED_GUIDES,
  IMMIGRATION_REVIEWED_SOURCES,
  toImmigrationGuideBody,
} from '@/lib/content/immigration-reviewed-2026';

describe('KIA legal ES/RU editorial evidence gate · October 2026', () => {
  it('documents closure of the extraordinary filing window in BOTH locales', () => {
    const initial = IMMIGRATION_REVIEWED_GUIDES.find(x => x.id === 'initial');
    expect(initial).toBeDefined();
    const extraordinary = initial!.sections.find(x => x.id === 'extraordinary');
    expect(extraordinary?.pEs).toContain('30 de junio de 2026');
    expect(extraordinary?.pRu).toContain('30 июня 2026');
    expect(extraordinary?.pEs).toContain('prórroga');
    expect(extraordinary?.pRu).toContain('продления');
    expect(initial!.sourceIds).toContain('boe-rd-316-2026');
  });

  it('never mandates electronic filing generically after BOE September 2026 Supreme Court decisions', () => {
    const initial = IMMIGRATION_REVIEWED_GUIDES.find(x => x.id === 'initial')!;
    const documents = initial.sections.find(x => x.id === 'documents');
    expect(documents?.pEs).toContain('197.2');
    expect(documents?.pRu).toContain('197.2');
    expect(documents?.pEs).toContain('canales habilitados');
    expect(documents?.pRu).toContain('способ подачи');
    for (const id of ['boe-ts-19632','boe-ts-19633']) {
      expect(initial.sourceIds).toContain(id);
      expect(IMMIGRATION_REVIEWED_SOURCES.some(s => s.id === id)).toBe(true);
    }
  });

  it('displays the revision warning in Spanish and Russian without stray Spanish in RU footer', () => {
    const es = toImmigrationGuideBody('initial', 'es');
    const ru = toImmigrationGuideBody('initial', 'ru');
    expect(es).toContain('Revisado: 2026-10-13');
    expect(ru).toContain('Проверено: 2026-10-13');
    expect(ru).toContain('Применимые требования');
    expect(ru).not.toContain('La norma aplicable es la vigente en la fecha de presentación.');
  });
});
