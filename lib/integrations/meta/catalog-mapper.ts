import { categories, services, type Service } from '@/lib/utils/catalog';
import type { MetaServiceCatalogDraft } from './types';

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://expertconsulting.es').replace(/\/$/, '');

function parseFixedEuroPrice(price?: string): number | null {
  if (!price) return null;
  const normalized = price.trim();
  if (/^(consultar|desde\b)/i.test(normalized)) return null;

  const match = normalized.match(/^(\d+(?:[.,]\d{1,2})?)\s*€/i);
  if (!match) return null;

  const value = Number(match[1].replace(',', '.'));
  return Number.isFinite(value) ? value : null;
}

function getCategoryName(slug: Service['categoria']): string {
  return categories.find((category) => category.slug === slug)?.name ?? slug;
}

export function mapServiceToMetaCatalogDraft(service: Service): MetaServiceCatalogDraft {
  const priceAmount = parseFixedEuroPrice(service.price);
  const warnings: string[] = [];

  if (!priceAmount) warnings.push('price_requires_manual_review');
  if (!service.shortDescription?.trim()) warnings.push('missing_short_description');

  return {
    retailerId: service.slug,
    name: service.name,
    description: service.shortDescription || service.description,
    serviceCategory: getCategoryName(service.categoria),
    sourceCategorySlug: service.categoria,
    landingUrl: `${APP_URL}/servicios/${service.categoria}/${service.slug}`,
    imageUrl: null,
    price: priceAmount
      ? {
          amount: priceAmount,
          currency: 'EUR',
          taxIncluded: false,
        }
      : null,
    marketingReady: warnings.length === 0,
    warnings,
  };
}

export function getMetaCatalogDrafts(): MetaServiceCatalogDraft[] {
  return services.map(mapServiceToMetaCatalogDraft);
}
