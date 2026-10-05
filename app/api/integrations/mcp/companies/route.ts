import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { validateMcpSharedSecret } from '@/lib/integrations/holded-mcp/mcp-auth';

async function resolveSupabaseUserId(mcpUserId: string): Promise<string | null> {
  const admin = getSupabaseAdmin();

  const { data: directProfile } = await admin
    .from('profiles')
    .select('id')
    .eq('id', mcpUserId)
    .maybeSingle();

  if (directProfile?.id) return directProfile.id;

  const { data: connection } = await admin
    .from('holded_mcp_connections')
    .select('supabase_user_id')
    .eq('mcp_user_id', mcpUserId)
    .not('supabase_user_id', 'is', null)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return connection?.supabase_user_id ?? null;
}

export async function GET(request: NextRequest) {
  if (!validateMcpSharedSecret(request.headers.get('x-expert-shared-secret'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId')?.trim();
  if (!userId) {
    return NextResponse.json({ error: 'userId requerido' }, { status: 400 });
  }

  const supabaseUserId = await resolveSupabaseUserId(userId);
  if (!supabaseUserId) {
    return NextResponse.json({ ok: true, companies: [] });
  }

  const admin = getSupabaseAdmin();
  const [{ data: memberships, error }, { data: profile }] = await Promise.all([
    admin
      .from('profile_companies')
      .select('role, company:companies(id,razon_social,nombre_comercial,cif_nif,status,preferred_language)')
      .eq('profile_id', supabaseUserId),
    admin
      .from('profiles')
      .select('active_company_id')
      .eq('id', supabaseUserId)
      .maybeSingle(),
  ]);

  if (error) {
    console.error('[MCP companies] membership lookup failed:', error.message);
    return NextResponse.json({ error: 'company_lookup_failed' }, { status: 500 });
  }

  const companies = (memberships ?? []).flatMap((membership) => {
    const raw = membership.company;
    const company = Array.isArray(raw) ? raw[0] : raw;
    if (!company) return [];
    return [{
      id: company.id,
      name: company.razon_social,
      tradeName: company.nombre_comercial,
      taxId: company.cif_nif,
      status: company.status,
      preferredLanguage: company.preferred_language,
      role: membership.role,
      active: profile?.active_company_id === company.id,
    }];
  });

  return NextResponse.json({ ok: true, companies });
}
