import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { exchangeCode, exchangeProductivityCode } from '@/lib/integrations/google-calendar';
import { getPublicAppUrl } from '@/lib/utils/app-url';
import { clearOAuthStateCookie, verifyOAuthState } from '@/lib/auth/oauth-state';
import { saveClientProductivityIntegration } from '@/lib/integrations/productivity/client-productivity-oauth';

function redirectClearingState(url: string): NextResponse {
  const response = NextResponse.redirect(url);
  clearOAuthStateCookie(response);
  return response;
}

// GET /api/auth/google-calendar/callback?code=...&state=<nonce>
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const appUrl = getPublicAppUrl();

  const oauthState = await verifyOAuthState(request, 'google_calendar', state);
  if (!code || !oauthState.ok) {
    return redirectClearingState(`${appUrl}/dashboard/calendario-fiscal?error=oauth`);
  }

  const supabase = createServerSupabaseClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== oauthState.userId) {
    return redirectClearingState(`${appUrl}/dashboard/calendario-fiscal?error=oauth`);
  }

  try {
    const admin = getSupabaseAdmin();
    const { data: profile } = await admin
      .from('profiles')
      .select('status')
      .eq('id', user.id)
      .maybeSingle();
    if (profile?.status === 'inactive') {
      return redirectClearingState(`${appUrl}/dashboard/calendario-fiscal?error=inactive`);
    }

    if (oauthState.purpose === 'client_productivity') {
      if (!oauthState.companyId) {
        return redirectClearingState(`${appUrl}/dashboard/integraciones/productividad?error=company_required&provider=google`);
      }
      const tokens = await exchangeProductivityCode(code);
      await saveClientProductivityIntegration({
        userId: user.id,
        companyId: oauthState.companyId,
        provider: 'google_workspace',
        accountEmail: tokens.email,
        secret: {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expiry_date: tokens.expiry_date,
          scope: tokens.scope ?? null,
        },
      });
      return redirectClearingState(`${appUrl}${oauthState.next ?? '/dashboard/integraciones/productividad?connected=google'}`);
    }

    const tokens = await exchangeCode(code);

    await admin.from('google_tokens').upsert(
      {
        user_id: user.id,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry_date: tokens.expiry_date,
        scope: tokens.scope,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

    return redirectClearingState(`${appUrl}/dashboard/calendario-fiscal?connected=1`);
  } catch (err) {
    console.error('Google Calendar OAuth callback error:', err);
    const destination = oauthState.ok && oauthState.purpose === 'client_productivity'
      ? `${appUrl}/dashboard/integraciones/productividad?error=oauth&provider=google`
      : `${appUrl}/dashboard/calendario-fiscal?error=oauth`;
    return redirectClearingState(destination);
  }
}
