import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { prepareMetaCatalogRetailer } from '@/lib/integrations/meta/catalog-sync';

const bodySchema = z.object({
  confirm: z.literal('prepare_meta_catalog_item'),
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

  const body = bodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ error: 'Confirmación explícita requerida' }, { status: 400 });
  }

  const { retailerId } = await params;

  try {
    const result = await prepareMetaCatalogRetailer(adminId, retailerId);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al preparar servicio para Meta' },
      { status: 409 },
    );
  }
}
