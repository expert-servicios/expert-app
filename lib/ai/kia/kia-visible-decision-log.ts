import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { redactJson } from './kia-redaction';
import type { KiaDecision } from './kia-output-schema';

/** The feedback endpoint reads output_json.userMessage by decisionLogId. */
export async function recordKiaVisibleReply(input: {
  admin: ReturnType<typeof getSupabaseAdmin>;
  decisionLogId?: string | null;
  clientId: string;
  decision: KiaDecision;
  reply: string;
}): Promise<string | null> {
  if (!input.decisionLogId) return null;
  const output = redactJson({ ...input.decision, userMessage: input.reply });
  const { data, error } = await input.admin.from('kia_decision_logs')
    .update({ output_json: output })
    .eq('id', input.decisionLogId)
    .eq('client_id', input.clientId)
    .select('id')
    .maybeSingle();
  // Never attach feedback to a log with a different reply if persistence failed.
  return error || !data ? null : data.id;
}
