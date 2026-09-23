import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { resolveKiaContextToken } from '@/lib/ai/kia/kia-context-token';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const origin = new URL(request.url).origin;
  const returnPath = `/kia/c/${encodeURIComponent(token)}`;

  const supabase = createServerSupabaseClient(request);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const login = new URL('/auth/login', origin);
    login.searchParams.set('next', returnPath);
    return NextResponse.redirect(login);
  }

  const admin = getSupabaseAdmin();
  const { data: profile } = await admin
    .from('profiles')
    .select('tenant_id,status')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || profile.status === 'inactive') {
    return NextResponse.redirect(new URL('/auth/login?error=inactive', origin));
  }

  const context = await resolveKiaContextToken({
    admin,
    token,
    profileId: user.id,
    tenantId: profile.tenant_id ?? null,
  }).catch(() => null);

  if (!context) {
    const target = new URL('/dashboard', origin);
    target.searchParams.set('kia', 'invalid_context');
    return NextResponse.redirect(target);
  }

  const target = new URL('/dashboard', origin);
  target.searchParams.set('kia', 'open');
  target.searchParams.set('ctx', token);
  return NextResponse.redirect(target);
}
