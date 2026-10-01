import { NextRequest, NextResponse } from 'next/server';
import { runKiaHealthChecks } from '@/lib/ai/kia/health/kia-health-runner';
import { verifyCronRequest } from '@/lib/security/cron';

export const maxDuration = 180;

export async function GET(request: NextRequest) {
  const cronAuth = verifyCronRequest(request.headers, 'cron/kia-health');
  if (!cronAuth.ok) {
    return NextResponse.json({ error: cronAuth.error }, { status: cronAuth.status });
  }

  console.log(JSON.stringify({ cron: 'kia-health', event: 'start', at: new Date().toISOString() }));

  if (process.env.KIA_HEALTH_CANARY_ENABLED?.toLowerCase() === 'false') {
    return NextResponse.json({ ok: true, skipped: true, reason: 'KIA_HEALTH_CANARY_ENABLED=false' });
  }

  const fullDailyCanary = process.env.KIA_HEALTH_DAILY_FULL_CANARY?.toLowerCase() === 'true';
  const weeklyFullCanary = new Date().getUTCDay() === 0;
  const includeCanary = fullDailyCanary || weeklyFullCanary;

  const result = await runKiaHealthChecks({
    runType: includeCanary ? 'nightly_eval' : 'canary',
    includeCanary,
    persist: true,
  });

  return NextResponse.json({ ok: true, result });
}
