import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin, listAllAuthUsers } from '@/lib/integrations/supabase';

type DirectoryItem = {
  id: string;
  kind: 'person' | 'company';
  name: string;
  subtitle: string;
  identifier: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  role: string | null;
  isClient: boolean;
  hasPortalAccess: boolean;
  linkedCompanies: number;
  linkedPeople: number;
  activeCases: number;
  activeSubscription: string | null;
  holdedConnected: boolean;
  activeCompanyId: string | null;
  href: string;
  portalHref: string | null;
  holdedHref: string | null;
  createdAt: string | null;
};

async function requireStaff(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  const admin = getSupabaseAdmin();
  const { data: profile } = await admin
    .from('profiles')
    .select('role,status')
    .eq('id', user.id)
    .single();

  if (!profile || profile.status === 'inactive') return null;
  if (!['admin', 'owner'].includes(profile.role)) return null;
  return admin;
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireStaff(request);
    if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const [
      profilesRes,
      companiesRes,
      membershipsRes,
      casesRes,
      subscriptionsRes,
      integrationsRes,
      authUsers,
    ] = await Promise.all([
      admin
        .from('profiles')
        .select('id,full_name,email,phone,role,status,client_type,active_company_id,tax_id,created_at')
        .order('created_at', { ascending: false })
        .limit(2000),
      admin
        .from('companies')
        .select('id,razon_social,nombre_comercial,cif_nif,email,telefono,status,forma_juridica,created_at')
        .order('created_at', { ascending: false })
        .limit(2000),
      admin
        .from('profile_companies')
        .select('profile_id,company_id,role'),
      admin
        .from('cases')
        .select('client_id,company_id,state,status'),
      admin
        .from('subscriptions')
        .select('client_id,company_id,plan_name,status,created_at')
        .in('status', ['active', 'trialing'])
        .order('created_at', { ascending: false }),
      admin
        .from('client_integrations')
        .select('client_id,company_id,provider,status')
        .eq('provider', 'holded')
        .eq('status', 'active'),
      listAllAuthUsers(),
    ]);

    const firstError = [
      profilesRes.error,
      companiesRes.error,
      membershipsRes.error,
      casesRes.error,
      subscriptionsRes.error,
      integrationsRes.error,
    ].find(Boolean);
    if (firstError) {
      return NextResponse.json({ error: firstError.message }, { status: 500 });
    }

    const profiles = profilesRes.data ?? [];
    const companies = companiesRes.data ?? [];
    const memberships = membershipsRes.data ?? [];
    const cases = casesRes.data ?? [];
    const subscriptions = subscriptionsRes.data ?? [];
    const integrations = integrationsRes.data ?? [];

    const authEmailById = new Map(authUsers.map((user) => [user.id, user.email ?? null]));
    const authUserIds = new Set(authUsers.map((user) => user.id));

    const companyIdsByProfile = new Map<string, string[]>();
    const profileIdsByCompany = new Map<string, string[]>();
    for (const row of memberships) {
      const byProfile = companyIdsByProfile.get(row.profile_id) ?? [];
      byProfile.push(row.company_id);
      companyIdsByProfile.set(row.profile_id, byProfile);

      const byCompany = profileIdsByCompany.get(row.company_id) ?? [];
      byCompany.push(row.profile_id);
      profileIdsByCompany.set(row.company_id, byCompany);
    }

    const activeCasesByClient = new Map<string, number>();
    const activeCasesByCompany = new Map<string, number>();
    for (const row of cases) {
      const closed = row.state === 'finalizado' || row.state === 'cerrado' || row.status === 'closed';
      if (closed) continue;
      activeCasesByClient.set(row.client_id, (activeCasesByClient.get(row.client_id) ?? 0) + 1);
      if (row.company_id) {
        activeCasesByCompany.set(row.company_id, (activeCasesByCompany.get(row.company_id) ?? 0) + 1);
      }
    }

    const subscriptionByClient = new Map<string, string>();
    const subscriptionByCompany = new Map<string, string>();
    for (const row of subscriptions) {
      if (!subscriptionByClient.has(row.client_id)) subscriptionByClient.set(row.client_id, row.plan_name);
      if (row.company_id && !subscriptionByCompany.has(row.company_id)) {
        subscriptionByCompany.set(row.company_id, row.plan_name);
      }
    }

    const directHoldedProfiles = new Set(
      integrations.map((row) => row.client_id).filter(Boolean) as string[],
    );
    const holdedCompanies = new Set(
      integrations.map((row) => row.company_id).filter(Boolean) as string[],
    );

    const items: DirectoryItem[] = [];

    for (const profile of profiles) {
      const linkedCompanyIds = companyIdsByProfile.get(profile.id) ?? [];
      const holdedConnected =
        directHoldedProfiles.has(profile.id) ||
        linkedCompanyIds.some((companyId) => holdedCompanies.has(companyId));
      const hasOperationalActivity =
        (activeCasesByClient.get(profile.id) ?? 0) > 0 ||
        subscriptionByClient.has(profile.id) ||
        linkedCompanyIds.length > 0;
      const isClient = profile.role === 'client' || hasOperationalActivity;
      const email = authEmailById.get(profile.id) ?? profile.email ?? null;

      items.push({
        id: profile.id,
        kind: 'person',
        name: profile.full_name || email || profile.id,
        subtitle: isClient ? 'Persona / cliente' : `Persona / ${profile.role}`,
        identifier: profile.tax_id ?? null,
        email,
        phone: profile.phone ?? null,
        status: profile.status ?? 'active',
        role: profile.role ?? null,
        isClient,
        hasPortalAccess: authUserIds.has(profile.id),
        linkedCompanies: linkedCompanyIds.length,
        linkedPeople: 0,
        activeCases: activeCasesByClient.get(profile.id) ?? 0,
        activeSubscription: subscriptionByClient.get(profile.id) ?? null,
        holdedConnected,
        activeCompanyId: profile.active_company_id ?? null,
        href: profile.role === 'client' ? `/admin/clientes/${profile.id}` : '/admin/usuarios',
        portalHref: profile.role === 'client' ? `/admin/clientes/${profile.id}/portal` : null,
        holdedHref: profile.role === 'client' ? `/admin/clientes/${profile.id}/integraciones` : null,
        createdAt: profile.created_at ?? null,
      });
    }

    for (const company of companies) {
      const linkedProfileIds = profileIdsByCompany.get(company.id) ?? [];
      const activeSubscription = subscriptionByCompany.get(company.id) ?? null;
      const activeCases = activeCasesByCompany.get(company.id) ?? 0;
      const holdedConnected = holdedCompanies.has(company.id);

      items.push({
        id: company.id,
        kind: 'company',
        name: company.nombre_comercial || company.razon_social || company.cif_nif || company.id,
        subtitle: company.forma_juridica ? `Empresa / ${company.forma_juridica}` : 'Empresa / entidad',
        identifier: company.cif_nif ?? null,
        email: company.email ?? null,
        phone: company.telefono ?? null,
        status: company.status ?? 'active',
        role: null,
        isClient: activeCases > 0 || Boolean(activeSubscription) || holdedConnected || linkedProfileIds.length > 0,
        hasPortalAccess: false,
        linkedCompanies: 0,
        linkedPeople: linkedProfileIds.length,
        activeCases,
        activeSubscription,
        holdedConnected,
        activeCompanyId: null,
        href: `/admin/empresas?companyId=${company.id}`,
        portalHref: null,
        holdedHref: `/admin/empresas/${company.id}/integraciones`,
        createdAt: company.created_at ?? null,
      });
    }

    return NextResponse.json({
      items,
      summary: {
        total: items.length,
        people: items.filter((item) => item.kind === 'person').length,
        companies: items.filter((item) => item.kind === 'company').length,
        clients: items.filter((item) => item.isClient).length,
        portalUsers: items.filter((item) => item.kind === 'person' && item.hasPortalAccess).length,
        unlinkedCompanies: items.filter((item) => item.kind === 'company' && item.linkedPeople === 0).length,
        holdedConnected: items.filter((item) => item.holdedConnected).length,
      },
    });
  } catch (error) {
    console.error('[admin/directorio]', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
