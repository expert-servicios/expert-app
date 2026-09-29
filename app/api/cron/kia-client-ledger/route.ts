import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { reconcileClientRegistry } from '@/lib/ai/kia/kia-client-ledger';
import { verifyCronRequest } from '@/lib/security/cron';

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const cronAuth = verifyCronRequest(request.headers, 'cron/kia-client-ledger');
  if (!cronAuth.ok) {
    return NextResponse.json({ error: cronAuth.error }, { status: cronAuth.status });
  }
  if (process.env.KIA_CLIENT_LEDGER_ENABLED?.trim().toLowerCase() !== 'true') {
    return NextResponse.json({ ok: true, skipped: true, reason: 'KIA_CLIENT_LEDGER_ENABLED=false' });
  }

  const admin = getSupabaseAdmin();
  const batchSize = Math.min(Math.max(Number(process.env.KIA_CLIENT_LEDGER_BATCH_SIZE ?? 20), 5), 50);
  const [{ data: profiles }, { data: leads }] = await Promise.all([
    admin.from('profiles')
      .select('id,email,phone,updated_at')
      .neq('status', 'inactive')
      .order('updated_at', { ascending: false })
      .limit(batchSize),
    admin.from('leads')
      .select('id,email,phone,updated_at')
      .order('updated_at', { ascending: false })
      .limit(batchSize),
  ]);

  const targets = [
    ...(profiles ?? []).map((row) => ({ clientId: row.id, email: row.email, phone: row.phone })),
    ...(leads ?? []).map((row) => ({ leadId: row.id, email: row.email, phone: row.phone })),
  ];

  const results = [];
  for (const target of targets) {
    try {
      const ledger = await reconcileClientRegistry(admin, target);
      results.push({ ok: true, subjectId: ledger?.subjectId ?? null });
    } catch (error) {
      results.push({ ok: false, error: error instanceof Error ? error.message : 'unknown_error' });
    }
  }

  return NextResponse.json({
    ok: results.every((item) => item.ok),
    processed: results.length,
    failed: results.filter((item) => !item.ok).length,
  });
}
