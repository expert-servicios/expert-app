import { articles } from '@/lib/utils/blog';
import { docs } from '@/lib/utils/docs';
import { getCatalogService } from '@/lib/utils/catalog';
import { getServiceLaunchPack } from '@/lib/marketing/catalog-launch-social';

export const SERVICE_PRODUCTION_STANDARD_VERSION = '1.0';

export type ServiceProductionStage =
  | 'draft'
  | 'commercial_ready'
  | 'content_ready'
  | 'locale_ready'
  | 'channel_ready'
  | 'production_ready';

export type ServiceReadinessIssueCode =
  | 'service_missing'
  | 'meta_missing'
  | 'commercial_definition_incomplete'
  | 'blog_below_minimum'
  | 'kb_below_minimum'
  | 'social_pack_missing'
  | 'social_channel_below_minimum';

export type ServiceReadinessIssue = {
  code: ServiceReadinessIssueCode;
  message: string;
};

export type ServiceReadinessResult = {
  slug: string;
  standardVersion: string;
  blogCount: number;
  knowledgeCount: number;
  socialCounts: Record<'facebook' | 'instagram' | 'linkedin' | 'google', number>;
  issues: ServiceReadinessIssue[];
};

const SOCIAL_CHANNELS = ['facebook', 'instagram', 'linkedin', 'google'] as const;

export function evaluateServiceContentReadiness(slug: string): ServiceReadinessResult {
  const service = getCatalogService(slug);
  const blogCount = articles.filter((article) => article.relatedServiceSlugs?.includes(slug)).length;
  const knowledgeCount = docs.filter((doc) => doc.relatedServiceSlugs?.includes(slug)).length;
  const socialPack = getServiceLaunchPack(slug);

  const socialCounts = Object.fromEntries(
    SOCIAL_CHANNELS.map((channel) => [
      channel,
      socialPack?.posts.filter((post) => post.channel === channel).length ?? 0,
    ]),
  ) as ServiceReadinessResult['socialCounts'];

  const issues: ServiceReadinessIssue[] = [];

  if (!service) {
    issues.push({ code: 'service_missing', message: 'El servicio no existe en el catálogo público.' });
    return {
      slug,
      standardVersion: SERVICE_PRODUCTION_STANDARD_VERSION,
      blogCount,
      knowledgeCount,
      socialCounts,
      issues,
    };
  }

  if (!service.metaTitle || !service.metaDescription) {
    issues.push({
      code: 'meta_missing',
      message: 'Faltan metaTitle o metaDescription propios del servicio.',
    });
  }

  if (
    !service.name ||
    !service.shortDescription ||
    !service.description ||
    !service.price ||
    !service.includes?.length ||
    !service.faqs?.length
  ) {
    issues.push({
      code: 'commercial_definition_incomplete',
      message: 'La definición comercial mínima del servicio está incompleta.',
    });
  }

  if (blogCount < 3) {
    issues.push({
      code: 'blog_below_minimum',
      message: `Se requieren al menos 3 artículos relacionados; existen ${blogCount}.`,
    });
  }

  if (knowledgeCount < 3) {
    issues.push({
      code: 'kb_below_minimum',
      message: `Se requieren al menos 3 guías relacionadas; existen ${knowledgeCount}.`,
    });
  }

  if (!socialPack) {
    issues.push({
      code: 'social_pack_missing',
      message: 'No existe paquete social para el servicio.',
    });
  } else {
    for (const channel of SOCIAL_CHANNELS) {
      if (socialCounts[channel] < 3) {
        issues.push({
          code: 'social_channel_below_minimum',
          message: `El canal ${channel} requiere al menos 3 piezas; existen ${socialCounts[channel]}.`,
        });
      }
    }
  }

  return {
    slug,
    standardVersion: SERVICE_PRODUCTION_STANDARD_VERSION,
    blogCount,
    knowledgeCount,
    socialCounts,
    issues,
  };
}

export function isServiceContentReady(slug: string): boolean {
  return evaluateServiceContentReadiness(slug).issues.length === 0;
}
