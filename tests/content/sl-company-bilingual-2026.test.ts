import { describe,it,expect } from 'vitest';
import { sl2026Pairs,sl2026BlogArticles,sl2026KnowledgeDocs,sl2026RuResources } from '@/lib/content/sl-company-bilingual-2026';
describe('Constitución SL editorial parity and SEO',()=>{
  it('has unique paired slugs and complete Russian resources',()=>{
    expect(new Set(sl2026Pairs.map(x=>x.es)).size).toBe(sl2026Pairs.length);
    expect(new Set(sl2026Pairs.map(x=>x.ru)).size).toBe(sl2026Pairs.length);
    expect(sl2026BlogArticles).toHaveLength(4);
    expect(sl2026KnowledgeDocs).toHaveLength(4);
    expect(sl2026RuResources).toHaveLength(9);
    expect(sl2026Pairs.every(x=>x.sources.length>0&&x.esSections.length>=3&&x.ruSections.length>=3)).toBe(true);
  });
  it('preserves correct modes and legal qualifications',()=>{
    const circe=sl2026KnowledgeDocs.find(x=>x.slug==='circe-o-notaria-constitucion-sl-modalidades');
    expect(circe?.body).toContain('499,00 € + IVA');
    expect(circe?.body).toContain('180,00 € + IVA');
    const taxes=sl2026BlogArticles.find(x=>x.slug==='irpf-vs-impuesto-sociedades-sl-tipos-2026');
    expect(taxes?.body).toContain('19 %');
    expect(taxes?.body).toContain('21 %');
    expect(taxes?.body).toContain('15 %');
    expect(taxes?.body).toContain('23 %');
    expect(sl2026BlogArticles.some(x=>x.body.includes('modelo 037'))).toBe(true);
  });
});
