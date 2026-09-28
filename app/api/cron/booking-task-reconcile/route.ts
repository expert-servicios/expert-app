import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { verifyCronRequest } from '@/lib/security/cron';
import { reconcileBookingAdminTasks } from '@/lib/booking/booking-admin-task';

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const auth = verifyCronRequest(request.headers, 'cron/booking-task-reconcile');
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const result = await reconcileBookingAdminTasks(getSupabaseAdmin());
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error('[booking-task-reconcile]', error);
    return NextResponse.json({ error: 'booking_task_reconcile_failed' }, { status: 500 });
  }
}
