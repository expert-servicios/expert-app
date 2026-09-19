import { NextRequest, NextResponse } from 'next/server';
import { verifyCronRequest } from '@/lib/security/cron';
import { runRegulatoryPulse } from '@/lib/regulatory/regulatory-monitor';

export const maxDuration = 300;

export async function GET(request: NextRequest) {
  const auth = verifyCronRequest(request.headers, 'cron/regulatory-pulse');
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const result = await runRegulatoryPulse({ runType: 'daily_pulse' });
  return NextResponse.json({ ok: true, result });
}

export const POST = GET;
