import { describe, expect, it } from 'vitest';
import { articles } from '@/lib/utils/blog';
import { docs } from '@/lib/utils/docs';
import { getCatalogService } from '@/lib/utils/catalog';
import { getServiceLaunchPack } from '@/lib/marketing/catalog-launch-social';

const SERVICES = [
  {
    slug: 'certificado-digital-persona-fisica',
    validity: '5 años',
    price: '90 € + IVA',
  },
  {
    slug: 'certificado-digital-entidad',
    validity: '2 años',
    price: '150 € + IVA',
  },
] as const;

describe('certificate launch content standard', () => {
  for (const service of SERVICES) {
    it(`${service.slug} has at least 3 blog articles and 3 KB guides`, () => {
      const blogCount = articles.filter((article) => article.relatedServiceSlugs?.includes(service.slug)).length;
      const docCount = docs.filter((doc) => doc.relatedServiceSlugs?.includes(service.slug)).length;

      expect(blogCount).toBeGreaterThanOrEqual(3);
      expect(docCount).toBeGreaterThanOrEqual(3);
    });

    it(`${service.slug} has 3 drafts per social channel`, () => {
      const pack = getServiceLaunchPack(service.slug);
      expect(pack).toBeDefined();

      for (const channel of ['facebook', 'instagram', 'linkedin'] as const) {
        const posts = pack?.posts.filter((post) => post.channel === channel) ?? [];
        expect(posts.length).toBeGreaterThanOrEqual(3);
        expect(posts.every((post) => post.status !== 'published')).toBe(true);
        expect(posts.every((post) => post.destinationPath.startsWith('/'))).toBe(true);
      }
    });

    it(`${service.slug} keeps canonical price and EXPERT validity copy`, () => {
      const canonical = getCatalogService(service.slug);
      expect(canonical?.price).toBe(service.price);
      const copy = JSON.stringify(canonical);
      expect(copy).toContain(service.validity);
    });
  }

  it('does not count Cl@ve articles as entity-certificate SEO content', () => {
    const entityArticles = articles
      .filter((article) => article.relatedServiceSlugs?.includes('certificado-digital-entidad'))
      .map((article) => article.slug);

    expect(entityArticles).not.toContain('que-es-clave-identificacion-electronica');
    expect(entityArticles).not.toContain('como-registrarse-en-clave');
  });
});
