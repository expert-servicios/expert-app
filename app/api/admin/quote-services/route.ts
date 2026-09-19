import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { getQuoteLineCatalog } from '@/lib/quotes/quote-line-catalog';

async function isAdmin(request: NextRequest): Promise<boolean> {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return false;

  const admin = getSupabaseAdmin();
  const { data: profile } = await admin
    .from('profiles')
    .select('role,status')
    .eq('id', user.id)
    .maybeSingle();

  return Boolean(
    profile &&
    (profile.role === 'admin' || profile.role === 'owner') &&
    profile.status !== 'inactive'
  );
}

export async function GET(request: NextRequest) {
  if (!await isAdmin(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const services = getQuoteLineCatalog().map((item) => ({
    slug: item.slug,
    name: item.name,
    category: item.category,
    unitAmountCents: item.unitAmountCents,
    minQuantity: item.minQuantity,
    maxQuantity: item.maxQuantity,
    quantityLabel: item.quantityLabel,
  }));

  return NextResponse.json({ services });
}
