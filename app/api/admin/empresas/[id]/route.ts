import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';

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

  if (!profile || profile.status === 'inactive' || !['admin', 'owner'].includes(profile.role)) return null;
  return { admin, actorId: user.id };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await requireStaff(request);
    if (!ctx) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const { id } = await params;
    const { admin } = ctx;

    const { data: company, error: companyError } = await admin
      .from('companies')
      .select('id,razon_social,nombre_comercial,cif_nif,forma_juridica,status,email,telefono,direccion,ciudad,provincia,codigo_postal,pais,web,stripe_customer_id,created_at,updated_at')
      .eq('id', id)
      .maybeSingle();

    if (companyError) return NextResponse.json({ error: companyError.message }, { status: 500 });
    if (!company) return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 });

    const [
      membershipsRes,
      subscriptionsRes,
      casesRes,
      integrationsRes,
      quotesRes,
      ordersRes,
      checkoutsRes,
      documentsRes,
      tasksRes,
    ] = await Promise.all([
      admin.from('profile_companies').select('profile_id,role,created_at').eq('company_id', id).order('created_at'),
      admin.from('subscriptions').select('id,client_id,plan_name,status,current_period_start,current_period_end,stripe_subscription_id,stripe_customer_id,created_at').eq('company_id', id).order('created_at', { ascending: false }),
      admin.from('cases').select('id,client_id,service,category,state,status,priority,due_date,next_action,opened_at,updated_at').eq('company_id', id).order('updated_at', { ascending: false }).limit(100),
      admin.from('client_integrations').select('id,client_id,provider,status,sync_mode,api_version,api_key_last4,permissions_enabled,last_success_at,last_error,created_at').eq('company_id', id).order('created_at', { ascending: false }),
      admin.from('quotes').select('id,client_id,title,status,amount_eur,created_at,expires_at').eq('company_id', id).order('created_at', { ascending: false }).limit(50),
      admin.from('orders').select('id,client_id,status,amount_eur,currency,stripe_payment_id,holded_invoice_id,holded_sync_error,created_at').eq('company_id', id).order('created_at', { ascending: false }).limit(50),
      admin.from('checkout_sessions').select('id,user_id,status,stripe_session_id,created_at,updated_at').eq('company_id', id).order('created_at', { ascending: false }).limit(50),
      admin.from('documents').select('id,client_id,title,original_name,state,doc_type,case_id,created_at').eq('company_id', id).order('created_at', { ascending: false }).limit(100),
      admin.from('internal_tasks').select('id,client_id,title,status,priority,due_date,case_id,source,created_at,updated_at').eq('company_id', id).order('updated_at', { ascending: false }).limit(100),
    ]);

    const firstError = [
      membershipsRes.error,
      subscriptionsRes.error,
      casesRes.error,
      integrationsRes.error,
      quotesRes.error,
      ordersRes.error,
      checkoutsRes.error,
      documentsRes.error,
      tasksRes.error,
    ].find(Boolean);
    if (firstError) return NextResponse.json({ error: firstError.message }, { status: 500 });

    const profileIds = [...new Set((membershipsRes.data ?? []).map((row) => row.profile_id).filter(Boolean))];
    const profilesRes = profileIds.length
      ? await admin.from('profiles').select('id,full_name,email,phone,status,role,active_company_id,tax_id').in('id', profileIds)
      : { data: [], error: null };

    if (profilesRes.error) return NextResponse.json({ error: profilesRes.error.message }, { status: 500 });

    const authUsers = profileIds.length
      ? await Promise.all(profileIds.map(async (profileId) => {
          const { data } = await admin.auth.admin.getUserById(profileId);
          return { id: profileId, email: data.user?.email ?? null };
        }))
      : [];

    const authEmail = new Map(authUsers.map((row) => [row.id, row.email]));
    const profileById = new Map((profilesRes.data ?? []).map((profile) => [profile.id, profile]));

    const people = (membershipsRes.data ?? []).map((membership) => {
      const profile = profileById.get(membership.profile_id);
      return {
        id: membership.profile_id,
        membershipRole: membership.role,
        membershipCreatedAt: membership.created_at,
        name: profile?.full_name ?? authEmail.get(membership.profile_id) ?? membership.profile_id,
        email: authEmail.get(membership.profile_id) ?? profile?.email ?? null,
        phone: profile?.phone ?? null,
        taxId: profile?.tax_id ?? null,
        profileRole: profile?.role ?? null,
        status: profile?.status ?? null,
        isActiveCompany: profile?.active_company_id === id,
        href: profile?.role === 'client' ? `/admin/clientes/${membership.profile_id}` : '/admin/usuarios',
      };
    });

    const cases = casesRes.data ?? [];
    const tasks = tasksRes.data ?? [];
    const documents = documentsRes.data ?? [];
    const integrations = integrationsRes.data ?? [];
    const subscriptions = subscriptionsRes.data ?? [];

    return NextResponse.json({
      company: {
        ...company,
        displayName: company.nombre_comercial || company.razon_social || company.cif_nif || company.id,
      },
      people,
      subscriptions,
      cases,
      integrations,
      quotes: quotesRes.data ?? [],
      orders: ordersRes.data ?? [],
      checkoutSessions: checkoutsRes.data ?? [],
      documents,
      tasks,
      summary: {
        linkedPeople: people.length,
        activeCases: cases.filter((item) => item.state !== 'finalizado' && item.state !== 'cerrado' && item.status !== 'closed').length,
        openTasks: tasks.filter((item) => !['done', 'completed', 'closed', 'cancelled'].includes(String(item.status).toLowerCase())).length,
        pendingDocuments: documents.filter((item) => item.state === 'pendiente').length,
        activeSubscription: subscriptions.find((item) => item.status === 'active' || item.status === 'trialing')?.plan_name ?? null,
        holdedConnected: integrations.some((item) => item.provider === 'holded' && item.status === 'active'),
        integrationErrors: integrations.filter((item) => Boolean(item.last_error)).length,
        openCheckouts: (checkoutsRes.data ?? []).filter((item) => item.status === 'open').length,
      },
    });
  } catch (error) {
    console.error('[admin/empresas/[id]]', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
