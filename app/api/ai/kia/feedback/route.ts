import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient, getSupabaseAdmin } from '@/lib/integrations/supabase';
import { storeKiaFeedback } from '@/lib/ai/kia/kia-feedback-store';

const bodySchema = z.object({
  decisionLogId: z.string().uuid(),
  rating: z.enum(['positive', 'negative']),
  userMessage: z.string().min(1).max(1000),
}).strict();

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient(request);
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_request' }, { status: 400 });

  const admin = getSupabaseAdmin();
  const { data: log, error } = await admin
    .from('kia_decision_logs')
    .select('id, client_id, channel, output_json')
    .eq('id', parsed.data.decisionLogId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: 'feedback_lookup_failed' }, { status: 500 });
  if (!log || log.client_id !== user.id || log.channel !== 'dashboard') {
    return NextResponse.json({ error: 'feedback_forbidden' }, { status: 403 });
  }

  const output = (log.output_json ?? {}) as Record<string, unknown>;
  const canonicalReply = typeof output.userMessage === 'string' ? output.userMessage : '';
  if (!canonicalReply) {
    return NextResponse.json({ error: 'feedback_reply_missing' }, { status: 409 });
  }

  await storeKiaFeedback({
    rating: parsed.data.rating,
    decisionLogId: parsed.data.decisionLogId,
    clientId: user.id,
    channel: 'dashboard',
    userMessage: parsed.data.userMessage,
    kiaReply: canonicalReply,
    feedbackContext: { source: 'kia_copilot_widget' },
  });

  return NextResponse.json({ ok: true });
}
