import { describe, expect, it } from 'vitest';
import { services } from '@/lib/utils/catalog';
import { blogArticles } from '@/lib/utils/blog';
import { docs } from '@/lib/utils/docs';
import {
  PUBLIC_KIA_ENTRY, PUBLIC_NAV_DRAFT, PUBLIC_TOPICS, PUBLIC_TOPIC_IDS,
  topicForArticle, topicForDoc, topicForService,
} from '@/lib/content/public-autogestion-taxonomy';

describe('WEB-P1: cross-content public taxonomy contract', () => {
  it('defines exactly eight stable bilingual thematic areas', () => {
    expect(PUBLIC_TOPICS).toHaveLength(8);
    expect(PUBLIC_TOPICS.map(topic => topic.id)).toEqual([...PUBLIC_TOPIC_IDS]);
    expect(new Set(PUBLIC_TOPIC_IDS).size).toBe(PUBLIC_TOPIC_IDS.length);
    for (const topic of PUBLIC_TOPICS) {
      expect(topic.label.es.length).toBeGreaterThan(3);
      expect(topic.label.ru.length).toBeGreaterThan(3);
      expect(topic.href.es.startsWith('/')).toBe(true);
      expect(topic.href.ru.startsWith('/')).toBe(true);
    }
  });

  it('classifies every current service, article and knowledge document into an existing topic', () => {
    const validTopics = new Set<string>(PUBLIC_TOPIC_IDS);
    for (const service of services) {
      expect(validTopics.has(topicForService(service) ?? ''), service.slug).toBe(true);
    }
    for (const article of blogArticles) {
      expect(validTopics.has(topicForArticle(article) ?? ''), article.slug).toBe(true);
    }
    for (const doc of docs) {
      expect(validTopics.has(topicForDoc(doc) ?? ''), doc.slug).toBe(true);
    }
  });

  it('keeps Labour and RGPD findable even when the commercial category is elsewhere', () => {
    expect(topicForService({ slug: 'formacion-rgpd-aepd', categoria: 'empresas-autonomos' })).toBe('proteccion-datos');
    expect(topicForService({ slug: 'holded-modulo-laboral', categoria: 'holded' })).toBe('laboral-seguridad-social');
    expect(topicForService({ slug: 'cuentas-anuales', categoria: 'empresas-autonomos' })).toBe('mercantil-registros');
    expect(topicForArticle({ slug: 'rgpd-marketplaces-candidatos-datos-sensibles-responsabilidad', category: 'Protección de datos' })).toBe('proteccion-datos');
  });

  it('uses known routes in ES/RU without claiming all Russian pages are translated', () => {
    expect(PUBLIC_NAV_DRAFT.map(item => item.id)).toEqual([
      'home', 'procedures', 'knowledge', 'tools', 'training', 'services', 'plans', 'login',
    ]);
    const broader = PUBLIC_NAV_DRAFT.filter(item => item.ruDestinationType === 'broader-hub');
    expect(broader.some(item => item.id === 'knowledge')).toBe(true);
    expect(broader.some(item => item.id === 'procedures')).toBe(true);
    expect(PUBLIC_NAV_DRAFT.find(item => item.id === 'tools')?.href.ru).toBe('/ru/instrumenty/rgpd');
    expect(PUBLIC_KIA_ENTRY.action).toBe('open-existing-kia-widget');
  });
});
