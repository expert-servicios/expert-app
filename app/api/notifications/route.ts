import { NextRequest, NextResponse } from 'next/server';
import { requireActiveActor } from '@/lib/auth/active-actor';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { urgencyLevel } from '@/lib/utils/fiscal-calendar';

export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ notifications: [], count: 0 });

  const actor = await requireActiveActor(request);
  if (!actor || actor.userId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const admin = getSupabaseAdmin();
  const { data: obligations } = await admin
    .from('fiscal_obligations')
    .select('id,modelo,description,deadline,period_label,status')
    .eq('user_id', user.id)
    .eq('status', 'pending')
    .lte('deadline', new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10))
    .order('deadline');

  const notifications = (obligations ?? []).map((o) => ({
    id: o.id,
    modelo: o.modelo,
    description: o.description,
    deadline: o.deadline,
    period_label: o.period_label,
    urgency: urgencyLevel(o.deadline),
  }));

  const urgent = notifications.filter((n) => n.urgency === 'overdue' || n.urgency === 'critical').length;

  return NextResponse.json({ notifications, count: urgent });
}
