import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { buildMetaCatalogDrafts } from '@/lib/integrations/meta/catalog-export';
import {
  INITIAL_META_CATALOG_BATCH_LIMIT,
  INITIAL_META_CATALOG_RETAILER_IDS,
  buildMetaProductPayload,
  hashMetaProductPayload,
} from '@/lib/integrations/meta/catalog-sync';

type ServiceIdentity = {
  id: string;
  slug: string;
};

type ServiceLocaleRow = {
  service_id: string;
  locale: string;
  status: string;
  image_url: string | null;
  updated_at: string;
};

type MetaItemRow = {
  retailer_id: string;
  locale: string;
  sync_status: string;
  meta_item_id: string | null;
  last_synced_at: string | null;
  last_error_code: string | null;
  last_payload_hash: string | null;
};

async function requireAdmin(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return false;

  const admin = getSupabaseAdmin();
  const { data: profile } = await admin
    .from('profiles')
    .select('role,status')
    .eq('id', user.id)
    .single();

  if (profile?.status === 'inactive') return false;
  return profile?.role === 'admin' || profile?.role === 'owner';
}

export async function GET(request: NextRequest) {
  if (!await requireAdmin(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const admin = getSupabaseAdmin();
  const result = await buildMetaCatalogDrafts();
  const retailerIds = result.drafts.map((draft) => draft.retailerId);

  const [servicesResult, metaItemsResult] = await Promise.all([
    retailerIds.length
      ? admin.from('catalog_services').select('id,slug').in('slug', retailerIds)
      : Promise.resolve({ data: [], error: null }),
    retailerIds.length
      ? admin
          .from('meta_catalog_items')
          .select('retailer_id,locale,sync_status,meta_item_id,last_synced_at,last_error_code,last_payload_hash')
          .in('retailer_id', retailerIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (servicesResult.error) {
    return NextResponse.json(
      { error: `No se pudo leer catalog_services: ${servicesResult.error.message}` },
      { status: 500 },
    );
  }
  if (metaItemsResult.error) {
    return NextResponse.json(
      { error: `No se pudo leer el estado Meta: ${metaItemsResult.error.message}` },
      { status: 500 },
    );
  }

  const services = (servicesResult.data ?? []) as ServiceIdentity[];
  const serviceIds = services.map((service) => service.id);
  const contentsResult = serviceIds.length
    ? await admin
        .from('service_contents')
        .select('service_id,locale,status,image_url,updated_at')
        .in('service_id', serviceIds)
        .in('locale', ['es', 'ru'])
    : { data: [], error: null };

  if (contentsResult.error) {
    return NextResponse.json(
      { error: `No se pudo leer service_contents: ${contentsResult.error.message}` },
      { status: 500 },
    );
  }

  const serviceIdBySlug = new Map(services.map((service) => [service.slug, service.id]));
  const localeRows = (contentsResult.data ?? []) as ServiceLocaleRow[];
  const metaItems = (metaItemsResult.data ?? []) as MetaItemRow[];

  const localesByService = new Map<string, Record<string, { exists: boolean; status: string | null; imageUrl: string | null; updatedAt: string | null }>>();
  for (const row of localeRows) {
    const existing = localesByService.get(row.service_id) ?? {};
    existing[row.locale] = {
      exists: true,
      status: row.status,
      imageUrl: row.image_url,
      updatedAt: row.updated_at,
    };
    localesByService.set(row.service_id, existing);
  }

  const metaByRetailer = new Map<string, Record<string, MetaItemRow>>();
  for (const row of metaItems) {
    const existing = metaByRetailer.get(row.retailer_id) ?? {};
    existing[row.locale] = row;
    metaByRetailer.set(row.retailer_id, existing);
  }

  const drafts = result.drafts.map((draft) => {
    const serviceId = serviceIdBySlug.get(draft.retailerId);
    const locales = serviceId ? localesByService.get(serviceId) ?? {} : {};
    const meta = metaByRetailer.get(draft.retailerId) ?? {};
    let currentPayloadHash: string | null = null;
    if (draft.marketingReady) {
      try {
        currentPayloadHash = hashMetaProductPayload(buildMetaProductPayload(draft));
      } catch {
        currentPayloadHash = null;
      }
    }

    return {
      ...draft,
      locales: {
        es: locales.es ?? { exists: false, status: null, imageUrl: null, updatedAt: null },
        ru: locales.ru ?? { exists: false, status: null, imageUrl: null, updatedAt: null },
      },
      meta: {
        es: meta.es
          ? {
              syncStatus: meta.es.sync_status,
              metaItemId: meta.es.meta_item_id,
              lastSyncedAt: meta.es.last_synced_at,
              lastErrorCode: meta.es.last_error_code,
              lastPayloadHash: meta.es.last_payload_hash,
              isStale: meta.es.sync_status === 'synced'
                && (
                  currentPayloadHash == null
                  || meta.es.last_payload_hash == null
                  || currentPayloadHash !== meta.es.last_payload_hash
                ),
            }
          : null,
        ru: meta.ru
          ? {
              syncStatus: meta.ru.sync_status,
              metaItemId: meta.ru.meta_item_id,
              lastSyncedAt: meta.ru.last_synced_at,
              lastErrorCode: meta.ru.last_error_code,
              lastPayloadHash: meta.ru.last_payload_hash,
              isStale: false,
            }
          : null,
      },
    };
  });

  const initialBatchRows = metaItems.filter(
    (item) => item.locale === 'es' && INITIAL_META_CATALOG_RETAILER_IDS.includes(
      item.retailer_id as (typeof INITIAL_META_CATALOG_RETAILER_IDS)[number],
    ),
  );
  const readyRetailerIds = new Set(
    initialBatchRows
      .filter((row) => row.sync_status === 'ready')
      .map((row) => row.retailer_id),
  );
  const syncedRetailerIds = new Set(
    initialBatchRows
      .filter((row) => row.sync_status === 'synced')
      .map((row) => row.retailer_id),
  );

  const initialBatchReadyCount = INITIAL_META_CATALOG_RETAILER_IDS.filter((id) => readyRetailerIds.has(id)).length;
  const initialBatchSyncedCount = INITIAL_META_CATALOG_RETAILER_IDS.filter((id) => syncedRetailerIds.has(id)).length;

  return NextResponse.json({
    ...result,
    drafts,
    initialBatch: {
      expectedCount: INITIAL_META_CATALOG_BATCH_LIMIT,
      readyCount: initialBatchReadyCount,
      syncedCount: initialBatchSyncedCount,
      ready: initialBatchReadyCount === INITIAL_META_CATALOG_BATCH_LIMIT,
      complete: initialBatchSyncedCount === INITIAL_META_CATALOG_BATCH_LIMIT,
    },
  });
}
