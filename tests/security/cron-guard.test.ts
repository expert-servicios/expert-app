import { afterEach, describe, expect, it, vi } from 'vitest';
import { verifyCronRequest } from '@/lib/security/cron';

describe('verifyCronRequest', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('fails closed in production when no cron secret is configured', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('CRON_SECRET', '');
    vi.stubEnv('PG_CRON_SECRET', '');

    expect(verifyCronRequest(new Headers())).toEqual({
      ok: false,
      status: 500,
      error: 'Cron not configured',
    });
  });

  it('allows local development without cron secrets', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('CRON_SECRET', '');
    vi.stubEnv('PG_CRON_SECRET', '');

    expect(verifyCronRequest(new Headers())).toEqual({ ok: true });
  });

  it('accepts the canonical pg_cron bearer independently of the Vercel scheduler', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('CRON_SECRET', 'vercel-secret');
    vi.stubEnv('PG_CRON_SECRET', 'pg-secret');
    vi.stubEnv('VERCEL_CRON_EXECUTOR_ENABLED', '0');

    expect(verifyCronRequest(new Headers({ authorization: 'Bearer pg-secret' }))).toEqual({ ok: true });
  });

  it('rejects the Vercel bearer when that project is not a Vercel cron executor', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('CRON_SECRET', 'vercel-secret');
    vi.stubEnv('PG_CRON_SECRET', 'pg-secret');
    vi.stubEnv('VERCEL_CRON_EXECUTOR_ENABLED', '0');

    expect(verifyCronRequest(new Headers({ authorization: 'Bearer vercel-secret' }))).toEqual({
      ok: false,
      status: 401,
      error: 'Unauthorized',
    });
  });

  it('accepts CRON_SECRET by default for the temporary Vercel scheduler project', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('CRON_SECRET', 'vercel-secret');
    vi.stubEnv('PG_CRON_SECRET', '');

    expect(verifyCronRequest(new Headers({ authorization: 'Bearer vercel-secret' }))).toEqual({ ok: true });
  });

  it('rejects requests with an unknown bearer token', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('CRON_SECRET', 'vercel-secret');
    vi.stubEnv('PG_CRON_SECRET', 'pg-secret');

    expect(verifyCronRequest(new Headers({ authorization: 'Bearer wrong' }))).toEqual({
      ok: false,
      status: 401,
      error: 'Unauthorized',
    });
  });
});
