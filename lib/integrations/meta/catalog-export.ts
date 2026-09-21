import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import type { MetaServiceCatalogDraft } from './types';

const SITE_ORIGIN = 'https://expertconsulting.es';

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
  status: string;
};

type ChannelConfigRow = {
  service_id: string;
  enabled: boolean;
  publish_status: string;
};

export type MetaCatalogDraftResult = {
  drafts: MetaServiceCatalogDraft[];
  readyCount: number;
  blockedCount: number;
};

/**
 * Read-only projection from the canonical C2 tables into what a Meta
 * commerce catalog item needs. Never writes anything and never calls Meta.
 * A draft with `marketingReady: false` names exactly what is missing so it
 * can be fixed before this service is exported.
 */
export async function buildMetaCatalogDrafts(locale = 'es'): Promise<MetaCatalogDraftResult> {
  const admin = getSupabaseAdmin();

  const [servicesResult, contentsResult, offersResult, channelsResult] = await Promise.all([
    admin.from('catalog_services').select('id,slug,category_key,status'),
    admin
      .from('service_contents')
      .select('id,service_id,locale,name,short_description,description,landing_path,image_url,status')
      .eq('locale', locale),
    admin.from('commercial_offers').select('id,service_id,code,price_mode,amount_cents,status'),
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

  const drafts = services.map((service) => buildDraft(service, contentByService, offersByService, channelByService));

  return {
    drafts,
    readyCount: drafts.filter((draft) => draft.marketingReady).length,
    blockedCount: drafts.filter((draft) => !draft.marketingReady).length,
  };
}

function buildDraft(
  service: CatalogServiceRow,
  contentByService: Map<string, ServiceContentRow>,
  offersByService: Map<string, CommercialOfferRow[]>,
  channelByService: Map<string, ChannelConfigRow>,
): MetaServiceCatalogDraft {
  const content = contentByService.get(service.id) ?? null;
  const serviceOffers = offersByService.get(service.id) ?? [];
  const offer = serviceOffers.find((row) => row.status === 'active') ?? serviceOffers[0] ?? null;
  const channel = channelByService.get(service.id) ?? null;

  const warnings: string[] = [];
  if (!content) warnings.push('missing_content');
  if (content && !content.image_url) warnings.push('missing_image');
  if (content && content.status !== 'active') warnings.push(`content_status:${content.status}`);
  if (!offer) warnings.push('missing_offer');
  if (offer && offer.price_mode === 'quote') warnings.push('price_requires_manual_review');
  if (offer && offer.price_mode !== 'quote' && offer.amount_cents == null) warnings.push('missing_amount');
  if (service.status !== 'active') warnings.push(`service_status:${service.status}`);
  if (!channel || !channel.enabled || channel.publish_status !== 'ready') warnings.push('meta_channel_not_ready');

  const price = offer && offer.amount_cents != null
    ? { amount: offer.amount_cents / 100, currency: 'EUR' as const, taxIncluded: false as const }
    : null;

  return {
    retailerId: service.slug,
    name: content?.name ?? service.slug,
    description: content?.description ?? content?.short_description ?? '',
    serviceCategory: service.category_key,
    sourceCategorySlug: service.category_key,
    landingUrl: content ? `${SITE_ORIGIN}${content.landing_path}` : `${SITE_ORIGIN}/servicios`,
    imageUrl: content?.image_url ? `${SITE_ORIGIN}${content.image_url}` : null,
    price,
    availability: service.status === 'active' ? 'in stock' : 'out of stock',
    marketingReady: warnings.length === 0,
    warnings,
  };
}
