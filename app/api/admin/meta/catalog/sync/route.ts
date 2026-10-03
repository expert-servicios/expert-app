import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import {
  syncInitialMetaCatalogBatch,
  syncMetaCatalogRetailers,
} from '@/lib/integrations/meta/catalog-sync';

const legacyBodySchema = z.object({
  confirm: z.literal('sync_initial_meta_catalog_batch'),
}).strict();

const bodySchema = z.object({
  confirm: z.literal('sync_meta_catalog_items'),
  retailerIds: z.array(
    z.string().trim().regex(/^[a-z0-9][a-z0-9-]{1,159}$/),
  ).min(1).max(25),
}).strict();

async function requireAdmin(request: NextRequest): Promise<string | null> {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  const admin = getSupabaseAdmin();
  const { data: profile } = await admin
    .from('profiles')
    .select('role,status')
    .eq('id', user.id)
    .single();

  if (profile?.status === 'inactive') return null;
  if (profile?.role !== 'admin' && profile?.role !== 'owner') return null;
  return user.id;
}

export async function POST(request: NextRequest) {
  const adminId = await requireAdmin(request);
  if (!adminId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const rawBody = await request.json().catch(() => null);
  const body = bodySchema.safeParse(rawBody);
  const legacyBody = legacyBodySchema.safeParse(rawBody);

  if (!body.success && !legacyBody.success) {
    return NextResponse.json(
      { error: 'Confirmación explícita y servicios válidos requeridos para sincronizar Meta' },
      { status: 400 },
    );
  }

  try {
    const result = body.success
      ? await syncMetaCatalogRetailers(adminId, body.data.retailerIds)
      : await syncInitialMetaCatalogBatch(adminId);

    return NextResponse.json({ ok: result.failed === 0, ...result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al sincronizar catálogo Meta' },
      { status: 500 },
    );
  }
}
