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
export const MAX_META_CATALOG_SYNC_BATCH = 25;

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

export type MetaCatalogPrepareResult = {
  retailerId: string;
  itemId: string;
  syncStatus: 'ready';
  warnings: string[];
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

export function hashMetaProductPayload(payload: Record<string, unknown>) {
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

function productionReadyRetailerIds() {
  return new Set(
    serviceProductionManifest
      .filter((entry) => entry.stage === 'production_ready')
      .map((entry) => entry.slug),
  );
}

function normalizeRetailerIds(retailerIds: readonly string[]) {
  const normalized = Array.from(new Set(
    retailerIds
      .map((value) => value.trim())
      .filter((value) => /^[a-z0-9][a-z0-9-]{1,159}$/.test(value)),
  ));

  if (normalized.length === 0) {
    throw new Error('Selecciona al menos un servicio para sincronizar');
  }
  if (normalized.length > MAX_META_CATALOG_SYNC_BATCH) {
    throw new Error(`El lote Meta no puede superar ${MAX_META_CATALOG_SYNC_BATCH} servicios`);
  }
  return normalized;
}

export async function prepareMetaCatalogRetailer(
  requestedBy: string,
  retailerId: string,
): Promise<MetaCatalogPrepareResult> {
  const [normalizedRetailerId] = normalizeRetailerIds([retailerId]);
  const productionReady = productionReadyRetailerIds();
  if (!productionReady.has(normalizedRetailerId)) {
    throw new Error(`Servicio no production_ready: ${normalizedRetailerId}`);
  }

  const admin = getSupabaseAdmin();
  const firstDraftResult = await buildMetaCatalogDrafts('es');
  const draftBeforeChannel = firstDraftResult.drafts.find(
    (draft) => draft.retailerId === normalizedRetailerId,
  );

  if (!draftBeforeChannel) {
    const excluded = firstDraftResult.excluded.find((item) => item.retailerId === normalizedRetailerId);
    throw new Error(
      excluded
        ? `Servicio excluido del catálogo Meta: ${excluded.reason}`
        : `Servicio no disponible para Meta: ${normalizedRetailerId}`,
    );
  }

  const blockers = draftBeforeChannel.warnings.filter((warning) => warning !== 'meta_channel_not_ready');
  if (blockers.length > 0) {
    throw new Error(`Servicio bloqueado para Meta: ${blockers.join(', ')}`);
  }

  const { data: service, error: serviceError } = await admin
    .from('catalog_services')
    .select('id,slug')
    .eq('slug', normalizedRetailerId)
    .single();
  if (serviceError || !service) {
    throw new Error(`No se pudo resolver catalog_services: ${normalizedRetailerId}`);
  }

  const { data: offer, error: offerError } = await admin
    .from('commercial_offers')
    .select('id,service_id,status')
    .eq('id', draftBeforeChannel.offerId)
    .eq('service_id', service.id)
    .eq('status', 'active')
    .single();
  if (offerError || !offer) {
    throw new Error(`Oferta canónica activa no encontrada: ${normalizedRetailerId}`);
  }

  const { data: existingChannel } = await admin
    .from('service_channel_configs')
    .select('id,editorial_overrides')
    .eq('service_id', service.id)
    .eq('channel', 'meta')
    .maybeSingle();

  const now = new Date().toISOString();
  if (existingChannel) {
    const { error } = await admin
      .from('service_channel_configs')
      .update({
        enabled: true,
        publish_status: 'ready',
        updated_at: now,
      })
      .eq('id', existingChannel.id);
    if (error) throw new Error(`No se pudo habilitar canal Meta: ${error.message}`);
  } else {
    const { error } = await admin
      .from('service_channel_configs')
      .insert({
        service_id: service.id,
        channel: 'meta',
        enabled: true,
        publish_status: 'ready',
        editorial_overrides: {},
        created_at: now,
        updated_at: now,
      });
    if (error) throw new Error(`No se pudo crear canal Meta: ${error.message}`);
  }

  const verifiedDraftResult = await buildMetaCatalogDrafts('es');
  const verifiedDraft = verifiedDraftResult.drafts.find(
    (draft) => draft.retailerId === normalizedRetailerId,
  );
  if (!verifiedDraft?.marketingReady) {
    throw new Error(
      `El servicio no supera el preflight Meta tras preparar canal: ${verifiedDraft?.warnings.join(', ') ?? 'sin draft'}`,
    );
  }

  const { data: existingItem, error: existingItemError } = await admin
    .from('meta_catalog_items')
    .select('id,meta_item_id,sync_status')
    .eq('retailer_id', normalizedRetailerId)
    .maybeSingle();
  if (existingItemError) {
    throw new Error(`No se pudo leer meta_catalog_items: ${existingItemError.message}`);
  }

  let itemId: string;
  if (existingItem) {
    const { data: item, error } = await admin
      .from('meta_catalog_items')
      .update({
        service_id: service.id,
        offer_id: offer.id,
        locale: 'es',
        sync_status: 'ready',
        last_error_code: null,
        updated_at: now,
      })
      .eq('id', existingItem.id)
      .select('id')
      .single();
    if (error || !item) {
      throw new Error(`No se pudo preparar item Meta: ${error?.message ?? 'sin id'}`);
    }
    itemId = String(item.id);
  } else {
    const { data: item, error } = await admin
      .from('meta_catalog_items')
      .insert({
        service_id: service.id,
        offer_id: offer.id,
        locale: 'es',
        retailer_id: normalizedRetailerId,
        sync_status: 'ready',
        created_at: now,
        updated_at: now,
      })
      .select('id')
      .single();
    if (error || !item) {
      throw new Error(`No se pudo crear item Meta: ${error?.message ?? 'sin id'}`);
    }
    itemId = String(item.id);
  }

  await admin.from('meta_sync_jobs').insert({
    operation: 'catalog_item_prepare',
    target_type: 'meta_catalog_item',
    target_id: itemId,
    requested_by: requestedBy,
    status: 'succeeded',
    attempt_count: 1,
    started_at: now,
    finished_at: now,
  });

  return {
    retailerId: normalizedRetailerId,
    itemId,
    syncStatus: 'ready',
    warnings: [],
  };
}

export async function syncMetaCatalogRetailers(
  requestedBy: string,
  retailerIds: readonly string[],
): Promise<MetaCatalogSyncResult> {
  const config = requireMetaMarketingConfig();
  if (!config.catalogId) throw new Error('Meta catalog ID is not configured');

  const requestedRetailerIds = normalizeRetailerIds(retailerIds);
  const requestedSet = new Set(requestedRetailerIds);
  const admin = getSupabaseAdmin();
  const draftResult = await buildMetaCatalogDrafts('es');
  const draftByRetailerId = new Map(draftResult.drafts.map((draft) => [draft.retailerId, draft]));

  const { data: stagedRows, error: stagedError } = await admin
    .from('meta_catalog_items')
    .select('id,service_id,offer_id,locale,retailer_id,sync_status')
    .eq('locale', 'es')
    .eq('sync_status', 'ready')
    .in('retailer_id', requestedRetailerIds)
    .order('retailer_id');

  if (stagedError) throw new Error(`No se pudo leer meta_catalog_items: ${stagedError.message}`);

  const staged = (stagedRows ?? []) as MetaCatalogItemRow[];
  if (staged.length !== requestedRetailerIds.length) {
    const stagedIds = new Set(staged.map((row) => row.retailer_id));
    const missing = requestedRetailerIds.filter((id) => !stagedIds.has(id));
    throw new Error(`Hay servicios que no están listos para sincronizar: ${missing.join(', ')}`);
  }

  const { data: serviceIdentityRows, error: serviceIdentityError } = await admin
    .from('catalog_services')
    .select('id,slug')
    .in('slug', requestedRetailerIds);
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

  const productionReady = productionReadyRetailerIds();

  const prepared: PreparedItem[] = staged.map((item) => {
    const retailerId = item.retailer_id;
    const draft = draftByRetailerId.get(retailerId);

    if (!requestedSet.has(retailerId)) {
      throw new Error(`Item fuera del lote solicitado: ${retailerId}`);
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
    ) {
      throw new Error(`Oferta canónica activa no encontrada: ${retailerId}`);
    }
    if (!draft?.marketingReady) {
      throw new Error(`Proyección Meta no lista: ${retailerId}`);
    }
    if (draft.offerId !== canonicalOffer.id) {
      throw new Error(`La oferta exportada no coincide con la oferta canónica: ${retailerId}`);
    }

    const payload = buildMetaProductPayload(draft);
    return { item, draft, payload, hash: hashMetaProductPayload(payload) };
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

export async function syncInitialMetaCatalogBatch(requestedBy: string): Promise<MetaCatalogSyncResult> {
  return syncMetaCatalogRetailers(requestedBy, INITIAL_META_CATALOG_RETAILER_IDS);
}
