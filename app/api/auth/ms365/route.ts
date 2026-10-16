import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/integrations/supabase';
import { requireActiveActor } from '@/lib/auth/active-actor';
import { getMs365AuthUrl } from '@/lib/integrations/microsoft365';
import { createOAuthState, setOAuthStateCookie } from '@/lib/auth/oauth-state';

export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL('/auth/login', request.url));

  const actor = await requireActiveActor(request, ['admin', 'owner']);
  if (!actor || actor.userId !== user.id) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Avoid redirecting to Microsoft with an undefined application ID.
  // Registration and consent must be completed by the mailbox owner.
  if (!process.env.MS365_CLIENT_ID || !process.env.MS365_CLIENT_SECRET) {
    return NextResponse.redirect(new URL('/admin/integraciones?error=ms365_not_configured', request.url));
  }

  const oauthState = await createOAuthState({
    provider: 'ms365',
    userId: user.id,
    requiresAdmin: true,
  });
  const response = NextResponse.redirect(getMs365AuthUrl(oauthState.state));
  setOAuthStateCookie(response, oauthState.cookieValue);
  return response;
}
