import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { buildMetaCatalogDrafts } from '@/lib/integrations/meta/catalog-export';

async function requireAdmin(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return false;

  const admin = getSupabaseAdmin();
  const { data: profile } = await admin
    .from('profiles')
    .select('role,status')
    .eq('id', user.id)
    .single();

  if (profile?.status === 'inactive') return false;
  return profile?.role === 'admin' || profile?.role === 'owner';
}

export async function GET(request: NextRequest) {
  if (!await requireAdmin(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const result = await buildMetaCatalogDrafts();
  return NextResponse.json(result);
}
