import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { reconcileMetaCatalogLocalizations } from '@/lib/integrations/meta/catalog-localization-sync';

const bodySchema = z.object({
  locale: z.literal('ru'),
  retailerIds: z.array(z.string().trim().regex(/^[a-z0-9][a-z0-9-]{1,159}$/)).min(1).max(25),
}).strict();

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

export async function POST(request: NextRequest) {
  if (!await requireAdmin(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Locale y servicios válidos requeridos' }, { status: 400 });
  }

  try {
    const result = await reconcileMetaCatalogLocalizations(
      parsed.data.retailerIds,
      parsed.data.locale,
    );
    return NextResponse.json({ ok: result.failed === 0, ...result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al comprobar localizaciones Meta' },
      { status: 500 },
    );
  }
}
