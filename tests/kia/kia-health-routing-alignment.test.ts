import { afterEach, describe, expect, it, vi } from 'vitest';
import { runKiaTechnicalChecks } from '@/lib/ai/kia/health/kia-health-checks';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('KIA health provider and retired WABA alignment', () => {
  it('treats Vercel AI Gateway as a valid provider even without direct API keys', async () => {
    vi.stubEnv('AI_GATEWAY_API_KEY', 'test-gateway-key');
    vi.stubEnv('ANTHROPIC_API_KEY', '');
    vi.stubEnv('OPENAI_API_KEY', '');
    vi.stubEnv('WABA_PAUSED', 'true');
    vi.stubEnv('STRIPE_SECRET_KEY', 'test');
    vi.stubEnv('STRIPE_WEBHOOK_SECRET', 'test');
    vi.stubEnv('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', 'test');
    vi.stubEnv('SECRET_ENCRYPTION_KEY', 'test');
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ status: { indicator: 'none' } }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })));

    const checks = await runKiaTechnicalChecks();
    const provider = checks.find((check) => check.checkId === 'provider_router_configured');
    expect(provider?.status).toBe('passed');
    expect(provider?.provider).toBe('vercel-ai-gateway');
    expect(provider?.model).toBe('google/gemini-3.6-flash');
  });

  it('reports a complete direct Gemini Claude OpenAI failover pool', async () => {
    vi.stubEnv('AI_GATEWAY_API_KEY', '');
    vi.stubEnv('VERCEL_OIDC_TOKEN', '');
    vi.stubEnv('GEMINI_API_KEY', 'test-gemini');
    vi.stubEnv('ANTHROPIC_API_KEY', 'test-anthropic');
    vi.stubEnv('OPENAI_API_KEY', 'test-openai');
    vi.stubEnv('WABA_PAUSED', 'true');
    vi.stubEnv('STRIPE_SECRET_KEY', 'test');
    vi.stubEnv('STRIPE_WEBHOOK_SECRET', 'test');
    vi.stubEnv('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', 'test');
    vi.stubEnv('SECRET_ENCRYPTION_KEY', 'test');
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ status: { indicator: 'none' } }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })));

    const checks = await runKiaTechnicalChecks();
    const pool = checks.find((check) => check.checkId === 'three_provider_failover_pool');
    expect(pool?.status).toBe('passed');
    expect(pool?.actual).toEqual(expect.objectContaining({ configuredCount: 3 }));
  });

  it('skips retired WABA instead of reporting a false critical failure', async () => {
    vi.stubEnv('AI_GATEWAY_API_KEY', 'test-gateway-key');
    vi.stubEnv('WABA_PAUSED', 'true');
    vi.stubEnv('STRIPE_SECRET_KEY', 'test');
    vi.stubEnv('STRIPE_WEBHOOK_SECRET', 'test');
    vi.stubEnv('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', 'test');
    vi.stubEnv('SECRET_ENCRYPTION_KEY', 'test');
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ status: { indicator: 'none' } }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })));

    const checks = await runKiaTechnicalChecks();
    const waba = checks.find((check) => check.checkId === 'waba_config_present');
    expect(waba?.status).toBe('skipped');
    expect(waba?.severity).toBe('info');
  });
});
