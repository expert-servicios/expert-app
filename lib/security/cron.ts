export type CronAuthResult =
  | { ok: true }
  | { ok: false; status: 401 | 500; error: string };

export function verifyCronRequest(headers: Headers, label = 'cron'): CronAuthResult {
  const vercelSecret = process.env.CRON_SECRET?.trim();
  const pgCronSecret = process.env.PG_CRON_SECRET?.trim();
  const vercelExecutorEnabled = process.env.VERCEL_CRON_EXECUTOR_ENABLED?.trim() !== '0';

  const acceptedSecrets = [
    pgCronSecret,
    vercelExecutorEnabled ? vercelSecret : undefined,
  ].filter((value): value is string => Boolean(value));

  if (acceptedSecrets.length === 0) {
    if (process.env.NODE_ENV !== 'production') {
      return { ok: true };
    }
    console.error(`[${label}] no cron bearer secret configured`);
    return { ok: false, status: 500, error: 'Cron not configured' };
  }

  const authHeader = headers.get('authorization');
  if (!authHeader || !acceptedSecrets.some((secret) => authHeader === `Bearer ${secret}`)) {
    return { ok: false, status: 401, error: 'Unauthorized' };
  }

  return { ok: true };
}
