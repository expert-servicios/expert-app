import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { estimateCost, extractTokenUsageFromProviderResult } from './kia-cost-tracker';
import type { KiaProviderResult } from './kia-provider-router';
import { safeErrorMessage, stableHash } from './kia-redaction';

export async function recordKiaProviderUsage(input: {
  providerResult: KiaProviderResult;
  taskType: string;
  channel: string;
  contactStatus?: 'lead' | 'client' | 'unknown';
  clientId?: string | null;
  leadId?: string | null;
  companyId?: string | null;
  caseId?: string | null;
  serviceSlug?: string | null;
  rawInput?: unknown;
  error?: unknown;
}): Promise<void> {
  try {
    const { tokensIn, tokensOut } = extractTokenUsageFromProviderResult(input.providerResult);
    const cost = estimateCost(input.providerResult.model, tokensIn, tokensOut);
    const admin = getSupabaseAdmin();
    const { error } = await admin.from('kia_decision_logs').insert({
      provider: input.providerResult.provider,
      model: input.providerResult.model,
      task_type: input.taskType,
      channel: input.channel,
      contact_status: input.contactStatus ?? 'unknown',
      client_id: input.clientId ?? null,
      lead_id: input.leadId ?? null,
      case_id: input.caseId ?? null,
      company_id: input.companyId ?? null,
      service_slug: input.serviceSlug ?? null,
      input_hash: input.rawInput ? stableHash(input.rawInput) : null,
      output_json: { usage_only: true, pricing_known: cost.pricingKnown },
      decision_summary: 'KIA provider usage telemetry',
      rules_applied: ['usage_telemetry'],
      requires_meeting: false,
      requires_manual_review: false,
      tool_calls: [],
      tool_results_summary: [],
      error: input.error ? safeErrorMessage(input.error) : input.providerResult.error ?? null,
      tokens_in: tokensIn,
      tokens_out: tokensOut,
      estimated_cost_usd: cost.estimatedCostUsd,
      loop_iterations: 0,
    });
    if (error) console.error('[KIA usage telemetry] insert failed:', error.message);
  } catch (error) {
    console.error('[KIA usage telemetry] failed:', safeErrorMessage(error));
  }
}
