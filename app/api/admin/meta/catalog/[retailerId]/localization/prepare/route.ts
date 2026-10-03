import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { prepareMetaCatalogLocalization } from '@/lib/integrations/meta/catalog-localization-sync';

const bodySchema = z.object({
  confirm: z.literal('prepare_meta_catalog_localization'),
  locale: z.literal('ru'),
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ retailerId: string }> },
) {
  const adminId = await requireAdmin(request);
  if (!adminId) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Confirmación y locale válidos requeridos' }, { status: 400 });
  }

  const { retailerId } = await params;
  try {
    const result = await prepareMetaCatalogLocalization(adminId, retailerId, parsed.data.locale);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al preparar localización Meta' },
      { status: 409 },
    );
  }
}
