import { createHash } from 'node:crypto';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { serviceProductionManifest } from '@/lib/services/service-production-manifest';
import { buildMetaCatalogDrafts } from './catalog-export';
import { MetaGraphError, metaGraphRequest } from './client';
import { requireMetaMarketingConfig } from './config';
import type { MetaServiceCatalogDraft } from './types';

export const INITIAL_META_CATALOG_RETAILER_IDS = [
  'certificado-digital-persona-fisica',
  'certificado-digital-entidad',
  'pack-certificados-digitales',
] as const;

export const INITIAL_META_CATALOG_BATCH_LIMIT = 3;

type MetaCatalogItemRow = {
  id: string;
  service_id: string;
  offer_id: string | null;
  locale: string;
  retailer_id: string;
  sync_status: string;
};

type CatalogServiceIdentityRow = {
  id: string;
  slug: string;
};

type CommercialOfferIdentityRow = {
  id: string;
  service_id: string;
  status: string;
};

type StripeBindingRow = {
  offer_id: string;
  environment: string;
  status: string;
  reconciliation_status: string;
};

export type MetaCatalogSyncItemResult = {
  retailerId: string;
  ok: boolean;
  metaItemId: string | null;
  error: string | null;
};

export type MetaCatalogSyncResult = {
  attempted: number;
  succeeded: number;
  failed: number;
  items: MetaCatalogSyncItemResult[];
};

export function buildMetaProductPayload(draft: MetaServiceCatalogDraft) {
  if (!draft.marketingReady) {
    throw new Error(`Meta draft is not marketing-ready: ${draft.retailerId}`);
  }
  if (!draft.price || draft.price.amount <= 0) {
    throw new Error(`Meta draft has no valid price: ${draft.retailerId}`);
  }
  if (!draft.imageUrl) {
    throw new Error(`Meta draft has no image: ${draft.retailerId}`);
  }

  return {
    retailer_id: draft.retailerId,
    name: draft.name,
    description: draft.description,
    availability: draft.availability,
    condition: 'new',
    currency: draft.price.currency,
    price: Math.round(draft.price.amount * 100),
    url: draft.landingUrl,
    image_url: draft.imageUrl,
    brand: 'EXPERT',
    product_type: draft.serviceCategory,
    allow_upsert: true,
  };
}

