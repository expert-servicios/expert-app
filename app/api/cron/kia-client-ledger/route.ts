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
  const concurrency = Math.min(Math.max(Number(process.env.KIA_CLIENT_LEDGER_CONCURRENCY ?? 4), 1), 8);

  const { data: state, error: stateError } = await admin
    .from('client_registry_reconcile_state')
    .select('profile_cursor,lead_cursor')
    .eq('id', 'default')
    .maybeSingle();
  if (stateError) {
    return NextResponse.json({ error: 'reconcile_state_unavailable' }, { status: 503 });
  }

  let profilesQuery = admin.from('profiles')
    .select('id,email,phone')
    .neq('status', 'inactive')
    .order('id', { ascending: true })
    .limit(batchSize);
  if (state?.profile_cursor) profilesQuery = profilesQuery.gt('id', state.profile_cursor);

  let leadsQuery = admin.from('leads')
    .select('id,email,phone')
    .order('id', { ascending: true })
    .limit(batchSize);
  if (state?.lead_cursor) leadsQuery = leadsQuery.gt('id', state.lead_cursor);

  const [{ data: profiles, error: profilesError }, { data: leads, error: leadsError }] = await Promise.all([
    profilesQuery,
    leadsQuery,
  ]);
  if (profilesError || leadsError) {
    return NextResponse.json({ error: 'reconcile_source_unavailable' }, { status: 503 });
  }

  const targets = [
    ...(profiles ?? []).map((row) => ({ clientId: row.id, email: row.email, phone: row.phone })),
    ...(leads ?? []).map((row) => ({ leadId: row.id, email: row.email, phone: row.phone })),
  ];

  const results: Array<{ ok: boolean; subjectId?: string | null; error?: string }> = [];
  for (let offset = 0; offset < targets.length; offset += concurrency) {
    const slice = targets.slice(offset, offset + concurrency);
    const settled = await Promise.all(slice.map(async (target) => {
      try {
        const ledger = await reconcileClientRegistry(admin, target);
        return { ok: true, subjectId: ledger?.subjectId ?? null };
      } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : 'unknown_error' };
      }
    }));
    results.push(...settled);
  }

  const nextProfileCursor = (profiles?.length ?? 0) < batchSize ? null : profiles?.at(-1)?.id ?? null;
  const nextLeadCursor = (leads?.length ?? 0) < batchSize ? null : leads?.at(-1)?.id ?? null;
  const { error: cursorError } = await admin.from('client_registry_reconcile_state').upsert({
    id: 'default',
    profile_cursor: nextProfileCursor,
    lead_cursor: nextLeadCursor,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'id' });
  if (cursorError) {
    return NextResponse.json({ error: 'reconcile_cursor_write_failed' }, { status: 503 });
  }

  return NextResponse.json({
    ok: results.every((item) => item.ok),
    processed: results.length,
    failed: results.filter((item) => !item.ok).length,
    profileCursor: nextProfileCursor,
    leadCursor: nextLeadCursor,
  });
}
