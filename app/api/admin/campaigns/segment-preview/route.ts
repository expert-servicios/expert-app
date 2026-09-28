import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { getSegmentRecipients, type SegmentKey } from '@/lib/campaigns/segments';

export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  const admin = getSupabaseAdmin();
  const { data: p } = await admin.from('profiles').select('role').eq('id', user.id).single();
  if (p?.role !== 'admin' && p?.role !== 'owner') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const segment = searchParams.get('segment') as SegmentKey | null;
  if (!segment) return NextResponse.json({ error: 'segment requerido' }, { status: 400 });

  const audienceSegment = searchParams.get('audience_segment');
  const allowedAudienceSegments = new Set([
    'particular_residente',
    'particular_no_residente',
    'autonomo',
    'empresa',
  ]);
  if (audienceSegment && !allowedAudienceSegments.has(audienceSegment)) {
    return NextResponse.json({ error: 'audience_segment no válido' }, { status: 400 });
  }

  try {
    const recipients = await getSegmentRecipients(
      segment,
      segment === 'newsletter' ? audienceSegment : null,
    );
    const sample = recipients.slice(0, 5).map((recipient) =>
      recipient.channel === 'telegram'
        ? `Telegram: ${recipient.telegramChatId ?? 'sin id'}`
        : recipient.email ?? 'sin email',
    );
    return NextResponse.json({ count: recipients.length, sample });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
