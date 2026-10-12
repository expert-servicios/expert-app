import { getSupabaseAdmin } from '@/lib/integrations/supabase';

export type AdminClient = ReturnType<typeof getSupabaseAdmin>;

export type ScopedAdminCase = {
  id: string;
  client_id: string;
  company_id: string | null;
  tenant_id: string | null;
};

export async function getScopedAdminCase(
  admin: AdminClient,
  caseId: string,
  actorTenantId: string | null,
): Promise<ScopedAdminCase | null> {
  let caseQuery = admin
    .from('cases')
    .select('id,client_id,company_id,tenant_id')
    .eq('id', caseId);

  if (actorTenantId) caseQuery = caseQuery.eq('tenant_id', actorTenantId);

  const { data: caseRow, error: caseError } = await caseQuery.maybeSingle();
  if (caseError || !caseRow) return null;

  const scopeTenantId = actorTenantId ?? caseRow.tenant_id;

  let clientQuery = admin
    .from('profiles')
    .select('id')
    .eq('id', caseRow.client_id);
  if (scopeTenantId) clientQuery = clientQuery.eq('tenant_id', scopeTenantId);

  const { data: client, error: clientError } = await clientQuery.maybeSingle();
  if (clientError || !client) return null;

  if (caseRow.company_id) {
    let companyQuery = admin
      .from('companies')
      .select('id')
      .eq('id', caseRow.company_id);
    if (scopeTenantId) companyQuery = companyQuery.eq('tenant_id', scopeTenantId);

    const { data: company, error: companyError } = await companyQuery.maybeSingle();
    if (companyError || !company) return null;

    const { data: membership, error: membershipError } = await admin
      .from('profile_companies')
      .select('company_id')
      .eq('profile_id', caseRow.client_id)
      .eq('company_id', caseRow.company_id)
      .maybeSingle();

    if (membershipError || !membership) return null;
  }

  return caseRow as ScopedAdminCase;
}
