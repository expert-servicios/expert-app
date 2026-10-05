import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { indexCompanyGoogleDrive } from '@/lib/documents/company-drive-index';

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
  const ctx = await requireStaff(request);
  if (!ctx) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  const { id } = await params;

  const [{ data, error }, { data: root, error: rootError }] = await Promise.all([
    ctx.admin
      .from('company_document_index')
      .select('id,relative_path,name,mime_type,size_bytes,is_folder,category,provider_modified_at,indexed_at')
      .eq('company_id', id)
      .order('relative_path')
      .limit(5000),
    ctx.admin
      .from('company_document_roots')
      .select('provider,display_name,status,sync_mode,last_indexed_at,last_error')
      .eq('company_id', id)
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
  const ctx = await requireStaff(request);
  if (!ctx) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  const { id } = await params;

  const { data: company } = await ctx.admin
    .from('companies')
    .select('id')
    .eq('id', id)
    .maybeSingle();
  if (!company) return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 });

  try {
    const result = await indexCompanyGoogleDrive(id);
    await ctx.admin.from('audit_logs').insert({
      actor_id: ctx.actorId,
      action: 'company_documents.drive_indexed',
      entity: 'companies',
      entity_id: id,
      metadata: result,
    }).then(() => null);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Error indexando Google Drive',
    }, { status: 500 });
  }
}
