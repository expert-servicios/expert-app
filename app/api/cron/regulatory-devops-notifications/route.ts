import { NextRequest, NextResponse } from 'next/server';
import { verifyCronRequest } from '@/lib/security/cron';
import { dispatchRegulatoryDevOpsReviews } from '@/lib/regulatory/regulatory-devops-outbox';

// Intentionally no scheduler registration. Enable only after schema and QA checks.
export const maxDuration = 60;
export async function POST(request: NextRequest) {
  const auth = verifyCronRequest(request.headers, 'cron/regulatory-devops-notifications');
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    const result = await dispatchRegulatoryDevOpsReviews(2);
    return NextResponse.json({ ok: true, result });
  } catch {
    return NextResponse.json({ ok: false, error: 'regulatory_devops_dispatch_failed' }, { status: 503 });
  }
}
