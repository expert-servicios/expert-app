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

type PreparedItem = {
  item: MetaCatalogItemRow;
  draft: MetaServiceCatalogDraft;
  payload: ReturnType<typeof buildMetaProductPayload>;
  hash: string;
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
  if (!draft.price || draft.price.amount <= 0 || !draft.price.taxIncluded) {
    throw new Error(`Meta draft has no valid consumer price: ${draft.retailerId}`);
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
    .order('retailer_id');

  if (stagedError) throw new Error(`No se pudo leer meta_catalog_items: ${stagedError.message}`);

  const staged = (stagedRows ?? []) as MetaCatalogItemRow[];
  if (staged.length !== INITIAL_META_CATALOG_BATCH_LIMIT) {
    throw new Error(
      `El lote inicial requiere exactamente ${INITIAL_META_CATALOG_BATCH_LIMIT} items Meta ready; encontrados: ${staged.length}`,
    );
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

  const prepared: PreparedItem[] = staged.map((item) => {
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
    if (draft.offerId !== canonicalOffer.id) {
      throw new Error(`La oferta exportada no coincide con la oferta reconciliada: ${retailerId}`);
    }

    const payload = buildMetaProductPayload(draft);
    return { item, draft, payload, hash: payloadHash(payload) };
  });

  const claimedIds: string[] = [];
  for (const { item } of prepared) {
    const { data: claimed, error: claimError } = await admin
      .from('meta_catalog_items')
      .update({ sync_status: 'pending', updated_at: new Date().toISOString() })
      .eq('id', item.id)
      .eq('sync_status', 'ready')
      .select('id');

    if (claimError || (claimed ?? []).length !== 1) {
      if (claimedIds.length > 0) {
        await admin
          .from('meta_catalog_items')
          .update({ sync_status: 'ready', updated_at: new Date().toISOString() })
          .in('id', claimedIds)
          .eq('sync_status', 'pending');
      }
      throw new Error(`El lote Meta ya está siendo procesado o cambió de estado: ${item.retailer_id}`);
    }
    claimedIds.push(item.id);
  }

  const now = new Date().toISOString();
  const { data: jobs, error: jobsError } = await admin
    .from('meta_sync_jobs')
    .insert(prepared.map(({ item }) => ({
      operation: 'catalog_product_upsert',
      target_type: 'meta_catalog_item',
      target_id: item.id,
      requested_by: requestedBy,
      status: 'running',
      attempt_count: 1,
      started_at: now,
    })))
    .select('id,target_id');

  if (jobsError || (jobs ?? []).length !== prepared.length) {
    await admin
      .from('meta_catalog_items')
      .update({ sync_status: 'ready', updated_at: new Date().toISOString() })
      .in('id', claimedIds)
      .eq('sync_status', 'pending');
    throw new Error(`No se pudieron crear los jobs Meta del lote: ${jobsError?.message ?? 'conteo incompleto'}`);
  }

  const jobIdByTarget = new Map((jobs ?? []).map((job) => [String(job.target_id), String(job.id)]));
  const results: MetaCatalogSyncItemResult[] = [];

  for (const { item, payload, hash } of prepared) {
    const retailerId = item.retailer_id;
    const jobId = jobIdByTarget.get(item.id);
    if (!jobId) throw new Error(`No se encontró job para ${retailerId}`);

    let metaItemId: string | null = null;

    try {
      const response = await metaGraphRequest<{ id?: string }>({
        path: `${config.catalogId}/products`,
        method: 'POST',
        formBody: payload,
      });

      if (!response.id) {
        throw new Error(`Meta no devolvió id para ${retailerId}`);
      }
      metaItemId = response.id;
    } catch (error) {
      const details = errorDetails(error);

      await admin.from('meta_api_logs').insert({
        sync_job_id: jobId,
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
        .eq('id', item.id)
        .eq('sync_status', 'pending');

      await admin
        .from('meta_sync_jobs')
        .update({
          status: 'failed',
          error_code: details.code,
          error_message: details.message.slice(0, 1000),
          finished_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', jobId);

      results.push({ retailerId, ok: false, metaItemId: null, error: details.message });
      continue;
    }

    const bookkeepingErrors: string[] = [];

    const { error: itemError } = await admin
      .from('meta_catalog_items')
      .update({
        meta_item_id: metaItemId,
        sync_status: 'synced',
        last_payload_hash: hash,
        last_synced_at: new Date().toISOString(),
        last_error_code: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', item.id)
      .eq('sync_status', 'pending');

    if (itemError) {
      bookkeepingErrors.push(`meta_catalog_items: ${itemError.message}`);
      await admin
        .from('meta_catalog_items')
        .update({
          meta_item_id: metaItemId,
          sync_status: 'manual_review',
          last_payload_hash: hash,
          last_synced_at: new Date().toISOString(),
          last_error_code: 'local_bookkeeping_incomplete',
          updated_at: new Date().toISOString(),
        })
        .eq('id', item.id);
    }

    const { error: logError } = await admin.from('meta_api_logs').insert({
      sync_job_id: jobId,
      operation: 'catalog_product_upsert',
      endpoint: `/${config.catalogId}/products`,
      http_status: 200,
    });
    if (logError) bookkeepingErrors.push(`meta_api_logs: ${logError.message}`);

    const { error: finishError } = await admin
      .from('meta_sync_jobs')
      .update({
        status: 'succeeded',
        error_code: bookkeepingErrors.length ? 'local_bookkeeping_incomplete' : null,
        error_message: bookkeepingErrors.length ? bookkeepingErrors.join(' | ').slice(0, 1000) : null,
        finished_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId);
    if (finishError) bookkeepingErrors.push(`meta_sync_jobs: ${finishError.message}`);

    results.push({
      retailerId,
      ok: true,
      metaItemId,
      error: bookkeepingErrors.length
        ? `Meta aceptó el item; revisión local necesaria: ${bookkeepingErrors.join(' | ')}`
        : null,
    });
  }

  return {
    attempted: results.length,
    succeeded: results.filter((item) => item.ok).length,
    failed: results.filter((item) => !item.ok).length,
    items: results,
  };
}
