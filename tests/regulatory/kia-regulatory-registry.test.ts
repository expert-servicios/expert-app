import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchRegulatorySource, type RegulatorySourceRow } from '@/lib/regulatory/regulatory-monitor';
import { createRegulatoryProposalPullRequest } from '@/lib/regulatory/regulatory-github';
import { getKiaToolPolicy } from '@/lib/ai/kia/kia-tool-registry';
import { KIA_TASK_TYPES } from '@/lib/ai/kia/kia-output-schema';

const read = (path: string) => readFileSync(path, 'utf8');
const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.restoreAllMocks();
});

function source(overrides: Partial<RegulatorySourceRow> = {}): RegulatorySourceRow {
  return {
    id: '00000000-0000-0000-0000-000000000001',
    source_key: 'test_official',
    authority: 'BOE',
    title: 'Fuente oficial de prueba',
    url: 'https://www.boe.es/',
    fetch_url: 'https://www.boe.es/test',
    fetch_strategy: 'html',
    check_frequency: 'daily',
    last_fingerprint: null,
    ...overrides,
  };
}

describe('KIA Regulatory Registry', () => {
  it('registers regulatory_review as a high-reasoning KIA task', () => {
    expect(KIA_TASK_TYPES).toContain('regulatory_review');

    const router = read('lib/ai/kia/kia-provider-router.ts');
    expect(router).toContain('"regulatory_review"');
  });

  it('exposes canonical regulatory values as an autonomous R0 read tool', () => {
    const policy = getKiaToolPolicy('get_regulatory_value');
    expect(policy?.riskTier).toBe('R0');
    expect(policy?.effect).toBe('read');
    expect(policy?.capability).toBe('regulatory');
    expect(policy?.requiresHumanApproval).toBe(false);
  });

  it('normalizes and fingerprints an allowed official source', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(
      '<html><style>.x{}</style><script>bad()</script><body><h1>Norma oficial</h1><p>Valor 123</p></body></html>',
      {
        status: 200,
        headers: { 'content-type': 'text/html' },
      },
    )));

    const result = await fetchRegulatorySource(source());
    expect(result.excerpt).toContain('Norma oficial');
    expect(result.excerpt).toContain('Valor 123');
    expect(result.excerpt).not.toContain('bad()');
    expect(result.fingerprint).toMatch(/^[a-f0-9]{64}$/);
  });

  it('rejects non-official hosts before fetching', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    await expect(fetchRegulatorySource(source({
      fetch_url: 'https://example.com/not-official',
    }))).rejects.toThrow('host not allowed');

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('keeps GitHub proposal PR creation fail-closed without a dedicated token', async () => {
    delete process.env.REGULATORY_GITHUB_TOKEN;
    await expect(createRegulatoryProposalPullRequest({
      changeId: 'change-1',
      sourceTitle: 'BOE',
      sourceUrl: 'https://www.boe.es/',
      severity: 'high',
      changeType: 'operational_update',
      summary: 'Cambio de prueba',
      effectiveDate: null,
      knownDependencies: [],
      dependencyHints: [],
      proposedFiles: [],
      valueUpdates: [],
    })).resolves.toBeNull();
  });

  it('never updates canonical values directly from the AI classification worker', () => {
    const worker = read('lib/regulatory/regulatory-review.ts');
    expect(worker).toContain('value_updates: parsed.valueUpdates');
    expect(worker).not.toContain(".from('regulatory_values').insert");
    expect(worker).not.toContain(".from('regulatory_values').update");
  });

  it('uses first fetch only as baseline and creates changes only after a previous fingerprint exists', () => {
    const monitor = read('lib/regulatory/regulatory-monitor.ts');
    expect(monitor).toContain('const hasBaseline = Boolean(source.last_fingerprint)');
    expect(monitor).toContain('const isChanged = hasBaseline && source.last_fingerprint !== fetched.fingerprint');
  });

  it('protects all regulatory cron routes with CRON_SECRET', () => {
    for (const path of [
      'app/api/cron/regulatory-pulse/route.ts',
      'app/api/cron/regulatory-worker/route.ts',
      'app/api/cron/regulatory-monthly-audit/route.ts',
    ]) {
      expect(read(path), path).toContain('verifyCronRequest');
    }
  });

  it('schedules daily pulse, hourly worker and monthly audit through pg_cron', () => {
    const migration = read('supabase/migrations/20260919193500_kia_regulatory_cron.sql');
    expect(migration).toContain("'regulatory-pulse-daily'");
    expect(migration).toContain("'17 5 * * *'");
    expect(migration).toContain("'regulatory-worker-hourly'");
    expect(migration).toContain("'37 * * * *'");
    expect(migration).toContain("'regulatory-monthly-audit'");
    expect(migration).toContain("'41 5 3 * *'");
    expect(migration).toContain("where name = 'cron_secret'");
  });

  it('keeps registry tables server-side only with explicit browser deny policies', () => {
    const migration = read('supabase/migrations/20260919191500_kia_regulatory_registry.sql');
    expect(migration).toContain('alter table public.regulatory_sources enable row level security');
    expect(migration).toContain('regulatory_sources_deny_browser');
    expect(migration).toContain('regulatory_changes_deny_browser');
    expect(migration).toContain('regulatory_values_deny_browser');
    expect(migration).toContain('to service_role');
  });

  it('adds admin-only /legal commands to the verified Telegram channel', () => {
    const telegram = read('app/api/webhooks/telegram/route.ts');
    expect(telegram).toContain("if (command === '/legal' && adminChat)");
    expect(telegram).toContain("action === 'cambios'");
    expect(telegram).toContain("action === 'valor'");
    expect(telegram).toContain("action === 'revisar'");
    expect(telegram).toContain('after(async () => {');
  });

  it('documents the no-auto-merge and no-auto-publish contract', () => {
    const docs = read('docs/kia-regulatory-registry.md');
    expect(docs).toContain('Nunca se hace merge automático');
    expect(docs).toContain('Nunca se modifica producción desde el cron');
    expect(docs).toContain('fingerprint');
  });
});
