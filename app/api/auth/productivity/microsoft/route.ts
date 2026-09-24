import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/integrations/supabase';
import { createOAuthState, setOAuthStateCookie } from '@/lib/auth/oauth-state';
import { getMs365AuthUrl } from '@/lib/integrations/microsoft365';
import { assertClientCompanyMembership } from '@/lib/integrations/productivity/client-productivity-oauth';

export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  const companyId = request.nextUrl.searchParams.get('companyId');
  const next = request.nextUrl.searchParams.get('next')
    ?? '/dashboard/integraciones/productividad?connected=microsoft';

  if (!user) {
    const login = new URL('/auth/login', request.url);
    login.searchParams.set('next', request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(login);
  }
  if (!companyId) {
    return NextResponse.redirect(new URL('/dashboard/integraciones/productividad?error=company_required&provider=microsoft', request.url));
  }

  try {
    await assertClientCompanyMembership(user.id, companyId);
  } catch {
    return NextResponse.redirect(new URL('/dashboard/integraciones/productividad?error=company_forbidden&provider=microsoft', request.url));
  }

  const oauthState = await createOAuthState({
    provider: 'ms365',
    userId: user.id,
    purpose: 'client_productivity',
    companyId,
    next,
  });
  const response = NextResponse.redirect(getMs365AuthUrl(oauthState.state));
  setOAuthStateCookie(response, oauthState.cookieValue);
  return response;
}
