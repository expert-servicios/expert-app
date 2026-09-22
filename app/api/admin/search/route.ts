import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin, listAllAuthUsers } from '@/lib/integrations/supabase';

interface SearchResult {
  id: string;
  type: 'person' | 'company' | 'case' | 'appointment' | 'quote' | 'document';
  title: string;
  subtitle: string;
  href: string;
}

async function requireAdmin(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = getSupabaseAdmin();
  const { data: p } = await admin.from('profiles').select('role').eq('id', user.id).single();
  return (p?.role === 'admin' || p?.role === 'owner') ? admin : null;
}

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim() ?? '';
  if (q.length < 2) return NextResponse.json({ results: [] });

  const lq = q.toLowerCase();
  const results: SearchResult[] = [];

  const [
    profilesRes,
    authUsersRes,
    companiesRes,
    casesRes,
    appointmentsRes,
    quotesRes,
    documentsRes,
  ] = await Promise.all([
    admin
      .from('profiles')
      .select('id,full_name,email,phone,role,status,tax_id')
      .or(`full_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%,tax_id.ilike.%${q}%`)
      .limit(7),

    listAllAuthUsers(),

    admin
      .from('companies')
      .select('id,razon_social,nombre_comercial,cif_nif,email,telefono,status')
      .or(`razon_social.ilike.%${q}%,nombre_comercial.ilike.%${q}%,cif_nif.ilike.%${q}%,email.ilike.%${q}%,telefono.ilike.%${q}%`)
      .limit(7),

    admin
      .from('cases')
      .select('id,service,category,state,client_id')
      .or(`service.ilike.%${q}%,category.ilike.%${q}%`)
      .neq('state', 'finalizado')
      .limit(5),

    admin
      .from('appointments')
      .select('id,name,email,service,status')
      .or(`name.ilike.%${q}%,email.ilike.%${q}%,service.ilike.%${q}%`)
      .limit(4),

    admin
      .from('quotes')
      .select('id,title,amount_eur,status,client_id')
      .ilike('title', `%${q}%`)
      .limit(4),

    admin
      .from('documents')
      .select('id,original_name,state,case_id,client_id')
      .ilike('original_name', `%${q}%`)
      .limit(5),
  ]);

  const authEmailById = new Map(authUsersRes.map((user) => [user.id, user.email ?? '']));

  for (const profile of profilesRes.data ?? []) {
    const email = profile.email ?? authEmailById.get(profile.id) ?? '';
    if (!email && !profile.full_name) continue;
    const isClient = profile.role === 'client';
    results.push({
      id: profile.id,
      type: 'person',
      title: profile.full_name ?? email,
      subtitle: [isClient ? 'Cliente' : profile.role, email, profile.tax_id].filter(Boolean).join(' · '),
      href: isClient ? `/admin/clientes/${profile.id}` : '/admin/usuarios',
    });
  }

  for (const company of companiesRes.data ?? []) {
    results.push({
      id: company.id,
      type: 'company',
      title: company.nombre_comercial || company.razon_social || company.cif_nif || company.id,
      subtitle: [company.cif_nif, company.email, company.status].filter(Boolean).join(' · '),
      href: `/admin/empresas?companyId=${company.id}`,
    });
  }

  const clientIds = [
    ...(casesRes.data ?? []).map((item) => item.client_id),
    ...(quotesRes.data ?? []).map((item) => item.client_id).filter(Boolean),
  ].filter(Boolean) as string[];

  const clientNameMap = new Map<string, string>();
  if (clientIds.length > 0) {
    const { data: clientProfiles } = await admin
      .from('profiles')
      .select('id,full_name')
      .in('id', [...new Set(clientIds)]);

    for (const profile of clientProfiles ?? []) {
      const email = authEmailById.get(profile.id) ?? '';
      clientNameMap.set(profile.id, profile.full_name ?? email);
    }
  }

  for (const item of casesRes.data ?? []) {
    const clientName = clientNameMap.get(item.client_id) ?? '';
    results.push({
      id: item.id,
      type: 'case',
      title: item.service,
      subtitle: `${item.state}${clientName ? ` · ${clientName}` : ''}`,
      href: `/admin/expedientes/${item.id}`,
    });
  }

  for (const item of appointmentsRes.data ?? []) {
    if (
      !item.name.toLowerCase().includes(lq) &&
      !item.email.toLowerCase().includes(lq) &&
      !item.service.toLowerCase().includes(lq)
    ) continue;

    results.push({
      id: item.id,
      type: 'appointment',
      title: item.name,
      subtitle: `${item.service} · ${item.status}`,
      href: '/admin/citas',
    });
  }

  for (const item of quotesRes.data ?? []) {
    const clientName = item.client_id ? clientNameMap.get(item.client_id) ?? '' : '';
    results.push({
      id: item.id,
      type: 'quote',
      title: item.title,
      subtitle: `${item.amount_eur}€ · ${item.status}${clientName ? ` · ${clientName}` : ''}`,
      href: `/admin/presupuestos/${item.id}`,
    });
  }

  for (const item of documentsRes.data ?? []) {
    results.push({
      id: item.id,
      type: 'document',
      title: item.original_name,
      subtitle: `Documento · ${item.state}${item.case_id ? ' · ver expediente' : ''}`,
      href: item.case_id
        ? `/admin/expedientes/${item.case_id}`
        : (item.client_id ? `/admin/clientes/${item.client_id}` : '/admin/documentos'),
    });
  }

  return NextResponse.json({ results: results.slice(0, 24) });
}
