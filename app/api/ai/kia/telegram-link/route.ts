import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { createTelegramLinkCode } from '@/lib/ai/kia/kia-telegram-linking';
import { safeErrorMessage } from '@/lib/ai/kia/kia-redaction';

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const admin = getSupabaseAdmin();
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('tenant_id,status')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    console.error('[Telegram link] profile lookup failed:', profileError.message);
    return NextResponse.json({ error: 'profile_lookup_failed' }, { status: 500 });
  }
  if (!profile || profile.status === 'inactive' || !profile.tenant_id) {
    return NextResponse.json({ error: 'profile_not_linkable' }, { status: 403 });
  }

  try {
    const link = await createTelegramLinkCode({
      admin,
      profileId: user.id,
      tenantId: profile.tenant_id,
    });
    return NextResponse.json({
      code: link.code,
      expiresAt: link.expiresAt,
      command: `/link ${link.code}`,
    });
  } catch (err) {
    console.error('[Telegram link] token creation failed:', safeErrorMessage(err));
    return NextResponse.json({ error: 'link_creation_failed' }, { status: 500 });
  }
}
