import { createHash } from 'node:crypto';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { serviceProductionManifest } from '@/lib/services/service-production-manifest';
import { buildMetaCatalogDrafts } from './catalog-export';
import { MetaGraphError, metaGraphRequest } from './client';
import { requireMetaMarketingConfig } from './config';
import type { MetaServiceCatalogDraft } from './types';

export type MetaCatalogLocalizationLocale = 'ru';

export const META_CATALOG_LOCALIZATION_LOCALES: Record<MetaCatalogLocalizationLocale, string> = {
  ru: 'ru_RU',
};

const MAX_LOCALIZED_BATCH = 25;

type JsonObject = Record<string, unknown>;

type LocalizationSyncState = {
  meta_locale: string;
  sync_status: 'ready' | 'pending' | 'synced' | 'failed' | 'manual_review';
  prepared_payload_hash: string | null;
  last_payload_hash: string | null;
  last_synced_at: string | null;
  last_error_code: string | null;
  batch_handle: string | null;
  sync_job_id: string | null;
};

type ChannelRow = {
  id: string;
  service_id: string;
  editorial_overrides: unknown;
  updated_at: string;
};

type BatchValidationStatus = {
  retailer_id?: string;
  errors?: Array<{ message?: string }>;
  warnings?: Array<{ message?: string }>;
};

type LocalizedBatchResponse = {
  handles?: string[];
  validation_status?: BatchValidationStatus[];
};

type BatchStatusResponse = {
  data?: Array<{
    handle?: string;
    status?: string;
    warnings?: Array<{ line?: number; id?: string; message?: string }>;
    errors_total_count?: number;
    ids_of_invalid_requests?: string[];
  }>;
};

export type LocalizationOperationResult = {
  retailerId: string;
  locale: MetaCatalogLocalizationLocale;
  syncStatus: LocalizationSyncState['sync_status'];
  error: string | null;
};

