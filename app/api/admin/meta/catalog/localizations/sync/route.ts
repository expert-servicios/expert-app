import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { syncMetaCatalogLocalizations } from '@/lib/integrations/meta/catalog-localization-sync';

const bodySchema = z.object({
  confirm: z.literal('sync_meta_catalog_localizations'),
  locale: z.literal('ru'),
  retailerIds: z.array(z.string().trim().regex(/^[a-z0-9][a-z0-9-]{1,159}$/)).min(1).max(25),
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
  if (!adminId) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Confirmación, locale y servicios válidos requeridos' }, { status: 400 });
  }

  try {
    const result = await syncMetaCatalogLocalizations(
      adminId,
      parsed.data.retailerIds,
      parsed.data.locale,
    );
    return NextResponse.json({ ok: result.failed === 0, ...result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al sincronizar localizaciones Meta' },
      { status: 500 },
    );
  }
}
