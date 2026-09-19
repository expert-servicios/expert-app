import { NextRequest, NextResponse } from 'next/server';
import { verifyCronRequest } from '@/lib/security/cron';
import { runRegulatoryWorker } from '@/lib/regulatory/regulatory-review';

export const maxDuration = 300;

export async function GET(request: NextRequest) {
  const auth = verifyCronRequest(request.headers, 'cron/regulatory-worker');
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const result = await runRegulatoryWorker(5);
  return NextResponse.json({ ok: true, result });
}
