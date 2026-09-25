import { getSupabaseAdmin } from '@/lib/integrations/supabase';

export type KiaRating = 'positive' | 'negative';

export const KIA_FEEDBACK_GOOD_PREFIX = 'kia_fb_g:';
export const KIA_FEEDBACK_BAD_PREFIX  = 'kia_fb_b:';

export function parseKiaFeedbackButtonId(buttonId: string): { rating: KiaRating; decisionLogId: string } | null {
  if (buttonId.startsWith(KIA_FEEDBACK_GOOD_PREFIX)) {
    return { rating: 'positive', decisionLogId: buttonId.slice(KIA_FEEDBACK_GOOD_PREFIX.length) };
  }
  if (buttonId.startsWith(KIA_FEEDBACK_BAD_PREFIX)) {
    return { rating: 'negative', decisionLogId: buttonId.slice(KIA_FEEDBACK_BAD_PREFIX.length) };
  }
  return null;
}

export async function storeKiaFeedback(input: {
  rating: KiaRating;
  decisionLogId: string;
  phone?: string | null;
  userMessage?: string | null;
  kiaReply?: string | null;
  feedbackContext?: Record<string, unknown>;
  clientId?: string | null;
  leadId?: string | null;
  channel?: string;
}): Promise<void> {
  const admin = getSupabaseAdmin();

  // Fetch the linked decision log to copy reply/intent context
  const { data: log } = await admin
    .from('kia_decision_logs')
    .select('output_json, task_type, client_id, lead_id')
    .eq('id', input.decisionLogId)
    .maybeSingle();

  const outputJson = (log?.output_json ?? {}) as Record<string, unknown>;

  await admin.from('kia_feedback').insert({
    decision_log_id: input.decisionLogId,
    phone:           input.phone ?? null,
    client_id:       input.clientId ?? log?.client_id ?? null,
    lead_id:         input.leadId ?? log?.lead_id ?? null,
    rating:          input.rating,
    channel:         input.channel ?? 'waba',
    kia_reply:       (input.kiaReply ?? (typeof outputJson.userMessage === 'string' ? outputJson.userMessage : null))?.slice(0, 1000) ?? null,
    user_message:    input.userMessage?.slice(0, 1000) ?? null,
    intent:          typeof outputJson.intent === 'string' ? outputJson.intent : null,
    next_action:     typeof outputJson.nextAction === 'string' ? outputJson.nextAction : null,
    task_type:       log?.task_type ?? null,
    approved_for_learning: false,
    feedback_context: input.feedbackContext ?? {},
  });
}
