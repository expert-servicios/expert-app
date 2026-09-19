import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { getRegulatoryPulseSummary } from '@/lib/regulatory/regulatory-values';
import { runRegulatoryPulse } from '@/lib/regulatory/regulatory-monitor';
import { runRegulatoryWorker } from '@/lib/regulatory/regulatory-review';

async function requireAdmin(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return false;

  const admin = getSupabaseAdmin();
  const { data: profile } = await admin
    .from('profiles')
    .select('role,status')
    .eq('id', user.id)
    .single();

  if (profile?.status === 'inactive') return false;
  return profile?.role === 'admin' || profile?.role === 'owner';
}

export async function GET(request: NextRequest) {
  if (!await requireAdmin(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }
  return NextResponse.json({ ok: true, summary: await getRegulatoryPulseSummary() });
}

export async function POST(request: NextRequest) {
  if (!await requireAdmin(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({})) as {
    action?: 'pulse' | 'worker';
    authority?: string;
    sourceKey?: string;
  };

  if (body.action === 'worker') {
    return NextResponse.json({ ok: true, result: await runRegulatoryWorker(5) });
  }

  return NextResponse.json({
    ok: true,
    result: await runRegulatoryPulse({
      runType: 'manual',
      forceAll: !body.authority && !body.sourceKey,
      authority: body.authority,
      sourceKey: body.sourceKey,
    }),
  });
}
