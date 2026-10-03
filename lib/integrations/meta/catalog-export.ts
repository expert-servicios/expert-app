import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import type { MetaCatalogVatTreatment, MetaServiceCatalogDraft } from './types';

const SITE_ORIGIN = 'https://expertconsulting.es';
const META_VAT_RATE_BY_SERVICE_SLUG: Readonly<Record<string, number>> = {
  'certificado-digital-persona-fisica': 0.21,
  'certificado-digital-entidad': 0.21,
  'pack-certificados-digitales': 0.21,
};

type CatalogServiceRow = {
  id: string;
  slug: string;
  category_key: string;
  status: string;
};

type ServiceContentRow = {
  id: string;
  service_id: string;
  locale: string;
  name: string;
  short_description: string | null;
  description: string | null;
  landing_path: string;
  image_url: string | null;
  status: string;
};

type CommercialOfferRow = {
  id: string;
  service_id: string;
  code: string;
  price_mode: string;
  amount_cents: number | null;
  vat_treatment: MetaCatalogVatTreatment;
  status: string;
};

type ChannelConfigRow = {
  service_id: string;
  enabled: boolean;
  publish_status: string;
};

export type MetaCatalogExcludedService = {
  retailerId: string;
  name: string;
  reason: 'quote_price' | 'missing_offer' | 'archived';
};

export type MetaCatalogDraftResult = {
  drafts: MetaServiceCatalogDraft[];
  excluded: MetaCatalogExcludedService[];
  readyCount: number;
  blockedCount: number;
};

export function projectMetaConsumerPrice(
  amountCents: number,
  vatTreatment: MetaCatalogVatTreatment,
  vatRate?: number,
) {
  if (vatTreatment === 'plus_vat') {
    if (vatRate == null) return null;
    return {
      amount: Math.round(amountCents * (1 + vatRate)) / 100,
      currency: 'EUR' as const,
      taxIncluded: true,
      vatTreatment,
    };
  }

  if (vatTreatment === 'vat_included' || vatTreatment === 'exempt' || vatTreatment === 'outside_scope') {
    return {
      amount: amountCents / 100,
      currency: 'EUR' as const,
      taxIncluded: true,
      vatTreatment,
    };
  }

  return null;
}

export async function buildMetaCatalogDrafts(locale = 'es'): Promise<MetaCatalogDraftResult> {
  const admin = getSupabaseAdmin();

  const [servicesResult, contentsResult, offersResult, channelsResult] = await Promise.all([
    admin.from('catalog_services').select('id,slug,category_key,status'),
    admin
      .from('service_contents')
      .select('id,service_id,locale,name,short_description,description,landing_path,image_url,status')
      .eq('locale', locale),
    admin.from('commercial_offers').select('id,service_id,code,price_mode,amount_cents,vat_treatment,status'),
    admin.from('service_channel_configs').select('service_id,enabled,publish_status').eq('channel', 'meta'),
  ]);

  for (const [source, result] of [
    ['catalog_services', servicesResult],
    ['service_contents', contentsResult],
    ['commercial_offers', offersResult],
    ['service_channel_configs', channelsResult],
  ] as const) {
    if (result.error) throw new Error(`No se pudo leer ${source}: ${result.error.message}`);
  }

  const services = (servicesResult.data ?? []) as CatalogServiceRow[];
  const contents = (contentsResult.data ?? []) as ServiceContentRow[];
  const offers = (offersResult.data ?? []) as CommercialOfferRow[];
  const channels = (channelsResult.data ?? []) as ChannelConfigRow[];

  const contentByService = new Map(contents.map((row) => [row.service_id, row]));
  const offersByService = new Map<string, CommercialOfferRow[]>();
  for (const offer of offers) {
    const list = offersByService.get(offer.service_id) ?? [];
    list.push(offer);
    offersByService.set(offer.service_id, list);
  }
  const channelByService = new Map(channels.map((row) => [row.service_id, row]));

  const drafts: MetaServiceCatalogDraft[] = [];
  const excluded: MetaCatalogExcludedService[] = [];

  for (const service of services) {
    const content = contentByService.get(service.id) ?? null;
    const serviceOffers = offersByService.get(service.id) ?? [];
    const offer = serviceOffers.find((row) => row.status === 'active') ?? serviceOffers[0] ?? null;

    if (service.status !== 'active') {
      excluded.push({
        retailerId: service.slug,
        name: content?.name ?? service.slug,
        reason: 'archived',
      });
      continue;
    }

    if (!offer || offer.price_mode === 'quote') {
      excluded.push({
        retailerId: service.slug,
        name: content?.name ?? service.slug,
        reason: offer ? 'quote_price' : 'missing_offer',
      });
      continue;
    }

    drafts.push(buildDraft(service, content, offer, channelByService));
  }

  return {
    drafts,
    excluded,
    readyCount: drafts.filter((draft) => draft.marketingReady).length,
    blockedCount: drafts.filter((draft) => !draft.marketingReady).length,
  };
}

function buildDraft(
  service: CatalogServiceRow,
  content: ServiceContentRow | null,
  offer: CommercialOfferRow,
  channelByService: Map<string, ChannelConfigRow>,
): MetaServiceCatalogDraft {
  const channel = channelByService.get(service.id) ?? null;

  const warnings: string[] = [];
  if (!content) warnings.push('missing_content');
  if (content && !content.image_url) warnings.push('missing_image');
  if (content && content.status !== 'active') warnings.push(`content_status:${content.status}`);
  if (offer.amount_cents == null) warnings.push('missing_amount');
  if (offer.vat_treatment === 'manual_review') warnings.push('vat_manual_review');
  if (!channel || !channel.enabled || channel.publish_status !== 'ready') warnings.push('meta_channel_not_ready');

  const vatRate = META_VAT_RATE_BY_SERVICE_SLUG[service.slug];
  const price = offer.amount_cents != null
    ? projectMetaConsumerPrice(offer.amount_cents, offer.vat_treatment, vatRate)
    : null;

  if (offer.amount_cents != null && !price) warnings.push('consumer_price_unavailable');

  return {
    retailerId: service.slug,
    offerId: offer.id,
    name: content?.name ?? service.slug,
    description: content?.description ?? content?.short_description ?? '',
    serviceCategory: service.category_key,
    sourceCategorySlug: service.category_key,
    landingUrl: content ? `${SITE_ORIGIN}${content.landing_path}` : `${SITE_ORIGIN}/servicios`,
    imageUrl: content?.image_url ? `${SITE_ORIGIN}${content.image_url}` : null,
    price,
    availability: 'in stock',
    marketingReady: warnings.length === 0,
    warnings,
  };
}
