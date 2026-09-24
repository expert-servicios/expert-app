import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { exchangeMs365Code } from '@/lib/integrations/microsoft365';
import { clearOAuthStateCookie, verifyOAuthState } from '@/lib/auth/oauth-state';
import { saveClientProductivityIntegration } from '@/lib/integrations/productivity/client-productivity-oauth';

function redirectClearingState(url: URL): NextResponse {
  const response = NextResponse.redirect(url);
  clearOAuthStateCookie(response);
  return response;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const oauthState = await verifyOAuthState(request, 'ms365', state);
  if (error || !code || !oauthState.ok) {
    const path = oauthState.ok && oauthState.purpose === 'client_productivity'
      ? '/dashboard/integraciones/productividad?error=oauth&provider=microsoft'
      : '/admin/correo?error=oauth_denied';
    return redirectClearingState(new URL(path, request.url));
  }
  if (oauthState.purpose !== 'client_productivity' && !oauthState.requiresAdmin) {
    return redirectClearingState(new URL('/admin/correo?error=oauth_denied', request.url));
  }

  const supabase = createServerSupabaseClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== oauthState.userId) {
    return redirectClearingState(new URL('/admin/correo?error=oauth_denied', request.url));
  }

  try {
    const admin = getSupabaseAdmin();
    const { data: profile } = await admin
      .from('profiles')
      .select('role,status')
      .eq('id', user.id)
      .maybeSingle();
    if (profile?.status === 'inactive') {
      return redirectClearingState(new URL('/auth/login?error=inactive', request.url));
    }

    const tokens = await exchangeMs365Code(code);

    if (oauthState.purpose === 'client_productivity') {
      if (!oauthState.companyId) {
        return redirectClearingState(new URL('/dashboard/integraciones/productividad?error=company_required&provider=microsoft', request.url));
      }
      await saveClientProductivityIntegration({
        userId: user.id,
        companyId: oauthState.companyId,
        provider: 'microsoft_365',
        accountEmail: tokens.email,
        secret: {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: tokens.expires_at,
        },
      });
      return redirectClearingState(new URL(oauthState.next ?? '/dashboard/integraciones/productividad?connected=microsoft', request.url));
    }

    if (profile?.role !== 'admin' && profile?.role !== 'owner') {
      return redirectClearingState(new URL('/admin/correo?error=oauth_denied', request.url));
    }

    await admin.from('ms365_tokens').upsert({
      id: 'admin',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: tokens.expires_at,
      email: tokens.email,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });

    return redirectClearingState(new URL('/admin/correo?connected=1', request.url));
  } catch (err) {
    console.error('[MS365 OAuth callback]', err);
    const path = oauthState.ok && oauthState.purpose === 'client_productivity'
      ? '/dashboard/integraciones/productividad?error=exchange_failed&provider=microsoft'
      : '/admin/correo?error=exchange_failed';
    return redirectClearingState(new URL(path, request.url));
  }
}
