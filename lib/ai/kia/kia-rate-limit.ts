import { getSupabaseAdmin } from '@/lib/integrations/supabase';

// In-memory per-user sliding window — resets on redeploy/restart, which is
// acceptable as a first line of defense against runaway loops/abuse from a
// single session; the daily cost cap below is the durable backstop.
const MESSAGE_WINDOW_MS = 60 * 1000;
const MESSAGE_LIMIT_PER_MINUTE = 12;
const hits = new Map<string, { count: number; resetAt: number }>();

export function checkKiaMessageRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = hits.get(userId);
  if (!entry || entry.resetAt < now) {
    hits.set(userId, { count: 1, resetAt: now + MESSAGE_WINDOW_MS });
    return true;
  }
  if (entry.count >= MESSAGE_LIMIT_PER_MINUTE) return false;
  entry.count++;
  return true;
}

const DAILY_COST_CAP_USD = Number(process.env.KIA_USER_DAILY_COST_CAP_USD ?? '2.00');

export type KiaAudioQuotaKind = 'transcription' | 'speech';

const AUDIO_DAILY_LIMITS: Record<KiaAudioQuotaKind, number> = {
  transcription: Math.max(1, Number(process.env.KIA_AUDIO_TRANSCRIPTIONS_PER_DAY ?? '60')),
  speech: Math.max(1, Number(process.env.KIA_AUDIO_SPEECH_PER_DAY ?? '120')),
};

const AUDIO_TASK_TYPES: Record<KiaAudioQuotaKind, string> = {
  transcription: 'audio_transcription',
  speech: 'audio_speech',
};

/**
 * Durable audio-call quota. A reservation is written before the paid provider
 * call, so successful abuse cannot bypass the cap across serverless instances.
 * Fail closed when the quota store is unavailable.
 */
export async function reserveKiaAudioDailyQuota(userId: string, kind: KiaAudioQuotaKind): Promise<boolean> {
  try {
    const admin = getSupabaseAdmin();
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const taskType = AUDIO_TASK_TYPES[kind];
    const limit = AUDIO_DAILY_LIMITS[kind];
    const { count, error } = await admin
      .from('kia_decision_logs')
      .select('id', { count: 'exact', head: true })
      .eq('client_id', userId)
      .eq('task_type', taskType)
      .gte('created_at', since);

    if (error || (count ?? 0) >= limit) return false;

    const { error: reserveError } = await admin.from('kia_decision_logs').insert({
      provider: 'openai',
      task_type: taskType,
      channel: 'voice',
      client_id: userId,
      decision_summary: 'KIA audio quota reservation',
      output_json: { kind, quota_reservation: true },
    });

    return !reserveError;
  } catch {
    return false;
  }
}

/**
 * Durable per-user daily spend cap backed by kia_decision_logs, so it holds
 * even across cold starts / multiple serverless instances.
 */
export async function checkKiaDailyCostCap(userId: string): Promise<{ ok: boolean; spentUsd: number }> {
  try {
    const admin = getSupabaseAdmin();
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await admin
      .from('kia_decision_logs')
      .select('estimated_cost_usd')
      .eq('client_id', userId)
      .gte('created_at', since);

    if (error || !data) return { ok: true, spentUsd: 0 }; // fail-open: don't block chat on a logging hiccup
    const spentUsd = data.reduce((sum, row) => sum + (row.estimated_cost_usd ?? 0), 0);
    return { ok: spentUsd < DAILY_COST_CAP_USD, spentUsd };
  } catch {
    return { ok: true, spentUsd: 0 };
  }
}
