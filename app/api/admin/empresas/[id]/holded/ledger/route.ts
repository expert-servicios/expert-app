import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { createHoldedV2Client } from '@/lib/integrations/holded/holded-v2-client';

const querySchema = z.object({
  startDate: z.iso.date(),
  endDate: z.iso.date(),
  cursor: z.string().min(1).max(2048).optional(),
}).strict();

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: 'Identificador de empresa inválido' }, { status: 400 });
  }

  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return NextResponse.json({ error: 'Sesión requerida' }, { status: 401 });

  const admin = getSupabaseAdmin();
  const { data: profile, error: roleError } = await admin.from('profiles')
    .select('role,status').eq('id', user.id).maybeSingle();
  if (roleError || !profile || profile.status === 'inactive'
    || !['owner', 'admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Acceso exclusivo a administración' }, { status: 403 });
  }

  const parsed = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return NextResponse.json({ error: 'Fecha o cursor inválidos' }, { status: 400 });
  const { startDate, endDate, cursor } = parsed.data;
  if (startDate > endDate || startDate.slice(0, 4) !== endDate.slice(0, 4)
      || Number(startDate.slice(0, 4)) < 2023 || Number(startDate.slice(0, 4)) > 2100) {
    return NextResponse.json({ error: 'Consulta limitada a un ejercicio válido' }, { status: 400 });
  }

  const { data: company } = await admin.from('companies').select('id,razon_social,cif_nif')
    .eq('id', id).maybeSingle();
  if (!company) return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 });

  const { data: integration } = await admin.from('client_integrations')
    .select('id,api_version,sync_mode,permissions_enabled')
    .eq('company_id', id).eq('provider', 'holded').eq('status', 'active')
    .order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (!integration || integration.api_version !== 'v2'
      || integration.permissions_enabled?.accountingEntries !== true) {
    return NextResponse.json({ error: 'El diario Holded V2 no está autorizado en esta empresa' }, { status: 409 });
  }

  try {
    const client = await createHoldedV2Client(integration.id);
    const page = await client.listLedgerEntries({ startDate, endDate, cursor, limit: 100 });
    return NextResponse.json({
      company: { id: company.id, name: company.razon_social, nif: company.cif_nif },
      source: 'holded_v2_existing_company_integration',
      period: { startDate, endDate },
      items: page.items,
      cursor: page.cursor,
      hasMore: page.has_more,
      exhaustive: !page.has_more,
      holdedMutated: false,
    }, { headers: { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex' } });
  } catch {
    return NextResponse.json(
      { error: 'No se pudo consultar el diario del Holded origen' },
      { status: 502, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
