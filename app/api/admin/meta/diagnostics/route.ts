import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { getMetaMarketingConfigStatus } from '@/lib/integrations/meta/config';
import { auditMetaCatalog } from '@/lib/integrations/meta/catalog-audit';
import { testMetaMarketingConnection } from '@/lib/integrations/meta/client';
import { auditCommercialCatalogInventory } from '@/lib/services/commercial-catalog-audit';
import { buildCanonicalShadowCatalog } from '@/lib/services/canonical-commercial-catalog';

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
  const canonicalShadow = buildCanonicalShadowCatalog();
  const canonicalSummary = {
    services: canonicalShadow.length,
    servicesWithAliases: canonicalShadow.filter((item) => item.aliases.length > 0).length,
    servicesWithMultipleOffers: canonicalShadow.filter((item) => item.offers.length > 1).length,
    servicesWithWarnings: canonicalShadow.filter((item) => item.warnings.length > 0).length,
    totalOffers: canonicalShadow.reduce((sum, item) => sum + item.offers.length, 0),
    warningCounts: canonicalShadow.reduce<Record<string, number>>((acc, item) => {
      for (const warning of item.warnings) acc[warning] = (acc[warning] ?? 0) + 1;
      return acc;
    }, {}),
  };

  return NextResponse.json({
    config,
    catalog,
    commercialInventory,
    canonicalSummary,
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
