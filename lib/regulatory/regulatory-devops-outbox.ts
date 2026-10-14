import { getSupabaseAdmin } from '@/lib/integrations/supabase';
import { notifyDevOpsRegulatoryHumanReview } from './regulatory-devops-telegram';

const CHANNEL = 'expert_devops_telegram';
const MAX_ATTEMPTS = 5;

export function regulatoryDevOpsNotificationsEnabled() {
  // Two independent gates: an administrator must activate the Telegram feature
  // AND explicitly confirm that the reviewed outbox migration is installed.
  return process.env.KIA_REGULATORY_DEVOPS_TELEGRAM_ENABLED === 'true'
    && process.env.KIA_REGULATORY_DEVOPS_OUTBOX_READY === 'true';
}

/**
 * Deduplication is enforced by an outbox UNIQUE(change_id,snapshot_id,channel).
 * Never call Telegram from the regulatory classification worker.
 * The queue and its atomic claim RPC must be deployed before enabling the flag.
 */
export async function enqueueRegulatoryDevOpsReview(input: {
  changeId: string;
  snapshotId: string;
}): Promise<'disabled' | 'queued'> {
  if (!regulatoryDevOpsNotificationsEnabled()) return 'disabled';
  const admin = getSupabaseAdmin();
  const { error } = await admin.from('regulatory_devops_notification_outbox').upsert({
    change_id: input.changeId,
    snapshot_id: input.snapshotId,
    channel: CHANNEL,
  }, { onConflict: 'change_id,snapshot_id,channel', ignoreDuplicates: true });
  if (error) throw new Error('regulatory_devops_outbox_unavailable');
  return 'queued';
}

type ClaimedJob = {
  id: string;
  change_id: string;
  snapshot_id: string;
  claim_token: string;
  attempts: number;
};

function cleanError(error: unknown) {
  const code = error instanceof Error ? error.message : '';
  return /^devops_telegram_[a-z_]+$/.test(code) ? code : 'regulatory_notification_delivery_failed';
}

export async function dispatchRegulatoryDevOpsReviews(limit = 2) {
  if (!regulatoryDevOpsNotificationsEnabled()) return { disabled: true, claimed: 0, sent: 0, uncertain: 0, retry: 0 };
  const admin = getSupabaseAdmin();
  const { data, error } = await admin.rpc('claim_regulatory_devops_notification_batch', {
    p_limit: Math.min(3, Math.max(1, Math.trunc(limit))),
  });
  if (error) throw new Error('regulatory_devops_claim_unavailable');
  const jobs = (data ?? []) as ClaimedJob[];
  let sent = 0;
  let uncertain = 0;
  let retry = 0;

  for (const job of jobs) {
    if (!job.id || !job.claim_token || !job.change_id || !job.snapshot_id) {
      throw new Error('regulatory_devops_invalid_claim');
    }

    const update = async (values: Record<string, unknown>) => {
      const { data: updated, error: updateError } = await admin
        .from('regulatory_devops_notification_outbox')
        .update(values)
        .eq('id', job.id).eq('claim_token', job.claim_token)
        .eq('status', 'processing').select('id').maybeSingle();
      if (updateError || !updated) throw new Error('regulatory_devops_ack_unavailable');
    };

    try {
      const { data: change, error: changeError } = await admin.from('regulatory_changes')
        .select('id,status,relevant,requires_human_review,current_snapshot_id,severity,summary,effective_date,proposal_pr_url,source:regulatory_sources(authority,title,url)')
        .eq('id', job.change_id).maybeSingle();
      if (changeError) throw new Error('regulatory_devops_change_lookup_failed');
      const source = Array.isArray(change?.source) ? change.source[0] : change?.source;

      // Stale alerts must never be sent after legal resolution or a new snapshot.
      if (!change || change.current_snapshot_id !== job.snapshot_id ||
          change.relevant !== true || change.requires_human_review !== true ||
          !['needs_review','proposal_ready','classified'].includes(change.status) || !source) {
        await update({ status: 'skipped', locked_until: null });
        continue;
      }

      const result = await notifyDevOpsRegulatoryHumanReview({
        changeId: job.change_id,
        authority: source.authority,
        title: source.title,
        sourceUrl: source.url,
        summary: change.summary ?? 'Revisión jurídica pendiente',
        severity: change.severity ?? 'unknown',
        effectiveDate: change.effective_date ?? null,
        proposalUrl: change.proposal_pr_url ?? null,
      });
      if (result !== 'sent') {
        // Disabled mid-batch: no remote side effect occurred.
        await update({ status: 'retry', locked_until: null,
          next_attempt_at: new Date(Date.now() + 10 * 60_000).toISOString() });
        retry++;
        continue;
      }

      // If acknowledgement fails after sending, the job remains processing.
      // Do NOT auto-reclaim a processing job: Telegram has no idempotency key.
      await update({ status: 'sent', delivered_at: new Date().toISOString(),
        locked_until: null, last_error: null });
      sent++;
    } catch (failure) {
      const code = cleanError(failure);
      if (code === 'regulatory_devops_ack_unavailable') throw failure;
      // A timed-out or unsuccessful sendMessage might nevertheless have reached
      // Telegram. Require manual reconciliation instead of risking duplicates.
      // Provider acknowledgement can be lost on any sendMessage error. As the
      // adapter does not expose whether sendMessage was reached, ALL failures
      // stay manual/uncertain; no automated resend can be proved safe.
      const ambiguous = true;
      const final = job.attempts >= MAX_ATTEMPTS;
      await update({
        status: ambiguous ? 'delivery_uncertain' : final ? 'dead' : 'retry',
        last_error: code,
        locked_until: null,
        next_attempt_at: new Date(Date.now() +
          Math.min(24 * 60, 2 ** Math.min(job.attempts, 8) * 5) * 60_000).toISOString(),
      });
      if (ambiguous) uncertain++; else retry++;
    }
  }
  return { disabled: false, claimed: jobs.length, sent, uncertain, retry };
}
