import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { requireActiveActor } from '@/lib/auth/active-actor';
import { indexCompanyGoogleDrive } from '@/lib/documents/company-drive-index';

async function authorize(request: NextRequest, companyId: string) {
  const actor = await requireActiveActor(request, ['admin', 'owner']);
  if (!actor) return null;
  const admin = getSupabaseAdmin();
  let companyQuery = admin.from('companies').select('id,tenant_id').eq('id', companyId);
  if (actor.tenantId) companyQuery = companyQuery.eq('tenant_id', actor.tenantId);
  const { data: company, error: companyError } = await companyQuery.maybeSingle();
  if (companyError || !company) return null;

  const effectiveTenant = actor.tenantId ?? company.tenant_id ?? null;
  const { data: memberships, error: membershipError } = await admin
    .from('profile_companies').select('profile_id').eq('company_id', company.id);
  if (membershipError || !memberships?.length) return null;
  const profileIds = [...new Set(memberships.map((row) => row.profile_id).filter(Boolean))];
  if (!profileIds.length) return null;
  let memberQuery = admin.from('profiles').select('id').in('id', profileIds);
  if (effectiveTenant) memberQuery = memberQuery.eq('tenant_id', effectiveTenant);
  const { data: members, error: membersError } = await memberQuery.limit(1);
  if (membersError || !members?.length) return null;
  return { admin, actorId: actor.userId, companyId: company.id };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ctx = await authorize(request, id);
  if (!ctx) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const [{ data, error }, { data: root, error: rootError }] = await Promise.all([
    ctx.admin
      .from('company_document_index')
      .select('id,relative_path,name,mime_type,size_bytes,is_folder,category,provider_modified_at,indexed_at')
      .eq('company_id', ctx.companyId)
      .order('relative_path')
      .limit(5000),
    ctx.admin
      .from('company_document_roots')
      .select('provider,display_name,status,sync_mode,last_indexed_at,last_error')
      .eq('company_id', ctx.companyId)
      .eq('provider', 'google')
      .maybeSingle(),
  ]);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (rootError) return NextResponse.json({ error: rootError.message }, { status: 500 });

  const items = data ?? [];
  const folders = items.filter((item) => item.is_folder).length;
  return NextResponse.json({
    root: root ?? null,
    summary: {
      total: items.length,
      folders,
      files: items.length - folders,
    },
    items,
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ctx = await authorize(request, id);
  if (!ctx) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  try {
    const result = await indexCompanyGoogleDrive(ctx.companyId);
    await ctx.admin.from('audit_logs').insert({
      actor_id: ctx.actorId,
      action: 'company_documents.drive_indexed',
      entity: 'companies',
      entity_id: ctx.companyId,
      metadata: result,
    }).then(() => null);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Error indexando Google Drive',
    }, { status: 500 });
  }
}
