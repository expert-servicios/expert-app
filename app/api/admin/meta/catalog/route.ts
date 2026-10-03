import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { buildMetaCatalogDrafts } from '@/lib/integrations/meta/catalog-export';
import {
  INITIAL_META_CATALOG_BATCH_LIMIT,
  INITIAL_META_CATALOG_RETAILER_IDS,
} from '@/lib/integrations/meta/catalog-sync';

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
  const [result, stagedResult] = await Promise.all([
    buildMetaCatalogDrafts(),
    admin
      .from('meta_catalog_items')
      .select('retailer_id,sync_status')
      .eq('locale', 'es')
      .in('retailer_id', [...INITIAL_META_CATALOG_RETAILER_IDS]),
  ]);

  if (stagedResult.error) {
    return NextResponse.json(
      { error: `No se pudo leer el estado del lote Meta: ${stagedResult.error.message}` },
      { status: 500 },
    );
  }

  const readyRetailerIds = new Set(
    (stagedResult.data ?? [])
      .filter((row) => row.sync_status === 'ready')
      .map((row) => String(row.retailer_id)),
  );

  const initialBatchReadyCount = INITIAL_META_CATALOG_RETAILER_IDS.filter((id) => readyRetailerIds.has(id)).length;

  return NextResponse.json({
    ...result,
    initialBatch: {
      expectedCount: INITIAL_META_CATALOG_BATCH_LIMIT,
      readyCount: initialBatchReadyCount,
      ready: initialBatchReadyCount === INITIAL_META_CATALOG_BATCH_LIMIT,
    },
  });
}
