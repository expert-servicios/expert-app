import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { requireActiveActor } from '@/lib/auth/active-actor';
import { isOperationallyActiveCase } from '@/lib/utils/case-states';

export async function GET(request: NextRequest) {
  try {
    const sessionSupabase = createServerSupabaseClient(request);
    const { data: { user }, error: authError } = await sessionSupabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // A valid session can survive a profile revocation. Revalidate the current
    // active staff role before any service-role reads of aggregate information.
    const actor = await requireActiveActor(request, ['admin', 'owner']);
    if (!actor || actor.userId !== user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const adminSupabase = getSupabaseAdmin();
    const [profilesResult, pendingQuotesResult, ordersResult, casesResult] = await Promise.all([
      adminSupabase.from('profiles').select('id', { count: 'exact', head: true }),
      adminSupabase
        .from('quotes')
        .select('id', { count: 'exact', head: true })
        .in('status', ['draft', 'sent', 'accepted']),
      adminSupabase.from('orders').select('amount_eur').eq('status', 'paid'), // full scan — needed for accurate SUM; migrate to RPC when orders > 10k
      adminSupabase
        .from('cases')
        .select('state') // full scan — needed for client-side isOperationallyActiveCase filter
    ]);

    const totalUsers = profilesResult.count ?? 0;
    const pendingQuotes = pendingQuotesResult.count ?? 0;
    const activeCases = (casesResult.data ?? []).filter((caseItem) =>
      isOperationallyActiveCase(String(caseItem.state))
    ).length;
    const totalRevenue = (ordersResult.data ?? []).reduce(
      (sum, order) => sum + Number(order.amount_eur),
      0
    );

    return NextResponse.json({ totalUsers, pendingQuotes, activeCases, totalRevenue });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
