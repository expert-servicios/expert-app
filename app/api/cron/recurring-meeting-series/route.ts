import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { verifyCronRequest } from '@/lib/security/cron';
import { materializeRecurringMeetingSeries } from '@/lib/booking/recurring-meeting-series';

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const auth = verifyCronRequest(request.headers, 'cron/recurring-meeting-series');
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const result = await materializeRecurringMeetingSeries(getSupabaseAdmin());
    return NextResponse.json({ ok: result.errors.length === 0, ...result });
  } catch (error) {
    console.error('[recurring-meeting-series]', error);
    return NextResponse.json({ error: 'recurring_meeting_series_failed' }, { status: 500 });
  }
}
