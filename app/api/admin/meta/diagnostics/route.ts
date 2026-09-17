import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { getMetaMarketingConfigStatus } from '@/lib/integrations/meta/config';
import { auditMetaCatalog } from '@/lib/integrations/meta/catalog-audit';
import { testMetaMarketingConnection } from '@/lib/integrations/meta/client';
import { auditCommercialCatalogInventory } from '@/lib/services/commercial-catalog-audit';

async function requireAdmin(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return false;
  const admin = getSupabaseAdmin();
  const { data: profile } = await admin.from('profiles').select('role,status').eq('id', user.id).single();
  if (profile?.status === 'inactive') return false;
  return profile?.role === 'admin' || profile?.role === 'owner';
}

export async function GET(request: NextRequest) {
  if (!await requireAdmin(request)) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const config = getMetaMarketingConfigStatus();
  const catalog = auditMetaCatalog();
  const commercialInventory = auditCommercialCatalogInventory();

  return NextResponse.json({
    config,
    catalog,
    commercialInventory,
    liveTestAvailable: config.enabled && config.configured,
  });
}

export async function POST(request: NextRequest) {
  if (!await requireAdmin(request)) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  try {
    const catalog = await testMetaMarketingConnection();
    return NextResponse.json({ ok: true, catalog });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
