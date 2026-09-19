import { describe, expect, it } from 'vitest';
import { articles } from '@/lib/utils/blog';
import { docs } from '@/lib/utils/docs';
import { getServiceLaunchPack } from '@/lib/marketing/catalog-launch-social';

const SERVICE = 'arraigo-social';

describe('catalog launch content standard', () => {
  it('requires at least 3 blog articles and 3 knowledge guides for Arraigo Social', () => {
    const blogCount = articles.filter((article) => article.relatedServiceSlugs?.includes(SERVICE)).length;
    const docCount = docs.filter((doc) => doc.relatedServiceSlugs?.includes(SERVICE)).length;

    expect(blogCount).toBeGreaterThanOrEqual(3);
    expect(docCount).toBeGreaterThanOrEqual(3);
  });

  it('prepares Facebook, Instagram and LinkedIn content before publication', () => {
    const pack = getServiceLaunchPack(SERVICE);
    expect(pack).toBeDefined();

    for (const channel of ['facebook', 'instagram', 'linkedin'] as const) {
      const posts = pack?.posts.filter((post) => post.channel === channel) ?? [];
      expect(posts.length).toBeGreaterThanOrEqual(3);
      expect(posts.every((post) => post.status !== 'published')).toBe(true);
      expect(posts.every((post) => post.destinationPath.startsWith('/'))).toBe(true);
      expect(posts.every((post) => post.utmCampaign.includes('arraigo-social'))).toBe(true);
    }
  });
});