function payloadHash(payload: Record<string, unknown>) {
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

function errorDetails(error: unknown) {
  if (error instanceof MetaGraphError) {
    return {
      code: error.code != null ? String(error.code) : 'meta_graph_error',
      message: error.message,
      httpStatus: error.status,
      subcode: error.subcode != null ? String(error.subcode) : null,
      traceId: error.traceId ?? null,
    };
  }

  return {
    code: 'internal_error',
    message: error instanceof Error ? error.message : String(error),
    httpStatus: null,
    subcode: null,
    traceId: null,
  };
}

/**
 * First controlled catalog writer.
 *
 * Safety gates:
 * - only the three explicitly approved production_ready certificate services;
 * - max three items per invocation;
 * - meta_catalog_items must already be staged as ready;
 * - C2 projection must be marketing-ready;
 * - a live, active, matched Stripe binding must exist for the canonical offer;
 * - one auditable meta_sync_jobs row is created before each external write;
 * - no campaigns, ads, budgets, Page posts or Instagram posts are touched.
 */
export async function syncInitialMetaCatalogBatch(requestedBy: string): Promise<MetaCatalogSyncResult> {
  const config = requireMetaMarketingConfig();
  if (!config.catalogId) throw new Error('Meta catalog ID is not configured');

  const admin = getSupabaseAdmin();
  const draftResult = await buildMetaCatalogDrafts('es');
  const draftByRetailerId = new Map(draftResult.drafts.map((draft) => [draft.retailerId, draft]));

  const { data: stagedRows, error: stagedError } = await admin
    .from('meta_catalog_items')
    .select('id,service_id,offer_id,locale,retailer_id,sync_status')
    .eq('locale', 'es')
    .eq('sync_status', 'ready')
    .in('retailer_id', [...INITIAL_META_CATALOG_RETAILER_IDS])
    .order('retailer_id')
    .limit(INITIAL_META_CATALOG_BATCH_LIMIT);

  if (stagedError) throw new Error(`No se pudo leer meta_catalog_items: ${stagedError.message}`);

  const staged = (stagedRows ?? []) as MetaCatalogItemRow[];
  if (staged.length === 0) {
    throw new Error('No hay items Meta en estado ready para sincronizar');
  }
  if (staged.length > INITIAL_META_CATALOG_BATCH_LIMIT) {
    throw new Error('El lote Meta excede el límite inicial de seguridad');
  }

  const allowed = new Set<string>(INITIAL_META_CATALOG_RETAILER_IDS);

  const { data: serviceIdentityRows, error: serviceIdentityError } = await admin
    .from('catalog_services')
    .select('id,slug')
    .in('slug', [...INITIAL_META_CATALOG_RETAILER_IDS]);
  if (serviceIdentityError) {
    throw new Error(`No se pudo verificar catalog_services: ${serviceIdentityError.message}`);
  }
  const serviceIdBySlug = new Map(
    ((serviceIdentityRows ?? []) as CatalogServiceIdentityRow[]).map((row) => [row.slug, row.id]),
  );

  const offerIds = staged.map((row) => row.offer_id).filter((id): id is string => Boolean(id));
  const { data: offerIdentityRows, error: offerIdentityError } = await admin
    .from('commercial_offers')
    .select('id,service_id,status')
    .in('id', offerIds);
  if (offerIdentityError) {
    throw new Error(`No se pudo verificar commercial_offers: ${offerIdentityError.message}`);
  }
  const offerById = new Map(
    ((offerIdentityRows ?? []) as CommercialOfferIdentityRow[]).map((row) => [row.id, row]),
  );

  const productionReady = new Set(
    serviceProductionManifest
      .filter((entry) => entry.stage === 'production_ready')
      .map((entry) => entry.slug),
  );

  const { data: bindingRows, error: bindingsError } = await admin
    .from('stripe_price_bindings')
    .select('offer_id,environment,status,reconciliation_status')
    .eq('environment', 'live')
    .eq('status', 'active')
    .eq('reconciliation_status', 'matched');

  if (bindingsError) throw new Error(`No se pudo leer stripe_price_bindings: ${bindingsError.message}`);

  const matchedOfferIds = new Set(
    ((bindingRows ?? []) as StripeBindingRow[]).map((row) => row.offer_id),
  );

  const results: MetaCatalogSyncItemResult[] = [];

  for (const item of staged) {
    const retailerId = item.retailer_id;
    const draft = draftByRetailerId.get(retailerId);

    if (!allowed.has(retailerId)) {
      throw new Error(`Item fuera del lote inicial permitido: ${retailerId}`);
    }
    if (!productionReady.has(retailerId)) {
      throw new Error(`Servicio no production_ready: ${retailerId}`);
    }

    const canonicalServiceId = serviceIdBySlug.get(retailerId);
    if (!canonicalServiceId || canonicalServiceId !== item.service_id) {
      throw new Error(`meta_catalog_items no coincide con catalog_services: ${retailerId}`);
    }

    const canonicalOffer = item.offer_id ? offerById.get(item.offer_id) : null;
    if (
      !canonicalOffer
      || canonicalOffer.service_id !== item.service_id
      || canonicalOffer.status !== 'active'
      || !matchedOfferIds.has(canonicalOffer.id)
    ) {
      throw new Error(`Oferta canónica sin binding Stripe live reconciliado: ${retailerId}`);
    }
    if (!draft?.marketingReady) {
      throw new Error(`Proyección Meta no lista: ${retailerId}`);
    }

    const payload = buildMetaProductPayload(draft);
    const hash = payloadHash(payload);

    const { data: job, error: jobError } = await admin
      .from('meta_sync_jobs')
      .insert({
        operation: 'catalog_product_upsert',
        target_type: 'meta_catalog_item',
        target_id: item.id,
        requested_by: requestedBy,
        status: 'running',
        attempt_count: 1,
        started_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (jobError || !job?.id) {
      throw new Error(`No se pudo crear el job Meta para ${retailerId}: ${jobError?.message ?? 'sin id'}`);
    }

    try {
      const response = await metaGraphRequest<{ id?: string }>({
        path: `${config.catalogId}/products`,
        method: 'POST',
        formBody: payload,
      });

      if (!response.id) {
        throw new Error(`Meta no devolvió id para ${retailerId}`);
      }

      const { error: logError } = await admin.from('meta_api_logs').insert({
        sync_job_id: job.id,
        operation: 'catalog_product_upsert',
        endpoint: `/${config.catalogId}/products`,
        http_status: 200,
      });
      if (logError) throw new Error(`No se pudo registrar meta_api_logs: ${logError.message}`);

      const { error: itemError } = await admin
        .from('meta_catalog_items')
        .update({
          meta_item_id: response.id,
          sync_status: 'synced',
          last_payload_hash: hash,
          last_synced_at: new Date().toISOString(),
          last_error_code: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', item.id);
      if (itemError) throw new Error(`No se pudo actualizar meta_catalog_items: ${itemError.message}`);

      const { error: finishError } = await admin
        .from('meta_sync_jobs')
        .update({
          status: 'succeeded',
          finished_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', job.id);
      if (finishError) throw new Error(`No se pudo cerrar meta_sync_jobs: ${finishError.message}`);

      results.push({ retailerId, ok: true, metaItemId: response.id, error: null });
    } catch (error) {
      const details = errorDetails(error);

      await admin.from('meta_api_logs').insert({
        sync_job_id: job.id,
        operation: 'catalog_product_upsert',
        endpoint: `/${config.catalogId}/products`,
        http_status: details.httpStatus,
        meta_error_code: details.code,
        meta_error_subcode: details.subcode,
        trace_id: details.traceId,
      });

      await admin
        .from('meta_catalog_items')
        .update({
          sync_status: 'failed',
          last_payload_hash: hash,
          last_error_code: details.code,
          updated_at: new Date().toISOString(),
        })
        .eq('id', item.id);

      await admin
        .from('meta_sync_jobs')
        .update({
          status: 'failed',
          error_code: details.code,
          error_message: details.message.slice(0, 1000),
          finished_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', job.id);

      results.push({
        retailerId,
        ok: false,
        metaItemId: null,
        error: details.message,
      });
    }
  }

  return {
    attempted: results.length,
    succeeded: results.filter((item) => item.ok).length,
    failed: results.filter((item) => !item.ok).length,
    items: results,
  };
}
