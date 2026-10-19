/**
 * WEB-P1 — one canonical thematic home per subject, preserving original URLs.
 * No changes to the underlying service / blog / knowledge catalogs.
 */
import { services, type Service } from '@/lib/utils/catalog';
import { blogArticles, type Article } from '@/lib/utils/blog';
import { docs, type KnowledgeDoc } from '@/lib/utils/docs';
import {
  PUBLIC_TOPICS,
  type PublicTopic,
  type PublicTopicId,
  topicForService,
  topicForArticle,
  topicForDoc,
} from '@/lib/content/public-autogestion-taxonomy';

/** The established URLs are kept, new URLs only for previously missing topics. */
export const PUBLIC_TOPIC_ROUTES: Readonly<Record<PublicTopicId, string>> = {
  'empresas-autonomos': 'empresas',
  'fiscalidad-contabilidad': 'fiscalidad',
  'laboral-seguridad-social': 'laboral-seguridad-social',
  'mercantil-registros': 'mercantil-registros',
  'tramites-certificados': 'tramites',
  'proteccion-datos': 'proteccion-datos',
  'extranjeria-nacionalidad': 'extranjeria-nacionalidad',
  'digitalizacion-gestion': 'holded',
};

export const PUBLIC_TOPIC_ROUTE_SLUGS = Object.values(PUBLIC_TOPIC_ROUTES);

export type PublicTopicResources = {
  topic: PublicTopic;
  services: Service[];
  articles: Article[];
  docs: KnowledgeDoc[];
};

export function resolvePublicTopicRoute(slug: string): PublicTopicId | null {
  const entry = Object.entries(PUBLIC_TOPIC_ROUTES).find(([, route]) => route === slug);
  return (entry?.[0] as PublicTopicId | undefined) ?? null;
}

export function getPublicTopicResources(topicId: PublicTopicId): PublicTopicResources {
  const topic = PUBLIC_TOPICS.find(t => t.id === topicId);
  if (!topic) throw new Error('Unknown public topic ' + topicId);
  return {
    topic,
    services: services.filter(item => topicForService(item) === topicId),
    articles: blogArticles.filter(item => topicForArticle(item) === topicId),
    docs: docs.filter(item => topicForDoc(item) === topicId),
  };
}

export function getTopicHref(topicId: PublicTopicId): string {
  return '/categoria/' + PUBLIC_TOPIC_ROUTES[topicId];
}
