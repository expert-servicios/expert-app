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
