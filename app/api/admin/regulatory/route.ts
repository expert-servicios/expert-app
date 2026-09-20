import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import {
  applyReviewedRegulatoryValueUpdates,
  getRegulatoryPulseSummary,
  resolveReviewedRegulatoryChange,
} from '@/lib/regulatory/regulatory-values';
import { runRegulatoryPulse } from '@/lib/regulatory/regulatory-monitor';
import { runRegulatoryWorker } from '@/lib/regulatory/regulatory-review';
import { runRegulatoryHealthAudit } from '@/lib/regulatory/regulatory-audit';

export const maxDuration = 300;

async function requireAdmin(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  const admin = getSupabaseAdmin();
  const { data: profile } = await admin
    .from('profiles')
    .select('role,status')
    .eq('id', user.id)
    .single();

  if (profile?.status === 'inactive') return null;
  if (profile?.role !== 'admin' && profile?.role !== 'owner') return null;
  return { userId: user.id };
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }
  const [summary, health] = await Promise.all([
    getRegulatoryPulseSummary(),
    runRegulatoryHealthAudit(),
  ]);
  return NextResponse.json({ ok: true, summary, health });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({})) as {
    action?: 'pulse' | 'worker' | 'apply_values' | 'resolve_change';
    authority?: string;
    sourceKey?: string;
    topic?: string;
    serviceKey?: string;
    changeId?: string;
    resolutionNote?: string;
    resolutionEvidence?: Record<string, unknown>;
  };

  if (body.action === 'apply_values') {
    if (!body.changeId) {
      return NextResponse.json({ error: 'changeId es obligatorio' }, { status: 400 });
    }
    return NextResponse.json({
      ok: true,
      result: await applyReviewedRegulatoryValueUpdates(body.changeId, auth.userId),
    });
  }

  if (body.action === 'resolve_change') {
    if (!body.changeId) {
      return NextResponse.json({ error: 'changeId es obligatorio' }, { status: 400 });
    }
    return NextResponse.json({
      ok: true,
      result: await resolveReviewedRegulatoryChange(
        body.changeId,
        auth.userId,
        body.resolutionNote ?? '',
        body.resolutionEvidence,
      ),
    });
  }

  if (body.action === 'worker') {
    return NextResponse.json({ ok: true, result: await runRegulatoryWorker(5) });
  }

  return NextResponse.json({
    ok: true,
    result: await runRegulatoryPulse({
      runType: 'manual',
      forceAll: !body.authority && !body.sourceKey && !body.topic && !body.serviceKey,
      authority: body.authority,
      sourceKey: body.sourceKey,
      topic: body.topic,
      serviceKey: body.serviceKey,
    }),
  });
}
