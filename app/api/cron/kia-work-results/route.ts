import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { verifyCronRequest } from '@/lib/security/cron';
import { workEnabled } from '@/lib/ai/kia/work-auth';
import { processWorkInbox } from '@/lib/ai/kia/work-inbox';
import { workErrorResponse } from '@/lib/ai/kia/work-http';

export const maxDuration = 60;
export async function GET(request: NextRequest) {
  const auth = verifyCronRequest(request.headers, 'cron/kia-work-results');
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (!workEnabled()) return NextResponse.json({ skipped: true });
  try { return NextResponse.json(await processWorkInbox(getSupabaseAdmin())); }
  catch (error) { return workErrorResponse(error); }
}
