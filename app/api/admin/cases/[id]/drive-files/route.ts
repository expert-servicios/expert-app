import { NextRequest, NextResponse } from 'next/server';
import { requireActiveActor } from '@/lib/auth/active-actor';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { listDriveFilesForClient } from '@/lib/integrations/google-drive';

type AdminClient = ReturnType<typeof getSupabaseAdmin>;

type ScopedCase = {
  id: string;
  service: string;
  client_id: string;
  company_id: string | null;
  tenant_id: string | null;
};

type ScopedCaseResult = {
  caseRow: ScopedCase;
  clientFullName: string | null;
};

async function getScopedCase(
  admin: AdminClient,
  caseId: string,
  actorTenantId: string | null,
): Promise<ScopedCaseResult | null> {
  let caseQuery = admin
    .from('cases')
    .select('id,service,client_id,company_id,tenant_id')
    .eq('id', caseId);

  if (actorTenantId) caseQuery = caseQuery.eq('tenant_id', actorTenantId);

  const { data: caseRow, error: caseError } = await caseQuery.maybeSingle();
  if (caseError || !caseRow) return null;

  const scopeTenantId = actorTenantId ?? caseRow.tenant_id;
  let clientQuery = admin
    .from('profiles')
    .select('id,full_name')
    .eq('id', caseRow.client_id);

  if (scopeTenantId) clientQuery = clientQuery.eq('tenant_id', scopeTenantId);

  const [clientScope, companyScope] = await Promise.all([
    clientQuery.maybeSingle(),
    caseRow.company_id && scopeTenantId
      ? admin
          .from('companies')
          .select('id')
          .eq('id', caseRow.company_id)
          .eq('tenant_id', scopeTenantId)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (clientScope.error || !clientScope.data) return null;
  if (caseRow.company_id && scopeTenantId && (companyScope.error || !companyScope.data)) {
    return null;
  }

  if (caseRow.company_id) {
    const { data: membership, error: membershipError } = await admin
      .from('profile_companies')
      .select('company_id')
      .eq('profile_id', caseRow.client_id)
      .eq('company_id', caseRow.company_id)
      .maybeSingle();

    if (membershipError || !membership) return null;
  }

  return {
    caseRow: caseRow as ScopedCase,
    clientFullName: clientScope.data.full_name ?? null,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireActiveActor(request, ['admin', 'owner']);
    if (!actor) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { id } = await params;
    const admin = getSupabaseAdmin();
    const scoped = await getScopedCase(admin, id, actor.tenantId);
    if (!scoped) {
      return NextResponse.json({ error: 'Expediente no encontrado' }, { status: 404 });
    }

    const { caseRow, clientFullName } = scoped;
    const { data: authUser } = await admin.auth.admin.getUserById(caseRow.client_id);
    const clientName =
      clientFullName ||
      authUser.user?.user_metadata?.full_name ||
      authUser.user?.email?.split('@')[0] ||
      'Cliente';

    const files = await listDriveFilesForClient(clientName, caseRow.service);

    return NextResponse.json({
      files,
      clientName,
      serviceName: caseRow.service,
    });
  } catch (err) {
    console.error('[admin/cases/[id]/drive-files] GET error:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
