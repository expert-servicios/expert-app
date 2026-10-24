import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';

export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'private, no-store', Vary: 'Cookie' };

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient(request);
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return NextResponse.json({ authenticated: false }, { headers });
    const { data: profile, error: profileError } = await getSupabaseAdmin()
      .from('profiles').select('full_name,role,status,preferred_language')
      .eq('id', user.id).maybeSingle();
    if (profileError) return NextResponse.json({ error: 'identity_unavailable' }, { status: 503, headers });
    if (!profile || profile.status !== 'active') return NextResponse.json({ authenticated: false }, { headers });
    const firstName = typeof profile.full_name === 'string'
      ? profile.full_name.trim().split(/\s+/)[0]?.slice(0, 60) || null : null;
    return NextResponse.json({
      authenticated: true,
      identityKey: user.id,
      firstName,
      role: profile.role,
      preferredLanguage: profile.preferred_language === 'ru' ? 'ru' : 'es',
    }, { headers });
  } catch {
    return NextResponse.json({ error: 'identity_unavailable' }, { status: 503, headers });
  }
}