function isObject(value: unknown): value is JsonObject {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function asObject(value: unknown): JsonObject {
  return isObject(value) ? { ...value } : {};
}

function normalizeRetailerIds(retailerIds: readonly string[]) {
  const normalized = Array.from(new Set(
    retailerIds
      .map((value) => value.trim())
      .filter((value) => /^[a-z0-9][a-z0-9-]{1,159}$/.test(value)),
  ));

  if (normalized.length === 0) {
    throw new Error('Selecciona al menos un servicio');
  }
  if (normalized.length > MAX_LOCALIZED_BATCH) {
    throw new Error(`El lote localizado no puede superar ${MAX_LOCALIZED_BATCH} servicios`);
  }
  return normalized;
}

function productionReadyRetailerIds() {
  return new Set(
    serviceProductionManifest
      .filter((entry) => entry.stage === 'production_ready')
      .map((entry) => entry.slug),
  );
}

export function buildMetaLocalizedRequest(
  draft: MetaServiceCatalogDraft,
  locale: MetaCatalogLocalizationLocale,
) {
  if (!draft.marketingReady) {
    throw new Error(`Meta localized draft is not marketing-ready: ${draft.retailerId}`);
  }
  if (!draft.imageUrl) {
    throw new Error(`Meta localized draft has no image: ${draft.retailerId}`);
  }

  return {
    method: 'UPDATE' as const,
    data: {
      id: draft.retailerId,
      title: draft.name,
      description: draft.description,
      link: draft.landingUrl,
      image: [
        {
          url: draft.imageUrl,
          tag: ['Localized'],
        },
      ],
    },
    localization: {
      type: 'LANGUAGE' as const,
      value: META_CATALOG_LOCALIZATION_LOCALES[locale],
    },
  };
}

export function hashMetaLocalizedRequest(request: ReturnType<typeof buildMetaLocalizedRequest>) {
  return createHash('sha256').update(JSON.stringify(request)).digest('hex');
}

export function readMetaLocalizationState(
  editorialOverrides: unknown,
  locale: MetaCatalogLocalizationLocale,
): LocalizationSyncState | null {
  const root = asObject(editorialOverrides);
  const localized = asObject(root.localized);
  const raw = localized[locale];
  if (!isObject(raw)) return null;

  const syncStatus = raw.sync_status;
  if (!['ready', 'pending', 'synced', 'failed', 'manual_review'].includes(String(syncStatus))) {
    return null;
  }

  return {
    meta_locale: typeof raw.meta_locale === 'string' ? raw.meta_locale : META_CATALOG_LOCALIZATION_LOCALES[locale],
    sync_status: syncStatus as LocalizationSyncState['sync_status'],
    prepared_payload_hash: typeof raw.prepared_payload_hash === 'string' ? raw.prepared_payload_hash : null,
    last_payload_hash: typeof raw.last_payload_hash === 'string' ? raw.last_payload_hash : null,
    last_synced_at: typeof raw.last_synced_at === 'string' ? raw.last_synced_at : null,
    last_error_code: typeof raw.last_error_code === 'string' ? raw.last_error_code : null,
    batch_handle: typeof raw.batch_handle === 'string' ? raw.batch_handle : null,
    sync_job_id: typeof raw.sync_job_id === 'string' ? raw.sync_job_id : null,
  };
}

function withMetaLocalizationState(
  editorialOverrides: unknown,
  locale: MetaCatalogLocalizationLocale,
  state: LocalizationSyncState,
) {
  const root = asObject(editorialOverrides);
  const localized = asObject(root.localized);

  return {
    ...root,
    localized: {
      ...localized,
      [locale]: state,
    },
  };
}

async function updateLocalizationState(
  channel: ChannelRow,
  locale: MetaCatalogLocalizationLocale,
  state: LocalizationSyncState,
) {
  const admin = getSupabaseAdmin();
  const nextOverrides = withMetaLocalizationState(channel.editorial_overrides, locale, state);
  const now = new Date().toISOString();

  const { data, error } = await admin
    .from('service_channel_configs')
    .update({
      editorial_overrides: nextOverrides,
      updated_at: now,
    })
    .eq('id', channel.id)
    .eq('updated_at', channel.updated_at)
    .select('id,service_id,editorial_overrides,updated_at')
    .single();

  if (error || !data) {
    throw new Error(`El estado Meta localizado cambió concurrentemente: ${error?.message ?? channel.id}`);
  }

  return data as ChannelRow;
}

async function getChannelForRetailer(retailerId: string) {
  const admin = getSupabaseAdmin();
  const { data: service, error: serviceError } = await admin
    .from('catalog_services')
    .select('id,slug')
    .eq('slug', retailerId)
    .single();

  if (serviceError || !service) {
    throw new Error(`Servicio no encontrado: ${retailerId}`);
  }

  const { data: channel, error: channelError } = await admin
    .from('service_channel_configs')
    .select('id,service_id,editorial_overrides,updated_at')
    .eq('service_id', service.id)
    .eq('channel', 'meta')
    .eq('enabled', true)
    .single();

  if (channelError || !channel) {
    throw new Error(`Canal Meta no habilitado: ${retailerId}`);
  }

  return {
    serviceId: String(service.id),
    channel: channel as ChannelRow,
  };
}

async function assertBaseItemSynced(retailerId: string, serviceId: string) {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('meta_catalog_items')
    .select('id,meta_item_id,sync_status')
    .eq('service_id', serviceId)
    .eq('retailer_id', retailerId)
    .eq('locale', 'es')
    .single();

  if (error || !data || data.sync_status !== 'synced' || !data.meta_item_id) {
    throw new Error(`El producto base ES debe estar sincronizado antes de localizar RU: ${retailerId}`);
  }

  return data;
}

function graphErrorDetails(error: unknown) {
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

export async function prepareMetaCatalogLocalization(
  requestedBy: string,
  retailerId: string,
  locale: MetaCatalogLocalizationLocale,
): Promise<LocalizationOperationResult> {
  const [normalizedRetailerId] = normalizeRetailerIds([retailerId]);
  if (!productionReadyRetailerIds().has(normalizedRetailerId)) {
    throw new Error(`Servicio no production_ready: ${normalizedRetailerId}`);
  }

  const { serviceId, channel } = await getChannelForRetailer(normalizedRetailerId);
  await assertBaseItemSynced(normalizedRetailerId, serviceId);

  const draftResult = await buildMetaCatalogDrafts(locale);
  const draft = draftResult.drafts.find((item) => item.retailerId === normalizedRetailerId);
  if (!draft) {
    throw new Error(`No existe contenido ${locale.toUpperCase()} activo para ${normalizedRetailerId}`);
  }

  if (!draft.marketingReady) {
    throw new Error(`Contenido ${locale.toUpperCase()} bloqueado: ${draft.warnings.join(', ')}`);
  }

  const request = buildMetaLocalizedRequest(draft, locale);
  const hash = hashMetaLocalizedRequest(request);
  const previous = readMetaLocalizationState(channel.editorial_overrides, locale);

  const state: LocalizationSyncState = {
    meta_locale: META_CATALOG_LOCALIZATION_LOCALES[locale],
    sync_status: 'ready',
    prepared_payload_hash: hash,
    last_payload_hash: previous?.last_payload_hash ?? null,
    last_synced_at: previous?.last_synced_at ?? null,
    last_error_code: null,
    batch_handle: null,
    sync_job_id: null,
  };

  const updatedChannel = await updateLocalizationState(channel, locale, state);
  const now = new Date().toISOString();
  await getSupabaseAdmin().from('meta_sync_jobs').insert({
    operation: 'catalog_localization_prepare',
    target_type: 'service_channel_config',
    target_id: updatedChannel.id,
    requested_by: requestedBy,
    status: 'succeeded',
    attempt_count: 1,
    started_at: now,
    finished_at: now,
  });

  return {
    retailerId: normalizedRetailerId,
    locale,
    syncStatus: 'ready',
    error: null,
  };
}

async function finishLocalizationJob(
  jobId: string | null,
  status: 'succeeded' | 'failed',
  errorCode: string | null,
  errorMessage: string | null,
) {
  if (!jobId) return;
  await getSupabaseAdmin()
    .from('meta_sync_jobs')
    .update({
      status,
      error_code: errorCode,
      error_message: errorMessage?.slice(0, 1000) ?? null,
      finished_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId);
}

async function logLocalizationApiCall(args: {
  jobId: string | null;
  catalogId: string;
  httpStatus: number | null;
  errorCode?: string | null;
  errorSubcode?: string | null;
  traceId?: string | null;
}) {
  await getSupabaseAdmin().from('meta_api_logs').insert({
    sync_job_id: args.jobId,
    operation: 'catalog_localization_upsert',
    endpoint: `/${args.catalogId}/localized_items_batch`,
    http_status: args.httpStatus,
    meta_error_code: args.errorCode ?? null,
    meta_error_subcode: args.errorSubcode ?? null,
    trace_id: args.traceId ?? null,
  });
}

type PreparedLocalization = {
  retailerId: string;
  serviceId: string;
  channel: ChannelRow;
  state: LocalizationSyncState;
  request: ReturnType<typeof buildMetaLocalizedRequest>;
  hash: string;
};

export async function syncMetaCatalogLocalizations(
  requestedBy: string,
  retailerIds: readonly string[],
  locale: MetaCatalogLocalizationLocale,
): Promise<{
  attempted: number;
  accepted: number;
  failed: number;
  pending: number;
  results: LocalizationOperationResult[];
}> {
  const config = requireMetaMarketingConfig();
  if (!config.catalogId) throw new Error('Meta catalog ID is not configured');

  const ids = normalizeRetailerIds(retailerIds);
  const draftResult = await buildMetaCatalogDrafts(locale);
  const drafts = new Map(draftResult.drafts.map((draft) => [draft.retailerId, draft]));
  const prepared: PreparedLocalization[] = [];

  for (const retailerId of ids) {
    const { serviceId, channel } = await getChannelForRetailer(retailerId);
    await assertBaseItemSynced(retailerId, serviceId);
    const state = readMetaLocalizationState(channel.editorial_overrides, locale);
    if (state?.sync_status !== 'ready') {
      throw new Error(`La localización ${locale.toUpperCase()} no está preparada: ${retailerId}`);
    }

    const draft = drafts.get(retailerId);
    if (!draft?.marketingReady) {
      throw new Error(`Proyección ${locale.toUpperCase()} no lista: ${retailerId}`);
    }

    const request = buildMetaLocalizedRequest(draft, locale);
    const hash = hashMetaLocalizedRequest(request);
    if (state.prepared_payload_hash !== hash) {
      throw new Error(`El contenido ${locale.toUpperCase()} cambió después de preparar: ${retailerId}`);
    }

    prepared.push({ retailerId, serviceId, channel, state, request, hash });
  }

  const now = new Date().toISOString();
  const { data: jobs, error: jobsError } = await getSupabaseAdmin()
    .from('meta_sync_jobs')
    .insert(prepared.map(({ channel }) => ({
      operation: 'catalog_localization_upsert',
      target_type: 'service_channel_config',
      target_id: channel.id,
      requested_by: requestedBy,
      status: 'running',
      attempt_count: 1,
      started_at: now,
    })))
    .select('id,target_id');

  if (jobsError || (jobs ?? []).length !== prepared.length) {
    throw new Error(`No se pudieron crear jobs de localización Meta: ${jobsError?.message ?? 'conteo incompleto'}`);
  }

  const jobByChannel = new Map((jobs ?? []).map((job) => [String(job.target_id), String(job.id)]));

  const claimed: PreparedLocalization[] = [];
  try {
    for (const item of prepared) {
      const jobId = jobByChannel.get(item.channel.id) ?? null;
      const nextState: LocalizationSyncState = {
        ...item.state,
        sync_status: 'pending',
        prepared_payload_hash: item.hash,
        last_error_code: null,
        batch_handle: null,
        sync_job_id: jobId,
      };
      const updated = await updateLocalizationState(item.channel, locale, nextState);
      claimed.push({ ...item, channel: updated, state: nextState });
    }
  } catch (error) {
    for (const item of claimed) {
      const current = readMetaLocalizationState(item.channel.editorial_overrides, locale);
      if (!current) continue;
      await updateLocalizationState(item.channel, locale, {
        ...current,
        sync_status: 'ready',
        sync_job_id: null,
      }).catch(() => null);
    }
    for (const job of jobs ?? []) {
      await finishLocalizationJob(String(job.id), 'failed', 'local_claim_failed', 'No se pudo reclamar el lote localizado');
    }
    throw error;
  }

  let response: LocalizedBatchResponse;
  try {
    response = await metaGraphRequest<LocalizedBatchResponse>({
      path: `${config.catalogId}/localized_items_batch`,
      method: 'POST',
      formBody: {
        item_type: 'PRODUCT_ITEM',
        requests: JSON.stringify(claimed.map((item) => item.request)),
      },
    });
  } catch (error) {
    const details = graphErrorDetails(error);
    for (const item of claimed) {
      const jobId = jobByChannel.get(item.channel.id) ?? null;
      await logLocalizationApiCall({
        jobId,
        catalogId: config.catalogId,
        httpStatus: details.httpStatus,
        errorCode: details.code,
        errorSubcode: details.subcode,
        traceId: details.traceId,
      });
      const current = readMetaLocalizationState(item.channel.editorial_overrides, locale);
      if (current) {
        await updateLocalizationState(item.channel, locale, {
          ...current,
          sync_status: 'failed',
          last_error_code: details.code,
          sync_job_id: jobId,
        }).catch(() => null);
      }
      await finishLocalizationJob(jobId, 'failed', details.code, details.message);
    }
    throw error;
  }

  const validationByRetailer = new Map(
    (response.validation_status ?? [])
      .filter((item): item is BatchValidationStatus & { retailer_id: string } => Boolean(item.retailer_id))
      .map((item) => [item.retailer_id, item]),
  );
  const handle = response.handles?.[0] ?? null;
  const results: LocalizationOperationResult[] = [];

  for (const item of claimed) {
    const validation = validationByRetailer.get(item.retailerId);
    const errors = (validation?.errors ?? [])
      .map((entry) => entry.message)
      .filter((message): message is string => Boolean(message));
    const jobId = jobByChannel.get(item.channel.id) ?? null;

    await logLocalizationApiCall({
      jobId,
      catalogId: config.catalogId,
      httpStatus: 200,
    });

    const current = readMetaLocalizationState(item.channel.editorial_overrides, locale);
    if (!current) continue;

    if (errors.length > 0 || !handle) {
      const message = errors.join(' | ') || 'Meta no devolvió handle de ingestión';
      await updateLocalizationState(item.channel, locale, {
        ...current,
        sync_status: 'failed',
        last_error_code: errors.length > 0 ? 'validation_error' : 'missing_batch_handle',
        batch_handle: handle,
        sync_job_id: jobId,
      });
      await finishLocalizationJob(
        jobId,
        'failed',
        errors.length > 0 ? 'validation_error' : 'missing_batch_handle',
        message,
      );
      results.push({ retailerId: item.retailerId, locale, syncStatus: 'failed', error: message });
      continue;
    }

    await updateLocalizationState(item.channel, locale, {
      ...current,
      sync_status: 'pending',
      batch_handle: handle,
      sync_job_id: jobId,
    });
    results.push({ retailerId: item.retailerId, locale, syncStatus: 'pending', error: null });
  }

  return {
    attempted: results.length,
    accepted: results.filter((item) => item.syncStatus === 'pending').length,
    failed: results.filter((item) => item.syncStatus === 'failed').length,
    pending: results.filter((item) => item.syncStatus === 'pending').length,
    results,
  };
}

export async function reconcileMetaCatalogLocalizations(
  retailerIds: readonly string[],
  locale: MetaCatalogLocalizationLocale,
): Promise<{
  checked: number;
  synced: number;
  failed: number;
  pending: number;
  results: LocalizationOperationResult[];
}> {
  const config = requireMetaMarketingConfig();
  if (!config.catalogId) throw new Error('Meta catalog ID is not configured');
  const ids = normalizeRetailerIds(retailerIds);

  const entries: Array<{
    retailerId: string;
    channel: ChannelRow;
    state: LocalizationSyncState;
  }> = [];

  for (const retailerId of ids) {
    const { channel } = await getChannelForRetailer(retailerId);
    const state = readMetaLocalizationState(channel.editorial_overrides, locale);
    if (state?.sync_status !== 'pending' || !state.batch_handle) continue;
    entries.push({ retailerId, channel, state });
  }

  const groups = new Map<string, typeof entries>();
  for (const entry of entries) {
    const list = groups.get(entry.state.batch_handle!) ?? [];
    list.push(entry);
    groups.set(entry.state.batch_handle!, list);
  }

  const results: LocalizationOperationResult[] = [];

  for (const [handle, group] of groups) {
    const statusResponse = await metaGraphRequest<BatchStatusResponse>({
      path: `${config.catalogId}/check_batch_request_status`,
      searchParams: {
        handle,
        load_ids_of_invalid_requests: true,
        fields: 'handle,status,warnings,errors_total_count,ids_of_invalid_requests',
      },
    });

    const batch = statusResponse.data?.[0];
    if (!batch || batch.status !== 'finished') {
      for (const entry of group) {
        results.push({ retailerId: entry.retailerId, locale, syncStatus: 'pending', error: null });
      }
      continue;
    }

    const invalidIds = new Set(batch.ids_of_invalid_requests ?? []);
    const errorsTotal = batch.errors_total_count ?? 0;

    for (const entry of group) {
      const invalid = invalidIds.has(entry.retailerId)
        || (errorsTotal > 0 && invalidIds.size === 0);
      const nextStatus: LocalizationSyncState['sync_status'] = invalid ? 'failed' : 'synced';
      const errorCode = invalid ? 'batch_ingestion_failed' : null;
      const updatedState: LocalizationSyncState = {
        ...entry.state,
        sync_status: nextStatus,
        last_payload_hash: invalid ? entry.state.last_payload_hash : entry.state.prepared_payload_hash,
        last_synced_at: invalid ? entry.state.last_synced_at : new Date().toISOString(),
        last_error_code: errorCode,
      };

      await updateLocalizationState(entry.channel, locale, updatedState);
      await finishLocalizationJob(
        entry.state.sync_job_id,
        invalid ? 'failed' : 'succeeded',
        errorCode,
        invalid ? 'Meta rechazó la localización durante la ingestión asíncrona' : null,
      );

      results.push({
        retailerId: entry.retailerId,
        locale,
        syncStatus: nextStatus,
        error: invalid ? 'Meta rechazó la localización durante la ingestión' : null,
      });
    }
  }

  return {
    checked: results.length,
    synced: results.filter((item) => item.syncStatus === 'synced').length,
    failed: results.filter((item) => item.syncStatus === 'failed').length,
    pending: results.filter((item) => item.syncStatus === 'pending').length,
    results,
  };
}
