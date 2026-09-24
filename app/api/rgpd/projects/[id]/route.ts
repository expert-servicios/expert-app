import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/integrations/supabase';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'authentication_required' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('rgpd_self_implementation_projects')
    .select('id,version,status,payload,created_at,updated_at')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: 'project_lookup_failed' }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'project_not_found' }, { status: 404 });
  }

  return NextResponse.json({ project: data });
}


export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'authentication_required' }, { status: 401 });
  }

  const { data: existing, error: lookupError } = await supabase
    .from('rgpd_self_implementation_projects')
    .select('id,version,status')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (lookupError) {
    return NextResponse.json({ error: 'project_lookup_failed' }, { status: 500 });
  }

  if (!existing) {
    return NextResponse.json({ error: 'project_not_found' }, { status: 404 });
  }

  if (existing.status !== 'draft') {
    return NextResponse.json(
      { error: 'project_locked_for_professional_traceability' },
      { status: 409 }
    );
  }

  const { error } = await supabase
    .from('rgpd_self_implementation_projects')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
    .eq('status', 'draft');

  if (error) {
    return NextResponse.json({ error: 'delete_failed' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, deleted: { id: existing.id, version: existing.version } });
}
