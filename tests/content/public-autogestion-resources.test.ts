import { describe, expect, it } from 'vitest';
import { PUBLIC_TOPIC_IDS } from '@/lib/content/public-autogestion-taxonomy';
import { PUBLIC_TOPIC_ROUTES, getPublicTopicResources, getTopicHref, resolvePublicTopicRoute } from '@/lib/content/public-autogestion-resources';

describe('WEB-P1 public topic hubs', () => {
  it('provides a unique route for each canonical topic', () => {
    expect(new Set(Object.values(PUBLIC_TOPIC_ROUTES)).size).toBe(8);
    for (const id of PUBLIC_TOPIC_IDS) {
      const href = getTopicHref(id);
      expect(resolvePublicTopicRoute(href.split('/').at(-1)!)).toBe(id);
    }
  });
  it('keeps content identities unique and links to actual canonical service categories', () => {
    const all = PUBLIC_TOPIC_IDS.map(id => getPublicTopicResources(id));
    for (const kind of ['services','articles','docs'] as const) {
      const items = all.flatMap(group => group[kind]);
      expect(new Set(items.map(item => item.slug)).size).toBe(items.length);
      expect(items.length).toBeGreaterThan(0);
    }
    expect(getPublicTopicResources('proteccion-datos').docs.length).toBeGreaterThan(0);
    expect(getPublicTopicResources('laboral-seguridad-social').articles.length).toBeGreaterThan(0);
  });
});
